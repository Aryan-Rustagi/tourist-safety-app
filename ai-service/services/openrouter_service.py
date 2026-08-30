"""
OpenRouter Fallback Service for Tourist Safety AI.
Uses FREE models with automatic fallback chain.
"""
import os
import time
from typing import Dict, Any, Optional
from openai import OpenAI

# ──────────────────────────────────────────────
# Lazy-initialized client (dotenv must load first)
# ──────────────────────────────────────────────
_client: Optional[OpenAI] = None

def _get_client() -> OpenAI:
    global _client
    if _client is None:
        key = os.getenv("OPENROUTER_API_KEY", "")
        if not key:
            print("[OpenRouter] ⚠️ WARNING: OPENROUTER_API_KEY is not set!")
        _client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=key or "missing-key"
        )
    return _client

# ──────────────────────────────────────────────
# Free model fallback chain (priority order)
# ──────────────────────────────────────────────
FALLBACK_MODELS = [
    "deepseek/deepseek-r1-0528",
    "meta-llama/llama-3.3-70b-instruct",
    "qwen/qwen3-coder",
    "google/gemma-3-27b-it",
]


def get_safety_response_with_fallback(
    message: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None
) -> Dict[str, Any]:
    """
    Tries multiple FREE OpenRouter models in sequence.
    Returns a safe fallback if all models fail.
    """
    context_str = (
        "You are a safety assistant for tourists in rural India. "
        "Always be calm, clear, and action-oriented. "
        "If the user asks for help, use their provided location to give concise, practical instructions "
        "(e.g., find nearest safe shelter, call 112) or explain emergency first aid. "
        f"The user's current GPS location is: Latitude {lat if lat else 'Unknown'}, Longitude {lng if lng else 'Unknown'}."
    )

    messages = [
        {"role": "system", "content": context_str},
        {"role": "user", "content": message}
    ]

    client = _get_client()

    for i, model in enumerate(FALLBACK_MODELS):
        try:
            print(f"[OpenRouter] Trying model {i+1}/{len(FALLBACK_MODELS)}: {model}")

            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=800
            )

            reply = response.choices[0].message.content
            if not reply:
                raise ValueError("Empty response from model")

            print(f"[OpenRouter] ✅ Success with: {model}")
            return {
                "success": True,
                "reply": reply,
                "model_used": model
            }

        except Exception as e:
            print(f"[OpenRouter] ❌ Failed: {model} → {str(e)}")

            if i < len(FALLBACK_MODELS) - 1:
                time.sleep(0.5)

    # Safe fallback response if ALL models fail
    print("[OpenRouter] All models failed. Returning emergency fallback.")
    return {
        "success": False,
        "reply": "⚠️ AI is temporarily offline. For emergencies, please call 112 (National Emergency) or 1363 (Tourist Helpline) immediately.",
        "model_used": "fallback"
    }
