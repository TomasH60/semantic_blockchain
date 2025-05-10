import os
from dotenv import load_dotenv

env_path = os.getenv("ENV_PATH", ".env")
load_dotenv(env_path)

ONTOP_PATH = os.getenv("ONTOP_PATH", "ontop")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", 5432))
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
SPARQL_ENDPOINT = os.getenv("SPARQL_ENDPOINT")

# Reasoner-related configuration
BASE_DIR = os.getenv("BASE_DIR", "/app")

N3_REASONER_PATH = "/opt/eye/bin/eye"  
N3_CLASSES_PATH = os.path.join(BASE_DIR, "classes", "rules.n3")
N3_INPUT_PATH = os.path.join(BASE_DIR, "dump", "rdf_input.n3")
N3_OUTPUT_PATH = os.path.join(BASE_DIR, "dump", "rdf_output_inferred.n3")
