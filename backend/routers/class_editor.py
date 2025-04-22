from fastapi import APIRouter, Query, UploadFile, File
from fastapi.responses import PlainTextResponse, FileResponse, JSONResponse
from pydantic import BaseModel
import subprocess
import os
import shutil

from config import BASE_DIR, REASONER_SCRIPT, INFERRED_DUMP

router = APIRouter()

class ClassCode(BaseModel):
    code: str

@router.post("/save-classes")
def save_classes(data: ClassCode):
    try:
        path = os.path.join(BASE_DIR, "custom_classes.py")
        with open(path, "w") as f:
            f.write("def define_custom_classes(onto):\n")
            for line in data.code.splitlines():
                f.write("    " + line + "\n")
        return {"status": "ok"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/load-classes", response_class=PlainTextResponse)
def load_classes():
    try:
        path = os.path.join(BASE_DIR, "classes/custom_classes.py")
        with open(path, "r") as f:
            return f.read()
    except Exception as e:
        return f"# Error loading file: {str(e)}"

@router.post("/run-reasoner")
def run_reasoner():
    try:
        result = subprocess.run(
            ["python3", REASONER_SCRIPT],
            capture_output=True,
            text=True,
            timeout=60
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/download-inferred")
def download_inferred():
    if not os.path.exists(INFERRED_DUMP):
        return JSONResponse(status_code=404, content={"error": "Inferred file not found"})
    return FileResponse(
        path=INFERRED_DUMP,
        media_type="application/rdf+xml",
        filename="inferred_dump.rdf"
    )

@router.post("/load-rdf-dump")
def load_rdf_dump(file: UploadFile = File(...)):
    try:
        dump_path = os.path.join(BASE_DIR, "dump", "rdf_dump.rdf")
        with open(dump_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return {"status": "ok", "filename": file.filename}
    except Exception as e:
        return {"error": str(e)}
