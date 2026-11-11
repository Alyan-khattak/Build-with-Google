"""
Gemini AI — optional assistance for structuring incident reports.
Gracefully disabled when GEMINI_API_KEY is not set.
"""
import logging
from ..config import settings

logger = logging.getLogger(__name__)


def structure_incident_report(description: str) -> str | None:
    """
    Ask Gemini to improve an incident report description.
    Returns the structured text, or None if AI is unavailable.
    """
    if not settings.gemini_api_key:
        return None

    try:
        from google import genai  # type: ignore

        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = (
            "You are helping a woman write a clear, factual safety incident report. "
            "Rewrite the following description in plain language, keeping only facts "
            "the person stated. Do not add details, invent information, or make accusations. "
            "Output only the improved description — no headers, no commentary.\n\n"
            f"Original: {description}"
        )
        response = client.models.generate_content(model="gemini-3.8-flash", contents=prompt)
        return response.text.strip()
    except Exception as exc:
        logger.warning("Gemini structuring failed: %s", exc)
        return None
