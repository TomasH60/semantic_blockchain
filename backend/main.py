from fastapi import FastAPI, Query
from SPARQLWrapper import SPARQLWrapper, JSON
from fastapi.middleware.cors import CORSMiddleware
import traceback
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
POSTGRES_HOST = "postgres_db"  # Use the container name
POSTGRES_PORT = 5432
POSTGRES_DB = "postgres"
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "postgres"

# ✅ Use the correct SPARQL endpoint (your container name, not 0.0.0.0)
SPARQL_ENDPOINT = "http://backend:8080/sparql"  

@app.get("/sparql-query")
def run_sparql_query():
    sparql = SPARQLWrapper(SPARQL_ENDPOINT)
    sparql.setReturnFormat(JSON)
    sparql.setMethod("POST")  # ✅ Use POST because curl works with POST
    sparql.setTimeout(10)  # ✅ Prevent infinite loading

    sparql.setQuery("""
        SELECT ?s ?p ?o 
        WHERE { ?s ?p ?o } 
        LIMIT 10
    """)

    try:
        results = sparql.query().convert()
        return results["results"]["bindings"]  # ✅ Return raw SPARQL results
    except Exception as e:
        print(traceback.format_exc())  # ✅ Print error stack trace for debugging
        return {"error": str(e)}

@app.get("/sql-query")
def run_sql_query():
    """Executes a similar query using SQL on PostgreSQL."""
    sql_query = """
        SELECT * 
        FROM transfer
        LIMIT 10;
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
        cursor.execute(sql_query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return results  # ✅ Return SQL query results
    except Exception as e:
        print(traceback.format_exc())  # ✅ Debugging logs
        return {"error": str(e)}
    
    
@app.get("/transfer-paths", response_model=List[List[dict]])
def get_transfer_paths(
    address_hash: str = Query(..., description="Address hash to trace"),
    token_contract_hash: str = Query(..., description="Token contract address"),
    max_depth: int = 3,
    max_total_paths: int = 10
):
    """
    Traces token transfers from a specific address and contract.
    """
    sparql = SPARQLWrapper(SPARQL_ENDPOINT)
    sparql.setReturnFormat(JSON)

    all_transfer_paths = []
    visited_transfers = set()

    while len(all_transfer_paths) < max_total_paths:
        sparql.setQuery(f"""
        PREFIX : <http://example.org/resource/transfer#>

        SELECT ?transfer ?from ?to ?amount ?timestamp ?contract ?tx
        WHERE {{
            ?transfer rdf:type <http://example.org/resource/transfer> ;
                      :from "{address_hash}" ;
                      :to ?to ;
                      :amount ?amount ;
                      :timestamp ?timestamp ;
                      :contract_address ?contract ;
                      :tx ?tx .

            FILTER (?contract = "{token_contract_hash}")
        }}
        ORDER BY ?timestamp
        LIMIT 1
        """)

        try:
            results = sparql.query().convert()
        except Exception as e:
            print(traceback.format_exc())  
            return {"error": str(e)}

        if "results" in results and "bindings" in results["results"]:
            transfer_path = []
            first_transfer = results["results"]["bindings"][0]
            transfer_path.append(first_transfer)
            visited_transfers.add(first_transfer["transfer"]["value"])

            depth = 0
            while depth < max_depth:
                last_to = transfer_path[-1]["to"]["value"]

                sparql.setQuery(f"""
                PREFIX : <http://example.org/resource/transfer#>

                SELECT ?transfer ?from ?to ?amount ?timestamp ?contract ?tx
                WHERE {{
                    ?transfer rdf:type <http://example.org/resource/transfer> ;
                              :from "{last_to}" ;
                              :to ?to ;
                              :amount ?amount ;
                              :timestamp ?timestamp ;
                              :contract_address ?contract ;
                              :tx ?tx .

                    FILTER (?contract = "{token_contract_hash}")
                }}
                ORDER BY ?timestamp
                LIMIT 1
                """)

                try:
                    next_results = sparql.query().convert()
                except Exception as e:
                    print(traceback.format_exc())
                    return {"error": str(e)}

                if "results" in next_results and "bindings" in next_results["results"] and len(next_results["results"]["bindings"]) > 0:
                    next_transfer = next_results["results"]["bindings"][0]
                    transfer_path.append(next_transfer)
                    visited_transfers.add(next_transfer["transfer"]["value"])
                    depth += 1
                else:
                    break

            all_transfer_paths.append(transfer_path)
        else:
            break

    return all_transfer_paths
