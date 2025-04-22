from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import sparql_routes, indexer_control, endpoint_control, sql_routes, class_editor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sparql_routes.router)
app.include_router(indexer_control.router)
app.include_router(endpoint_control.router)
app.include_router(sql_routes.router)
app.include_router(class_editor.router)
