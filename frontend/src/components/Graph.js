import React, { useState, useRef, useEffect } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';
import { DataSet } from 'vis-data';
import { Parser } from 'n3';

const getLabel = (uri) => uri?.split(/[\/#]/).pop() || '';
const getCanonicalId = (uri) => uri?.trim() || '';

const colorMap = new Map();

const getColorForClass = (className) => {
    if (!colorMap.has(className)) {
        const hash = seededHash(className);
        const r = (hash & 0xFF0000) >> 16;
        const g = (hash & 0x00FF00) >> 8;
        const b = hash & 0x0000FF;
        const color = `rgb(${r}, ${g}, ${b})`;
        colorMap.set(className, color);
    }
    return colorMap.get(className);
};

const seededHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
};


const isAttribute = (label) =>
    /^[0-9]+$/.test(label) || /^[0-9a-fA-F]{16,}$/.test(label) ||
    /^0x[0-9a-fA-F]{8,}$/.test(label) || /\d{4}-\d{2}-\d{2}/.test(label);

const Graph = () => {
    const containerRef = useRef(null);
    const networkRef = useRef(null);
    const expandModeRef = useRef(false);

    const [originalData, setOriginalData] = useState({ nodes: [], edges: [] });
    const [visibleNodeIds, setVisibleNodeIds] = useState(new Set());
    const [expandMode, setExpandMode] = useState(false);
    const [showLabels, setShowLabels] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [lastClickedId, setLastClickedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeCounts, setTypeCounts] = useState([]);
    const [attributeColor, setAttributeColor] = useState('#CCCCCC');
    const [ontologyInfo, setOntologyInfo] = useState({ classes: new Set(), attributes: new Set() });
    const [instanceClassMap, setInstanceClassMap] = useState(new Map());

    useEffect(() => {
        expandModeRef.current = expandMode;
    }, [expandMode]);

    const parseOntology = async (file) => {
        const text = await file.text();
        const xml = new DOMParser().parseFromString(text, 'application/xml');

        const nodeMap = new Map();
        const edges = [];
        const classTypeCounts = new Map();

        const extractResource = (el) => el.getAttribute('rdf:about') || el.getAttribute('rdf:ID') || '';

        const classes = Array.from(xml.getElementsByTagName('owl:Class'));
        const classSet = new Set();
        for (const cls of classes) {
            const id = getCanonicalId(extractResource(cls));
            if (!id) continue;
            const label = getLabel(id);
            nodeMap.set(id, { id, label, title: id, type: 'class' });
            classTypeCounts.set(label, (classTypeCounts.get(label) || 0) + 1);
            classSet.add(id);

            const subs = Array.from(cls.getElementsByTagName('rdfs:subClassOf'));
            for (const sub of subs) {
                const parent = getCanonicalId(sub.getAttribute('rdf:resource'));
                if (parent) {
                    if (!nodeMap.has(parent)) {
                        nodeMap.set(parent, { id: parent, label: getLabel(parent), title: parent, type: 'class' });
                    }
                    edges.push({ from: id, to: parent, label: 'subClassOf' });
                }
            }
        }

        const props = Array.from(xml.getElementsByTagName('owl:DatatypeProperty'));
        const attributeSet = new Set();
        for (const prop of props) {
            const id = getCanonicalId(extractResource(prop));
            if (!id) continue;
            const label = getLabel(id);
            nodeMap.set(id, { id, label, title: id, type: 'attribute' });
            attributeSet.add(id);

            const domains = Array.from(prop.getElementsByTagName('rdfs:domain'));
            for (const dom of domains) {
                const domain = getCanonicalId(dom.getAttribute('rdf:resource'));
                if (domain) {
                    if (!nodeMap.has(domain)) {
                        nodeMap.set(domain, { id: domain, label: getLabel(domain), title: domain, type: 'class' });
                    }
                    edges.push({ from: domain, to: id, label: 'hasAttribute' });
                }
            }
        }

        const parsed = { nodes: Array.from(nodeMap.values()), edges };

        const typeCountsArray = Array.from(classTypeCounts.entries())
            .map(([type, count]) => ({
                type: getLabel(type),
                count,
                color: getColorForClass(getLabel(type))
            }))
            .sort((a, b) => b.count - a.count);

        setTypeCounts(typeCountsArray);
        setOriginalData(parsed);
        setAttributeColor('#AAAAAA');
        setVisibleNodeIds(new Set(parsed.nodes.map((n) => n.id)));
        setOntologyInfo({ classes: classSet, attributes: attributeSet });
        setInitialized(true);
    };

    const parseN3Dump = async (file) => {
        const text = await file.text();
        const parser = new Parser();
        const quads = parser.parse(text);

        const addedNodes = new Map();
        const addedEdges = [];
        const instanceToClassMap = new Map();
        const classTypeCounts = new Map();
        const existingNodeIds = new Set(originalData.nodes.map(n => n.id));
        const existingEdgeSet = new Set(originalData.edges.map(e => `${e.from}->${e.to}->${e.label}`));

        for (const quad of quads) {
            const subjId = getCanonicalId(quad.subject.id);
            const predId = quad.predicate.id;
            const objRaw = quad.object;

            const subjLabel = getLabel(subjId);
            const predLabel = getLabel(predId);

            let objId = '';
            let objLabel = '';

            if (objRaw.termType === 'Literal') {
                objId = objRaw.value;
                objLabel = objId;
            } else {
                objId = getCanonicalId(objRaw.id);
                objLabel = getLabel(objId);
            }

            if (predId === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && ontologyInfo.classes.has(objId)) {
                instanceToClassMap.set(subjId, objId);
                classTypeCounts.set(objId, (classTypeCounts.get(objId) || 0) + 1);
            }

            if (!existingNodeIds.has(subjId) && !addedNodes.has(subjId)) {
                const type = ontologyInfo.attributes.has(subjId)
                    ? 'attribute'
                    : instanceToClassMap.has(subjId) ? 'instance' : null;
                addedNodes.set(subjId, { id: subjId, label: subjLabel, title: subjId, type });
            }

            if (!existingNodeIds.has(objId) && !addedNodes.has(objId)) {
                const type = ontologyInfo.attributes.has(objId)
                    ? 'attribute'
                    : instanceToClassMap.has(objId) ? 'instance' : null;
                addedNodes.set(objId, { id: objId, label: objLabel, title: objId, type });
            }

            const edgeKey = `${subjId}->${objId}->${predLabel}`;
            if (!existingEdgeSet.has(edgeKey)) {
                addedEdges.push({ from: subjId, to: objId, label: predLabel });
                existingEdgeSet.add(edgeKey);
            }
        }

        const mergedNodes = [...originalData.nodes, ...addedNodes.values()];
        const mergedEdges = [...originalData.edges, ...addedEdges];

        setOriginalData({ nodes: mergedNodes, edges: mergedEdges });
        setVisibleNodeIds(new Set(mergedNodes.map(n => n.id)));
        setInitialized(true);
        setInstanceClassMap(instanceToClassMap);

        if (networkRef.current) {
            networkRef.current.body.data.nodes.add(Array.from(addedNodes.values()));
            networkRef.current.body.data.edges.add(addedEdges);
        }

        const updatedCounts = new Map();
        typeCounts.forEach(({ type, count }) => updatedCounts.set(type, count));
        classTypeCounts.forEach((count, type) => {
            const label = getLabel(type);
            updatedCounts.set(label, (updatedCounts.get(label) || 0) + count);
        });

        const typeCountsArray = Array.from(updatedCounts.entries())
            .map(([type, count]) => ({ type, count, color: getColorForClass(type) }))
            .sort((a, b) => b.count - a.count);

        setTypeCounts(typeCountsArray);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query) {
            setVisibleNodeIds(new Set(originalData.nodes.map((n) => n.id)));
            return;
        }
        const matched = new Set();
        const q = query.toLowerCase();
        originalData.nodes.forEach((n) => {
            if (n.label.toLowerCase().includes(q)) {
                matched.add(n.id);
                originalData.edges.forEach((e) => {
                    if (e.from === n.id) matched.add(e.to);
                    if (e.to === n.id) matched.add(e.from);
                });
            }
        });
        setVisibleNodeIds(matched);
    };

    const renderGraph = () => {
        console.log(instanceClassMap)
        const visibleNodes = originalData.nodes
            .filter((n) => visibleNodeIds.has(n.id))
            .map((node) => {
                let shape = 'square';
                let color = '#AAAAAA';

                if (node.type === 'class') {
                    shape = 'dot';
                    color = getColorForClass(node.label);
                } else if (node.type === 'attribute' || isAttribute(node.label)) {
                    shape = 'ellipse';
                    color = attributeColor;
                } else if (node.type === 'instance') {
                    
                    const classUri = instanceClassMap.get(node.id);
                    const classLabel = getLabel(classUri);
                    console.log(classLabel)
                    shape = 'dot';
                    color = getColorForClass(classLabel);
                }

                return {
                    ...node,
                    label: showLabels ? node.label : '',
                    title: node.label,
                    shape,
                    borderWidth: node.id === lastClickedId ? 4 : 1,
                    color: {
                        border: node.id === lastClickedId ? '#d400ff' : color,
                        background: color,
                    }
                };
            });

        const visibleEdges = originalData.edges.filter((e) =>
            visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)
        );

        const data = {
            nodes: new DataSet(visibleNodes),
            edges: new DataSet(visibleEdges.map((e) => ({
                ...e,
                label: showLabels ? e.label : '',
                title: e.label,
            })))
        };

        const options = {
            nodes: { shape: 'dot', size: 16, font: { size: showLabels ? 14 : 0 } },
            edges: { arrows: 'to', font: { size: showLabels ? 12 : 0 }, smooth: true, length: 300 },
            interaction: { dragNodes: true, zoomView: true, hover: true },
            physics: {
                stabilization: false,
                barnesHut: { gravitationalConstant: -30000, springLength: 300, springConstant: 0.05 }
            }
        };

        if (networkRef.current) networkRef.current.destroy();
        networkRef.current = new Network(containerRef.current, data, options);

        networkRef.current.on('click', (params) => {
            if (!params.nodes.length) return;
            const clickedId = params.nodes[0];
            const updated = new Set(expandModeRef.current ? visibleNodeIds : []);
            updated.add(clickedId);
            originalData.edges.forEach((e) => {
                if (e.from === clickedId || e.to === clickedId) {
                    updated.add(e.from);
                    updated.add(e.to);
                }
            });
            setLastClickedId(clickedId);
            setVisibleNodeIds(updated);
        });

        networkRef.current.on('oncontext', (params) => {
            params.event.preventDefault();
            const id = networkRef.current.getNodeAt(params.pointer.DOM);
            if (id) {
                const node = originalData.nodes.find((n) => n.id === id);
                navigator.clipboard.writeText(node?.label || node?.id || '')
                    .then(() => console.log('Copied:', node?.label))
                    .catch(console.error);
            }
        });
    };

    useEffect(() => {
        if (initialized) renderGraph();
    }, [visibleNodeIds, initialized, lastClickedId, showLabels]);

    return (
        <div className="full-height-layout">
            <div style={{ padding: '10px' }}>
                <div style={{
                    maxHeight: '150px', overflowY: 'auto', margin: '10px', padding: '10px',
                    border: '1px solid #ccc', backgroundColor: '#f9f9f9'
                }}>
                    <strong>Class Composition:</strong>
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                        {typeCounts.map(({ type, count, color }) => (
                            <li key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: color, marginRight: '8px', border: '1px solid #000' }}></div>
                                <span style={{ fontWeight: 500 }}>{type}:</span>&nbsp;<span>{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input type="file" accept=".owl" onChange={(e) => {
                        if (e.target.files?.[0]) parseOntology(e.target.files[0]);
                    }} />
                    <span style={{ marginLeft: '10px' }}>Upload OWL Ontology</span>
                    <input
                        type="file"
                        accept=".n3"
                        onChange={(e) => {
                            if (!networkRef.current) {
                                alert('Please upload the OWL ontology first.');
                                return;
                            }
                            if (e.target.files?.[0]) parseN3Dump(e.target.files[0]);
                        }}
                        style={{ marginLeft: '20px' }}
                    />
                    <button onClick={() => {
                        setVisibleNodeIds(new Set(originalData.nodes.map((n) => n.id)));
                        setSearchQuery('');
                    }} style={{ marginLeft: '20px' }}>Reset View</button>
                    <label style={{ marginLeft: '20px' }}>
                        <input type="checkbox" checked={expandMode} onChange={(e) => setExpandMode(e.target.checked)} /> Expand Mode
                    </label>
                    <label style={{ marginLeft: '20px' }}>
                        <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} /> Show Labels
                    </label>
                    <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search label..." style={{ width: '300px', marginLeft: '20px', padding: '5px' }} />
                </div>
            </div>
            <div ref={containerRef} className="graph-container" />
        </div>
    );
};

export default Graph;
