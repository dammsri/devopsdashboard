import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.tools import tool
from langchain.agents import create_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from sqlalchemy.orm import joinedload

from app.core.config import settings
from app.models.ai import AIAuditLog
from app.db.session import SessionLocal
from app.models.application import Application
from app.models.infrastructure import Environment, Server, Service
from app.models.ske import SKECluster, SKEEnvironment, SKEService, SKENamespace

logger = logging.getLogger(__name__)

class SensitiveDataFilter:
    """Utility to redact sensitive information from data sent to AI."""
    
    @staticmethod
    def redact(data: Any) -> Any:
        if isinstance(data, dict):
            return {
                k: "[REDACTED]" if any(s.lower() in k.lower() for s in settings.AI_SENSITIVE_FIELDS) 
                else SensitiveDataFilter.redact(v)
                for k, v in data.items()
            }
        elif isinstance(data, list):
            return [SensitiveDataFilter.redact(item) for item in data]
        return data

class AIService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.enabled = False
        
        if self.provider == "openai":
            self.api_key = settings.OPENAI_API_KEY
            if not self.api_key:
                logger.warning("OPENAI_API_KEY not set. OpenAI features will be disabled.")
                return
            self.enabled = True
            self.chat_model = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                openai_api_key=self.api_key,
                streaming=True
            )
            self.insights_model = ChatOpenAI(
                model=settings.OPENAI_INSIGHTS_MODEL,
                openai_api_key=self.api_key
            )
            self.embeddings = OpenAIEmbeddings(openai_api_key=self.api_key)
            
        elif self.provider == "gemini":
            self.api_key = settings.GEMINI_API_KEY
            if not self.api_key:
                logger.warning("GEMINI_API_KEY not set. Gemini features will be disabled.")
                return
            self.enabled = True
            self.chat_model = ChatGoogleGenerativeAI(
                model=settings.GEMINI_CHAT_MODEL,
                google_api_key=self.api_key,
                streaming=True
            )
            self.insights_model = ChatGoogleGenerativeAI(
                model=settings.GEMINI_INSIGHTS_MODEL,
                google_api_key=self.api_key
            )
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=settings.GEMINI_EMBEDDING_MODEL,
                google_api_key=self.api_key
            )
        else:
            logger.error(f"Unsupported AI provider: {self.provider}")
            return

        self.vector_store = None
        # Initialize RAG if enabled
        self._initialize_rag()
        
        self._tools = self._setup_tools()
        self.agent = create_agent(
            model=self.chat_model,
            tools=self._tools,
            system_prompt="""You are the DevOps Copilot for the Standard Chartered DevOps Dashboard.
You assist users with infrastructure management, telemetry analysis, and documentation.

Guidelines:
- Be concise and technical.
- Use the available tools to answer questions about the dashboard state.
- When calling tools, ensure you take user permissions into account.
- If an action is requested (e.g., restart a server), use 'suggest_action' to explain WHY and provide the confirmation.
- Never expose passwords or secret keys."""
        )

    def _setup_tools(self):
        """Define the tools available to the AI agent."""
        
        @tool
        def get_all_applications(user_permissions: List[str]) -> str:
            """
            Returns a list of all registered applications with their ITAM IDs.
            Required permissions: None (Basic summary is visible to all authenticated users).
            """
            db = SessionLocal()
            try:
                apps = db.query(Application).all()
                result = "Applications registered in the system:\n"
                for app in apps:
                    result += f"- {app.name} (ITAM ID: {app.itam_id})\n"
                return result
            finally:
                db.close()

        @tool
        def get_application_summary(itam_id: int, user_permissions: List[str]) -> str:
            """
            Provides a detailed summary of resources (envs, servers, services) for a specific app.
            Required permissions: None (Read-only summary).
            """
            db = SessionLocal()
            try:
                app = db.query(Application).filter(Application.itam_id == itam_id).first()
                if not app:
                    return f"Application with ITAM ID {itam_id} not found."
                
                summary = f"Summary for {app.name} (ID: {itam_id}):\n"
                
                # Environments
                envs = db.query(Environment).filter(Environment.itam_id == itam_id).all()
                summary += f"- Infrastructure Environments: {', '.join([e.env_id for e in envs]) if envs else 'None'}\n"
                
                # Servers
                servers = db.query(Server).filter(Server.itam_id == itam_id).all()
                summary += f"- Servers count: {len(servers)}\n"
                
                # SKE
                ske_envs = db.query(SKEEnvironment).filter(SKEEnvironment.itam_id == itam_id).all()
                summary += f"- SKE Environments: {len(ske_envs)}\n"
                
                return summary
            finally:
                db.close()

        @tool
        def get_infrastructure_status(user_permissions: List[str]) -> str:
            """
            Returns the current health status and IP addresses of all servers.
            Requires permission: 'infra.server.view'
            """
            # Support explicit view permission or administrative rights
            if not any(p in user_permissions for p in ["infra.server.view", "sys.security.manage", "admin"]):
                return "Error: You do not have permission to view infrastructure status. Required: 'infra.server.view'"
                
            db = SessionLocal()
            try:
                servers = db.query(Server).all()
                result = "Current Infrastructure Status:\n"
                for s in servers:
                    result += f"- {s.hostname} ({s.ip_address}): {s.status} | OS: {s.os}\n"
                return result
            finally:
                db.close()

        @tool
        def suggest_action(action_type: str, target: str, rationale: str, payload: Dict[str, Any]) -> str:
            """
            Generates a structured suggestion for a destructive or administrative action.
            This tool DOES NOT execute the action, it only prepares the confirmation for the UI.
            Example action_type: 'RESTART_SERVICE', 'REBOOT_SERVER'.
            """
            # Return a JSON-like string that the agent can present to the user
            suggestion = {
                "type": "SUGGESTED_ACTION",
                "action": action_type,
                "target": target,
                "rationale": rationale,
                "payload": payload
            }
            return f"I am suggesting an action. Please confirm: {json.dumps(suggestion)}"

        return [get_all_applications, get_application_summary, get_infrastructure_status, suggest_action]

    def _initialize_rag(self):
        """Build initial FAISS index from README and docs."""
        try:
            docs = []
            # Index README.md
            readme_path = os.path.join(os.getcwd(), "..", "README.md")
            if os.path.exists(readme_path):
                with open(readme_path, "r") as f:
                    docs.append(Document(page_content=f.read(), metadata={"source": "README.md"}))
            
            if not docs:
                logger.info("No documentation found for RAG indexing.")
                return

            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            splits = text_splitter.split_documents(docs)
            self.vector_store = FAISS.from_documents(splits, self.embeddings)
            logger.info(f"FAISS vector store initialized with {len(splits)} chunks.")
        except Exception as e:
            logger.error(f"Failed to initialize RAG: {e}")

    async def chat(self, message: str, history: List[Dict[str, str]] = None, user_permissions: List[str] = None) -> Any:
        """Core chat interaction with tool-calling and RAG context."""
        if not self.enabled:
            return "AI service is currently disabled. Please provide an API key."

        # Redact any accidental sensitive info in message (defense in depth)
        filtered_message = SensitiveDataFilter.redact(message)
        
        # Add RAG context if available
        context = ""
        if self.vector_store:
            try:
                search_results = self.vector_store.similarity_search(message, k=2)
                context = "\n".join([doc.page_content for doc in search_results])
            except Exception as e:
                logger.error(f"RAG search failed: {e}")

        # Construct messages for the agent
        # We add the permissions and context as part of the messages or state
        # For simplicity, we'll append the RAG context to the system message's spirit
        current_context = f"\nContext from documentation:\n{context}\n\nUser Permissions: {user_permissions or []}"
        
        input_messages = []
        # Add history, but filter out pure duplicates of current message if client sent it
        for i, m in enumerate(history or []):
            # If this is the last message and matches current, skip it to avoid duplication
            if i == len(history) - 1 and m['content'] == message:
                continue
            input_messages.append((m['role'], m['content']))
            
        # Add current message with context
        input_messages.append(("human", f"{current_context}\n\nUser Query: {filtered_message}"))

        # We use stream_mode="messages" to get token-level streaming
        return self.agent.astream({
            "messages": input_messages
        }, stream_mode="messages")

    def log_ai_action(self, user_id: str, action: str, rationale: str, payload: Dict[str, Any]):
        """Record an executed AI-driven action to the audit log."""
        db = SessionLocal()
        try:
            # Redact sensitive info before logging
            clean_payload = SensitiveDataFilter.redact(payload)
            log_entry = AIAuditLog(
                user_id=user_id,
                action=action,
                rationale=rationale,
                payload=clean_payload,
                status="success"
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log AI action: {e}")
            db.rollback()
        finally:
            db.close()

ai_service = AIService()
