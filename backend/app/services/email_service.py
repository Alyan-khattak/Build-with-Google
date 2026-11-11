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

    has_location = latitude is not None and longitude is not None

    gmaps = f"https://maps.google.com/?q={latitude},{longitude}" if has_location else None
    osm = f"https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}&zoom=16" if has_location else None

    # Plain-text fallback
    location_plain = (
        f"\n\nLocation: {latitude:.5f}, {longitude:.5f}"
        f"\nGoogle Maps: {gmaps}"
        f"\nOpenStreetMap: {osm}"
        if has_location else "\n\nLocation: not available"
    )
    plain_body = (
        f"AMANAH AI — Emergency Alert\n\n"
        f"{user_email} has {reason_text} and may need assistance."
        f"{location_plain}\n\n"
        "Please check on them immediately.\n\n"
        "— AMANAH AI Safety System\n"
        "(Demo application. In a real emergency, call local emergency services.)"
    )

    # HTML email with clickable map button
    location_html = (
        f"""
        <p style="margin:12px 0;font-size:15px;color:#374151;">
          📍 <strong>Location:</strong> {latitude:.5f}, {longitude:.5f}
        </p>
        <p style="margin:8px 0;">
          <a href="{gmaps}" style="display:inline-block;background:#dc2626;color:#fff;
            padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;
            font-size:15px;margin-right:8px;">📍 Open in Google Maps</a>
          <a href="{osm}" style="display:inline-block;background:#4b5563;color:#fff;
            padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;
            font-size:15px;">🗺 OpenStreetMap</a>
        </p>"""
        if has_location else
        "<p style='color:#6b7280;'>⚠️ Location was not available when the session started.</p>"
    )

    html_body = f"""<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;">
  <div style="background:#dc2626;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;">🚨 AMANAH AI — Emergency Alert</h2>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
    <p style="font-size:16px;color:#111827;">
      <strong>{user_email}</strong> has <strong>{reason_text}</strong> and may need assistance.
    </p>
    {location_html}
    <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;">
    <p style="color:#374151;">Please check on them immediately.</p>
    <p style="color:#9ca3af;font-size:12px;">
      — AMANAH AI Safety System<br>
      Demo application. In a real emergency, call local emergency services.
    </p>
  </div>
</body></html>"""

    recipients = list(dict.fromkeys([guardian_email, settings.smtp_from]))

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.smtp_from
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = f"🚨 [AMANAH AI] Emergency: {user_email} needs help"
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

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
