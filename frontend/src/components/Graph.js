import React, { useState, useRef, useEffect } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';
import { DataSet } from 'vis-data';
import { Parser as N3Parser } from 'n3';

const getLabel = (term) => {
    if (term.termType === 'Literal') return term.value;
    if (term.termType === 'BlankNode') return `_:${term.value}`;
    return term.value.split(/[\/#]/).pop();
};

const getCanonicalId = (term) => {
    if (term.termType === 'Literal') return term.value.trim();
    if (term.termType === 'NamedNode') return term.value.trim();
    if (term.termType === 'BlankNode') return `_:${term.value.trim()}`;
    return term.value.trim();
};

const brightColors = [
    '#FF6B6B', '#6BCB77', '#4D96FF', '#FFD93D', '#FF6FF0', '#6B6BFF', '#FF914D', '#32D1F3', '#F77F00', '#7AE582'
];

const seedRandom = (seed) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return () => {
        h = Math.imul(48271, h) & 0x7fffffff;
        return (h & 0x7fffffff) / 0x7fffffff;
    };
};

const isAttribute = (label) => {
    if (!label) return false;
    return (
        /^[0-9]+$/.test(label) ||
        /^[0-9a-fA-F]{16,}$/.test(label) ||
        /^0x[0-9a-fA-F]{8,}$/.test(label) ||
        /\d{4}-\d{2}-\d{2}/.test(label)
    );
};

const Graph = () => {
    const containerRef = useRef(null);
    const networkRef = useRef(null);
    const expandModeRef = useRef(false);

    const [originalData, setOriginalData] = useState({ nodes: [], edges: [] });
    const [nodeTypes, setNodeTypes] = useState(new Map());
    const [visibleNodeIds, setVisibleNodeIds] = useState(new Set());
    const [expandMode, setExpandMode] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [lastClickedId, setLastClickedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [classColors, setClassColors] = useState(new Map());
    const [attributeColor, setAttributeColor] = useState('#CCCCCC');

    useEffect(() => {
        expandModeRef.current = expandMode;
    }, [expandMode]);

    const parseTurtle = async (file) => {
        const text = await file.text();
        const parser = new N3Parser();
        const quads = parser.parse(text);

        const nodeMap = new Map();
        const edges = [];
        const types = new Map();

        for (const quad of quads) {
            const subjId = getCanonicalId(quad.subject);
            const objId = getCanonicalId(quad.object);
            const predId = quad.predicate.value;

            if (predId.endsWith('type')) {
                const typeLabel = getLabel(quad.object);
                types.set(subjId, typeLabel);
            }

            nodeMap.set(subjId, { id: subjId, label: getLabel(quad.subject), title: subjId });
            nodeMap.set(objId, { id: objId, label: getLabel(quad.object), title: objId });

            edges.push({ from: subjId, to: objId, label: getLabel(quad.predicate) });
        }

        const parsed = { nodes: Array.from(nodeMap.values()), edges };

        const seedRand = seedRandom('fixed-seed');
        const classColorMap = new Map();
        let usedColors = [];

        types.forEach((className) => {
            if (!classColorMap.has(className)) {
                let color;
                do {
                    color = brightColors[Math.floor(seedRand() * brightColors.length)];
                } while (usedColors.includes(color));
                usedColors.push(color);
                classColorMap.set(className, color);
            }
        });

        const attributeCol = brightColors[Math.floor(seedRand() * brightColors.length)];

        setOriginalData(parsed);
        setNodeTypes(types);
        setClassColors(classColorMap);
        setAttributeColor(attributeCol);
        setVisibleNodeIds(new Set(parsed.nodes.map((n) => n.id)));
        setInitialized(true);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query) {
            setVisibleNodeIds(new Set(originalData.nodes.map((n) => n.id)));
            return;
        }

        const matchedIds = new Set();
        const queryLower = query.toLowerCase();

        originalData.nodes.forEach((node) => {
            if (node.label && node.label.toLowerCase().includes(queryLower)) {
                matchedIds.add(node.id);
                originalData.edges.forEach((edge) => {
                    if (edge.from === node.id) matchedIds.add(edge.to);
                    if (edge.to === node.id) matchedIds.add(edge.from);
                });
            }
        });

        setVisibleNodeIds(matchedIds);
    };

    const renderGraph = () => {
        const visibleNodes = originalData.nodes
            .filter((n) => visibleNodeIds.has(n.id))
            .map((node) => {
                const type = nodeTypes.get(node.id);
                let shape;
                let color;

                if (type) {
                    shape = 'dot';
                    color = classColors.get(type) || '#AAAAAA';
                } else if (isAttribute(node.label)) {
                    shape = 'ellipse';
                    color = attributeColor;
                } else {
                    shape = 'square';
                    color = classColors.get(node.label) || '#AAAAAA';
                }

                return {
                    ...node,
                    shape: shape,
                    borderWidth: node.id === lastClickedId ? 4 : 1,
                    color: {
                        border: node.id === lastClickedId ? '#d400ff' : color,
                        background: color,
                    },
                };
            });

        const visibleEdges = originalData.edges.filter(
            (e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)
        );

        const data = {
            nodes: new DataSet(visibleNodes),
            edges: new DataSet(visibleEdges),
        };

        const options = {
            nodes: { shape: 'dot', size: 16, font: { size: 14 } },
            edges: {
                arrows: 'to',
                font: { align: 'middle' },
                smooth: true,
                length: 300,
            },
            interaction: {
                dragNodes: true,
                zoomView: true,
                hover: true,
            },
            physics: {
                stabilization: false,
                barnesHut: {
                    gravitationalConstant: -30000,
                    springLength: 300,
                    springConstant: 0.05,
                },
            },
        };

        if (networkRef.current) networkRef.current.destroy();
        networkRef.current = new Network(containerRef.current, data, options);

        networkRef.current.on('click', (params) => {
            if (!params.nodes.length) return;
            const clickedId = params.nodes[0];

            const useExpand = expandModeRef.current;
            const updated = new Set(useExpand ? visibleNodeIds : []);
            updated.add(clickedId);

            originalData.edges.forEach((edge) => {
                if (edge.from === clickedId || edge.to === clickedId) {
                    updated.add(edge.from);
                    updated.add(edge.to);
                }
            });

            setLastClickedId(clickedId);
            setVisibleNodeIds(updated);
        });

        networkRef.current.on('oncontext', (params) => {
            params.event.preventDefault();
            const pointerNodeId = networkRef.current.getNodeAt(params.pointer.DOM);
            if (pointerNodeId) {
                const node = originalData.nodes.find((n) => n.id === pointerNodeId);
                if (node) {
                    navigator.clipboard.writeText(node.label || node.title || node.id)
                        .then(() => console.log('Copied to clipboard:', node.label || node.title || node.id))
                        .catch((err) => console.error('Clipboard copy failed:', err));
                }
            }
        });
    };

    useEffect(() => {
        if (initialized) renderGraph();
    }, [visibleNodeIds, initialized, lastClickedId]);

    return (
        <div className="full-height-layout">
            <div style={{ padding: '10px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="file"
                        accept=".ttl"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) parseTurtle(e.target.files[0]);
                        }}
                    />
                    <button
                        onClick={() => {
                            setVisibleNodeIds(new Set(originalData.nodes.map((n) => n.id)));
                            setSearchQuery('');
                        }}
                        style={{ marginLeft: '10px' }}
                    >
                        Reset View
                    </button>
                    <label style={{ marginLeft: '20px' }}>
                        <input
                            type="checkbox"
                            checked={expandMode}
                            onChange={(e) => setExpandMode(e.target.checked)}
                        />{' '}
                        Expand Mode
                    </label>
                    <input
                        type="text"
                        placeholder="Search node label..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: '300px', padding: '5px', marginLeft: '20px'}}
                    />
                </div>
               
            </div>
            <div ref={containerRef} className="graph-container" />
        </div>
    );
};

export default Graph;
