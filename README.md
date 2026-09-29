# Candidate Onboarding Management System

**A centralized, secure, and workflow-driven platform for managing candidate recruitment and onboarding.**

The Candidate Onboarding Management System is a full-stack web application designed to streamline the recruitment lifecycle—from candidate registration and document submission to interview coordination, evaluation, and onboarding. It provides role-based access for administrators, HR, and management, helping teams organize candidate information and manage recruitment activities through a unified platform.

---

## Overview

Recruitment processes often involve multiple stakeholders, candidate documents, interview rounds, and follow-up communication. Managing these activities separately can create operational overhead and make it difficult to track progress.

This system brings these activities together in one application, with dedicated access for different roles, centralized candidate records, interview session management, document handling, and email-based communication.

## Key Features

* **Role-Based Access Control** — Separate access for Admin, HR, and Management users.
* **Candidate Management** — Create, manage, and track candidate records throughout the onboarding process.
* **Document Management** — Upload, view, and download candidate documents through authenticated access.
* **Interview Management** — Organize interview sessions, assign interviewers, and manage interview outcomes.
* **Candidate Progress Tracking** — Track candidates across recruitment and onboarding stages.
* **Position Management** — Maintain job positions and associated position documents.
* **Email Notifications** — Support automated email communication for relevant recruitment and interview workflows.
* **Secure Authentication** — Token-based authentication and hashed password storage.
* **Centralized Dashboard** — Provide authorized users with a consolidated view of candidate and recruitment activities.
* **Database Migrations** — Manage database schema changes using Alembic.

## User Roles

| Role           | Responsibility                                                                             |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Admin**      | Administrative access, user management, and oversight of recruitment workflows.            |
| **HR**         | Candidate coordination, document handling, and recruitment process management.             |
| **Management** | Interview participation, candidate evaluation, and management-related workflow activities. |

Access to application features is controlled by the user's assigned role and permissions.

## Recruitment Workflow

The system is designed to support a structured candidate journey:

1. **Candidate Creation** — Add candidate information to the system.
2. **Application and Documents** — Manage candidate details and required documents.
3. **Interview Coordination** — Schedule and manage interview sessions with the relevant stakeholders.
4. **Evaluation** — Record interview outcomes and track candidate progress.
5. **Further Review** — Coordinate additional interview or review stages when required.
6. **Onboarding** — Track candidates through the final onboarding stage.

The exact stages and actions available depend on the configured workflow and user permissions.

## Technology Stack

| Layer                   | Technologies                       |
| ----------------------- | ---------------------------------- |
| **Frontend**            | React, Vite, JavaScript, HTML, CSS |
| **Backend**             | Python, FastAPI                    |
| **Database**            | PostgreSQL                         |
| **ORM**                 | SQLAlchemy                         |
| **Database Migrations** | Alembic                            |
| **Data Validation**     | Pydantic                           |
| **Authentication**      | JWT, password hashing              |
| **Email Integration**   | Resend                             |
| **API Testing**         | FastAPI Swagger UI                 |
| **Version Control**     | Git, GitHub                        |
| **Deployment**          | Render                             |

## Architecture

The application follows a frontend–backend architecture. The React frontend communicates with the FastAPI backend through REST APIs. The backend handles authentication, business logic, data validation, document operations, and database interactions.

```text
                 ┌──────────────────────┐
                 │      React + Vite    │
                 │       Frontend       │
                 └──────────┬───────────┘
                            │
                         REST API
                            │
                 ┌──────────▼───────────┐
                 │       FastAPI        │
                 │       Backend        │
                 ├──────────────────────┤
                 │ Authentication       │
                 │ Candidate Management │
                 │ Interview Sessions   │
                 │ Document Handling    │
                 │ Position Management  │
                 │ Email Integration    │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │      PostgreSQL      │
                 │       Database       │
                 └──────────────────────┘
```

## Project Structure

```text
candidate-onboarding-system/
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── auth.py
│   │   ├── candidate_portal.py
│   │   ├── candidates.py
│   │   ├── database.py
│   │   ├── email_service.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── positions.py
│   │   ├── sessions.py
│   │   └── users.py
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Ensure the following tools are installed:

* Python 3.12
* Node.js and npm
* PostgreSQL
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/gautamkhatri57/candidate-onboarding-system.git
cd candidate-onboarding-system
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows**

```powershell
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file inside the `backend` directory. Add the environment variables required by the application.

