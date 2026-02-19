"""
Rate Limiting — shared slowapi limiter for all AI endpoints.
AI routes: 10 req/min per IP (LLM calls are expensive).
General routes: 60 req/min per IP.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter — import this in routers that need rate limiting
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
