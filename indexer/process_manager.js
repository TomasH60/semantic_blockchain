const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

let started = false;
let finished = false;

const { main } = require("./lib/main");

async function startIndexer() {
  if (started) {
    console.log("Indexer already running or completed.");
    return;
  }

  started = true;
  console.log("Indexer starting...");

  try {
    await main();
    console.log("Indexer finished processing.");
    finished = true;
    started = false; // Allow restart if needed
  } catch (err) {
    console.error("Indexer crashed:", err);
    started = false;
  }
}

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

app.post("/start", async (req, res) => {
  if (started) {
    return res.json({ status: finished ? "finished" : "already running" });
  }

  startIndexer(); // Don't await — run async
  res.json({ status: "started" });
});

app.post("/stop", (req, res) => {
  res.json({ status: "shutting down" });
  process.exit(0);
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Process manager listening on port ${PORT}`);
});
