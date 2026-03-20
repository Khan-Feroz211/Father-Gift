from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import aiosmtplib
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

BRAND_NAVY = "#0D1B2A"
BRAND_GOLD = "#B8860B"


def _build_hearing_html(
    advocate_name: str,
    case_title: str,
    case_number: Optional[str],
    hearing_date: str,
    hearing_time: Optional[str],
    courtroom: Optional[str],
    court_name: Optional[str],
    purpose: str,
) -> str:
    time_str = hearing_time or "Time not specified"
    court_str = court_name or "Court not specified"
    room_str = courtroom or "Not specified"
    case_num_str = case_number or "N/A"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Hearing Reminder – LegalPakistan</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:{BRAND_NAVY};padding:24px 32px;text-align:center;">
              <span style="font-size:28px;">⚖️</span>
              <h1 style="color:{BRAND_GOLD};font-family:'Times New Roman',serif;margin:8px 0 0;font-size:22px;letter-spacing:1px;">LegalPakistan</h1>
              <p style="color:#aab4be;margin:4px 0 0;font-size:12px;font-family:sans-serif;">Practice Management System</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:{BRAND_NAVY};font-family:'Times New Roman',serif;margin:0 0 16px;font-size:20px;">📅 Hearing Reminder</h2>
              <p style="color:#333;font-size:15px;margin:0 0 24px;">Dear <strong>{advocate_name}</strong>,</p>
              <p style="color:#333;font-size:15px;margin:0 0 16px;">This is a reminder that you have a scheduled hearing tomorrow:</p>
              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0d9cc;border-radius:6px;overflow:hidden;margin-bottom:24px;">
                <tr style="background:#faf8f2;">
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;width:40%;">
                    <strong style="color:{BRAND_NAVY};">Case</strong>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;">
                    <span style="color:#333;">{case_title}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;background:#faf8f2;">
                    <strong style="color:{BRAND_NAVY};">Case Number</strong>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;">
                    <span style="color:#333;">{case_num_str}</span>
                  </td>
                </tr>
                <tr style="background:#faf8f2;">
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;">
                    <strong style="color:{BRAND_NAVY};">Date</strong>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;">
                    <strong style="color:{BRAND_GOLD};font-size:16px;">{hearing_date}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;background:#faf8f2;">
                    <strong style="color:{BRAND_NAVY};">Time</strong>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;">
                    <span style="color:#333;">{time_str}</span>
                  </td>
                </tr>
                <tr style="background:#faf8f2;">
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;">
                    <strong style="color:{BRAND_NAVY};">Court</strong>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;">
                    <span style="color:#333;">{court_str}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;background:#faf8f2;">
                    <strong style="color:{BRAND_NAVY};">Courtroom</strong>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e0d9cc;">
                    <span style="color:#333;">{room_str}</span>
                  </td>
                </tr>
                <tr style="background:#faf8f2;">
                  <td style="padding:12px 16px;">
                    <strong style="color:{BRAND_NAVY};">Purpose</strong>
                  </td>
                  <td style="padding:12px 16px;">
                    <span style="color:#333;text-transform:capitalize;">{purpose.replace('_', ' ')}</span>
                  </td>
                </tr>
              </table>
              <p style="color:#666;font-size:13px;text-align:center;margin:0;">
                This is an automated reminder from LegalPakistan.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:{BRAND_NAVY};padding:16px 32px;text-align:center;">
              <p style="color:#aab4be;font-size:11px;margin:0;font-family:sans-serif;">
                © LegalPakistan · Your trusted legal practice management system
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


async def send_hearing_reminder(
    to_email: str,
    advocate_name: str,
    case_title: str,
    case_number: Optional[str],
    hearing_date: str,
    hearing_time: Optional[str],
    courtroom: Optional[str],
    court_name: Optional[str],
    purpose: str,
) -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("email_not_configured_skipping")
        return False

    html_content = _build_hearing_html(
        advocate_name=advocate_name,
        case_title=case_title,
        case_number=case_number,
        hearing_date=hearing_date,
        hearing_time=hearing_time,
        courtroom=courtroom,
        court_name=court_name,
        purpose=purpose,
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"⚖️ Hearing Reminder: {case_title} – {hearing_date}"
    msg["From"] = settings.EMAILS_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("hearing_reminder_sent", to=to_email, case=case_title)
        return True
    except Exception as exc:
        logger.error("hearing_reminder_failed", to=to_email, error=str(exc))
        return False
