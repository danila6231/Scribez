#!/usr/bin/env python3
"""
Test script for LLM routing functionality
Run this after setting up your API keys in .env
"""

import asyncio
from app.llm import get_llm_response, validate_api_keys

# Test queries of varying complexity
test_queries = [
    {
        "message": "What is the capital of France?",
        "expected": "simple"
    },
    {
        "message": "Check my grammar: 'She don't like apples'",
        "expected": "simple"
    },
    {
        "message": "Convert 100 fahrenheit to celsius",
        "expected": "simple"
    },
    {
        "message": "Write a compelling introduction for an essay about climate change that incorporates storytelling, statistics, and a call to action",
        "expected": "complex"
    },
    {
        "message": "Analyze the philosophical implications of artificial intelligence on human consciousness and free will",
        "expected": "complex"
    },
    {
        "message": "Help me brainstorm creative ways to structure a research paper on renewable energy that stands out from traditional formats",
        "expected": "complex"
    }
]

async def test_llm_routing():
    print("🔍 Checking API key configuration...")
    api_keys = validate_api_keys()
    print(f"✅ Groq: {'Configured' if api_keys['groq'] else 'Missing'}")
    print(f"✅ Claude: {'Configured' if api_keys['claude'] else 'Missing'}")
    print(f"✅ Gemini: {'Configured' if api_keys['gemini'] else 'Missing'}")
    
    if not api_keys['groq']:
        print("\n❌ Error: Groq API key is required for routing. Please set GROQ_API_KEY in your .env file")
        return
    
    print("\n🧪 Testing LLM routing...\n")
    
    for i, test in enumerate(test_queries, 1):
        print(f"Test {i}: {test['message'][:50]}...")
        
        try:
            response = get_llm_response(test['message'])
            
            print(f"📊 Analysis:")
            if response.analysis:
                print(f"   - Should use simple model: {response.analysis.use_simple_model}")
                print(f"   - Confidence: {response.analysis.confidence}/10")
                print(f"   - Reason: {response.analysis.reason[:100]}...")
            
            print(f"🤖 Model used: {response.used_model}")
            print(f"💬 Response: {response.response[:150]}...")
            
            # Check if routing decision matches expectation
            if response.analysis:
                actual = "simple" if response.analysis.use_simple_model else "complex"
                if actual == test['expected']:
                    print(f"✅ Routing decision correct (expected: {test['expected']})")
                else:
                    print(f"⚠️  Routing decision mismatch (expected: {test['expected']}, got: {actual})")
            
            print("-" * 80)
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            print("-" * 80)
        
        # Small delay to avoid rate limits
        await asyncio.sleep(1)

if __name__ == "__main__":
    print("=" * 80)
    print("LLM Routing Test Suite")
    print("=" * 80)
    asyncio.run(test_llm_routing()) 