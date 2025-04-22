from fastapi import APIRouter
from pydantic import BaseModel
from SPARQLWrapper import SPARQLWrapper, JSON
import time
import traceback
from config import SPARQL_ENDPOINT

router = APIRouter()

class SPARQLQueryRequest(BaseModel):
    query: str

@router.post("/custom-sparql")
def run_custom_sparql(request: SPARQLQueryRequest):
    sparql = SPARQLWrapper(SPARQL_ENDPOINT)
    sparql.setReturnFormat(JSON)
    sparql.setMethod("POST")
    sparql.setTimeout(10)
    sparql.setQuery(request.query)

    try:
        start_time = time.time()
        results = sparql.query().convert()
        execution_time = (time.time() - start_time) * 1000
        return {
            "data": results["results"]["bindings"],
            "execution_time": f"{execution_time:.4f} ms"
        }
    except Exception as e:
        print(traceback.format_exc())
        return {"error": str(e)}
