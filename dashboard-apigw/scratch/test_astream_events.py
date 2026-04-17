import asyncio
import os
import sys

# Setup path
sys.path.append(os.getcwd())

from app.services.ai_service import ai_service

async def test_streaming_events():
    print("🚀 Testing astream_events (v2)...")
    if not ai_service.enabled:
        print("❌ AI Service disabled")
        return

    query = "Hello, who are you and what can you do?"
    input_messages = [("human", query)]

    try:
        print("🤖 AI Response: ", end="", flush=True)
        # astream_events is the most powerful streaming method
        async for event in ai_service.agent.astream_events({"messages": input_messages}, version="v2"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    print(content, end="", flush=True)
            elif kind == "on_tool_start":
                print(f"\n[Tool Start: {event['name']}]")
            elif kind == "on_tool_end":
                print(f"[Tool End: {event['name']}]")
        print("\n✅ Stream complete.")
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_streaming_events())
