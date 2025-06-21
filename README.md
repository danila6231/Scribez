# Writing Tool for Students

An AI-enhanced writing interface that supports students throughout the writing process without taking away their agency.

## Features

- **Text Editor (Left Side)**: A standard word processor with typical formatting tools, markdown support, and image insertion
- **AI Chat Assistant (Right Side)**: Interactive chat window for brainstorming ideas, getting writing suggestions, and receiving feedback

## Tech Stack

- **Frontend**: React with Vite
  - Text Editor: Lexical (Meta's extensible text editor framework)
  - Styling: CSS
- **Backend**: FastAPI (Python)

## Project Structure

```
├── frontend/           # React frontend application
│   ├── public/        # Static assets
│   │   ├── components/  # React components
│   │   │   ├── Editor/  # Text editor components
│   │   │   ├── Chat/    # Chat interface components
│   │   │   └── Layout.jsx
│   │   ├── styles/      # CSS files
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   └── package.json     # Frontend dependencies
│
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   │   ├── main.py   # FastAPI app
│   │   └── routers/  # API routes
│   └── requirements.txt
│
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Development Notes

- This is a starting version with placeholder AI functionality
- The text editor uses Lexical for rich text editing capabilities
- The chat interface is ready for AI integration but currently returns placeholder responses