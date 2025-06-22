import os
import json
from typing import Dict, Any, Optional, List, Generator, Union
from groq import Groq
import anthropic
import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Model Configuration
LLM_CONFIG = {
    "groq": {
        "analyzer_model": "llama3-8b-8192",
        "responder_model": "compound-beta-mini"
    },
    "claude": {
        "model": "claude-opus-4-20250514"
    },
    "gemini": {
        "model": "gemini-2.5-flash"
    }
}

GENERAL_SYSTEM_PROMPT = '''You are a helpful research assistant integrated into a text editor. Your goal is to perform a web search and provide a concise, well-structured summary on the given topic. The summary should be written in clear, professional language, suitable for a research paper or report. Do not include conversational filler. Given that today's date is June 22, 2025, focus on the latest developments. Stick to the undergrad level of writing. DO NOT ADD UNNECESSARY DETAILS. ALWAYS GET STRAIGHT TO THE POINT!'''

EDIT_SYSTEM_PROMPT = """You are a document editor. When given a document and an edit request, you should return ONLY the edited document content. Do not include any explanations, comments, or additional text. Just return the modified document."""

# Initialize clients
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Response models
class QueryAnalysis(BaseModel):
    use_simple_model: bool
    reason: str
    confidence: int  # 1-10

class LLMResponse(BaseModel):
    response: str
    used_model: str
    analysis: Optional[QueryAnalysis] = None

# System prompts
GROQ_ANALYZER_PROMPT = """You are a query complexity analyzer. Your job is to determine if a query is simple/factual or requires complex reasoning.

Simple/factual queries include:
- Basic factual questions (dates, definitions, simple explanations)
- Grammar and spelling checks
- Simple calculations or conversions
- Direct information retrieval
- Basic formatting or structure questions

Complex queries include:
- Multi-step reasoning problems
- Creative writing or ideation
- Complex analysis or synthesis
- Philosophical or abstract questions
- Tasks requiring deep understanding or nuanced judgment

Respond with a JSON object containing:
- "use_simple_model": boolean
- "reason": string explaining your decision
- "confidence": number 1-10 for how confident you are in this decision

Only respond with the JSON object, nothing else."""

GROQ_RESPONDER_PROMPT = """You are a helpful AI assistant focused on providing clear, accurate responses to simple factual questions and basic writing assistance."""

