import { useState, useEffect } from "react";
import "./App.css";
import Editor from "@monaco-editor/react";

function Notification({ message, type, onClose }) {
  if (!message) return null;

  return (
    <div className={`notification ${type}`}>
      <span>{message}</span>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
}

function App() {
  const [sqlResults, setSqlResults] = useState([]);
  const [sparqlResults, setSparqlResults] = useState([]);
  const [sqlTimings, setSqlTimings] = useState([]);
  const [sparqlTimings, setSparqlTimings] = useState([]);
  const [numTests, setNumTests] = useState(5);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState("benchmark");
  const [customClass, setCustomClass] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [customQuery, setCustomQuery] = useState("");
  const [customQueryResult, setCustomQueryResult] = useState(null);
  const [customQueryExecutionTime, setCustomQueryExecutionTime] =
    useState(null);
  const [reasonerOutput, setReasonerOutput] = useState(null);

  const fetchEndpoint = async (endpoint, setResults, setTimings) => {
    let results = [];
    let timings = [];

    for (let i = 0; i < numTests; i++) {
      try {
        const response = await fetch(`http://localhost:8000/${endpoint}`);
        const data = await response.json();
        results.push(data);
        if (data.execution_time) {
          timings.push(parseFloat(data.execution_time.replace(" ms", "")));
        }
      } catch (err) {
        setNotification({ message: `Error fetching ${endpoint}: ${err.message}`, type: "error" });
      }
    }

    setResults(results);
    setTimings(timings);
  };

  const saveClassDefinition = async () => {
    try {
      const response = await fetch("http://localhost:8000/save-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: customClass }),
      });
      const result = await response.json();
      if (result.error) {
        setNotification({ message: result.error, type: "error" });
      } else {
        setNotification({ message: "Saved successfully to custom_classes.py", type: "success" });
      }
    } catch (err) {
      setNotification({ message: `Failed to save: ${err.message}`, type: "error" });
    }
  };

  const runReasoner = async () => {
    try {
      const response = await fetch("http://localhost:8000/run-reasoner");
      const data = await response.json();
      if (data.error || data.returncode !== 0) {
        setNotification({ message: data.stderr || data.error, type: "error" });
        setReasonerOutput(null);
      } else {
        setReasonerOutput(data.stdout);
        setNotification({ message: "Reasoner executed successfully", type: "success" });
      }
    } catch (err) {
      setNotification({ message: `Reasoner error: ${err.message}`, type: "error" });
    }
  };

  const runBenchmark = async () => {
    setRunning(true);
    await fetchEndpoint("sql-query", setSqlResults, setSqlTimings);
    await fetchEndpoint("sparql-query", setSparqlResults, setSparqlTimings);
    setRunning(false);
    setNotification({ message: "Benchmark complete", type: "success" });
  };

  const downloadCSV = () => {
    let csvContent = "Test,SQL Time (ms),SPARQL Time (ms)\n";
    for (let i = 0; i < numTests; i++) {
      const sqlTime = sqlTimings[i] || "";
      const sparqlTime = sparqlTimings[i] || "";
      csvContent += `${i + 1},${sqlTime},${sparqlTime}\n`;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "benchmark_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setNotification({ message: "CSV downloaded", type: "success" });
  };

  const loadClassDefinition = async () => {
    try {
      const response = await fetch("http://localhost:8000/load-classes");
      const text = await response.text();
      setCustomClass(text);
      setNotification({ message: "Loaded custom_classes.py", type: "success" });
    } catch (err) {
      setNotification({ message: `Failed to load class file: ${err.message}`, type: "error" });
    }
  };

  const executeCustomQuery = async () => {
    try {
      const response = await fetch("http://localhost:8000/custom-sparql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: customQuery }),
      });
      const data = await response.json();
      if (data.error) {
        setNotification({ message: data.error, type: "error" });
        setCustomQueryResult(null);
        setCustomQueryExecutionTime(null);
      } else {
        setCustomQueryResult(data.data);
        setCustomQueryExecutionTime(data.execution_time);
        setNotification({ message: "SPARQL executed successfully", type: "success" });
      }
    } catch (err) {
      setNotification({ message: `SPARQL query failed: ${err.message}`, type: "error" });
    }
  };

  return (
    <div className="App">
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />

      <nav className="navbar">
        <div className="logo-container">
          <img src="/graph-svgrepo-com.svg" alt="Logo" className="logo" />
          <p style={{ marginLeft: "20px", fontWeight: "bold" }}>
            BP Semantic Blockchain
          </p>
        </div>
        <div className="nav-buttons">
          <button onClick={() => setView("benchmark")}>Benchmark</button>
          <button onClick={() => setView("query")}>SPARQL Query</button>
          <button onClick={() => setView("editor")}>Class Editor</button>
        </div>
      </nav>

      {view === "benchmark" && (
        <>
          <h1>Benchmark: SQL vs SPARQL</h1>

          <div className="controls">
            <label>
              Number of Tests:
              <input
                type="number"
                value={numTests}
                onChange={(e) => setNumTests(parseInt(e.target.value, 10))}
                min="1"
                disabled={running}
              />
            </label>
            <button onClick={runBenchmark} disabled={running}>
              {running ? "Running..." : "Start Benchmark"}
            </button>
            <button
              onClick={downloadCSV}
              disabled={!sqlTimings.length && !sparqlTimings.length}
            >
              Download CSV
            </button>
          </div>

          <div className="benchmark">
            <h2>Results</h2>
            <table border="1">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>SQL Time (ms)</th>
                  <th>SPARQL Time (ms)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: numTests }).map((_, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{sqlTimings[i]?.toFixed(2) || "N/A"}</td>
                    <td>{sparqlTimings[i]?.toFixed(2) || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="data">
            <h2>SQL Query Results</h2>
            <pre>{JSON.stringify(sqlResults, null, 2)}</pre>
          </div>

          <div className="data">
            <h2>SPARQL Query Results</h2>
            <pre>{JSON.stringify(sparqlResults, null, 2)}</pre>
          </div>
        </>
      )}

      {view === "query" && (
        <div className="split-window">
          <div className="split-pane left-pane">
            <h2>SPARQL Query</h2>
            <Editor
              height="100%"
              width="100%"
              defaultLanguage="sparql"
              theme="vs-dark"
              value={customQuery}
              onChange={(value) => setCustomQuery(value || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
              }}
            />
            <button onClick={executeCustomQuery}>Execute Query</button>
            {customQueryExecutionTime && (
              <p>Execution Time: {customQueryExecutionTime}</p>
            )}
          </div>
          <div className="split-pane right-pane">
            <h2>Query Result</h2>
            <pre>
              {customQueryResult
                ? JSON.stringify(customQueryResult, null, 2)
                : "No results yet."}
            </pre>
          </div>
        </div>
      )}

      {view === "editor" && (
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
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
              }}
            />
            <button onClick={loadClassDefinition}>Load File</button>
            <button onClick={saveClassDefinition}>Save to File</button>
            <button onClick={runReasoner}>Run Reasoner</button>
          </div>
          <div className="split-pane right-pane">
            <h2>Reasoner Output</h2>
            <pre>{reasonerOutput ? reasonerOutput : "No output yet."}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
