# Writing Tool Backend

FastAPI backend for the writing tool application.

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

3. Run the server:
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
- `POST /api/chat/message` - Send a message to the AI assistant (placeholder)
- `GET /api/chat/history` - Get chat history (placeholder)
- `DELETE /api/chat/history` - Clear chat history (placeholder) 