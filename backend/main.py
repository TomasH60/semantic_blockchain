from fastapi import FastAPI
from SPARQLWrapper import SPARQLWrapper, JSON
from typing import List
import json
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SPARQL_ENDPOINT = "http://localhost:8080/sparql"

@app.get("/transfer-paths", response_model=List[List[dict]])
def get_transfer_paths(max_depth: int = 3, max_total_paths: int = 10):
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
                      :from ?from ;
                      :to ?to ;
                      :amount ?amount ;
                      :timestamp ?timestamp ;
                      :contract_address ?contract ;
                      :tx ?tx .
            
            FILTER(?transfer NOT IN ({",".join(f"<{t}>" for t in visited_transfers)}))
        }}
        ORDER BY ?timestamp
        LIMIT 1
        """)

        results = sparql.query().convert()

        if "results" in results and "bindings" in results["results"]:
            transfer_path = []
            first_transfer = results["results"]["bindings"][0]
            transfer_path.append(first_transfer)
            contract_address = first_transfer["contract"]["value"]
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

                    FILTER (?contract = "{contract_address}")
                }}
                ORDER BY ?timestamp
                LIMIT 1
                """)

                next_results = sparql.query().convert()

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
