import React, { useState } from "react";
import Editor from "@monaco-editor/react";

export default function Query({ setNotification }) {
  const [customQuery, setCustomQuery] = useState("");
  const [customQueryResult, setCustomQueryResult] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [queryMode, setQueryMode] = useState("endpoint"); // "endpoint" or "file"

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  const executeCustomQuery = async () => {
    try {
      const response = await fetch(`${API_BASE}/custom-sparql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: customQuery }),
      });
      const data = await response.json();
      if (data.error) {
        setNotification({ message: data.error, type: "error" });
        setCustomQueryResult(null);
        setExecutionTime(null);
      } else {
        setCustomQueryResult(data.data);
        setExecutionTime(data.execution_time);
        setNotification({ message: "SPARQL executed successfully", type: "success" });
      }
    } catch (err) {
      setNotification({ message: `SPARQL query failed: ${err.message}`, type: "error" });
    }
  };

  return (
    <div className="main-content">
      <h1>SPARQL query</h1>

      <div className="split-window">
        <div className="split-pane left-pane">
          <h2>SPARQL query editor</h2>
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="sparql"
            theme="vs-dark"
            value={customQuery}
            onChange={(value) => setCustomQuery(value || "")}
            options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: "on" }}
          />
          <button onClick={executeCustomQuery}>Execute Query</button>
          {executionTime && <p>Execution Time: {executionTime}</p>}
        </div>
        <div className="split-pane right-pane">
          <h2>Query Result</h2>
          <pre>{customQueryResult ? JSON.stringify(customQueryResult, null, 2) : "No results yet."}</pre>
        </div>
      </div>
    </div>
  );
}
