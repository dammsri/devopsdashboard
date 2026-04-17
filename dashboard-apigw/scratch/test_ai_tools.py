import asyncio
import os
import sys
from typing import List

# Setup path
sys.path.append(os.getcwd())

from langchain_core.messages import AIMessage
from app.services.ai_service import ai_service
from app.core.config import settings

async def test_ai_agent():
    print("🚀 Initializing AI Agent Test...")
    
    if not ai_service.enabled:
        print("❌ AI Service is disabled. Check API keys.")
        return

    # Mock user sessions
    permissions = ["infra.server.view"]
    
    queries = [
        "What applications are registered in the system?",
        "Give me a summary of application with ITAM ID 1001.",
        "What is the current status of all servers?",
        "I need to reboot server web-prod-01, can you help?"
    ]
    
    for query in queries:
        print(f"\n💬 Query: {query}")
        print("-" * 50)
        
        try:
            print("🤖 AI Response: ", end="", flush=True)
            # astream(stream_mode="messages") yields (BaseMessageChunk, metadata) tuples
            async for chunk, metadata in await ai_service.chat(query, user_permissions=permissions):
                if hasattr(chunk, 'content') and chunk.content:
                    print(chunk.content, end="", flush=True)
            print()
        except Exception as e:
            print(f"\n❌ Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai_agent())
