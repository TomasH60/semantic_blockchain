import React, { useEffect, useState, useRef } from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import outlabels from 'chartjs-plugin-piechart-outlabels';




ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, LogarithmicScale, ArcElement, Tooltip, Legend, ChartDataLabels, outlabels);

export default function Home({ setNotification }) {
  const [stats, setStats] = useState({});
  const [rates, setRates] = useState(null);
  const [indexerStatus, setIndexerStatus] = useState("stopped");
  const previousStats = useRef(null);
  const [startMode, setStartMode] = useState("db");
  const [rdfFile, setRdfFile] = useState(null);
  const lastNonZeroRates = useRef({
    blocks_per_second: 0,
    transactions_per_second: 0,
    internal_transactions_per_second: 0,
    events_per_second: 0,
  });
  const [rateStats, setRateStats] = useState({
    average: {},
    stddev: {},
    min: {},
    max: {}
  });




  const chartDataRef = useRef({
    labels: [],
    datasets: [
      {
        label: "Indexed blocks",
        data: [],
        borderColor: "rgb(8, 255, 3)",
        fill: false,
      },
      {
        label: "Indexed transactions",
        data: [],
        borderColor: "rgba(255, 99, 132, 1)",
        fill: false,
      },
      {
        label: "Indexed internal txs",
        data: [],
        borderColor: "rgba(255, 159, 64, 1)",
        fill: false,
      },
      {
        label: "Indexed events",
        data: [],
        borderColor: "rgba(54, 162, 235, 1)",
        fill: false,
      },
    ],
  });
  const rateChartRef = useRef({
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
        label: "Internal txs per second",
        data: [],
        borderColor: "rgba(255, 159, 64, 1)",
        fill: false,
      },
      {
        label: "Events per second",
        data: [],
        borderColor: "rgba(54, 162, 235, 1)",
        fill: false,
      },
    ],
  });
  const [rateChartData, setRateChartData] = useState(rateChartRef.current);


  const [chartData, setChartData] = useState(chartDataRef.current);
  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setRdfFile(e.target.files[0]);
    }
  };

  const stopOntopEndpoint = async () => {
    try {
      const res = await fetch(`${API_BASE}/stop-ontop-endpoint`, { method: "POST" });
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
        response = await fetch(`${API_BASE}/start-ontop-endpoint-file`, { method: "POST", body: formData });
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
    try {
      lastUpdateTimeRef.current = Date.now();
      previousStats.current = {
        indexed_blocks: 0,
        indexed_transactions_total: 0,
        indexed_internal_transactions_total: 0,
        indexed_events_total: 0,
      };

      const res = await fetch(`${API_BASE}/start-indexer`, { method: "POST" });
      const json = await res.json();
      setIndexerStatus(json.status || json.error || "error");

      if (json.status && json.status.toLowerCase().includes("started")) {
        setIndexerStatus("started")
      }
    } catch (err) {
      setNotification({ message: `Failed to start indexer: ${err.message}`, type: "error" });
    }
  };

  const stopIndexer = async () => {
    const res = await fetch(`${API_BASE}/stop-indexer`, { method: "POST" });
    const json = await res.json();
    setIndexerStatus(json.status || json.error || "error");
  };

  const handleExport = async (format) => {
    try {
      setNotification({ message: `Export started for format ${format.toUpperCase()}`, type: "success" });
      const res = await fetch(`${API_BASE}/export-rdf?format=${format}`, { method: "POST" });
      const data = await res.json();
      if (data.download_url) {
        window.open(`${API_BASE}${data.download_url}`, "_blank");
      } else {
        setNotification({ message: "Export failed: download URL missing", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Export failed", type: "error" });
    }
  };
  function calculateStats(dataArray) {
    const n = dataArray.length;
    if (n === 0) {
      return { mean: 0, std: 0, min: 0, max: 0, p25: 0, p50: 0, p75: 0 };
    }

    const sorted = [...dataArray].sort((a, b) => a - b);

    const percentile = (arr, p) => {
      const rank = (p / 100) * (arr.length - 1);
      const lower = Math.floor(rank);
      const upper = Math.ceil(rank);
      const weight = rank - lower;
      if (upper >= arr.length) return arr[lower];
      return arr[lower] * (1 - weight) + arr[upper] * weight;
    };

    const sum = dataArray.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const std = Math.sqrt(dataArray.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n);

    return {
      mean: parseFloat(mean.toFixed(2)),
      std: parseFloat(std.toFixed(2)),
      min: parseFloat(Math.min(...dataArray).toFixed(2)),
      p25: parseFloat(percentile(sorted, 25).toFixed(2)),
      p50: parseFloat(percentile(sorted, 50).toFixed(2)),
      p75: parseFloat(percentile(sorted, 75).toFixed(2)),
      max: parseFloat(Math.max(...dataArray).toFixed(2)),
    };
  }

  const lastUpdateTimeRef = useRef(null);

  useEffect(() => {
    if (indexerStatus !== "started") return;
    let lastBlock = null;
    //let lastUpdateTime = null;

    const checkAndFetchStats = async () => {
      try {
        const blockRes = await fetch(`${API_BASE}/prometheus/block`);
        

        if (blockRes.status === 61) {
          console.error(`Custom error 61 from /prometheus/block`);

          const statsRes = await fetch(`${API_BASE}/stats`);
          const statsJson = await statsRes.json();
          if (statsJson && statsJson.data) {
            setStats(statsJson.data);
          }
          setIndexerStatus("stopped");
          return;
        }

        const blockJson = await blockRes.json();
        if (!blockJson || !blockJson.last_indexed_block) {
          console.warn("Missing or malformed /prometheus/block payload.");
          return;
        }


        const currentBlock = blockJson.last_indexed_block;
        const now = Date.now();
        const deltaTime = lastUpdateTimeRef.current ? (now - lastUpdateTimeRef.current) / 1000 : 0;
        lastUpdateTimeRef.current = now;

        const statsRes = await fetch(`${API_BASE}/stats`);
        const statsJson = await statsRes.json();

        if (!statsJson || !statsJson.data) {
          console.error("Invalid response format from /stats:", statsJson);
          return;
        }

        const newStats = statsJson.data;
        const timeLabel = new Date().toLocaleTimeString();
        setStats(newStats);

        if (indexerStatus === "stopped") {
          setRates(null);
          return;
        }

        if (!previousStats.current) {
          previousStats.current = {
            indexed_blocks: 0,
            indexed_transactions_total: 0,
            indexed_internal_transactions_total: 0,
            indexed_events_total: 0,
          };
        }

        const deltaBlocks = newStats.indexed_blocks - previousStats.current.indexed_blocks;
        const deltaTxs = newStats.indexed_transactions_total - previousStats.current.indexed_transactions_total;
        const deltaInternal = newStats.indexed_internal_transactions_total - previousStats.current.indexed_internal_transactions_total;
        const deltaEvents = newStats.indexed_events_total - previousStats.current.indexed_events_total;

        const bps = deltaBlocks / deltaTime;
        const tps = deltaTxs / deltaTime;
        const itps = deltaInternal / deltaTime;
        const eps = deltaEvents / deltaTime;

        setRates({ blocks_per_second: bps, transactions_per_second: tps, internal_transactions_per_second: itps, events_per_second: eps });

        const refRate = rateChartRef.current;
        refRate.labels.push(timeLabel);
        refRate.datasets[0].data.push(parseFloat(bps.toFixed(2)));
        refRate.datasets[1].data.push(parseFloat(tps.toFixed(2)));
        refRate.datasets[2].data.push(parseFloat(itps.toFixed(2)));
        refRate.datasets[3].data.push(parseFloat(eps.toFixed(2)));

        setRateChartData({
          labels: [...refRate.labels],
          datasets: refRate.datasets.map((ds) => ({
            ...ds,
            data: [...ds.data],
          })),
        });

        setRateStats({
          bps: calculateStats(refRate.datasets[0].data),
          tps: calculateStats(refRate.datasets[1].data),
          itps: calculateStats(refRate.datasets[2].data),
          eps: calculateStats(refRate.datasets[3].data),
        });

        const ref = chartDataRef.current;
        ref.labels.push(timeLabel);
        ref.datasets[0].data.push(newStats.indexed_blocks);
        ref.datasets[1].data.push(newStats.indexed_transactions_total);
        ref.datasets[2].data.push(newStats.indexed_internal_transactions_total);
        ref.datasets[3].data.push(newStats.indexed_events_total);

        setChartData({
          labels: [...ref.labels],
          datasets: ref.datasets.map((ds) => ({
            ...ds,
            data: ds.data.map(value => value === 0 ? null : value),
          })),
        });

        previousStats.current = newStats;

      } catch (err) {
        if (err.message.includes("ECONNREFUSED") || err.message.includes("Failed to fetch")) {
          console.error("Connection refused or fetch failed:", err.message);
          try {
            const statsRes = await fetch(`${API_BASE}/stats`);
            const statsJson = await statsRes.json();
            if (statsJson && statsJson.data) {
              setStats(statsJson.data);
            }
          } catch (_) { }
          setIndexerStatus("stopped");
        } else {
          console.error("Unexpected error during indexer polling:", err);
        }
      }
    };


    const interval = setInterval(checkAndFetchStats, 15000);
    return () => clearInterval(interval);
  }, [API_BASE, indexerStatus]);




  const pieOptions = {
    plugins: {
      legend: {
        display: false,
        position: 'right',
      },
      datalabels: {
        display: false, // Hide labels completely
      },
    },
  };





  const transactionPieData = {
    labels: stats.table_counts ? Object.keys(stats.table_counts).filter(x => x.endsWith("_transaction")) : [],
    datasets: [
      {
        label: "Transaction types",
        data: stats.table_counts ? Object.entries(stats.table_counts).filter(([k]) => k.endsWith("_transaction")).map(([, v]) => v) : [],
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
          "#FF9F40", "#66FF66", "#FF6666", "#6666FF", "#FFFF66",
        ],
        radius: "80%"
      },
    ],
  };

  const eventPieData = {
    labels: stats.table_counts ? Object.keys(stats.table_counts).filter(x => x.endsWith("_event")) : [],
    datasets: [
      {
        label: "Event types",
        data: stats.table_counts ? Object.entries(stats.table_counts).filter(([k]) => k.endsWith("_event")).map(([, v]) => v) : [],
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
          "#FF9F40", "#66FF66", "#FF6666", "#6666FF", "#FFFF66",
        ],
        radius: "80%"
      },
    ],
  };
  const thStyle = { border: "1px solid #ccc", textAlign: "center", padding: "0.5rem" };
  const tdStyle = { border: "1px solid #ccc", textAlign: "center", padding: "0.5rem" };

  return (
    <div className="main-content">
      <h1>Dashboard</h1>

      {/* Ontop Buttons */}
      <div className="card">
        <p>Start Ontop endpoint from:</p>
        <div className="button-group" style={{ marginBottom: "1rem" }}>
          <label>
            <input type="radio" name="ontopSource" value="db" checked={startMode === "db"} onChange={() => setStartMode("db")} /> DB Mapping
          </label>
          <label style={{ marginLeft: "1rem" }}>
            <input type="radio" name="ontopSource" value="file" checked={startMode === "file"} onChange={() => setStartMode("file")} /> RDF File
          </label>
        </div>
        {startMode === "file" && (
          <div style={{ marginBottom: "1rem" }}>
            <label className="file-upload-button">Choose RDF File
              <input type="file" accept=".ttl,.rdf" style={{ display: "none" }} onChange={handleFileChange} />
            </label>
            {rdfFile && <span style={{ marginLeft: "0.5rem" }}>{rdfFile.name}</span>}
          </div>
        )}
        <button onClick={startOntopEndpoint}>Start Ontop Endpoint</button>
        <button onClick={stopOntopEndpoint} style={{ marginLeft: "1rem" }}>Stop Ontop Endpoint</button>
      </div>

      {/* Export Buttons */}
      <div className="card">
        <p>Export database to RDF:</p>
        <div className="button-group">
          <button onClick={() => handleExport("turtle")}>Turtle (.ttl)</button>
          <button onClick={() => handleExport("rdfxml")}>RDF/XML (.rdf)</button>
          <button onClick={() => handleExport("jsonld")}>JSON-LD (.json)</button>
          <button onClick={() => handleExport("n3")}>Notation3 (.n3)</button>
        </div>
      </div>


      {/* Indexer Control Buttons */}
      <div className="card">
        <p>Indexer controls:</p>
        <div className="button-group">
          <button onClick={startIndexer}>Start</button>
          <button onClick={stopIndexer}>Stop</button>
        </div>
        <p><strong>Indexer status:</strong> {indexerStatus}</p>
      </div>

      {/* Stats */}
      <div className="card stats-card">
        <p style={{ fontWeight: "bold" }}>Statistics:</p>

        {stats.block_range && (
          <div className="stat-item">
            <span>Block range:</span>{" "}
            <strong>{stats.block_range.min_block} - {stats.block_range.max_block}</strong>
          </div>
        )}

        <div className="stat-item"><span>Indexed blocks:</span> <strong>{stats.indexed_blocks}</strong></div>
        <div className="stat-item"><span>Indexed transactions:</span> <strong>{stats.indexed_transactions_total}</strong></div>
        <div className="stat-item"><span>Indexed internal transactions:</span> <strong>{stats.indexed_internal_transactions_total}</strong></div>
        <div className="stat-item"><span>Indexed event logs:</span> <strong>{stats.indexed_events_total}</strong></div>

        <div className="stat-item"><span>Blocks per second (BPS):</span> <strong>{rates?.blocks_per_second?.toFixed(2) ?? "Stopped"}</strong></div>
        <div className="stat-item"><span>Transactions per second (TPS):</span> <strong>{rates?.transactions_per_second?.toFixed(2) ?? "Stopped"}</strong></div>
        <div className="stat-item"><span>Internal transactions per second (ITPS):</span> <strong>{rates?.internal_transactions_per_second?.toFixed(2) ?? "Stopped"}</strong></div>
        <div className="stat-item"><span>Event logs per second (ELPS):</span> <strong>{rates?.events_per_second?.toFixed(2) ?? "Stopped"}</strong></div>

        <div style={{ maxHeight: "300px", overflowY: "auto", marginTop: "1rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
          {stats.table_counts && Object.entries(stats.table_counts).map(([table, count]) => (
            <div key={table} className="stat-item">
              <span>{table}:</span> <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="card stats-card" style={{ marginTop: "2rem" }}>
        <p><strong>Additional Rate Statistics</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Metric</th>
              <th style={thStyle}>Mean</th>
              <th style={thStyle}>Std. Dev</th>
              <th style={thStyle}>Min</th>
              <th style={thStyle}>25%</th>
              <th style={thStyle}>50%</th>
              <th style={thStyle}>75%</th>
              <th style={thStyle}>Max</th>
            </tr>
          </thead>
          <tbody>
            {["bps", "tps", "itps", "eps"].map((key) => (
              <tr key={key}>
                <td style={tdStyle}>{key.toUpperCase()}</td>
                <td style={tdStyle}>{rateStats[key]?.mean}</td>
                <td style={tdStyle}>{rateStats[key]?.std}</td>
                <td style={tdStyle}>{rateStats[key]?.min}</td>
                <td style={tdStyle}>{rateStats[key]?.p25}</td>
                <td style={tdStyle}>{rateStats[key]?.p50}</td>
                <td style={tdStyle}>{rateStats[key]?.p75}</td>
                <td style={tdStyle}>{rateStats[key]?.max}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>


      {/* Logarithmic Chart */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <h2>Indexed absolute counts of data:</h2>

        <Line data={chartData} options={{
          plugins: {
            datalabels: { display: false } // ⛔ hides point labels
          },
        }} />
      </div>
      <div className="card" style={{ marginTop: "2rem" }}>
        <h2>Indexer performance over time:</h2>
        <Line data={rateChartData} options={{
          plugins: {
            datalabels: { display: false } // ⛔ hides point labels
          },
          scales: {
            y: {
              type: "logarithmic",

            },
          },
        }} />
      </div>

      {/* Two Pie Charts */}
      <div className="card" style={{ marginTop: "2rem", display: "flex", justifyContent: "space-around" }}>

        <div style={{ width: "45%" }}>
          <h3>Transactions Composition</h3>
          <Pie data={transactionPieData} options={pieOptions} />
        </div>

        <div style={{ width: "45%" }}>
          <h3>Event Logs Composition</h3>
          <Pie data={eventPieData} options={pieOptions} />
        </div>
      </div>

    </div>
  );
}
