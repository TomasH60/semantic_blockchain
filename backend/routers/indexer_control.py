import os
import requests
from fastapi import APIRouter

router = APIRouter()


@router.post("/start-indexer")
def start_indexer():
    try:
        response = requests.post(f"http://localhost:5500/start")
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e)}

@router.post("/stop-indexer")
def stop_indexer():
    try:
        response = requests.post(f"http://localhost:5500/stop")
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e)}
