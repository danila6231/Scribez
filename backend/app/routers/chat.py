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
    document_content: Optional[str] = ""  # Current document content, defaults to empty string
    document_id: Optional[str] = None  # Document ID for context
    selected_text: Optional[str] = None  # Selected text for Command+K interface
    edit_mode: Optional[bool] = False  # Edit mode for document generation

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
        
        # Prepare document content for context
        document_content = request.document_content or ""
        
        # If document_id is provided but no document_content, try to fetch it
        if request.document_id and not document_content:
            try:
                from app.database import get_document_content
                document_content = await get_document_content(request.document_id) or ""
            except Exception as e:
                print(f"Warning: Could not fetch document content for {request.document_id}: {e}")
        
        # Add selected text context if provided (for Command+K)
        if request.selected_text:
            context_prefix = f"Selected text from document: \"{request.selected_text}\"\n\n"
            if document_content:
                document_content = context_prefix + document_content
            else:
                document_content = context_prefix
        
        # Get LLM response with intelligent routing
        llm_response = get_llm_response(
            message=request.message,
            conversation_history=conversation_history,
            preferred_complex_model=request.preferred_complex_model,
            document_content=document_content,
            edit_mode=request.edit_mode
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
            
            # Prepare document content for context
            document_content = request.document_content or ""
            
            # If document_id is provided but no document_content, try to fetch it
            if request.document_id and not document_content:
                try:
                    from app.database import get_document_content
                    document_content = await get_document_content(request.document_id) or ""
                except Exception as e:
                    print(f"Warning: Could not fetch document content for {request.document_id}: {e}")
            
            # Add selected text context if provided (for Command+K)
            if request.selected_text:
                context_prefix = f"Selected text from document: \"{request.selected_text}\"\n\n"
                if document_content:
                    document_content = context_prefix + document_content
                else:
                    document_content = context_prefix
            
            # Get streaming LLM response
            response_generator = get_llm_response(
                message=request.message,
                conversation_history=conversation_history,
                preferred_complex_model=request.preferred_complex_model,
                stream=True,
                document_content=document_content,
                edit_mode=request.edit_mode
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

class MermaidRequest(BaseModel):
    query: str

class MermaidResponse(BaseModel):
    diagram: str
    
@router.post("/mermaid", response_model=MermaidResponse)
async def generate_mermaid_diagram(request: MermaidRequest):
    """
    Generate a Mermaid diagram based on the query using Claude Opus
    """
    try:
        # Create a specific prompt for Mermaid diagram generation
        mermaid_prompt = f"""Generate a Mermaid diagram for: {request.query}

Return ONLY the Mermaid diagram code, without any explanation or markdown code blocks.
Start directly with the diagram type (e.g., 'graph TD', 'flowchart LR', 'sequenceDiagram', etc.).
Make sure the diagram is syntactically correct."""

        # Get response from Claude (force complex model)
        llm_response = get_llm_response(
            message=mermaid_prompt,
            conversation_history=[],
            preferred_complex_model="claude",
            stream=False
        )
        
        # Clean up the response to ensure it's valid Mermaid syntax
        diagram_code = llm_response.response.strip()
        
        # Remove markdown code blocks if present
        if diagram_code.startswith("```"):
            lines = diagram_code.split('\n')
            # Remove first and last lines if they're code block markers
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1] == "```":
                lines = lines[:-1]
            diagram_code = '\n'.join(lines)
        
        return MermaidResponse(diagram=diagram_code)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 