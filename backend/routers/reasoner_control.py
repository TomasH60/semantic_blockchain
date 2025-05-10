from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel
import os
import shutil
import subprocess

from config import BASE_DIR, N3_REASONER_PATH, N3_CLASSES_PATH, N3_INPUT_PATH, N3_OUTPUT_PATH

router = APIRouter()

class N3ClassCode(BaseModel):
    code: str

@router.post("/save-n3-classes")
def save_n3_classes(data: N3ClassCode):
    try:
        with open(N3_CLASSES_PATH, "w", encoding="utf-8") as f:
            f.write(data.code)
        return {"status": "ok"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/load-n3-classes", response_class=PlainTextResponse)
def load_n3_classes():
    try:
        with open(N3_CLASSES_PATH, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return PlainTextResponse(f"# Error loading N3 classes: {str(e)}", status_code=500)

@router.post("/load-n3-data")
def load_n3_data(file: UploadFile = File(...)):
    try:
        with open(N3_INPUT_PATH, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return {"status": "ok", "filename": file.filename}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/run-n3-reasoner")
def run_n3_reasoner():
    try:
        cmd = f"{N3_REASONER_PATH} {N3_INPUT_PATH} {N3_CLASSES_PATH} --nope --pass > {N3_OUTPUT_PATH}"
        result = subprocess.run(
            cmd,
            shell=True,
            stderr=subprocess.PIPE,
            text=True
        )

        if result.returncode != 0:
            return JSONResponse(
                status_code=500,
                content={"error": "Reasoner failed", "stderr": result.stderr}
            )

        return {"status": "ok", "download_url": "/download-inferred-n3"}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/download-inferred-n3")
def download_inferred_n3():
    if not os.path.exists(N3_OUTPUT_PATH):
        return JSONResponse(status_code=404, content={"error": "Inferred file not found"})
    return FileResponse(
        path=N3_OUTPUT_PATH,
        media_type="text/n3",
        filename="inferred_output.n3"
    )
