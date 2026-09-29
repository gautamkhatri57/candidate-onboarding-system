from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.candidates import router as candidates_router
from app.candidate_portal import router as candidate_portal_router
from app.sessions import router as sessions_router
from app.users import router as users_router
from app.positions import router as positions_router


app = FastAPI(
    title="Candidate Onboarding Management System",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users_router)
app.include_router(candidates_router)
app.include_router(candidate_portal_router)
app.include_router(sessions_router)
app.include_router(positions_router)


@app.get("/")
def root():
    return {
        "message": "Candidate Onboarding Management System API is running"
    }