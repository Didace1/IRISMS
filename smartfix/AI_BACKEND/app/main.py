# smartfix/AI_BACKEND/app/main_clean.py
# Clean AI Backend - Inventory Recommendations + Chatbot

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from api.inventory import router as inventory_router
from api.inventory_v2 import router as inventory_v2_router
from api.inventory_v3 import router as inventory_v3_router
from api.chatbot import router as chatbot_router
from api.customer_demand import router as customer_demand_router

# Create FastAPI app
app = FastAPI(
    title="SmartFix AI - Inventory & Chatbot System",
    version="3.0.0",
    description="Production-grade AI-powered inventory forecasting and customer chatbot"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inventory_router, prefix="/api", tags=["inventory-v1"])
app.include_router(inventory_v2_router, prefix="/api", tags=["inventory-v2-ml"])
app.include_router(inventory_v3_router, prefix="/api", tags=["inventory-v3-production"])
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["chatbot"])
app.include_router(customer_demand_router, prefix="/api", tags=["customer-demand"])

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "SmartFix AI System",
        "status": "running",
        "version": "3.0.0",
        "endpoints": {
            "v3_train_models": "POST /api/v3/train",
            "v3_recommendations": "GET /api/v3/inventory-recommendations",
            "v3_validate_optimize": "POST /api/v3/validate",
            "v3_performance": "GET /api/v3/performance",
            "v3_test": "GET /api/v3/test",
            "v2_recommendations": "GET /api/v2/inventory-recommendations",
            "v1_recommendations": "GET /api/inventory-recommendations",
            "chatbot": "POST /api/chatbot/chat",
            "customer_demand_analysis": "GET /api/customer-demand-analysis",
            "customer_demand_summary": "GET /api/customer-demand-summary",
            "docs": "/docs"
        },
        "versions": {
            "v1": "Statistical analysis (deprecated)",
            "v2": "Random Forest + adaptive weights",
            "v3": "Prophet + LightGBM + real optimization (PRODUCTION)"
        },
        "note": "V3 is production-grade. Use V3 endpoints for best results."
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": ["inventory-ai", "chatbot"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
