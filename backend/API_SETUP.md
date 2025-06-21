# API Setup Guide

## Setting up your LLM API Keys

To use the AI assistant with intelligent routing, you need to set up API keys for the LLM providers.

### 1. Create a `.env` file

In the `backend/` directory, create a file named `.env` with the following content:

```bash
# LLM API Keys
GROQ_API_KEY=your_groq_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Set preferred complex model (claude or gemini)
PREFERRED_COMPLEX_MODEL=claude
```

### 2. Get your API Keys

#### Groq (Required)
- Sign up at: https://console.groq.com/
- Get your API key from: https://console.groq.com/keys
- Groq is used for analyzing query complexity and handling simple queries

#### Claude/Anthropic (Recommended)
- Sign up at: https://console.anthropic.com/
- Get your API key from the console
- Claude is used for complex queries requiring deep reasoning

#### Google Gemini (Optional)
- Get your API key from: https://makersuite.google.com/app/apikey
- Gemini serves as an alternative to Claude for complex queries

### 3. How the Routing Works

1. **Query Analysis**: Every user message is first analyzed by Groq to determine complexity (returns `use_simple_model` boolean)
2. **Simple Queries**: Handled directly by Groq (fast and efficient)
   - Basic factual questions
   - Grammar checks
   - Simple calculations
   - Direct information retrieval

3. **Complex Queries**: Routed to Claude or Gemini
   - Multi-step reasoning
   - Creative writing
   - Complex analysis
   - Abstract or philosophical questions

4. **Fallback System**: If one model fails, the system automatically tries alternatives

### 4. Testing Your Setup

After setting up your API keys, you can test the configuration:

```bash
# Check API key configuration
curl http://localhost:8000/api/chat/health
```

This will show which models are available based on your API key configuration.

### 5. Cost Considerations

- **Groq**: Generally has free tier options
- **Claude**: Pay-per-use pricing, Claude Haiku is the most cost-effective
- **Gemini**: Has free tier with rate limits

The intelligent routing system helps minimize costs by using the most appropriate model for each query. 