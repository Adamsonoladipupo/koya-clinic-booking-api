from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.bookings import router as bookings_router
from app.api.slots import router as slots_router
from app.core.security import require_api_key

# app = FastAPI(
#     title="Koya Clinic Booking API",
#     description="Clinic appointment booking API ",
#     version="1.0.0",
#     dependencies=[Depends(require_api_key)],
# )
#
# app.include_router(slots_router)
# app.include_router(bookings_router)

app = FastAPI(
    title="Koya Clinic Booking API",
    description="Clinic appointment booking API ",
    version="1.0.0",
)

app.include_router(
    slots_router,
    dependencies=[Depends(require_api_key)],
)

app.include_router(
    bookings_router,
    dependencies=[Depends(require_api_key)],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail)},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid request data"},
    )


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