Example template (use the exact variable names expected by your backend configuration):

```env
DATABASE_URL=postgresql://username:password@localhost:5432/candidate_onboarding
SECRET_KEY=replace_with_a_secure_random_secret
RESEND_API_KEY=your_resend_api_key
```

Do not commit `.env` files, database credentials, API keys, or other secrets to version control.

### 4. Database Setup

Create a PostgreSQL database named `candidate_onboarding`, and configure the database connection in your backend environment.

Apply database migrations:

```bash
alembic upgrade head
```

Run this command from the backend directory, where `alembic.ini` is located.

### 5. Start the Backend

From the `backend` directory, run:

```bash
python -m uvicorn app.main:app --reload
```

The backend will be available at:

* **API:** `http://127.0.0.1:8000`
* **Swagger UI:** `http://127.0.0.1:8000/docs`
* **ReDoc:** `http://127.0.0.1:8000/redoc`

### 6. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure the frontend API base URL according to the variable or configuration used in `src/api.js`, pointing it to the local backend.

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in the terminal.

## API Documentation

The backend uses FastAPI to expose RESTful API endpoints. Interactive API documentation is automatically generated and available when the backend is running.

| Resource           | Description                                      |
| ------------------ | ------------------------------------------------ |
| Authentication     | User login and token-based authentication        |
| Users              | User and role-related operations                 |
| Candidates         | Candidate creation and management                |
| Candidate Portal   | Candidate-related access and document operations |
| Interview Sessions | Interview session coordination and outcomes      |
| Positions          | Position and position-document management        |

For the complete list of routes, request schemas, and responses, visit `/docs` on the running backend.

## Security

Security is an important part of the system's design:

* Passwords are stored using password hashing rather than plain text.
* Authenticated API access uses token-based authentication.
* Role-based authorization restricts access to protected operations.
* Candidate document access is handled through authenticated endpoints.
* Environment variables are used to keep sensitive configuration outside source code.

For production deployment, configure HTTPS, secure secrets, restrictive CORS origins, and persistent or managed file storage as appropriate.

## Deployment

The project is structured for separate frontend and backend deployment, with PostgreSQL as the database.

A typical deployment process includes:

1. Push the application code to GitHub.
2. Create a managed PostgreSQL database.
3. Configure backend environment variables in the hosting platform.
4. Deploy the FastAPI backend with the appropriate start command and run database migrations.
5. Deploy the React frontend and configure its API base URL to point to the deployed backend.
6. Configure CORS, email service credentials, and persistent document storage.
7. Create the required initial Admin, HR, and Management accounts securely.

**Important:** Uploaded documents require persistent storage in production. Do not rely on an ephemeral application filesystem for files that must remain available after redeployment or restart.

## Environment and Configuration Notes

* Keep local environment files out of Git.
* Use separate credentials for development and production.
* Use a strong, randomly generated secret key.
* Never publish database backups, uploaded candidate documents, or personal candidate information in the repository.
* Configure production CORS to allow only the required frontend origin.

## Future Enhancements

Potential areas for further development include:

* Advanced recruitment analytics and reporting
* Candidate search and filtering enhancements
* Audit logs for important administrative actions
* Expanded notification preferences
* Cloud-based document storage
* Additional workflow configuration options

## Contributing

Contributions, suggestions, and issue reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Commit your changes with a clear message.
5. Open a pull request describing the changes.

Please avoid including credentials, personal information, or real candidate documents in issues, commits, and pull requests.

## License

No license has been specified for this repository yet. All rights are reserved by the repository owner unless a license is added.

## Author

**Gautam Khatri**
BCA — Artificial Intelligence & Data Science

* **GitHub:** [@gautamkhatri57](https://github.com/gautamkhatri57)
* **Project Repository:** [candidate-onboarding-system](https://github.com/gautamkhatri57/candidate-onboarding-system)

---

*Candidate Onboarding Management System — Bringing candidate information, recruitment coordination, and onboarding workflows together in one platform.*
