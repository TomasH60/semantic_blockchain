import React, { useState } from "react";
import Editor from "@monaco-editor/react";

export default function ClassEditor({ setNotification }) {
  const [customClass, setCustomClass] = useState("");
  const [reasonerOutput, setReasonerOutput] = useState(null);
  const [inferredDumpUrl, setInferredDumpUrl] = useState(null);
  const [rdfFile, setRdfFile] = useState(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  const loadClassDefinition = async () => {
    try {
      const response = await fetch(`${API_BASE}/load-classes`);
      const text = await response.text();
      setCustomClass(text);
      setNotification({ message: "Loaded custom_classes.py", type: "success" });
    } catch (err) {
      setNotification({ message: `Failed to load class file: ${err.message}`, type: "error" });
    }
  };

  const saveClassDefinition = async () => {
    try {
      const response = await fetch(`${API_BASE}/save-classes`, {
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

  const runReasoner = async () => {
    try {
      const response = await fetch(`${API_BASE}/run-reasoner`, { method: "POST" });
      const data = await response.json();
      if (data.error || data.returncode !== 0) {
        setNotification({ message: data.stderr || data.error, type: "error" });
        setReasonerOutput(null);
        setInferredDumpUrl(null);
      } else {
        setReasonerOutput(data.stdout);
        setNotification({ message: "Reasoner executed successfully", type: "success" });

        const downloadUrl = `${API_BASE}/download-inferred`;
        setInferredDumpUrl(downloadUrl);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "inferred_ontology.owl";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setNotification({ message: `Reasoner error: ${err.message}`, type: "error" });
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
      const response = await fetch(`${API_BASE}/load-rdf-dump`, {
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

  return (
    <div className="main-content">
      <h1>Inference Editor</h1>

      <div className="card" style={{ marginTop: "1rem" }}>
        <p style={{ marginTop: 0 }}>Reasoning controls:</p>
        <div className="button-group">
          <label className="file-upload-button">
            Choose RDF File
            <input
              type="file"
              className="button-style"
              accept=".rdf,.owl,.xml"
              onChange={(e) => setRdfFile(e.target.files[0])}
            />
          </label>

          <button onClick={loadRdfDump}>Upload RDF Dump</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <p style={{ marginTop: 0 }}>Class logic (custom_classes.py):</p>
        <div className="button-group">
          <button onClick={loadClassDefinition}>Load File</button>
          <button onClick={saveClassDefinition}>Save File</button>
        </div>
      </div>

      <div className="split-window">
        <div className="split-pane left-pane">
          <h2>OWL Class Editor</h2>
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={customClass}
            onChange={(value) => setCustomClass(value || "")}
            options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: "on" }}
          />
          <button onClick={runReasoner} style={{ marginTop: "1rem" }}>
            Run Reasoner
          </button>
        </div>
        <div className="split-pane right-pane">
          <h2>Reasoner Output</h2>
          <pre>{reasonerOutput || "No output yet."}</pre>
        </div>
      </div>
    </div>
  );
}
