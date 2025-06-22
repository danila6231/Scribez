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

# Get the CA certificate path
ca = certifi.where()

try:
    print("HERE `")
    client = AsyncIOMotorClient(
        MONGODB_URL,
        ssl=True,
        serverSelectionTimeoutMS=60000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
    )
    # Test the connection
    client.admin.command('ping')
    print("MongoDB connection successful")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    # Fallback connection attempt
    client = AsyncIOMotorClient(
        MONGODB_URL,
        ssl=True,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True
    )
    
client = AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]


# Collections
users_collection = database["users"]
documents_collection = database["documents"]
chat_history_collection = database["chat_history"]

# Create indexes
async def create_indexes():
    # Index for documents by user_id
    await documents_collection.create_index("user_id")
    # Index for chat history by document_id
    await chat_history_collection.create_index("document_id") 