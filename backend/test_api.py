import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://localhost:8000/api/documents"

async def test_document_api():
    async with httpx.AsyncClient() as client:
        # 1. Create a document
        print("1. Creating a document...")
        create_response = await client.post(
            BASE_URL,
            json={
                "user_id": "test_user_123",
                "title": "My First Document"
            }
        )
        print(f"Create response: {create_response}")
        response_data = create_response.json()
        print(f"Create response: {response_data}")
        document_id = response_data["id"]
        
        # 2. Get document title
        print(f"\n2. Getting document title for ID: {document_id}")
        title_response = await client.get(f"{BASE_URL}/{document_id}/title")
        print(f"Title: {title_response.json()}")
        
        # 3. Get all documents for user
        print("\n3. Getting all documents for user...")
        user_docs_response = await client.get(f"{BASE_URL}/user/test_user_123")
        print(f"User documents: {user_docs_response.json()}")
        
        # 4. Update document content
        print("\n4. Updating document content...")
        update_response = await client.put(
            f"{BASE_URL}/{document_id}",
            json={
                "content": "# My Document\n\nThis is my markdown content.\n\n## Section 1\n\nSome text here."
            }
        )
        print(f"Update response: {update_response.json()}")
        
        # 5. Get document content
        print("\n5. Getting document content...")
        content_response = await client.get(f"{BASE_URL}/{document_id}/content")
        print(f"Content: {content_response.json()}")
        
        # 6. Add chat message
        print("\n6. Adding chat message...")
        chat_response = await client.post(
            f"{BASE_URL}/{document_id}/chat-message",
            json={
                "role": "user",
                "content": "Help me improve this document"
            }
        )
        print(f"Chat message response: {chat_response.json()}")
        
        # 7. Get chat history
        print("\n7. Getting chat history...")
        history_response = await client.get(f"{BASE_URL}/{document_id}/chat-history")
        print(f"Chat history: {history_response.json()}")
        
        # 8. Delete document (optional - commented out)
        # print("\n8. Deleting document...")
        # delete_response = await client.delete(f"{BASE_URL}/{document_id}")
        # print(f"Delete response: {delete_response.json()}")

if __name__ == "__main__":
    print("Testing Document API Endpoints...")
    print("Make sure the server is running with: uvicorn app.main:app --reload")
    print("-" * 50)
    asyncio.run(test_document_api()) 