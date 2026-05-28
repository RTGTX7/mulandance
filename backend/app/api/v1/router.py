from fastapi import APIRouter
from app.api.v1 import (
    users,
    programs,
    events,
    content,
    portal,
    news,
    upload,
    classrooms,
    faculty,
    schedules,
    settings as site_settings,
)

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(programs.router, prefix="/programs", tags=["programs"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(portal.router, prefix="/portal", tags=["portal"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(classrooms.router, prefix="/classrooms", tags=["classrooms"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["faculty"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
api_router.include_router(site_settings.router, prefix="/settings", tags=["settings"])
