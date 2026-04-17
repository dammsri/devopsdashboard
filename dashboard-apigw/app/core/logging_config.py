import os
import logging
from typing import Optional
from pythonjsonlogger import jsonlogger
from logging.handlers import RotatingFileHandler
from app.core.config import settings
from contextvars import ContextVar

# Correlation ID context variable for cross-service tracing
correlation_id: ContextVar[Optional[str]] = ContextVar("correlation_id", default="system")

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        log_record['service'] = settings.SERVICE_NAME
        log_record['request_id'] = correlation_id.get()
        if not log_record.get('timestamp'):
            from datetime import datetime
            now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            log_record['timestamp'] = now
        if log_record.get('levelname'):
            log_record['level'] = log_record['levelname'].upper()
            del log_record['levelname']
        else:
            log_record['level'] = record.levelname

def setup_logging(logger_name: Optional[str] = None, log_file_name: Optional[str] = None):
    """Sets up the standardized JSON logging configuration."""
    log_dir = settings.LOG_DIR
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Use service name-based log file if not specified
    if not log_file_name:
        log_file_path = os.path.join(log_dir, f"{settings.SERVICE_NAME}.log")
    else:
        log_file_path = os.path.join(log_dir, log_file_name)

    formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
    
    # File Handler (10MB per file, 5 backups)
    file_handler = RotatingFileHandler(log_file_path, maxBytes=10*1024*1024, backupCount=5)
    file_handler.setFormatter(formatter)
    
    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    # Configure root logger or specific logger
    logger = logging.getLogger(logger_name)
    logger.setLevel(settings.LOG_LEVEL.upper())
    
    # Clear existing handlers to prevent duplicates
    if logger.handlers:
        logger.handlers.clear()
        
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # Prevent propagation to avoid double logging if sub-loggers are used
    logger.propagate = False
    
    return logger
