import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi
import ssl

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is required")

# Extract database name from connection string
DATABASE_NAME = os.getenv("DATABASE_NAME")
if not DATABASE_NAME:
    raise ValueError("DATABASE_NAME environment variable is required")

# Create SSL context with certifi certificates
ssl_context = ssl.create_default_context(cafile=certifi.where())

try:
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(
        MONGODB_URL,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=20000,
        socketTimeoutMS=20000,
    )
    # Test the connection
    client.admin.command('ping')
    print("MongoDB connection successful")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    raise

database = client[DATABASE_NAME]

# Collections
users_collection = database["users"]
documents_collection = database["documents"]
chat_history_collection = database["chat_history"]

# Helper functions
async def get_document_content(document_id: str) -> str:
    """Get document content by document ID"""
    try:
        document = await documents_collection.find_one({"_id": document_id})
        if document:
            return document.get("content", "")
        return ""
    except Exception as e:
        print(f"Error fetching document content: {e}")
        return ""

# Create indexes
async def create_indexes():
    # Index for documents by user_id
    await documents_collection.create_index("user_id")
    # Index for chat history by document_id
    await chat_history_collection.create_index("document_id") 