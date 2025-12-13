# main.py
"""
FastAPI entrypoint for HenSense backend.
"""

import logging
import os
import sys
import importlib.util
from pathlib import Path
from typing import List

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

LOG = logging.getLogger("uvicorn.error")
HERE = Path(__file__).parent.resolve()

FRONTEND_DIR = HERE / "static"
UPLOADS_DIR = HERE / "uploads"
ROUTES_DIR = HERE / "routes"

app = FastAPI(title="HenSense API")


# ============================================================
# 1️⃣ CORS — MUST BE FIRST
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 2️⃣ MOUNT UPLOADS (optional)
# ============================================================
if UPLOADS_DIR.exists():
    LOG.info(f"Mounting uploads at /uploads -> {UPLOADS_DIR}")
    app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
else:
    LOG.warning("Uploads directory missing.")


# ============================================================
# 3️⃣ LOAD ROUTERS (auth, history, predict)
# ============================================================
def include_route_modules(dirpath: Path) -> List[str]:
    included = []
    if not dirpath.exists():
        LOG.warning(f"Routes dir missing: {dirpath}")
        return included

    sys.path.insert(0, str(dirpath.parent))

    for f in sorted(dirpath.glob("*.py")):
        if f.name.startswith("_"):
            continue

        modulename = f.stem
        try:
            spec = importlib.util.spec_from_file_location(modulename, str(f))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)

            router = getattr(mod, "router", None)
            if router:
                app.include_router(router)
                included.append(modulename)
                LOG.info(f"Included router: {f.name}")
            else:
                LOG.debug(f"No router in {f.name}")

        except Exception as e:
            LOG.exception(f"Failed loading router {f}: {e}")

    return included


loaded = include_route_modules(ROUTES_DIR)
LOG.info(f"Routers included: {loaded}")


# ============================================================
# 4️⃣ HEALTH ROUTE
# ============================================================
@app.get("/_health")
async def health():
    return {"status": "ok"}


# ============================================================
# 5️⃣ ROOT API (fallback when no static build exists)
# ============================================================
@app.get("/")
async def root(request: Request):
    return {
        "status": "ok",
        "message": "HenSense backend running. Static frontend may not be built yet.",
    }


# ============================================================
# 6️⃣ MOUNT FRONTEND LAST (AFTER API ROUTES)
# ============================================================
if FRONTEND_DIR.exists() and (FRONTEND_DIR / "index.html").exists():
    LOG.info(f"Serving frontend from: {FRONTEND_DIR}")
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")
else:
    LOG.warning("Static frontend not found. API only mode.")


# ============================================================
# 7️⃣ STARTUP / SHUTDOWN LOGS
# ============================================================
@app.on_event("startup")
async def startup():
    LOG.info("Backend started.")
    LOG.info(f"Working dir: {HERE}")
    LOG.info(f"Routes loaded: {loaded}")


@app.on_event("shutdown")
async def shutdown():
    LOG.info("Backend shutdown.")


# ============================================================
# 8️⃣ DEV SERVER
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
