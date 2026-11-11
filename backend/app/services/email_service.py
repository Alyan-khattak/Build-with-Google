"""
SMTP email notifications — optional.
Skipped silently when SMTP_HOST is not configured.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings

logger = logging.getLogger(__name__)


def send_emergency_email(
    guardian_email: str,
    user_email: str,
    trigger_reason: str,
    latitude: float | None,
    longitude: float | None,
) -> None:
    """
    Send emergency alert to guardian_email AND cc the configured SMTP address.
    No-op if SMTP not configured.
    """
    if not settings.smtp_host:
        return

    reason_text = {
        "NO": "responded NO (needs help)",
        "SOS": "triggered SOS",
        "missed": "missed a check-in",
    }.get(trigger_reason, trigger_reason)

    location_text = ""
    if latitude is not None and longitude is not None:
        maps_link = f"https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}&zoom=16"
        location_text = f"\n\nLast known location: {latitude:.5f}, {longitude:.5f}\nMap: {maps_link}"

    body = (
        f"AMANAH AI — Emergency Alert\n\n"
        f"{user_email} has {reason_text} and may need assistance."
        f"{location_text}\n\n"
        "Please check on them immediately.\n\n"
        "— AMANAH AI Safety System\n"
        "(This is a demo application. In a real emergency, call local emergency services.)"
    )

    # Collect all recipients: the guardian + the configured sender address (so the
    # app owner always receives a copy), deduplicated.
    recipients = list(dict.fromkeys([guardian_email, settings.smtp_from]))

    msg = MIMEMultipart()
    msg["From"] = settings.smtp_from
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = f"[AMANAH AI] Emergency: {user_email} needs help"
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, recipients, msg.as_string())
        logger.info("Emergency email sent to %s", recipients)
    except Exception as exc:
        # Email failure must never block the emergency flow
        logger.warning("Failed to send emergency email to %s: %s", recipients, exc)
