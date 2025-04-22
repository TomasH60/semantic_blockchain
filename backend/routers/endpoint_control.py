from fastapi import APIRouter, Query, UploadFile, File
from fastapi.responses import FileResponse,JSONResponse
import subprocess
import os
import time
from config import ONTOP_PATH

router = APIRouter()
ontop_process = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "config"))
DUMP_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "dump"))

@router.post("/start-ontop-endpoint")
def start_ontop():
    global ontop_process
    if ontop_process and ontop_process.poll() is None:
        return {"status": "already running"}

    try:
        ontop_process = subprocess.Popen(
            [
                ONTOP_PATH, "endpoint",
                "--ontology=" + os.path.join(CONFIG_DIR, "ontology.owl"),
                "--mapping=" + os.path.join(CONFIG_DIR, "mapping.obda"),
                "--properties=" + os.path.join(CONFIG_DIR, "ontop.properties")
            ],
            cwd=os.path.abspath(os.path.join(BASE_DIR, "..")),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Wait briefly to check if it failed to start
        time.sleep(2)
        if ontop_process.poll() is not None:
            stdout, stderr = ontop_process.communicate()
            return {
                "error": "Ontop failed to start",
                "stdout": stdout,
                "stderr": stderr
            }

        return {"status": "ontop endpoint started"}
    except Exception as e:
        return {"error": f"Exception: {str(e)}"}


@router.get("/download-rdf")
def download_rdf(format: str = Query(...)):
    format_map = {
        "turtle": ("text/turtle", "materialized.ttl"),
        "rdfxml": ("application/rdf+xml", "materialized.rdf"),
        "jsonld": ("application/ld+json", "materialized.json")
    }

    if format not in format_map:
        return {"error": "Unsupported RDF format"}

    media_type, filename = format_map[format]
    output_path = os.path.join(DUMP_DIR, filename)

    if not os.path.exists(output_path):
        return {"error": "File not found"}

    return FileResponse(path=output_path, media_type=media_type, filename=filename)



@router.post("/export-rdf")
def export_rdf(format: str = Query("turtle")):
    format_map = {
        "turtle": ("text/turtle", "materialized.ttl"),
        "rdfxml": ("application/rdf+xml", "materialized.rdf"),
        "jsonld": ("application/ld+json", "materialized.json")
    }

    if format not in format_map:
        return JSONResponse(status_code=400, content={"error": "Unsupported RDF format"})

    _, filename = format_map[format]
    output_path = os.path.join(DUMP_DIR, filename)

    try:
        subprocess.run([
            ONTOP_PATH, "materialize",
            "-m", os.path.join(CONFIG_DIR, "mapping.obda"),
            "-t", os.path.join(CONFIG_DIR, "ontology.owl"),
            "-p", os.path.join(CONFIG_DIR, "ontop.properties"),
            "-f", format,
            "-o", output_path
        ], check=True)

        return {"status": "ok", "download_url": f"/download-rdf?format={format}"}

    except subprocess.CalledProcessError as e:
        return {"error": f"Materialization failed: {e}"}
    except Exception as ex:
        return {"error": str(ex)}
UPLOAD_ONTOLOGY_PATH = os.path.join(CONFIG_DIR, "uploaded_ontology.ttl")

@router.post("/start-ontop-endpoint-file")
async def start_ontop_from_file(file: UploadFile = File(...)):
    global ontop_process

    if ontop_process and ontop_process.poll() is None:
        return {"status": "already running"}

    try:
        # Save uploaded ontology
        contents = await file.read()
        with open(UPLOAD_ONTOLOGY_PATH, "wb") as f:
            f.write(contents)

        # Start Ontop with the uploaded ontology
        ontop_process = subprocess.Popen(
            [
                ONTOP_PATH, "endpoint",
                "--ontology=" + UPLOAD_ONTOLOGY_PATH,
                "--mapping=" + os.path.join(CONFIG_DIR, "mapping.obda"),
                "--properties=" + os.path.join(CONFIG_DIR, "ontop.properties")
            ],
            cwd=os.path.abspath(os.path.join(BASE_DIR, "..")),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        time.sleep(2)
        if ontop_process.poll() is not None:
            stdout, stderr = ontop_process.communicate()
            return {
                "error": "Ontop failed to start",
                "stdout": stdout,
                "stderr": stderr
            }

        return {"status": "ontop endpoint started with uploaded file"}

    except Exception as e:
        return {"error": f"Exception: {str(e)}"}

@router.post("/stop-ontop-endpoint")
def stop_ontop():
    global ontop_process
    if ontop_process and ontop_process.poll() is None:
        ontop_process.terminate()
        ontop_process = None
        return {"status": "ontop endpoint stopped"}
    return {"status": "not running"}