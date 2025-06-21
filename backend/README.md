# Writing Tool Backend

FastAPI backend for the writing tool application with intelligent LLM routing.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up API keys:
   - Create a `.env` file in the backend directory
   - Add your LLM API keys (see [API_SETUP.md](API_SETUP.md) for detailed instructions)

4. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`

## Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/chat/message` - Send a message to the AI assistant with intelligent routing
- `GET /api/chat/health` - Check LLM service health and API key configuration
- `GET /api/chat/history` - Get chat history (placeholder)
- `DELETE /api/chat/history` - Clear chat history (placeholder)

## LLM Integration

The backend uses intelligent routing between multiple LLM providers:
- **Groq**: Handles query analysis and simple/factual questions
- **Claude**: Handles complex reasoning and creative tasks
- **Gemini**: Alternative for complex queries

See [API_SETUP.md](API_SETUP.md) for detailed setup instructions. 