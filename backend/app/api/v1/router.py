from fastapi import APIRouter
from app.api.v1 import users, programs, events, content, portal

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(programs.router, prefix="/programs", tags=["programs"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(portal.router, prefix="/portal", tags=["portal"])
