from fastapi import FastAPI

from .api.images import router as images_router

app = FastAPI(title="FujiFrame AI", version="0.1.0")
app.include_router(images_router, prefix="/api/images")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
