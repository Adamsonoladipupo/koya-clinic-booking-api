from fastapi import FastAPI


app = FastAPI(
    title="Koya Clinic Booking API",
    description="Clinic appointment booking API for Koya Academy Cohort 4.",
    version="1.0.0",
)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
