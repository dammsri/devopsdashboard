import asyncio
import os
import sys

# Setup path
sys.path.append(os.getcwd())

from app.services.ai_service import ai_service

async def test_insights():
    print("🚀 Testing Insights...")
    if not ai_service.enabled:
        print("❌ AI Service disabled")
        return

    prompt = "Based on the infrastructure, generate 3 proactive maintenance suggestions for a DevOps dashboard."
    try:
        response = ai_service.insights_model.invoke(prompt)
        print(f"✅ Response Type: {type(response)}")
        print(f"✅ Response Data: {response}")
        if hasattr(response, 'content'):
            print(f"✅ Content: {response.content[:50]}...")
        else:
            print("❌ Response has no 'content' attribute!")
    except Exception as e:
        print(f"❌ Error in insights: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_insights())
