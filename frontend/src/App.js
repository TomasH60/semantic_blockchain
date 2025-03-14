import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [sqlTime, setSqlTime] = useState(null);
  const [sparqlTime, setSparqlTime] = useState(null);
  const [sqlData, setSqlData] = useState([]);
  const [sparqlData, setSparqlData] = useState([]);
  const [error, setError] = useState(null);

  const benchmarkEndpoint = async (endpoint, setTime, setData) => {
    try {
      const startTime = performance.now();
      const response = await fetch(`http://localhost:8000/${endpoint}`);
      const data = await response.json();
      const endTime = performance.now();

      setTime((endTime - startTime).toFixed(2)); // Store response time in milliseconds
      setData(data); // Store the returned data
    } catch (err) {
      setError(`Error fetching ${endpoint}: ${err.message}`);
    }
  };

  useEffect(() => {
    benchmarkEndpoint("sql-query", setSqlTime, setSqlData);
    benchmarkEndpoint("sparql-query", setSparqlTime, setSparqlData);
  }, []);

  return (
    <div className="App">
      <h1>Benchmark: SQL vs SPARQL</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="benchmark">
        <h2>Results</h2>
        <p><strong>SQL Query Time:</strong> {sqlTime ? `${sqlTime} ms` : "Running..."}</p>
        <p><strong>SPARQL Query Time:</strong> {sparqlTime ? `${sparqlTime} ms` : "Running..."}</p>
      </div>

      <div className="data">
        <h2>SQL Query Results</h2>
        {sqlData.length > 0 ? (
          <ul>
            {sqlData.map((item, index) => (
              <li key={index}>
                <strong>Subject:</strong> {item.s} <br />
                <strong>Predicate:</strong> {item.p} <br />
                <strong>Object:</strong> {item.o}
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading SQL data...</p>
        )}
      </div>

      <div className="data">
        <h2>SPARQL Query Results</h2>
        {sparqlData.length > 0 ? (
          <ul>
            {sparqlData.map((item, index) => (
              <li key={index}>
                <strong>Subject:</strong> {item.s.value} <br />
                <strong>Predicate:</strong> {item.p.value} <br />
                <strong>Object:</strong> {item.o.value}
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading SPARQL data...</p>
        )}
      </div>
    </div>
  );
}

export default App;
