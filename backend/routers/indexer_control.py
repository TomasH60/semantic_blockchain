import os
import subprocess
from threading import Lock
from fastapi import APIRouter

router = APIRouter()
indexer_process = None
indexer_lock = Lock()

@router.post("/start-indexer")
def start_indexer():
    global indexer_process
    with indexer_lock:
        if indexer_process is None or indexer_process.poll() is not None:
            try:
                backend_dir = os.path.dirname(os.path.abspath(__file__))
                indexer_dir = os.path.abspath(os.path.join(backend_dir, "..", "..", "indexer"))
                indexer_process = subprocess.Popen(
                    ["node", "-r", "dotenv/config", "lib/main.js"],
                    cwd=indexer_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                return {"status": "started"}
            except Exception as e:
                return {"error": str(e)}
        else:
            return {"status": "already running"}

@router.post("/stop-indexer")
def stop_indexer():
    global indexer_process
    with indexer_lock:
        if indexer_process and indexer_process.poll() is None:
            indexer_process.terminate()
            indexer_process = None
            return {"status": "stopped"}
        else:
            return {"status": "not running"}
