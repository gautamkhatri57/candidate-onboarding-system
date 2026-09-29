import os

import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")


def send_candidate_application_email(
    candidate_email: str,
    candidate_name: str,
    application_link: str,
):
    params = {
        "from": "onboarding@resend.dev",
        "to": [candidate_email],
        "subject": "Candidate Application - Complete Your Checklist",
        "html": f"""
        <h2>Hello {candidate_name},</h2>

        <p>
            You have been invited to complete your candidate application.
        </p>

        <p>
            Please open the link below and complete the required details
            and document checklist:
        </p>

        <p>
            <a href="{application_link}">
                Open Candidate Application
            </a>
        </p>

        <p>
            Please make sure all required documents are uploaded
            before submitting your application.
        </p>

        <p>Thank you.</p>
        """,
    }

    return resend.Emails.send(params)


def send_manager_documents_completed_email(
    manager_email: str,
    candidate_name: str,
    position_name: str,
):
    params = {
        "from": "onboarding@resend.dev",
        "to": [manager_email],
        "subject": "Candidate Documents Completed - Schedule Session 1",
        "html": f"""
        <h2>Candidate Documents Completed</h2>

        <p>
            Candidate <strong>{candidate_name}</strong>
            has completed all required documents.
        </p>

        <p>
            Position: <strong>{position_name}</strong>
        </p>

        <p>
            You can now schedule Session 1 for this candidate.
        </p>
        """,
    }

    return resend.Emails.send(params)


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

    params = {
        "from": "onboarding@resend.dev",
        "to": [candidate_email],
        "subject": f"Session {session_number} Scheduled - Candidate Interview",
        "html": f"""
        <h2>Hello {candidate_name},</h2>

        <p>
            Your Session {session_number} has been scheduled.
        </p>

        <p>
            <strong>Position:</strong> {position_name}
        </p>

        <p>
            <strong>Session:</strong> Session {session_number}
        </p>

        <p>
            <strong>Date:</strong> {formatted_date}
        </p>

        <p>
            <strong>Time:</strong> {formatted_time}
        </p>

        <p>
            Please make sure you are available at the scheduled time.
        </p>

        <p>
            After completing your session, please open your Candidate Portal
            and confirm that you have completed the session.
        </p>

        <p>
            <a
                href="{candidate_portal_link}"
                style="
                    display:inline-block;
                    padding:12px 20px;
                    background-color:#2563eb;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                "
            >
                Open Candidate Portal
            </a>
        </p>

        <p>Thank you.</p>
        """,
    }

    return resend.Emails.send(params)