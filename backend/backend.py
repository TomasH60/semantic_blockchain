import subprocess
from fastapi import FastAPI, Query
from SPARQLWrapper import SPARQLWrapper, JSON
from fastapi.middleware.cors import CORSMiddleware
import traceback
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import time 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

POSTGRES_HOST = "localhost" #postgres_db
POSTGRES_PORT = 5432
POSTGRES_DB = "postgres"
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "postgres"

SPARQL_ENDPOINT = "http://localhost:8080/sparql" #backend

class SPARQLQueryRequest(BaseModel):
    query: str
class ClassCode(BaseModel):
    code: str
    
@app.post("/custom-sparql")
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
    
@app.get("/run-reasoner")
def run_reasoner():
    try:
        result = subprocess.run(
            ["python3", "/home/tomas/semantica/backend/reasoner.py"], #unsafe
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
    
@app.get("/sparql-query")
def run_sparql_query():
    
    sparql = SPARQLWrapper(SPARQL_ENDPOINT)
    sparql.setReturnFormat(JSON)
    sparql.setMethod("POST")
    sparql.setTimeout(10)

    sparql.setQuery("""
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX blon: <http://www.semanticblockchain.com/Blondie.owl#>

SELECT ?id ?block_number ?timestamp ?tx
WHERE { 
    ?transfer rdf:type blon:TronTransaction ;
              blon:txIdTronTransaction ?id ;
              blon:blockNumberTronTransaction ?block_number ;
              blon:timestampTronTransaction ?timestamp ;
              blon:senderTronTransaction ?tx .

    BIND(xsd:integer(substr(?timestamp, 1, 4)) AS ?year)  
    BIND(xsd:integer(substr(?timestamp, 6, 2)) AS ?month) 
    BIND(xsd:integer(substr(?timestamp, 9, 2)) AS ?day)   
    BIND(xsd:integer(substr(?timestamp, 12, 2)) AS ?hour) 
    BIND(xsd:integer(substr(?timestamp, 15, 2)) AS ?minute)
    BIND(xsd:integer(substr(?timestamp, 18, 2)) AS ?second) 
}
ORDER BY DESC(?year) DESC(?month) DESC(?day) 
DESC(?hour) DESC(?minute) DESC(?second)
LIMIT 100
    """)

    try:
        start_time = time.time()  # ✅ Start timing
        results = sparql.query().convert()
        execution_time = (time.time() - start_time) * 1000 # ✅ Calculate execution time
        return {
            "data": results["results"]["bindings"],
            "execution_time": f"{execution_time:.4f} ms"  # ✅ Include timing in response
        }
    except Exception as e:
        print(traceback.format_exc())
        return {"error": str(e)}
    

@app.post("/save-classes")
async def save_classes(data: ClassCode):
    try:
        path = "/home/tomas/semantica/backend/custom_classes.py"
        with open(path, "w") as f:
            f.write("def define_custom_classes(onto):\n")
            for line in data.code.splitlines():
                f.write("    " + line + "\n")
        return {"status": "ok"}
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/load-classes", response_class=PlainTextResponse)
def load_classes():
    try:
        with open("/home/tomas/semantica/backend/custom_classes.py", "r") as f:
            return f.read()
    except Exception as e:
        return f"# Error loading file: {str(e)}"
    
@app.get("/sql-query")
def run_sql_query():
    sql_query = """
        SELECT * FROM transfer LIMIT 100;
    """

    try:
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            cursor_factory=RealDictCursor
        )
        cursor = conn.cursor()
        start_time = time.time()  # ✅ Start timing
        cursor.execute(sql_query)
        execution_time = (time.time() - start_time) * 1000  # ✅ Calculate execution time
        results = cursor.fetchall()
        cursor.close()
        conn.close()

        
        return {
            "data": results,
            "execution_time": f"{execution_time:.4f} ms"  # ✅ Include timing in response
        }
    except Exception as e:
        print(traceback.format_exc())
        return {"error": str(e)}

