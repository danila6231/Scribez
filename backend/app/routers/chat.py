from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random

router = APIRouter()

# Pydantic models
class ChatMessage(BaseModel):
    content: str
    role: str  # "user" or "assistant"
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

# Placeholder responses for different types of requests
PLACEHOLDER_RESPONSES = {
    "grammar": [
        "I've reviewed your text and it looks grammatically correct! Keep up the good work.",
        "I noticed a few minor grammatical points that could be improved. Consider reviewing your verb tenses.",
        "Your grammar is solid overall. Remember to maintain consistency in your writing style."
    ],
    "ideas": [
        "Here are some ideas to consider: You could expand on your main argument by providing more examples.",
        "Consider exploring different perspectives on this topic to strengthen your argument.",
        "What if you structured your essay with a compelling anecdote at the beginning?"
    ],
    "feedback": [
        "Your writing shows clear organization and good flow between paragraphs.",
        "The introduction effectively sets up your main points. Consider strengthening your conclusion.",
        "Your arguments are well-supported with evidence. Nice work!"
    ],
    "default": [
        "That's an interesting point! Let me help you develop it further.",
        "I understand what you're trying to convey. Have you considered approaching it from this angle?",
        "Great question! Here's my perspective on that..."
    ]
}

def get_placeholder_response(message: str) -> str:
    """Generate a placeholder response based on the message content"""
    message_lower = message.lower()
    
    if any(word in message_lower for word in ["grammar", "spelling", "punctuation"]):
        return random.choice(PLACEHOLDER_RESPONSES["grammar"])
    elif any(word in message_lower for word in ["idea", "brainstorm", "topic", "suggest"]):
        return random.choice(PLACEHOLDER_RESPONSES["ideas"])
    elif any(word in message_lower for word in ["feedback", "review", "improve"]):
        return random.choice(PLACEHOLDER_RESPONSES["feedback"])
    else:
        return random.choice(PLACEHOLDER_RESPONSES["default"])

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the AI assistant and receive a response
    This is a placeholder implementation
    """
    try:
        # Generate placeholder response
        ai_response = get_placeholder_response(request.message)
        
        return ChatResponse(
            response=ai_response,
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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