def analyze_query_complexity(message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> QueryAnalysis:
    """Use Groq to analyze if the query is simple enough for Groq to handle"""
    try:
        # Prepare messages for analysis
        messages = [
            {"role": "system", "content": GROQ_ANALYZER_PROMPT},
            {"role": "user", "content": f"Analyze this query: {message}"}
        ]
        
        # Add conversation history context if available
        if conversation_history:
            context = "Previous conversation context:\n"
            for msg in conversation_history[-3:]:  # Last 3 messages for context
                context += f"{msg['role']}: {msg['content']}\n"
            messages.insert(1, {"role": "system", "content": context})
        
        # Get Groq's analysis
        completion = groq_client.chat.completions.create(
            model=LLM_CONFIG["groq"]["analyzer_model"],  # Use configured analyzer model
            messages=messages,
            temperature=0.1,
            max_tokens=200
        )
        
        # Parse the JSON response
        analysis_text = completion.choices[0].message.content
        analysis_data = json.loads(analysis_text)
        
        return QueryAnalysis(**analysis_data)
        
    except Exception as e:
        # Default to using Claude/Gemini if analysis fails
        return QueryAnalysis(
            use_simple_model=False,
            reason=f"Error during analysis: {str(e)}",
            confidence=1
        )

# def groq_internet_search(message: str) -> str:
#     """Use Groq to search the internet for information"""

#     system_prompt = '''You are a helpful research assistant integrated into a text editor.
#     Your goal is to perform a web search and provide a concise, well-structured summary 
#     on the given topic. The summary should be written in clear, professional language, 
#     suitable for a research paper or report. Do not include conversational filler. 
#     Given that today's date is June 22, 2025, focus on the latest developments.'''
#     try:
#         response = groq_client.chat.completions.create(
#             messages=[
#                 {"role": "system", "content": system_prompt},
#                 {"role": "user", "content": message}
#             ],
#             model="compound-beta-mini",  # Use configured responder model
#             temperature=0.7,
#             max_tokens=1000
#         )
#         return response.choices[0].message.content
#     except Exception as e:
#         return f"Error during internet search: {str(e)}"

def get_groq_response(message: str, conversation_history: Optional[List[Dict[str, str]]] = None, stream: bool = False, document_content: Optional[str] = None, edit_mode: bool = False) -> Union[str, Generator[str, None, None]]:
    """Get response from Groq for simple queries"""
    try:
        # Use different system prompt for edit mode
        if edit_mode:
            system_prompt = GENERAL_SYSTEM_PROMPT + "\n" + EDIT_SYSTEM_PROMPT
        else:
            system_prompt = GENERAL_SYSTEM_PROMPT + "\n" + GROQ_RESPONDER_PROMPT
            
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add document content if provided
        if document_content:
            messages.append({"role": "system", "content": f"Current document content:\n{document_content}\n"})
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages
                messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": message})
        
        completion = groq_client.chat.completions.create(
            model=LLM_CONFIG["groq"]["responder_model"],  # Use configured responder model
            messages=messages,
            temperature=0.7,
            max_tokens=8000,
            stream=stream
        )
        
        if stream:
            def generate():
                for chunk in completion:
                    if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            return generate()
        else:
            return completion.choices[0].message.content
        
    except Exception as e:
        if stream:
            def error_generator():
                yield f"Error: {str(e)}"
            return error_generator()
        else:
            raise Exception(f"Groq response error: {str(e)}")

def get_claude_response(message: str, conversation_history: Optional[List[Dict[str, str]]] = None, stream: bool = False, document_content: Optional[str] = None, edit_mode: bool = False) -> Union[str, Generator[str, None, None]]:
    """Get response from Claude for complex queries"""
    try:
        # Prepare messages in Claude format
        messages = []
        system_prompt = GENERAL_SYSTEM_PROMPT
        # Add document content if provided
        if document_content:
            if edit_mode:
                messages.append({
                    "role": "user",
                    "content": f"Here is the current document content:\n{document_content}\n\nApply the following edit and return ONLY the edited document content, nothing else:"
                })
                system_prompt += "\n" + EDIT_SYSTEM_PROMPT
            else:
                messages.append({
                    "role": "user",
                    "content": f"Here is the current document content:\n{document_content}\n\nBased on this context, please answer the following question:"
                })
        
        if conversation_history:
            for msg in conversation_history[-10:]:  # More context for complex queries
                messages.append({
                    "role": msg["role"] if msg["role"] in ["user", "assistant"] else "user",
                    "content": msg["content"]
                })
        
        messages.append({"role": "user", "content": message})
        
        if stream:
            def generate():
                with claude_client.messages.stream(
                    model=LLM_CONFIG["claude"]["model"],  # Use configured Claude model
                    system=system_prompt,
                    messages=messages,
                    max_tokens=32000,
                    temperature=0.7,
                    tools=[{
                        "type": "web_search_20250305",
                        "name": "web_search",
                        "max_uses": 5
                    }]
                ) as stream:
                    for text in stream.text_stream:
                        yield text
            return generate()
        else:
            response = claude_client.messages.create(
                model=LLM_CONFIG["claude"]["model"],  # Use configured Claude model
                system=system_prompt,
                messages=messages,
                max_tokens=32000,
                temperature=0.7,
                tools=[{
                    "type": "web_search_20250305",
                    "name": "web_search",
                    "max_uses": 5
                }]
            )
            return response.content[0].text
        
    except Exception as e:
        if stream:
            def error_generator():
                yield f"Error: {str(e)}"
            return error_generator()
        else:
            raise Exception(f"Claude response error: {str(e)}")

def get_gemini_response(message: str, conversation_history: Optional[List[Dict[str, str]]] = None, stream: bool = False, document_content: Optional[str] = None, edit_mode: bool = False) -> Union[str, Generator[str, None, None]]:
    """Get response from Gemini for complex queries"""
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel(LLM_CONFIG["gemini"]["model"])
        
        # Prepare context
        full_prompt = ""
        
        # Add document content if provided
        if document_content:
            if edit_mode:
                full_prompt = f"Current document content:\n{document_content}\n\nApply the following edit and return ONLY the edited document content, nothing else:\n"
            else:
                full_prompt = f"Current document content:\n{document_content}\n\n"
        
        if conversation_history:
            full_prompt += "Previous conversation:\n"
            for msg in conversation_history[-10:]:
                full_prompt += f"{msg['role'].upper()}: {msg['content']}\n"
            full_prompt += "\n"
        
        full_prompt += f"USER: {message}\nASSISTANT:"
        
        if stream:
            def generate():
                response = model.generate_content(full_prompt, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
            return generate()
        else:
            response = model.generate_content(full_prompt)
            return response.text
        
    except Exception as e:
        if stream:
            def error_generator():
                yield f"Error: {str(e)}"
            return error_generator()
        else:
            raise Exception(f"Gemini response error: {str(e)}")

def get_llm_response(
    message: str, 
    conversation_history: Optional[List[Dict[str, str]]] = None,
    preferred_complex_model: str = "claude",  # "claude" or "gemini"
    stream: bool = False,
    document_content: Optional[str] = None,
    edit_mode: bool = False
) -> Union[LLMResponse, Generator[Dict[str, Any], None, None]]:
    """
    Main function to get LLM response with intelligent routing
    """
    try:
        # Step 1: Analyze query complexity with Groq (skip for edit mode)
        if edit_mode:
            # For edit mode, always use the complex model for better accuracy
            analysis = QueryAnalysis(
                use_simple_model=False,
                reason="Edit mode requires complex model for accurate document generation",
                confidence=10
            )
        else:
            analysis = analyze_query_complexity(message, conversation_history)
        
        if stream:
            def generate():
                # First yield metadata
                yield {
                    "type": "metadata",
                    "analysis": {
                        "use_simple_model": analysis.use_simple_model,
                        "reason": analysis.reason,
                        "confidence": analysis.confidence
                    }
                }
                
                # Then stream the response
                if analysis.use_simple_model:
                    # Simple query - use Groq
                    response_generator = get_groq_response(message, conversation_history, stream=True, document_content=document_content, edit_mode=edit_mode)
                    model = "groq"
                else:
                    # Complex query - use Claude or Gemini
                    if preferred_complex_model == "gemini":
                        try:
                            response_generator = get_gemini_response(message, conversation_history, stream=True, document_content=document_content, edit_mode=edit_mode)
                            model = "gemini"
                        except Exception:
                            # Fallback to Claude if Gemini fails
                            response_generator = get_claude_response(message, conversation_history, stream=True, document_content=document_content, edit_mode=edit_mode)
                            model = "claude"
                    else:
                        try:
                            response_generator = get_claude_response(message, conversation_history, stream=True, document_content=document_content, edit_mode=edit_mode)
                            model = "claude"
                        except Exception:
                            # Fallback to Gemini if Claude fails
                            response_generator = get_gemini_response(message, conversation_history, stream=True, document_content=document_content, edit_mode=edit_mode)
                            model = "gemini"
                
                yield {"type": "model", "model": model}
                
                # Stream content chunks
                for chunk in response_generator:
                    yield {"type": "content", "content": chunk}
                
                yield {"type": "done"}
            
            return generate()
        else:
            # Step 2: Route to appropriate model
            if analysis.use_simple_model:
                # Simple query - use Groq
                response = get_groq_response(message, conversation_history, document_content=document_content, edit_mode=edit_mode)
                model = "groq"
            else:
                # Complex query - use Claude or Gemini
                if preferred_complex_model == "gemini":
                    try:
                        response = get_gemini_response(message, conversation_history, document_content=document_content, edit_mode=edit_mode)
                        model = "gemini"
                    except Exception as e:
                        # Fallback to Claude if Gemini fails
                        response = get_claude_response(message, conversation_history, document_content=document_content, edit_mode=edit_mode)
                        model = "claude"
                else:
                    try:
                        response = get_claude_response(message, conversation_history, document_content=document_content, edit_mode=edit_mode)
                        model = "claude"
                    except Exception as e:
                        # Fallback to Gemini if Claude fails
                        response = get_gemini_response(message, conversation_history, document_content=document_content, edit_mode=edit_mode)
                        model = "gemini"
            
            return LLMResponse(
                response=response,
                used_model=model,
                analysis=analysis
            )
        
    except Exception as e:
        if stream:
            def error_generator():
                yield {"type": "error", "error": str(e)}
            return error_generator()
        else:
            # Ultimate fallback - return error message
            return LLMResponse(
                response=f"I apologize, but I encountered an error processing your request: {str(e)}",
                used_model="error",
                analysis=None
            )

# Helper function to validate API keys
def validate_api_keys() -> Dict[str, bool]:
    """Check which API keys are configured"""
    return {
        "groq": bool(os.getenv("GROQ_API_KEY")),
        "claude": bool(os.getenv("ANTHROPIC_API_KEY")),
        "gemini": bool(os.getenv("GOOGLE_API_KEY"))
    } 