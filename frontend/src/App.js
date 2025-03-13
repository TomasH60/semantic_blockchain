import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [transferPaths, setTransferPaths] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/transfer-paths") // Adjust if FastAPI runs on a different port
      .then(response => response.json())
      .then(data => setTransferPaths(data))
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="App">
      <h1>Transfer Paths</h1>
      {transferPaths.length > 0 ? (
        <ul>
          {transferPaths.map((path, index) => (
            <li key={index}>
              <h3>Path {index + 1}</h3>
              <ul>
                {path.map((transfer, idx) => (
                  <li key={idx}>
                    <strong>From:</strong> {transfer.from.value} → <strong>To:</strong> {transfer.to.value}
                    <br />
                    <strong>Amount:</strong> {transfer.amount.value}
                    <br />
                    <strong>Timestamp:</strong> {transfer.timestamp.value}
                    <br />
                    <strong>Contract:</strong> {transfer.contract.value}
                    <br />
                    <strong>Transaction:</strong> {transfer.tx.value}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading transfer paths...</p>
      )}
    </div>
  );
}

export default App;
