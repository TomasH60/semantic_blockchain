import React, { useState } from "react";
import Editor from "@monaco-editor/react";

function Reasoner({ setNotification }) {
  const [customClass, setCustomClass] = useState("");
  const [reasonerOutput, setReasonerOutput] = useState(null);
  const [rdfFile, setRdfFile] = useState(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  const loadClassDefinition = async () => {
    try {
      const response = await fetch(`${API_BASE}/load-n3-classes`);
      const text = await response.text();
      setCustomClass(text);
      setNotification({ message: "Loaded N3 classes", type: "success" });
    } catch (err) {
      setNotification({ message: `Failed to load N3 classes: ${err.message}`, type: "error" });
    }
  };

  const saveClassDefinition = async () => {
    try {
      const response = await fetch(`${API_BASE}/save-n3-classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: customClass }),
      });
      const result = await response.json();
      if (result.error) {
        setNotification({ message: result.error, type: "error" });
      } else {
        setNotification({ message: "Saved successfully", type: "success" });
      }
    } catch (err) {
      setNotification({ message: `Save failed: ${err.message}`, type: "error" });
    }
  };

  const loadRdfDump = async () => {
    if (!rdfFile) {
      setNotification({ message: "No file selected", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("file", rdfFile);

    try {
      const response = await fetch(`${API_BASE}/load-n3-data`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.status === "ok") {
        setNotification({ message: `RDF dump ${result.filename} loaded`, type: "success" });
      } else {
        setNotification({ message: result.error || "Failed to load RDF dump", type: "error" });
      }
    } catch (err) {
      setNotification({ message: `Load RDF error: ${err.message}`, type: "error" });
    }
  };

  const runReasoner = async () => {
    try {
      const response = await fetch(`${API_BASE}/run-n3-reasoner`, { method: "POST" });
      const data = await response.json();

      if (data.error) {
        setNotification({ message: data.stderr || data.error, type: "error" });
        return;
      }

      const downloadResponse = await fetch(`${API_BASE}/download-inferred-n3`);
      const text = await downloadResponse.text();

      if (!downloadResponse.ok) {
        throw new Error("Failed to download output.");
      }

      const lines = text.split("\n");
      const header = lines.slice(0, 2).filter(line => line.startsWith("#"));
      const statLine = lines.find(line => /^# \d{4}-\d{2}-\d{2}T/.test(line));
      const stats = [];

      const labels = {
        sec: "Seconds taken",
        inf: "Total inferences made",
        "inf/sec": "Inferences per second",
        in: "Input triples",
        out: "Output triples",
        ent: "Entailed triples",
        step: "Reasoning steps",
        brake: "Brakepoints hit"
      };

      if (statLine) {
        const pairs = statLine.match(/([a-zA-Z0-9/_-]+)=([\d.]+)/g);
        if (pairs) {
          for (const pair of pairs) {
            const [key, value] = pair.split("=");
            stats.push({ key, value, label: labels[key] });
          }
        }
      }

      setReasonerOutput({ header, stats });

      const blob = new Blob([text], { type: "text/n3" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inferred_output.n3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setNotification({ message: "Reasoner executed successfully", type: "success" });
    } catch (err) {
      setNotification({ message: `Reasoner error: ${err.message}`, type: "error" });
    }
  };

  const thStyle = { border: "1px solid #ccc", textAlign: "left", padding: "0.5rem" };
  const tdStyle = { border: "1px solid #ccc", textAlign: "left", padding: "0.5rem" };

  return (
    <div className="main-content">
      <h1>Reasoning</h1>

      <div className="card" style={{ marginTop: "1rem" }}>
        <p>Reasoning controls:</p>
        <div className="button-group">
          <label className="file-upload-button">
            Choose N3 File
            <input
              type="file"
              className="button-style"
              accept=".n3"
              onChange={(e) => setRdfFile(e.target.files[0])}
            />
          </label>
          <button onClick={loadRdfDump}>Upload N3 Dump</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <p>Rule file (rules.n3):</p>
        <div className="button-group">
          <button onClick={loadClassDefinition}>Load File</button>
          <button onClick={saveClassDefinition}>Save File</button>
        </div>
      </div>

      <div className="split-window">
        <div className="split-pane left-pane">
          <h2 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Reasoner Rule Definitions
            <a
              href="https://github.com/eyereasoner/Notation3-By-Example"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "0.9rem", marginLeft: "1rem" }}
            >
              Example ↗
            </a>
          </h2>
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="n3"
            theme="vs-dark"
            value={customClass}
            onChange={(value) => setCustomClass(value || "")}
            options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: "on" }}
          />
          <button onClick={runReasoner} style={{ marginTop: "1rem" }}>
            Run EYE Reasoner
          </button>
        </div>

        <div className="split-pane right-pane">
          <h2>EYE Reasoner Stats</h2>
          {reasonerOutput ? (
            <>
              {reasonerOutput.header.map((line, i) => (
                <pre key={i} style={{ marginBottom: '0.2rem' }}>{line}</pre>
              ))}

              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Metric</th>
                    <th style={thStyle}>Value</th>
                    <th style={thStyle}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {reasonerOutput.stats.map(({ key, value, label }) => (
                    <tr key={key}>
                      <td style={tdStyle}>{key}</td>
                      <td style={tdStyle}>{value}</td>
                      <td style={tdStyle}>{label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>No output yet.</p>
          )}
        </div>
      </div>
    </div>
  );
} 
export default Reasoner;
