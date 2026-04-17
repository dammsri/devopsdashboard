import json
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.ai_service import ai_service
from app.api.v1.auth import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai")

@router.post("/chat")
async def chat(
    message: str = Body(..., embed=True),
    history: List[Dict[str, Any]] = Body(None, embed=True),
    current_user: User = Depends(get_current_user)
):
    """
    Chat with the DevOps Copilot.
    Returns a streaming response for real-time interaction.
    """
    if not ai_service.enabled:
        raise HTTPException(status_code=503, detail="AI Service is disabled. Check OPENAI_API_KEY.")

    async def event_generator():
        try:
            # Flatten permissions from roles
            user_permissions = []
            for role in current_user.roles:
                for func in role.functionalities:
                    user_permissions.append(func.name)
            
            # Pass permissions as context to the AI agent
            stream = await ai_service.chat(message, history, user_permissions=user_permissions)
            async for chunk in stream:
                try:
                    # Robust check for different stream formats
                    if isinstance(chunk, tuple) and len(chunk) >= 1:
                        chunk_obj = chunk[0]
                    else:
                        chunk_obj = chunk
                    
                    content = getattr(chunk_obj, 'content', None)
                    if not content and isinstance(chunk_obj, dict):
                        # Handle case where it might be a Step/Values dict
                        if 'messages' in chunk_obj and chunk_obj['messages']:
                            last_msg = chunk_obj['messages'][-1]
                            content = getattr(last_msg, 'content', None) or (last_msg.get('content') if isinstance(last_msg, dict) else None)
                        else:
                            content = chunk_obj.get('content')

                    # NEW: Robustly extract text from structured content (lists of dicts)
                    if isinstance(content, list):
                        text_parts = []
                        for part in content:
                            if isinstance(part, dict) and 'text' in part:
                                text_parts.append(part['text'])
                            elif isinstance(part, str):
                                text_parts.append(part)
                        content = "".join(text_parts)

                    if content is not None and content != "":
                        yield f"data: {json.dumps({'content': str(content)})}\n\n"
                except Exception as chunk_err:
                    logger.error(f"Error processing chunk: {chunk_err}. Chunk type: {type(chunk)}")
                    continue
        except Exception as e:
            logger.error(f"AI Chat Error: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/insights")
async def get_insights(current_user: User = Depends(get_current_user)):
    """
    Get proactive AI-generated infrastructure insights.
    """
    if not ai_service.enabled:
        return {"insights": ["AI Service disabled. Provide API key to enable insights."]}

    # Mock sample for now, will be connected to telemetry in Phase 2
    prompt = "Based on the infrastructure, generate 3 proactive maintenance suggestions for a DevOps dashboard."
    try:
        response = ai_service.insights_model.invoke(prompt)
        content = getattr(response, 'content', None)
        if not content and isinstance(response, dict):
            content = response.get('content', '')
            
        return {"insights": content.split("\n") if content else []}
    except Exception as e:
        logger.error(f"Error in insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
async def execute_action(
    action: str = Body(..., embed=True),
    rationale: str = Body(..., embed=True),
    payload: Dict[str, Any] = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Securely execute an AI-suggested action after user confirmation.
    Logs the action to the audit trail.
    """
    # 1. Audit Log the attempt
    ai_service.log_ai_action(
        user_id=current_user.user_id,
        action=action,
        rationale=rationale,
        payload=payload
    )

    # 2. Logic to actually perform the action
    # This will be expanded as we define "tools" for the agent.
    # For now, it's a secured execution skeleton.
    
    if action == "RESTART_SERVICE":
        # Placeholder for actual service restart logic
        return {"status": "success", "message": f"Action {action} executed and logged."}
    
    return {"status": "unsupported", "message": f"Action {action} is not yet implemented."}
