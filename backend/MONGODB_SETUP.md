# MongoDB Atlas Setup Guide

## 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (free tier is sufficient)

## 2. Configure Database Access
1. Go to Database Access in the left sidebar
2. Add a new database user with username and password
3. Remember these credentials for the connection string

## 3. Configure Network Access
1. Go to Network Access in the left sidebar
2. Add your IP address or use 0.0.0.0/0 for development (not recommended for production)

## 4. Get Connection String
1. Go to your cluster and click "Connect"
2. Choose "Connect your application"
3. Copy the connection string

## 5. Configure Environment Variables
Create a `.env` file in the backend directory:

```bash
# MongoDB Configuration
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=writing_tool

# Existing LLM API Keys
GROQ_API_KEY=your_groq_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

Replace `<username>`, `<password>`, and `<cluster>` with your actual values.

## 6. Test the Connection
Run the test script to verify everything is working:

```bash
python test_api.py
``` 