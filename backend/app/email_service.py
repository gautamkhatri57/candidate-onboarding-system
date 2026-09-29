import os
import smtplib
from email.message import EmailMessage
from html import escape

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def _send_email(to_email: str, subject: str, html: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise ValueError("SMTP_EMAIL or SMTP_PASSWORD is missing in .env")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg.set_content("Please view this email in an HTML-compatible email client.")
    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as server:
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        return server.send_message(msg)


def send_candidate_application_email(
    candidate_email: str,
    candidate_name: str,
    application_link: str,
):
    safe_name = escape(candidate_name)
    safe_link = escape(application_link, quote=True)

    html = f"""
    <h2>Hello {safe_name},</h2>
    <p>You have been invited to complete your candidate application.</p>
    <p>Please open the link below and complete the required details
    and document checklist:</p>
    <p><a href="{safe_link}">Open Candidate Application</a></p>
    <p>Please make sure all required documents are uploaded
    before submitting your application.</p>
    <p>Thank you.</p>
    """

    return _send_email(
        candidate_email,
        "Candidate Application - Complete Your Checklist",
        html,
    )


def send_manager_documents_completed_email(
    manager_email: str,
    candidate_name: str,
    position_name: str,
):
    safe_candidate = escape(candidate_name)
    safe_position = escape(position_name)

    html = f"""
    <h2>Candidate Documents Completed</h2>
    <p>Candidate <strong>{safe_candidate}</strong>
    has completed all required documents.</p>
    <p>Position: <strong>{safe_position}</strong></p>
    <p>You can now schedule Session 1 for this candidate.</p>
    """

    return _send_email(
        manager_email,
        "Candidate Documents Completed - Schedule Session 1",
        html,
    )


def send_candidate_session_scheduled_email(
    candidate_email: str,
    candidate_name: str,
    position_name: str,
    session_number: int,
    scheduled_at,
    candidate_portal_link: str,
):
    formatted_date = scheduled_at.strftime("%d %B %Y")
    formatted_time = scheduled_at.strftime("%I:%M %p")

    safe_name = escape(candidate_name)
    safe_position = escape(position_name)
    safe_link = escape(candidate_portal_link, quote=True)

    html = f"""
    <h2>Hello {safe_name},</h2>
    <p>Your Session {session_number} has been scheduled.</p>
    <p><strong>Position:</strong> {safe_position}</p>
    <p><strong>Session:</strong> Session {session_number}</p>
    <p><strong>Date:</strong> {formatted_date}</p>
    <p><strong>Time:</strong> {formatted_time}</p>
    <p>Please make sure you are available at the scheduled time.</p>
    <p>After completing your session, please open your Candidate Portal
    and confirm that you have completed the session.</p>
    <p>
        <a href="{safe_link}"
           style="display:inline-block;padding:12px 20px;
           background-color:#2563eb;color:#ffffff;
           text-decoration:none;border-radius:6px;font-weight:bold;">
           Open Candidate Portal
        </a>
    </p>
    <p>Thank you.</p>
    """

    return _send_email(
        candidate_email,
        f"Session {session_number} Scheduled - Candidate Interview",
        html,
    )


def send_interviewer_session_scheduled_email(
    interviewer_email: str,
    interviewer_name: str,
    candidate_name: str,
    position_name: str,
    session_number: int,
    scheduled_at,
):
    formatted_date = scheduled_at.strftime("%d %B %Y")
    formatted_time = scheduled_at.strftime("%I:%M %p")

    safe_interviewer = escape(interviewer_name)
    safe_candidate = escape(candidate_name)
    safe_position = escape(position_name)

    html = f"""
    <h2>Hello {safe_interviewer},</h2>
    <p>A candidate interview session has been scheduled with you.</p>
    <p><strong>Candidate:</strong> {safe_candidate}</p>
    <p><strong>Position:</strong> {safe_position}</p>
    <p><strong>Session:</strong> Session {session_number}</p>
    <p><strong>Date:</strong> {formatted_date}</p>
    <p><strong>Time:</strong> {formatted_time}</p>
    <p>Please be available at the scheduled time.</p>
    <p>Thank you.</p>
    """

    return _send_email(
        interviewer_email,
        f"Interview Session {session_number} Scheduled",
        html,
    )