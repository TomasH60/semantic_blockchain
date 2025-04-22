from fastapi import APIRouter
import psycopg2
from psycopg2.extras import RealDictCursor
from config import POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD

router = APIRouter()

@router.get("/stats")
def get_statistics():
    query = """
        SELECT
            (SELECT COUNT(DISTINCT block_number) FROM transfer) AS indexed_blocks,
            (SELECT COUNT(*) FROM transfer) AS indexed_transactions,
            (SELECT COUNT(*) FROM contract_execution) AS indexed_contract_executions;
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
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return {"data": result}
    except Exception as e:
        return {"error": str(e)}

@router.get("/sql-query")
def run_sql_query():
    query = "SELECT * FROM transfer LIMIT 100;"
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
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return {"data": result}
    except Exception as e:
        return {"error": str(e)}
