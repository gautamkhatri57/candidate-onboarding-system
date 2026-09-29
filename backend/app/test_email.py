import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

msg = EmailMessage()
msg["Subject"] = "SMTP Test - Candidate Onboarding"
msg["From"] = os.getenv("SMTP_EMAIL")
msg["To"] = "gautamkhatri325@gmail.com"
msg.set_content("Hello Gautam, SMTP email sending is working successfully!")

with smtplib.SMTP_SSL(
    os.getenv("SMTP_HOST"),
    int(os.getenv("SMTP_PORT"))
) as server:
    server.login(
        os.getenv("SMTP_EMAIL"),
        os.getenv("SMTP_PASSWORD")
    )
    server.send_message(msg)

print("Test email sent successfully!")