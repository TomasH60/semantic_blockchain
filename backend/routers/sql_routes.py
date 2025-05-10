from fastapi import APIRouter, WebSocket
import psycopg2
from psycopg2.extras import RealDictCursor
from config import POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
from typing import List
import httpx
import re

router = APIRouter()
connected_clients: List[WebSocket] = []

router = APIRouter()

all_tables = [
    "block",
    "internal_transaction",
    "transfer_contract_transaction",
    "transfer_asset_contract_transaction",
    "trigger_smart_contract_transaction",
    "account_create_contract_transaction",
    "account_update_contract_transaction",
    "asset_issue_contract_transaction",
    "participate_asset_issue_contract_transaction",
    "freeze_balance_contract_transaction",
    "unfreeze_balance_contract_transaction",
    "witness_create_contract_transaction",
    "witness_update_contract_transaction",
    "vote_asset_contract_transaction",
    "vote_witness_contract_transaction",
    "withdraw_balance_contract_transaction",
    "proposal_create_contract_transaction",
    "proposal_approve_contract_transaction",
    "proposal_delete_contract_transaction",
    "set_account_id_contract_transaction",
    "custom_contract_transaction",
    "create_smart_contract_transaction",
    "get_contract_transaction",
    "update_setting_contract_transaction",
    "exchange_create_contract_transaction",
    "exchange_inject_contract_transaction",
    "exchange_withdraw_contract_transaction",
    "exchange_transaction_contract_transaction",
    "update_energy_limit_contract_transaction",
    "account_permission_update_contract_transaction",
    "clear_abi_contract_transaction",
    "update_brokerage_contract_transaction",
    "shielded_transfer_contract_transaction",
    "market_sell_asset_contract_transaction",
    "market_cancel_order_contract_transaction",
    "freeze_balance_v2_contract_transaction",
    "unfreeze_balance_v2_contract_transaction",
    "withdraw_expire_unfreeze_contract_transaction",
    "delegate_resource_contract_transaction",
    "un_delegate_resource_contract_transaction",
    "cancel_all_unfreeze_v2_contract_transaction",
    "destroyed_black_funds_event",
    "issue_event",
    "redeem_event",
    "deprecate_event",
    "added_black_list_event",
    "removed_black_list_event",
    "params_event",
    "pause_event",
    "unpause_event",
    "ownership_transferred_event",
    "approval_event",
    "transfer_event",
    "generic_log_event",
]

@router.get("/stats")
def get_statistics():
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

        stats = {}
        total_blocks = 0
        total_transactions = 0
        total_internal_transactions = 0
        total_events = 0
        min_block = None
        max_block = None

        for table in all_tables:
            cursor.execute(f'SELECT COUNT(*) AS count FROM "{table}";')
            count = cursor.fetchone()["count"]
            stats[table] = count

            if table == "block":
                total_blocks += count

                # fetch min and max block height
                cursor.execute('SELECT MIN(number) as min_block, MAX(number) as max_block FROM "block";')
                minmax = cursor.fetchone()
                min_block = minmax["min_block"]
                max_block = minmax["max_block"]

            elif table == "internal_transaction":
                total_internal_transactions += count
            elif table.endswith("_transaction") or table == "generic_transaction":
                total_transactions += count
            elif table.endswith("_event"):
                total_events += count

        cursor.close()
        conn.close()

        return {
            "data": {
                "indexed_blocks": total_blocks,
                "indexed_transactions_total": total_transactions,
                "indexed_internal_transactions_total": total_internal_transactions,
                "indexed_events_total": total_events,
                "block_range": {
                    "min_block": min_block,
                    "max_block": max_block
                },
                "table_counts": stats
            }
        }
    except Exception as e:
        return {"error": str(e)}



@router.get("/prometheus/block")
def get_last_block_from_prometheus():
    try:
        response = httpx.get("http://localhost:9090/metrics", timeout=5.0)
        response.raise_for_status()

        # Extract the line with sqd_processor_last_block and get its numeric value
        match = re.search(r"^sqd_processor_last_block\s+(\d+)", response.text, re.MULTILINE)
        if match:
            block_number = int(match.group(1))
            return {"last_indexed_block": block_number}
        else:
            return {"error": "sqd_processor_last_block not found in metrics"}
    except Exception as e:
        return {"error": str(e)}
