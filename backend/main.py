from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import sparql_routes, indexer_control, endpoint_control, sql_routes, reasoner_control



app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://frontend:3000",
        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(sparql_routes.router)
app.include_router(indexer_control.router)
app.include_router(endpoint_control.router)
app.include_router(sql_routes.router)
app.include_router(reasoner_control.router)
