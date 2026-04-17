import os
import logging
from typing import Optional
from pythonjsonlogger import jsonlogger
from logging.handlers import RotatingFileHandler
from contextvars import ContextVar

# Correlation ID context variable
correlation_id: ContextVar[Optional[str]] = ContextVar("correlation_id", default="system")

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        log_record['service'] = os.getenv("SERVICE_NAME", "telemetry-podman")
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

def setup_logging():
    """Standardized JSON logging configuration for telemetry services."""
    service_name = os.getenv("SERVICE_NAME", "telemetry-podman")
    log_dir = os.getenv("LOG_DIR", "logs")
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log_file_path = os.path.join(log_dir, f"{service_name}.log")
    formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
    
    # File Handler
    file_handler = RotatingFileHandler(log_file_path, maxBytes=10*1024*1024, backupCount=5)
    file_handler.setFormatter(formatter)
    
    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    # Root Logger Configuration
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    if logger.handlers:
        logger.handlers.clear()
        
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger
