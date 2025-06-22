from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, diff

app = FastAPI(title="Writing Tool API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(diff.router, prefix="/api/diff", tags=["diff"])

@app.get("/")
async def root():
    return {"message": "Writing Tool API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 