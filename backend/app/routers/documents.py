from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from uuid import UUID

from app.database import users_collection, documents_collection, chat_history_collection
from app.models import (
    Document, DocumentCreate, DocumentUpdate, DocumentResponse,
    User, ChatHistory, ChatMessage
)

router = APIRouter()

def validate_uuid(document_id: str) -> bool:
    """Validate if a string is a valid UUID"""
    try:
        UUID(document_id)
        return True
    except ValueError:
        return False

@router.post("/", response_model=DocumentResponse)
async def create_document(document: DocumentCreate):
    """Create a new document for a user"""
    # Check if user exists, if not create one
    user = await users_collection.find_one({"user_id": document.user_id})
    if not user:
        new_user = User(user_id=document.user_id)
        await users_collection.insert_one(new_user.model_dump(by_alias=True))
    
    # Create new document
    new_document = Document(
        user_id=document.user_id,
        title=document.title
    )
    doc_dict = new_document.model_dump(by_alias=True)
    
    await documents_collection.insert_one(doc_dict)
    created_document = await documents_collection.find_one({"_id": doc_dict["_id"]})
    
    # Initialize chat history for the document
    chat_history = ChatHistory(document_id=doc_dict["_id"])
    await chat_history_collection.insert_one(chat_history.model_dump(by_alias=True))
    
    return DocumentResponse(
        id=created_document["_id"],
        user_id=created_document["user_id"],
        title=created_document["title"],
        content=created_document["content"],
        created_at=created_document["created_at"],
        updated_at=created_document["updated_at"]
    )

@router.get("/{document_id}/title")
async def get_document_title(document_id: str):
    """Get document title by document ID"""
    if not validate_uuid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID format")
    
    document = await documents_collection.find_one({"_id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"title": document["title"]}

@router.get("/user/{user_id}")
async def get_user_documents(user_id: str):
    """Get all document IDs for a user"""
    documents = []
    async for doc in documents_collection.find({"user_id": user_id}):
        documents.append({
            "id": doc["_id"],
            "title": doc["title"],
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"]
        })
    
    return {"documents": documents}

@router.get("/{document_id}/content")
async def get_document_content(document_id: str):
    """Get document content by ID"""
    if not validate_uuid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID format")
    
    document = await documents_collection.find_one({"_id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"content": document["content"]}

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document by ID"""
    if not validate_uuid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID format")
    
    # Delete document
    result = await documents_collection.delete_one({"_id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete associated chat history
    await chat_history_collection.delete_one({"document_id": document_id})
    
    return {"message": "Document deleted successfully"}

@router.get("/{document_id}/chat-history")
async def get_chat_history(document_id: str):
    """Get chat history for a document"""
    if not validate_uuid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID format")
    
    chat_history = await chat_history_collection.find_one({"document_id": document_id})
    if not chat_history:
        raise HTTPException(status_code=404, detail="Chat history not found")
    
    return {
        "document_id": document_id,
        "messages": chat_history.get("messages", [])
    }

@router.put("/{document_id}")
async def update_document_content(document_id: str, update: DocumentUpdate):
    """Update document content"""
    if not validate_uuid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID format")
    
    # Update document
    result = await documents_collection.update_one(
        {"_id": document_id},
        {
            "$set": {
                "content": update.content,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    updated_document = await documents_collection.find_one({"_id": document_id})
    
    return DocumentResponse(
        id=updated_document["_id"],
        user_id=updated_document["user_id"],
        title=updated_document["title"],
        content=updated_document["content"],
        created_at=updated_document["created_at"],
        updated_at=updated_document["updated_at"]
    )

@router.post("/{document_id}/chat-message")
async def add_chat_message(document_id: str, message: ChatMessage):
    """Add a message to document's chat history"""
    if not validate_uuid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID format")
    
    # Check if document exists
    document = await documents_collection.find_one({"_id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update chat history
    result = await chat_history_collection.update_one(
        {"document_id": document_id},
        {
            "$push": {"messages": message.model_dump()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    if result.matched_count == 0:
        # Create chat history if it doesn't exist
        chat_history = ChatHistory(
            document_id=document_id,
            messages=[message]
        )
        await chat_history_collection.insert_one(chat_history.model_dump(by_alias=True))
    
    return {"message": "Chat message added successfully"} 