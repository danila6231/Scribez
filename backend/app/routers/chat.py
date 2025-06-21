from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.llm import get_llm_response, validate_api_keys

router = APIRouter()

# Pydantic models
class ChatMessage(BaseModel):
    content: str
    role: str  # "user" or "assistant"
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []
    preferred_complex_model: Optional[str] = "claude"  # "claude" or "gemini"

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime
    model_used: str
    analysis: Optional[dict] = None

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the AI assistant and receive a response
    Uses intelligent routing between Groq, Claude, and Gemini
    """
    try:
        # Convert conversation history to the format expected by llm.py
        conversation_history = []
        if request.conversation_history:
            for msg in request.conversation_history:
                conversation_history.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Get LLM response with intelligent routing
        llm_response = get_llm_response(
            message=request.message,
            conversation_history=conversation_history,
            preferred_complex_model=request.preferred_complex_model
        )
        
        # Prepare analysis data if available
        analysis_data = None
        if llm_response.analysis:
            analysis_data = {
                "use_simple_model": llm_response.analysis.use_simple_model,
                "reason": llm_response.analysis.reason,
                "confidence": llm_response.analysis.confidence
            }
        
        return ChatResponse(
            response=llm_response.response,
            timestamp=datetime.now(),
            model_used=llm_response.model_used,
            analysis=analysis_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """
    Check the health of the chat service and API key configuration
    """
    api_keys = validate_api_keys()
    
    # Check if at least Groq is configured (minimum requirement)
    if not api_keys["groq"]:
        return {
            "status": "unhealthy",
            "message": "Groq API key is required for basic functionality",
            "api_keys": api_keys
        }
    
    return {
        "status": "healthy",
        "message": "Chat service is operational",
        "api_keys": api_keys,
        "available_models": [
            "groq" if api_keys["groq"] else None,
            "claude" if api_keys["claude"] else None,
            "gemini" if api_keys["gemini"] else None
        ]
    }

@router.get("/history")
async def get_chat_history():
    """
    Get chat history (placeholder implementation)
    """
    # Return empty history for now
    return {"messages": [], "total": 0}

@router.delete("/history")
async def clear_chat_history():
    """
    Clear chat history (placeholder implementation)
    """
    return {"message": "Chat history cleared successfully"} 