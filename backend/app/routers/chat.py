from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, AsyncGenerator
from datetime import datetime
import json
import asyncio
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
    model: str
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
            model=llm_response.used_model,
            analysis=analysis_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/message/stream")
async def stream_message(request: ChatRequest):
    """
    Stream a message response from the AI assistant using Server-Sent Events
    """
    async def generate():
        try:
            # Convert conversation history to the format expected by llm.py
            conversation_history = []
            if request.conversation_history:
                for msg in request.conversation_history:
                    conversation_history.append({
                        "role": msg.role,
                        "content": msg.content
                    })
            
            # Get streaming LLM response
            response_generator = get_llm_response(
                message=request.message,
                conversation_history=conversation_history,
                preferred_complex_model=request.preferred_complex_model,
                stream=True
            )
            
            # Stream each chunk as Server-Sent Events
            for chunk in response_generator:
                # Format as SSE
                data = json.dumps(chunk)
                yield f"data: {data}\n\n"
                
                # Small delay to prevent overwhelming the client
                await asyncio.sleep(0.01)
            
        except Exception as e:
            # Send error as SSE
            error_data = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

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