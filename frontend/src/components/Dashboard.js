import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip);

export default function Home({ setNotification }) {
  const [stats, setStats] = useState({
    indexed_blocks: "none",
    indexed_transactions: "none",
    indexed_contract_executions: "none",
  });
  const [rates, setRates] = useState(null);
  const [indexerStatus, setIndexerStatus] = useState("stopped");
  const previousStats = useRef(null);
  const chartDataRef = useRef({
    labels: [],
    datasets: [
      {
        label: "Blocks per second",
        data: [],
        borderColor: "rgb(8, 255, 3)",
        fill: false,
      },
      {
        label: "Transactions per second",
        data: [],
        borderColor: "rgba(255, 99, 132, 1)",
        fill: false,
      },
      {
        label: "Contracts per second",
        data: [],
        borderColor: "rgba(54, 162, 235, 1)",
        fill: false,
      },
    ],
  });

  const [chartData, setChartData] = useState(chartDataRef.current);
  const API_BASE = process.env.REACT_APP_BACKEND_URL;
  const [startMode, setStartMode] = useState("db");
  const [rdfFile, setRdfFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setRdfFile(e.target.files[0]);
    }
  };
  const stopOntopEndpoint = async () => {
    try {
      const res = await fetch(`${API_BASE}/stop-ontop-endpoint`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.status) {
        setNotification({ message: json.status, type: "success" });
      } else {
        setNotification({ message: json.error || "Unknown error", type: "error" });
      }
    } catch (err) {
      setNotification({ message: `Failed to stop endpoint: ${err.message}`, type: "error" });
    }
  };

  const startOntopEndpoint = async () => {
    if (startMode === "file" && !rdfFile) {
      setNotification({ message: "Please upload a file", type: "error" });
      return;
    }

    try {
      setNotification({ message: "Starting Ontop endpoint...", type: "info" });

      let response;
      if (startMode === "db") {
        response = await fetch(`${API_BASE}/start-ontop-endpoint`, { method: "POST" });
      } else {
        const formData = new FormData();
        formData.append("file", rdfFile);

        response = await fetch(`${API_BASE}/start-ontop-endpoint-file`, {
          method: "POST",
          body: formData,
        });
      }

      const json = await response.json();
      if (json.status) {
        setNotification({ message: json.status, type: "success" });
      } else {
        setNotification({ message: json.error || "Unknown error", type: "error" });
      }
    } catch (err) {
      setNotification({ message: `Failed to start endpoint: ${err.message}`, type: "error" });
    }
  };

  const startIndexer = async () => {
    const res = await fetch(`${API_BASE}/start-indexer`, { method: "POST" });
    const json = await res.json();
    setIndexerStatus(json.status || json.error || "error");
  };

  const stopIndexer = async () => {
    const res = await fetch(`${API_BASE}/stop-indexer`, { method: "POST" });
    const json = await res.json();
    setIndexerStatus(json.status || json.error || "error");
  };
  const handleExport = async (format) => {
    try {
      setNotification({ message: `Export started for format ${format.toUpperCase()}`, type: "success" });

      const res = await fetch(`${API_BASE}/export-rdf?format=${format}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.download_url) {
        window.open(`${API_BASE}${data.download_url}`, "_blank");
      } else {
        console.error("Download URL missing", data);
        setNotification({ message: "Export failed: download URL missing", type: "error" });
      }
    } catch (err) {
      console.error("Export failed:", err);
      setNotification({ message: "Export failed", type: "error" });
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        const json = await res.json();

        if (!json || !json.data) {
          console.error("Invalid response format from /stats:", json);
          return;
        }

        const newStats = json.data;
        const now = new Date().toLocaleTimeString();

        setStats(newStats);

        // Rates calculation (as before)
        if (previousStats.current) {
          const deltaTime = 5;
          const blockRate = (newStats.indexed_blocks - previousStats.current.indexed_blocks) / deltaTime;
          if (blockRate === 0) return;

          const txRate = (newStats.indexed_transactions - previousStats.current.indexed_transactions) / deltaTime;
          const contractRate = (newStats.indexed_contract_executions - previousStats.current.indexed_contract_executions) / deltaTime;

          setRates({
            blocks_per_second: blockRate,
            transactions_per_second: txRate,
            contracts_per_second: contractRate,
          });

          const ref = chartDataRef.current;
          ref.labels.push(now);
          ref.datasets[0].data.push(blockRate);
          ref.datasets[1].data.push(txRate);
          ref.datasets[2].data.push(contractRate);

          if (ref.labels.length > 20) {
            ref.labels.shift();
            ref.datasets.forEach((d) => d.data.shift());
          }

          setChartData({
            labels: [...ref.labels],
            datasets: ref.datasets.map((ds) => ({
              ...ds,
              data: [...ds.data],
            })),
          });

          localStorage.setItem("chartData", JSON.stringify(chartDataRef.current));
          localStorage.setItem("previousStats", JSON.stringify(newStats));
        }

        previousStats.current = newStats;

      } catch (err) {
        console.error("Failed to load statistics:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [API_BASE]);


  return (
    <div className="main-content">
      <h1>Dashboard</h1>
      <div className="card">
        <p style={{ marginTop: 0 }}>Start Ontop endpoint from:</p>
        <div className="button-group" style={{ marginBottom: "1rem" }}>
          <label>
            <input
              type="radio"
              name="ontopSource"
              value="db"
              checked={startMode === "db"}
              onChange={() => setStartMode("db")}
            /> DB Mapping
          </label>
          <label style={{ marginLeft: "1rem" }}>
            <input
              type="radio"
              name="ontopSource"
              value="file"
              checked={startMode === "file"}
              onChange={() => setStartMode("file")}
            /> RDF File
          </label>
        </div>

        {startMode === "file" && (
          <div style={{ marginBottom: "1rem" }}>
            <label className="file-upload-button">
              Choose RDF File
              <input
                type="file"
                accept=".ttl,.rdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </label>
            {rdfFile && <span style={{ marginLeft: "0.5rem" }}>{rdfFile.name}</span>}

          </div>
        )}

        <button onClick={startOntopEndpoint}>Start Ontop Endpoint</button>
        <button onClick={stopOntopEndpoint} style={{ marginLeft: "1rem" }}>
          Stop Ontop Endpoint
        </button>

      </div>

      <div className="card">

        <p style={{ marginTop: 0 }}>Export database to RDF:</p>

        <div className="button-group">
          <button onClick={() => handleExport("turtle")}>Turtle (.ttl)</button>
          <button onClick={() => handleExport("rdfxml")}>RDF/XML (.rdf)</button>
          <button onClick={() => handleExport("jsonld")}>JSON-LD (.json)</button>

        </div>



      </div>

      <div className="card">
        <p style={{ marginTop: 0, fontWeight: "bold" }}>Indexer controls: </p>
        <div className="button-group">
          <button onClick={startIndexer}>Start</button>
          <button onClick={stopIndexer}>Stop</button>
        </div>
        <p style={{ marginBottom: 0 }}>
          <strong>Indexer status:</strong> {indexerStatus}
        </p>
      </div>

      <div className="card stats-card">
        <p style={{ marginTop: 0 }}>Statistics for the current session:</p>
        <div className="stat-item">
          <span>Indexed blocks:</span>
          <strong>{stats.indexed_blocks}</strong>
        </div>
        <div className="stat-item">
          <span>Indexed transactions:</span>
          <strong>{stats.indexed_transactions}</strong>
        </div>
        <div className="stat-item">
          <span>Indexed contract executions:</span>
          <strong>{stats.indexed_contract_executions}</strong>
        </div>
        <div className="stat-item">
          <span>Blocks per second:</span>
          <strong>{indexerStatus === "stopped" ? "Indexer stopped" : rates?.blocks_per_second.toFixed(0)}</strong>
        </div>
        <div className="stat-item">
          <span>Transactions per second:</span>
          <strong>{indexerStatus === "stopped" ? "Indexer stopped" : rates?.transactions_per_second.toFixed(0)}</strong>
        </div>
        <div className="stat-item">
          <span>Contracts per second:</span>
          <strong>{indexerStatus === "stopped" ? "Indexer stopped" : rates?.contracts_per_second.toFixed(0)}</strong>
        </div>
      </div>

      <div className="card" style={{ marginTop: "2rem" }}>
        <h2 style={{ marginTop: 0 }}>Indexer performance graph:</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
}
