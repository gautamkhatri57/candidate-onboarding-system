import { useEffect, useState } from "react"

import "./App.css"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")

import {

  loginUser,

  getCurrentUser,

  getCandidates,

  createCandidate,

  getSessions,

  createSession,

  completeSession,

  getCandidatePortal,

  uploadCandidateDocument,

  submitCandidateApplication,

  confirmCandidateSession,

} from "./api"





/* =========================================================

   CANDIDATE DETAILS

========================================================= */

function CandidateDetails({ candidate, onClose, onReview }) {

  return (

    <div className="details-overlay">

      <div className="details-card">

        <div className="details-header">

          <div>

            <h2>Candidate Details</h2>

            <p>Candidate application information</p>

          </div>

          <button className="close-btn" onClick={onClose}>

            ×

          </button>

        </div>

        <div className="details-grid">

          <div className="detail-item">

            <span>Candidate ID</span>

            <strong>{candidate.id}</strong>

          </div>

          <div className="detail-item">

            <span>Name</span>

            <strong>{candidate.name}</strong>

          </div>

          <div className="detail-item">

            <span>Email</span>

            <strong>{candidate.email}</strong>

          </div>

          <div className="detail-item">

            <span>Phone</span>

            <strong>{candidate.phone}</strong>

          </div>

          <div className="detail-item">

            <span>Position ID</span>

            <strong>{candidate.position_id}</strong>

          </div>

          <div className="detail-item">

            <span>Manager ID</span>

            <strong>

              {candidate.assigned_manager_id || "Not Assigned"}

            </strong>

          </div>

          <div className="detail-item">

            <span>Status</span>

            <span className="status-badge">

              {candidate.status}

            </span>

          </div>

        </div>

        <div className="workflow-section">

          <h3>Application Progress</h3>

          <div className="progress-list">

            <div className="progress-item">

              <span>Candidate Created</span>

              <strong>✓</strong>

            </div>

            <div className="progress-item">

              <span>Session 1</span>

              <strong>

                {[

                  "SESSION_1_SCHEDULED",

                  "SESSION_1_COMPLETED",

                  "CANDIDATE_CONFIRMED",

                  "UNDER_REVIEW",

                  "APPROVED",

                  "FINAL_INTERVIEW",

                  "SELECTED",

                  "ONBOARDED",

                ].includes(candidate.status)

                  ? "✓"

                  : "Pending"}

              </strong>

            </div>

            <div className="progress-item">

              <span>Management Review</span>

              <strong>

                {[

                  "APPROVED",

                  "FINAL_INTERVIEW",

                  "SELECTED",

                  "ONBOARDED",

                ].includes(candidate.status)

                  ? "✓"

                  : "Pending"}

              </strong>

            </div>

            <div className="progress-item">

              <span>Final Interview</span>

              <strong>

                {["SELECTED", "ONBOARDED"].includes(

                  candidate.status

                )

                  ? "✓"

                  : "Pending"}

              </strong>

            </div>

            <div className="progress-item">

              <span>Onboarding</span>

              <strong>

                {candidate.status === "ONBOARDED"

                  ? "✓"

                  : "Pending"}

              </strong>

            </div>

          </div>

        </div>

        {candidate.status === "UNDER_REVIEW" && (

          <div className="workflow-section">

            <h3>Admin Review</h3>

            <p>Session 1 and Session 2 are completed. Select the next action.</p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>

              <button

                className="primary-btn"

                onClick={() => onReview(candidate.id, "APPROVE")}

              >

                Approve

              </button>

              <button

                className="view-btn"

                onClick={() => onReview(candidate.id, "REMEDIAL")}

              >

                Remedial

              </button>

              <button

                className="secondary-btn"

                onClick={() => onReview(candidate.id, "REJECT")}

              >

                Reject

              </button>

            </div>

          </div>

        )}

        <div className="details-footer">

          <button className="secondary-btn" onClick={onClose}>

            Close

          </button>

        </div>

      </div>

    </div>

  )

}





/* =========================================================

   CANDIDATES PAGE

========================================================= */

function CandidatesPage({

  candidates,

  loading,

  error,

  onView,

}) {

  const [search, setSearch] = useState("")

  const [statusFilter, setStatusFilter] = useState("ALL")

  const filteredCandidates = candidates.filter((candidate) => {

    const searchText = search.toLowerCase()

    const matchesSearch =

      String(candidate.id).includes(searchText) ||

      String(candidate.name || "")

        .toLowerCase()

        .includes(searchText) ||

      String(candidate.email || "")

        .toLowerCase()

        .includes(searchText) ||

      String(candidate.phone || "").includes(searchText)

    const matchesStatus =

      statusFilter === "ALL" ||

      candidate.status === statusFilter

    return matchesSearch && matchesStatus

  })

  return (

    <section className="content-card">

      <div className="section-header">

        <div>

          <h2>All Candidates</h2>

          <p>

            View and manage all candidate applications.

          </p>

        </div>

      </div>

      <div className="candidate-filters">

        <input

          type="text"

          placeholder="Search candidate..."

          value={search}

          onChange={(e) => setSearch(e.target.value)}

        />

        <select

          value={statusFilter}

          onChange={(e) =>

            setStatusFilter(e.target.value)

          }

        >

          <option value="ALL">All Status</option>

          <option value="CREATED">Created</option>

          <option value="SESSION_1_SCHEDULED">

            Session 1 Scheduled

          </option>

          <option value="SESSION_1_COMPLETED">

            Session 1 Completed

          </option>

          <option value="CANDIDATE_CONFIRMED">

            Candidate Confirmed

          </option>

          <option value="UNDER_REVIEW">

            Under Review

          </option>

          <option value="APPROVED">Approved</option>

          <option value="REMEDIAL_REQUIRED">

            Remedial Required

          </option>

          <option value="FINAL_INTERVIEW">

            Final Interview

          </option>

          <option value="SELECTED">Selected</option>

          <option value="REJECTED">Rejected</option>

          <option value="ONBOARDED">Onboarded</option>

        </select>

      </div>

      {loading && (

        <div className="empty-state">

          <h3>Loading candidates...</h3>

        </div>

      )}

      {error && (

        <div className="empty-state">

          <h3>Failed to load candidates</h3>

          <p>{error}</p>

        </div>

      )}

      {!loading &&

        !error &&

        filteredCandidates.length === 0 && (

          <div className="empty-state">

            <div className="empty-icon">👤</div>

            <h3>No candidates found</h3>

            <p>

              Try changing your search or status filter.

            </p>

          </div>

        )}

      {!loading &&

        !error &&

        filteredCandidates.length > 0 && (

          <div className="candidate-table-wrapper">

            <table className="candidate-table">

              <thead>

                <tr>

                  <th>ID</th>

                  <th>Name</th>

                  <th>Email</th>

                  <th>Phone</th>

                  <th>Status</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {filteredCandidates.map((candidate) => (

                  <tr key={candidate.id}>

                    <td>{candidate.id}</td>

                    <td>{candidate.name}</td>

                    <td>{candidate.email}</td>

                    <td>{candidate.phone}</td>

                    <td>

                      <span className="status-badge">

                        {candidate.status}

                      </span>

                    </td>

                    <td>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>

                        <button

                          className="view-btn"

                          onClick={() => onView(candidate)}

                        >

                          View

                        </button>

                        {candidate.status === "UNDER_REVIEW" && (

                          <button

                            className="primary-btn"

                            onClick={() => onView(candidate)}

                          >

                            Review

                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

    </section>

  )

}





/* =========================================================

   DASHBOARD HOME

========================================================= */

function DashboardHome({ candidates, onAddCandidate }) {

  const totalCandidates = candidates.length

  const underReview = candidates.filter(

    (candidate) =>

      candidate.status === "UNDER_REVIEW"

  ).length

  const onboarded = candidates.filter(

    (candidate) =>

      candidate.status === "ONBOARDED"

  ).length

  const interviews = candidates.filter((candidate) =>

    [

      "SESSION_1_SCHEDULED",

      "SESSION_1_COMPLETED",

      "FINAL_INTERVIEW",

    ].includes(candidate.status)

  ).length

  return (

    <>

      <section className="stats">

        <div className="stat-card">

          <span>Total Candidates</span>

          <strong>{totalCandidates}</strong>

        </div>

        <div className="stat-card">

          <span>Under Review</span>

          <strong>{underReview}</strong>

        </div>

        <div className="stat-card">

          <span>Interviews</span>

          <strong>{interviews}</strong>

        </div>

        <div className="stat-card">

          <span>Onboarded</span>

          <strong>{onboarded}</strong>

        </div>

      </section>

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>Recent Candidates</h2>

            <p>

              Manage candidate applications and progress.

            </p>

          </div>

          <button

            className="primary-btn"

            onClick={onAddCandidate}

          >

            + Add Candidate

          </button>

        </div>

        {candidates.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">👤</div>

            <h3>No candidates to display</h3>

            <p>

              Candidate records will appear here once they

              are added.

            </p>

          </div>

        ) : (

          <div className="candidate-table-wrapper">

            <table className="candidate-table">

              <thead>

                <tr>

                  <th>ID</th>

                  <th>Name</th>

                  <th>Email</th>

                  <th>Status</th>

                </tr>

              </thead>

              <tbody>

                {candidates.slice(0, 5).map((candidate) => (

                  <tr key={candidate.id}>

                    <td>{candidate.id}</td>

                    <td>{candidate.name}</td>

                    <td>{candidate.email}</td>

                    <td>

                      <span className="status-badge">

                        {candidate.status}

                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </>

  )

}





/* =========================================================

   ADD CANDIDATE

========================================================= */

function AddCandidateForm({ onClose, onCreated, positions = [] }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [positionId, setPositionId] = useState("")
  const [managerId, setManagerId] = useState("")
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState("")

  const selectedPosition = positions.find((position) => String(position.id) === positionId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError("")
    if (!positionId) {
      setFormError("Please select a job position.")
      return
    }
    setCreating(true)
    try {
      const token = localStorage.getItem("access_token")
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        position_id: Number(positionId),
      }
      if (managerId.trim()) payload.assigned_manager_id = Number(managerId)
      await createCandidate(token, payload)
      await onCreated()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create candidate")
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="content-card">
      <div className="section-header">
        <div><h2>Add Candidate</h2><p>Create a candidate application and generate its document checklist from the selected position.</p></div>
        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
      </div>
      <form className="candidate-form" onSubmit={handleSubmit}>
        <div className="form-group"><label>Full Name</label><input type="text" placeholder="Enter candidate name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="form-group"><label>Email</label><input type="email" placeholder="Enter candidate email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="form-group"><label>Phone</label><input type="tel" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
        <div className="form-group"><label>Job Position</label><select value={positionId} onChange={(e) => setPositionId(e.target.value)} required><option value="">Select a position</option>{positions.filter((p) => p.is_active !== false).map((p) => <option key={p.id} value={p.id}>{p.title || p.name} (ID: {p.id})</option>)}</select>{positions.length === 0 && <small>Create a job position first.</small>}</div>
        <div className="form-group"><label>Assigned Manager ID <span className="subtitle">(Optional)</span></label><input type="number" min="1" placeholder="Enter manager user ID, if assigned" value={managerId} onChange={(e) => setManagerId(e.target.value)} /></div>
        {selectedPosition && <div className="form-group"><label>Document Checklist</label>{selectedPosition.documents?.length ? <ul>{selectedPosition.documents.map((doc) => <li key={doc.id}>{doc.document_name} — {doc.is_required ? "Required" : "Optional"}</li>)}</ul> : <p className="subtitle">No document requirements are configured for this position.</p>}</div>}
        {formError && <p className="error-message">{formError}</p>}
        <button className="primary-btn" type="submit" disabled={creating || positions.filter((p) => p.is_active !== false).length === 0}>{creating ? "Creating..." : "Create Candidate"}</button>
      </form>
    </section>
  )
}

function InterviewsPage({

  sessions,

  loading,

  error,

}) {

  return (

    <section className="content-card">

      <div className="section-header">

        <div>

          <h2>Interviews</h2>

          <p>

            View scheduled and completed interviews.

          </p>

        </div>

      </div>

      {loading && (

        <div className="empty-state">

          <h3>Loading interviews...</h3>

        </div>

      )}

      {error && (

        <div className="empty-state">

          <h3>Failed to load interviews</h3>

          <p>{error}</p>

        </div>

      )}

      {!loading &&

        !error &&

        sessions.length === 0 && (

          <div className="empty-state">

            <div className="empty-icon">📅</div>

            <h3>No interviews found</h3>

            <p>

              Scheduled interviews will appear here.

            </p>

          </div>

        )}

      {!loading &&

        !error &&

        sessions.length > 0 && (

          <div className="candidate-table-wrapper">

            <table className="candidate-table">

              <thead>

                <tr>

                  <th>ID</th>

                  <th>Candidate ID</th>

                  <th>Session</th>

                  <th>Interviewer</th>

                  <th>Scheduled At</th>

                  <th>Status</th>

                </tr>

              </thead>

              <tbody>

                {sessions.map((session) => (

                  <tr key={session.id}>

                    <td>{session.id}</td>

                    <td>{session.candidate_id}</td>

                    <td>{session.session_type}</td>

                    <td>{session.interviewer_id}</td>

                    <td>

                      {session.scheduled_at

                        ? new Date(

                            session.scheduled_at

                          ).toLocaleString()

                        : "-"}

                    </td>

                    <td>

                      <span className="status-badge">

                        {session.status}

                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

    </section>

  )

}





/* =========================================================

   ADMIN DASHBOARD

========================================================= */

function AdminDashboard({ onLogout }) {

  const [candidates, setCandidates] = useState([])

  const [sessions, setSessions] = useState([])

  const [loading, setLoading] = useState(true)

  const [sessionsLoading, setSessionsLoading] =

    useState(false)

  const [error, setError] = useState("")

  const [sessionsError, setSessionsError] =

    useState("")

  const [page, setPage] = useState("dashboard")

  const [selectedCandidate, setSelectedCandidate] =

    useState(null)

  const loadCandidates = async () => {

    try {

      setError("")

      const token = localStorage.getItem(

        "access_token"

      )

      const data = await getCandidates(token)

      setCandidates(

        Array.isArray(data) ? data : []

      )

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  const loadSessions = async () => {

    try {

      setSessionsLoading(true)

      setSessionsError("")

      const token = localStorage.getItem(

        "access_token"

      )

      const data = await getSessions(token)

      setSessions(

        Array.isArray(data) ? data : []

      )

    } catch (err) {

      setSessionsError(err.message)

    } finally {

      setSessionsLoading(false)

    }

  }

  const handleReviewDecision = async (candidateId, decision) => {

    try {

      setError("")

      const token = localStorage.getItem("access_token")

      const response = await fetch(

        `${API_BASE_URL}/candidates/${candidateId}/review`,

        {

          method: "PUT",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify({ decision }),

        }

      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {

        const message =

          typeof data?.detail === "string"

            ? data.detail

            : "Failed to update candidate review"

        throw new Error(message)

      }

      setSelectedCandidate(null)

      await loadCandidates()

    } catch (err) {

      console.error("Review error:", err)

      setError(

        err instanceof Error

          ? err.message

          : "Something went wrong while reviewing candidate"

      )

    }

  }

  useEffect(() => {

    loadCandidates()

  }, [])

  const handleCandidateCreated = async () => {

    await loadCandidates()

    setPage("candidates")

  }

  const navigate = (newPage) => {

    setPage(newPage)

    setSelectedCandidate(null)

    if (newPage === "interviews") {

      loadSessions()

    }

  }

  return (

    <div className="dashboard">

      <aside className="sidebar">

        <div className="logo">

          Candidate

          <span>Onboarding System</span>

        </div>

        <nav>

          <button

            className={`nav-item ${

              page === "dashboard" ? "active" : ""

            }`}

            onClick={() => navigate("dashboard")}

          >

            Dashboard

          </button>

          <button

            className={`nav-item ${

              page === "candidates" ? "active" : ""

            }`}

            onClick={() => navigate("candidates")}

          >

            Candidates

          </button>

          <button

            className={`nav-item ${

              page === "interviews" ? "active" : ""

            }`}

            onClick={() => navigate("interviews")}

          >

            Interviews

          </button>

          <button

            className={`nav-item ${

              page === "management" ? "active" : ""

            }`}

            onClick={() => navigate("management")}

          >

            Management

          </button>

          <button

            className={`nav-item ${

              page === "onboarding" ? "active" : ""

            }`}

            onClick={() => navigate("onboarding")}

          >

            Onboarding

          </button>

        </nav>

        <button

          className="logout-btn"

          onClick={onLogout}

        >

          Logout

        </button>

      </aside>

      <main className="main-content">

        <div className="topbar">

          <div>

            <h1>

              {page === "dashboard" &&

                "Admin Dashboard"}

              {page === "candidates" &&

                "Candidates"}

              {page === "add-candidate" &&

                "Add Candidate"}

              {page === "interviews" &&

                "Interviews"}

              {page === "management" &&

                "Management"}

              {page === "onboarding" &&

                "Onboarding"}

            </h1>

            <p>

              {page === "dashboard" &&

                "Candidate onboarding overview"}

              {page === "candidates" &&

                "Manage all candidate applications"}

              {page === "add-candidate" &&

                "Create a new candidate application"}

              {page === "interviews" &&

                "Manage candidate interviews"}

              {page === "management" &&

                "Manage management assignments"}

              {page === "onboarding" &&

                "Manage selected candidates"}

            </p>

          </div>

          <div className="admin-profile">

            <div className="avatar">A</div>

            <div>

              <strong>Admin</strong>

              <span>Administrator</span>

            </div>

          </div>

        </div>

        {page === "dashboard" && (

          <DashboardHome

            candidates={candidates}

            onAddCandidate={() =>

              navigate("add-candidate")

            }

          />

        )}

        {page === "candidates" && (

          <CandidatesPage

            candidates={candidates}

            loading={loading}

            error={error}

            onView={(candidate) =>

              setSelectedCandidate(candidate)

            }

          />

        )}

        {page === "add-candidate" && (

          <AddCandidateForm

            onClose={() => navigate("dashboard")}

            onCreated={handleCandidateCreated}

          />

        )}

        {page === "interviews" && (

          <InterviewsPage

            sessions={sessions}

            loading={sessionsLoading}

            error={sessionsError}

          />

        )}

        {page === "management" && (

          <section className="content-card">

            <div className="empty-state">

              <div className="empty-icon">👥</div>

              <h3>Management</h3>

              <p>

                Management assignment will be connected

                next.

              </p>

            </div>

          </section>

        )}

        {page === "onboarding" && (

          <section className="content-card">

            <div className="empty-state">

              <div className="empty-icon">✅</div>

              <h3>Onboarding</h3>

              <p>

                Onboarding management will be connected

                next.

              </p>

            </div>

          </section>

        )}

      </main>

      {selectedCandidate && (

        <CandidateDetails

          candidate={selectedCandidate}

          onClose={() =>

            setSelectedCandidate(null)

          }

          onReview={handleReviewDecision}

        />

      )}

    </div>

  )

}





/* =========================================================

   MANAGEMENT DASHBOARD

========================================================= */

function ManagementDashboard({ onLogout }) {

  const [page, setPage] = useState("dashboard")

  const [candidates, setCandidates] = useState([])

  const [sessions, setSessions] = useState([])

  const [currentUser, setCurrentUser] = useState(null)

  const [interviewers, setInterviewers] = useState([])

  const [selectedInterviewerId, setSelectedInterviewerId] = useState("")

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const [scheduleError, setScheduleError] =

    useState("")

  const [scheduleSuccess, setScheduleSuccess] =

    useState("")

  const [scheduling, setScheduling] = useState(false)

  const [selectedCandidateId, setSelectedCandidateId] =

    useState("")

  const [scheduledAt, setScheduledAt] = useState("")

  const [completeSessionId, setCompleteSessionId] =

    useState(null)

  const [completeOutcome, setCompleteOutcome] =

    useState("")

  const [completeNotes, setCompleteNotes] =

    useState("")

  const [completeError, setCompleteError] =

    useState("")

  const [completeSuccess, setCompleteSuccess] =

    useState("")

  const [completing, setCompleting] =

    useState(false)

  const navigate = (newPage) => {

    setPage(newPage)

    if (newPage === "interviews") {

      setScheduleError("")

      setScheduleSuccess("")

      setCompleteError("")

      setCompleteSuccess("")

    }

  }

  const loadData = async () => {

    try {

      setLoading(true)

      setError("")

      const token = localStorage.getItem(

        "access_token"

      )

      const [

        userData,

        candidateData,

        sessionData,

        interviewerResponse,

      ] = await Promise.all([

        getCurrentUser(token),

        getCandidates(token),

        getSessions(token),

        fetch(`${API_BASE_URL}/sessions/interviewers`, {

          headers: { Authorization: `Bearer ${token}` },

        }),

      ])

      const interviewerData = await interviewerResponse.json().catch(() => [])

      if (!interviewerResponse.ok) {

        throw new Error(

          typeof interviewerData?.detail === "string"

            ? interviewerData.detail

            : "Failed to load interviewers"

        )

      }

      setCurrentUser(userData)

      setInterviewers(Array.isArray(interviewerData) ? interviewerData : [])

      setCandidates(

        Array.isArray(candidateData)

          ? candidateData

          : []

      )

      setSessions(

        Array.isArray(sessionData)

          ? sessionData

          : []

      )

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {

    loadData()

  }, [])

  const refreshData = async () => {

    const token = localStorage.getItem(

      "access_token"

    )

    const [

      candidateData,

      sessionData,

    ] = await Promise.all([

      getCandidates(token),

      getSessions(token),

    ])

    setCandidates(

      Array.isArray(candidateData)

        ? candidateData

        : []

    )

    setSessions(

      Array.isArray(sessionData)

        ? sessionData

        : []

    )

  }

  const handleScheduleInterview = async (e) => {

    e.preventDefault()

    setScheduleError("")

    setScheduleSuccess("")

    if (!selectedCandidateId) {

      setScheduleError("Please select a candidate.")

      return

    }

    if (!scheduledAt) {

      setScheduleError(

        "Please select interview date and time."

      )

      return

    }

    if (!selectedInterviewerId) {

      setScheduleError("Please select an interviewer.")

      return

    }

    try {

      setScheduling(true)

      const token = localStorage.getItem(

        "access_token"

      )

      await createSession(token, {

        candidate_id: Number(selectedCandidateId),

        interviewer_id: Number(selectedInterviewerId),

        session_type: "MANAGEMENT_FIRST_INTERVIEW",

        scheduled_at: new Date(

          scheduledAt

        ).toISOString(),

      })

      setScheduleSuccess(

        "Interview scheduled successfully."

      )

      setSelectedCandidateId("")

      setSelectedInterviewerId("")

      setScheduledAt("")

      await refreshData()

    } catch (err) {

      setScheduleError(err.message)

    } finally {

      setScheduling(false)

    }

  }

  const handleCompleteInterview = async (e) => {

    e.preventDefault()

    setCompleteError("")

    setCompleteSuccess("")

    if (!completeSessionId) {

      setCompleteError("Please select an interview.")

      return

    }

    if (!completeOutcome) {

      setCompleteError(

        "Please select an interview result."

      )

      return

    }

    try {

      setCompleting(true)

      const token = localStorage.getItem(

        "access_token"

      )

      await completeSession(

        token,

        completeSessionId,

        completeOutcome,

        completeNotes

      )

      setCompleteSuccess(

        "Interview completed successfully."

      )

      setCompleteSessionId(null)

      setCompleteOutcome("")

      setCompleteNotes("")

      await refreshData()

    } catch (err) {

      setCompleteError(err.message)

    } finally {

      setCompleting(false)

    }

  }

  const remedialCandidates = candidates.filter(

    (candidate) =>

      candidate.status === "REMEDIAL_REQUIRED"

  )

  const pendingInterviews = sessions.filter(

    (session) =>

      session.status === "SCHEDULED"

  )

  const completedInterviews = sessions.filter(

    (session) =>

      session.status === "COMPLETED"

  )

  const candidatesAvailableForInterview =

    candidates.filter(

      (candidate) =>

        candidate.status === "CREATED" ||

        candidate.status === "SESSION_1_COMPLETED"

    )

  return (

    <div className="dashboard">

      <aside className="sidebar">

        <div className="logo">

          Candidate

          <span>Onboarding System</span>

        </div>

        <nav>

          <button

            className={`nav-item ${

              page === "dashboard" ? "active" : ""

            }`}

            onClick={() => navigate("dashboard")}

          >

            Dashboard

          </button>

          <button

            className={`nav-item ${

              page === "candidates" ? "active" : ""

            }`}

            onClick={() => navigate("candidates")}

          >

            My Candidates

          </button>

          <button

            className={`nav-item ${

              page === "interviews" ? "active" : ""

            }`}

            onClick={() => navigate("interviews")}

          >

            Interviews

          </button>

          <button

            className={`nav-item ${

              page === "remedial" ? "active" : ""

            }`}

            onClick={() => navigate("remedial")}

          >

            Remedial

          </button>

        </nav>

        <button

          className="logout-btn"

          onClick={onLogout}

        >

          Logout

        </button>

      </aside>

      <main className="main-content">

        <div className="topbar">

          <div>

            <h1>

              {page === "dashboard" &&

                "Management Dashboard"}

              {page === "candidates" &&

                "My Candidates"}

              {page === "interviews" &&

                "Interviews"}

              {page === "remedial" &&

                "Remedial"}

            </h1>

            <p>

              {page === "dashboard" &&

                "Manage assigned candidates and interviews"}

              {page === "candidates" &&

                "View your assigned candidates"}

              {page === "interviews" &&

                "Manage your candidate interviews"}

              {page === "remedial" &&

                "Manage remedial candidates"}

            </p>

          </div>

          <div className="admin-profile">

            <div className="avatar">M</div>

            <div>

              <strong>Management</strong>

              <span>Management User</span>

            </div>

          </div>

        </div>

        {error && (

          <section className="content-card">

            <div className="empty-state">

              <h3>Failed to load data</h3>

              <p>{error}</p>

            </div>

          </section>

        )}

        {loading && (

          <section className="content-card">

            <div className="empty-state">

              <h3>Loading...</h3>

            </div>

          </section>

        )}

        {!loading &&

          !error &&

          page === "dashboard" && (

            <>

              <section className="stats">

                <div className="stat-card">

                  <span>Assigned Candidates</span>

                  <strong>

                    {candidates.length}

                  </strong>

                </div>

                <div className="stat-card">

                  <span>Pending Interviews</span>

                  <strong>

                    {pendingInterviews.length}

                  </strong>

                </div>

                <div className="stat-card">

                  <span>Completed Interviews</span>

                  <strong>

                    {completedInterviews.length}

                  </strong>

                </div>

                <div className="stat-card">

                  <span>Remedial Required</span>

                  <strong>

                    {remedialCandidates.length}

                  </strong>

                </div>

              </section>

              <section className="content-card">

                <div className="section-header">

                  <div>

                    <h2>Assigned Candidates</h2>

                    <p>

                      View and manage your assigned candidates.

                    </p>

                  </div>

                </div>

                {candidates.length === 0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">👥</div>

                    <h3>No candidates assigned</h3>

                    <p>

                      Assigned candidate records will appear here.

                    </p>

                  </div>

                ) : (

                  <div className="candidate-table-wrapper">

                    <table className="candidate-table">

                      <thead>

                        <tr>

                          <th>ID</th>

                          <th>Name</th>

                          <th>Email</th>

                          <th>Status</th>

                        </tr>

                      </thead>

                      <tbody>

                        {candidates

                          .slice(0, 5)

                          .map((candidate) => (

                            <tr key={candidate.id}>

                              <td>{candidate.id}</td>

                              <td>{candidate.name}</td>

                              <td>{candidate.email}</td>

                              <td>

                                <span className="status-badge">

                                  {candidate.status}

                                </span>

                              </td>

                            </tr>

                          ))}

                      </tbody>

                    </table>

                  </div>

                )}

              </section>

            </>

          )}

        {!loading &&

          !error &&

          page === "candidates" && (

            <section className="content-card">

              <div className="section-header">

                <div>

                  <h2>My Candidates</h2>

                  <p>

                    Candidates assigned to you.

                  </p>

                </div>

              </div>

              {candidates.length === 0 ? (

                <div className="empty-state">

                  <div className="empty-icon">👥</div>

                  <h3>No candidates assigned</h3>

                  <p>

                    There are currently no assigned candidates.

                  </p>

                </div>

              ) : (

                <div className="candidate-table-wrapper">

                  <table className="candidate-table">

                    <thead>

                      <tr>

                        <th>ID</th>

                        <th>Name</th>

                        <th>Email</th>

                        <th>Phone</th>

                        <th>Status</th>

                      </tr>

                    </thead>

                    <tbody>

                      {candidates.map((candidate) => (

                        <tr key={candidate.id}>

                          <td>{candidate.id}</td>

                          <td>{candidate.name}</td>

                          <td>{candidate.email}</td>

                          <td>{candidate.phone}</td>

                          <td>

                            <span className="status-badge">

                              {candidate.status}

                            </span>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          )}

        {!loading &&

          !error &&

          page === "interviews" && (

            <>

              <section className="content-card">

                <div className="section-header">

                  <div>

                    <h2>Schedule Interview</h2>

                    <p>

                      Schedule the first management interview for

                      an assigned candidate.

                    </p>

                  </div>

                </div>

                <form

                  className="candidate-form"

                  onSubmit={handleScheduleInterview}

                >

                  <div className="form-group">

                    <label>Candidate</label>

                    <select

                      value={selectedCandidateId}

                      onChange={(e) =>

                        setSelectedCandidateId(

                          e.target.value

                        )

                      }

                      required

                    >

                      <option value="">

                        Select Candidate

                      </option>

                      {candidatesAvailableForInterview.map(

                        (candidate) => (

                          <option

                            key={candidate.id}

                            value={candidate.id}

                          >

                            {candidate.name} - ID{" "}

                            {candidate.id}

                          </option>

                        )

                      )}

                    </select>

                  </div>

                  <div className="form-group">

                    <label>

                      Interview Date & Time

                    </label>

                    <input

                      type="datetime-local"

                      value={scheduledAt}

                      onChange={(e) =>

                        setScheduledAt(

                          e.target.value

                        )

                      }

                      required

                    />

                  </div>

                  <div className="form-group">

                    <label>Interviewer</label>

                    <select

                      value={selectedInterviewerId}

                      onChange={(e) => setSelectedInterviewerId(e.target.value)}

                      required

                      disabled={interviewers.length === 0}

                    >

                      <option value="">Select Interviewer</option>

                      {interviewers.map((interviewer) => (

                        <option key={interviewer.id} value={interviewer.id}>

                          {interviewer.name} ({interviewer.email})

                        </option>

                      ))}

                    </select>

                    {interviewers.length === 0 && (

                      <small>No active Management interviewers available.</small>

                    )}

                  </div>

                  {scheduleError && (

                    <p className="error-message">

                      {scheduleError}

                    </p>

                  )}

                  {scheduleSuccess && (

                    <p className="success-message">

                      {scheduleSuccess}

                    </p>

                  )}

                  <button

                    className="primary-btn"

                    type="submit"

                    disabled={scheduling}

                  >

                    {scheduling

                      ? "Scheduling..."

                      : "Schedule Interview"}

                  </button>

                </form>

              </section>

              <section className="content-card">

                <div className="section-header">

                  <div>

                    <h2>Scheduled Interviews</h2>

                    <p>

                      Your candidate interview sessions.

                    </p>

                  </div>

                </div>

                {sessions.length === 0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">

                      📅

                    </div>

                    <h3>No interviews found</h3>

                    <p>

                      Your interview sessions will appear here.

                    </p>

                  </div>

                ) : (

                  <div className="candidate-table-wrapper">

                    <table className="candidate-table">

                      <thead>

                        <tr>

                          <th>ID</th>

                          <th>Candidate ID</th>

                          <th>Session Type</th>

                          <th>Interviewer</th>

                          <th>Scheduled At</th>

                          <th>Status</th>

                          <th>Action</th>

                        </tr>

                      </thead>

                      <tbody>

                        {sessions.map((session) => (

                          <tr key={session.id}>

                            <td>{session.id}</td>

                            <td>

                              {session.candidate_id}

                            </td>

                            <td>

                              {session.session_type}

                            </td>

                            <td>

                              {session.interviewer_id}

                            </td>

                            <td>

                              {session.scheduled_at

                                ? new Date(

                                    session.scheduled_at

                                  ).toLocaleString()

                                : "-"}

                            </td>

                            <td>

                              <span className="status-badge">

                                {session.status}

                              </span>

                            </td>

                            <td>

                              {session.status ===

                                "CANDIDATE_CONFIRMED" && (

                                <button

                                  className="view-btn"

                                  onClick={() => {

                                    setCompleteSessionId(

                                      session.id

                                    )

                                    setCompleteOutcome("")

                                    setCompleteNotes("")

                                    setCompleteError("")

                                    setCompleteSuccess("")

                                  }}

                                >

                                  Complete

                                </button>

                              )}

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

              </section>

              {completeSessionId && (

                <section className="content-card">

                  <div className="section-header">

                    <div>

                      <h2>Complete Interview</h2>

                      <p>

                        Enter the interview result and notes.

                      </p>

                    </div>

                    <button

                      className="secondary-btn"

                      onClick={() =>

                        setCompleteSessionId(null)

                      }

                    >

                      Cancel

                    </button>

                  </div>

                  <form

                    className="candidate-form"

                    onSubmit={handleCompleteInterview}

                  >

                    <div className="form-group">

                      <label>Interview Result</label>

                      <select

                        value={completeOutcome}

                        onChange={(e) =>

                          setCompleteOutcome(

                            e.target.value

                          )

                        }

                        required

                      >

                        <option value="">

                          Select Result

                        </option>

                        <option value="PASS">

                          Pass

                        </option>

                        <option value="REMEDIAL">

                          Remedial

                        </option>

                        <option value="REJECT">

                          Reject

                        </option>

                      </select>

                    </div>

                    <div className="form-group">

                      <label>Interview Notes</label>

                      <textarea

                        placeholder="Enter interview notes..."

                        value={completeNotes}

                        onChange={(e) =>

                          setCompleteNotes(

                            e.target.value

                          )

                        }

                        rows="5"

                      />

                    </div>

                    {completeError && (

                      <p className="error-message">

                        {completeError}

                      </p>

                    )}

                    {completeSuccess && (

                      <p className="success-message">

                        {completeSuccess}

                      </p>

                    )}

                    <button

                      className="primary-btn"

                      type="submit"

                      disabled={completing}

                    >

                      {completing

                        ? "Submitting..."

                        : "Submit Interview Result"}

                    </button>

                  </form>

                </section>

              )}

            </>

          )}

        {!loading &&

          !error &&

          page === "remedial" && (

            <section className="content-card">

              <div className="section-header">

                <div>

                  <h2>Remedial Candidates</h2>

                  <p>

                    Candidates requiring remedial sessions.

                  </p>

                </div>

              </div>

              {remedialCandidates.length === 0 ? (

                <div className="empty-state">

                  <div className="empty-icon">🔄</div>

                  <h3>No remedial candidates</h3>

                  <p>

                    No candidates currently require remedial.

                  </p>

                </div>

              ) : (

                <div className="candidate-table-wrapper">

                  <table className="candidate-table">

                    <thead>

                      <tr>

                        <th>ID</th>

                        <th>Name</th>

                        <th>Email</th>

                        <th>Phone</th>

                        <th>Status</th>

                      </tr>

                    </thead>

                    <tbody>

                      {remedialCandidates.map(

                        (candidate) => (

                          <tr key={candidate.id}>

                            <td>{candidate.id}</td>

                            <td>{candidate.name}</td>

                            <td>{candidate.email}</td>

                            <td>{candidate.phone}</td>

                            <td>

                              <span className="status-badge">

                                {candidate.status}

                              </span>

                            </td>

                          </tr>

                        )

                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          )}

      </main>

    </div>

  )

}





/* =========================================================

   CANDIDATE PORTAL

========================================================= */

function CandidatePortal({ token }) {

  const [candidate, setCandidate] = useState(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const [uploadingId, setUploadingId] = useState(null)

  const [submitting, setSubmitting] = useState(false)

  const [confirmingSession, setConfirmingSession] = useState(false)

  const [applicationSubmitted, setApplicationSubmitted] = useState(false)

  const loadCandidate = async () => {

    try {

      setLoading(true)

      setError("")

      const data = await getCandidatePortal(token)

      setCandidate(data)

      setApplicationSubmitted(Boolean(data.application_submitted))

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {

    loadCandidate()

  }, [token])

  const handleFileSelect = async (documentId, file) => {

    if (!file || applicationSubmitted) return

    try {

      setUploadingId(documentId)

      setError("")

      await uploadCandidateDocument(token, documentId, file)

      await loadCandidate()

    } catch (err) {

      setError(err.message)

    } finally {

      setUploadingId(null)

    }

  }

  const handleSubmitApplication = async () => {

    if (!candidate || applicationSubmitted) return

    const requiredDocuments = candidate.documents.filter((document) => document.is_required)

    const missingDocuments = requiredDocuments.filter((document) => !document.file_name)

    if (missingDocuments.length > 0) {

      setError("Please upload all required documents before submitting the application.")

      return

    }

    try {

      setSubmitting(true)

      setError("")

      await submitCandidateApplication(token)

      await loadCandidate()

    } catch (err) {

      setError(err.message)

    } finally {

      setSubmitting(false)

    }

  }

  const handleConfirmSession = async () => {

    if (!candidate) return

    try {

      setConfirmingSession(true)

      setError("")

      await confirmCandidateSession(token)

      await loadCandidate()

    } catch (err) {

      setError(err.message)

    } finally {

      setConfirmingSession(false)

    }

  }

  if (loading) {

    return (

      <div className="candidate-page">

        <div className="candidate-loading-card">

          <div className="candidate-loading-icon">⏳</div>

          <h2>Loading your application...</h2>

          <p>Please wait while we load your application details.</p>

        </div>

      </div>

    )

  }

  if (error && !candidate) {

    return (

      <div className="candidate-page">

        <div className="candidate-error-card">

          <div className="candidate-error-icon">!</div>

          <h2>Unable to Load Application</h2>

          <p>{error}</p>

        </div>

      </div>

    )

  }

  const requiredDocuments = candidate.documents.filter((document) => document.is_required)

  const completedRequiredDocuments = requiredDocuments.filter((document) => document.file_name)

  const allRequiredUploaded = requiredDocuments.length > 0 && completedRequiredDocuments.length === requiredDocuments.length

  const sessions = candidate.sessions || []

  return (

    <div className="candidate-page">

      <div className="candidate-container">

        <div className="candidate-header">

          <div>

            <div className="candidate-logo">

              Candidate

              <span>Onboarding System</span>

            </div>

            <h1>Candidate Application</h1>

            <p>Complete your application and follow your interview schedule.</p>

          </div>

          <div className="candidate-profile">

            <div className="candidate-avatar">{candidate.name?.charAt(0).toUpperCase()}</div>

            <div>

              <strong>{candidate.name}</strong>

              <span>Candidate</span>

            </div>

          </div>

        </div>

        {error && <div className="candidate-error-message">{error}</div>}

        {applicationSubmitted && (

          <section className="candidate-card">

            <div className="candidate-card-header">

              <div>

                <h2>Application Submitted</h2>

                <p>Your required documents have been submitted successfully. The assigned manager has been notified.</p>

              </div>

              <span className="candidate-status">Submitted</span>

            </div>

          </section>

        )}

        <section className="candidate-card">

          <div className="candidate-card-header">

            <div>

              <h2>Application Details</h2>

              <p>Your candidate application information.</p>

            </div>

            <span className="candidate-status">{candidate.status}</span>

          </div>

          <div className="candidate-details-grid">

            <div><span>Candidate ID</span><strong>{candidate.id}</strong></div>

            <div><span>Name</span><strong>{candidate.name}</strong></div>

            <div><span>Email</span><strong>{candidate.email}</strong></div>

            <div><span>Phone</span><strong>{candidate.phone}</strong></div>

            <div><span>Position ID</span><strong>{candidate.position_id}</strong></div>

            <div><span>Application Status</span><strong>{candidate.status}</strong></div>

          </div>

        </section>

        {sessions.length > 0 && (

          <section className="candidate-card">

            <div className="candidate-card-header">

              <div>

                <h2>Interview Sessions</h2>

                <p>Check your scheduled sessions and confirm completion after attending.</p>

              </div>

            </div>

            <div className="document-list">

              {sessions.map((session) => {

                const sessionDate = session.scheduled_at ? new Date(session.scheduled_at).toLocaleDateString() : "-"

                const sessionTime = session.scheduled_at ? new Date(session.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"

                return (

                  <div className="document-item" key={session.id}>

                    <div className="document-info">

                      <div className="document-title-row">

                        <h3>Session {session.session_number}</h3>

                        <span className="required-label">{session.status}</span>

                      </div>

                      <p><strong>Type:</strong> {session.session_type}</p>

                      <p><strong>Date:</strong> {sessionDate}</p>

                      <p><strong>Time:</strong> {sessionTime}</p>

                    </div>

                    <div className="document-action">

                      {session.status === "SCHEDULED" && (

                        <button type="button" className="final-submit-btn" disabled={confirmingSession} onClick={handleConfirmSession}>

                          {confirmingSession ? "Confirming..." : `Yes, I have completed Session ${session.session_number}`}

                        </button>

                      )}

                      {session.status === "CANDIDATE_CONFIRMED" && (

                        <span className="uploading-text">Completion confirmed. Waiting for interviewer confirmation.</span>

                      )}

                      {session.status === "COMPLETED" && (

                        <span className="uploaded-file">✓ Session completed</span>

                      )}

                    </div>

                  </div>

                )

              })}

            </div>

          </section>

        )}

        <section className="candidate-card">

          <div className="candidate-card-header">

            <div>

              <h2>Document Checklist</h2>

              <p>Upload all required documents to complete your application.</p>

            </div>

            <div className="document-progress">

              {completedRequiredDocuments.length}/{requiredDocuments.length}

              <span>Required Documents</span>

            </div>

          </div>

          <div className="document-list">

            {candidate.documents.map((document) => {

              const isUploading = uploadingId === document.id

              return (

                <div className="document-item" key={document.id}>

                  <div className="document-info">

                    <div className="document-title-row">

                      <h3>{document.document_name}</h3>

                      {document.is_required ? <span className="required-label">Required</span> : <span className="optional-label">Optional</span>}

                    </div>

                    {document.file_name ? <p className="uploaded-file">✓ {document.file_name}</p> : <p className="pending-file">Document not uploaded</p>}

                  </div>

                  <div className="document-action">

                    <label className="file-input-label">

                      {isUploading ? "Uploading..." : document.file_name ? "Choose Another File" : "Choose File"}

                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={applicationSubmitted || isUploading} onChange={(e) => handleFileSelect(document.id, e.target.files[0])} />

                    </label>

                    {isUploading && <span className="uploading-text">Uploading document...</span>}

                  </div>

                </div>

              )

            })}

          </div>

          {!applicationSubmitted && (

            <div className="final-submit-section">

              {!allRequiredUploaded && <p className="submit-hint">Please upload all required documents before submitting your application.</p>}

              {allRequiredUploaded && <p className="submit-ready">All required documents are ready to submit.</p>}

              <button type="button" className="final-submit-btn" disabled={!allRequiredUploaded || submitting} onClick={handleSubmitApplication}>

                {submitting ? "Submitting Application..." : "Submit Application"}

              </button>

            </div>

          )}

        </section>

      </div>

    </div>

  )

}



/* =========================================================

   MAIN APP

========================================================= */

/* =========================================================
   HR DASHBOARD
========================================================= */
function HRDashboard({ onLogout }) {
  const [page, setPage] = useState("dashboard")
  const [candidates, setCandidates] = useState([])
  const [sessions, setSessions] = useState([])
  const [positions, setPositions] = useState([])
  const [positionDocuments, setPositionDocuments] = useState({})
  const [selectedDocumentCandidate, setSelectedDocumentCandidate] = useState(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [positionError, setPositionError] = useState("")
  const [positionMessage, setPositionMessage] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [positionTitle, setPositionTitle] = useState("")
  const [positionDescription, setPositionDescription] = useState("")
  const [requirements, setRequirements] = useState([{ document_name: "", is_required: true }])
  const [savingPosition, setSavingPosition] = useState(false)
  const token = () => localStorage.getItem("access_token")

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), Authorization: `Bearer ${token()}`, ...(options.headers || {}) },
    })
    const data = response.status === 204 ? null : await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(typeof data?.detail === "string" ? data.detail : `Request failed (${response.status})`)
    return data
  }

  const loadPositions = async () => {
    const data = await apiRequest("/positions/")
    const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
    setPositions(rows)
    const docs = await Promise.all(rows.map(async (position) => {
      try { return [position.id, await apiRequest(`/positions/${position.id}/documents`)] }
      catch { return [position.id, []] }
    }))
    setPositionDocuments(Object.fromEntries(docs.map(([id, list]) => [id, Array.isArray(list) ? list : []])))
  }

  const loadHRData = async () => {
    setLoading(true); setError("")
    try {
      const [candidateData, sessionData] = await Promise.all([getCandidates(token()), getSessions(token())])
      setCandidates(Array.isArray(candidateData) ? candidateData : Array.isArray(candidateData?.items) ? candidateData.items : [])
      setSessions(Array.isArray(sessionData) ? sessionData : Array.isArray(sessionData?.items) ? sessionData.items : [])
      await loadPositions()
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load HR data") }
    finally { setLoading(false) }
  }
  useEffect(() => { loadHRData() }, [])

  const openCandidateDocuments = async (candidate) => {
    setSelectedDocumentCandidate({ ...candidate, documents: [] })
    setDocumentsLoading(true)
    setDocumentsError("")
    try {
      const result = await apiRequest(`/hr/candidates/${candidate.id}/documents`)
      setSelectedDocumentCandidate({
        ...candidate,
        documents: Array.isArray(result?.documents) ? result.documents : [],
      })
    } catch (err) {
      setDocumentsError(err instanceof Error ? err.message : "Could not load candidate documents")
    } finally {
      setDocumentsLoading(false)
    }
  }

  const openHRDocument = async (candidateId, document) => {
    const previewWindow = window.open("", "_blank")
    if (!previewWindow) {
      setDocumentsError("Please allow pop-ups to view this document.")
      return
    }
    try {
      setDocumentsError("")
      const response = await fetch(`${API_BASE_URL}/hr/candidates/${candidateId}/documents/${document.id}/download`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(typeof data?.detail === "string" ? data.detail : `Document request failed (${response.status})`)
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      previewWindow.location.href = objectUrl
      previewWindow.document.title = document.file_name || document.document_name || "Candidate document"
    } catch (err) {
      previewWindow.close()
      setDocumentsError(err instanceof Error ? err.message : "Could not open candidate document")
    }
  }

  const addRequirement = () => setRequirements((current) => [...current, { document_name: "", is_required: true }])
  const updateRequirement = (index, key, value) => setRequirements((current) => current.map((item, i) => i === index ? { ...item, [key]: value } : item))
  const removeRequirement = (index) => setRequirements((current) => current.length === 1 ? [{ document_name: "", is_required: true }] : current.filter((_, i) => i !== index))

  const createPosition = async (e) => {
    e.preventDefault(); setSavingPosition(true); setPositionError(""); setPositionMessage("")
    const docs = requirements.map((item) => ({ document_name: item.document_name.trim(), is_required: item.is_required })).filter((item) => item.document_name)
    const names = docs.map((item) => item.document_name.toLowerCase())
    if (new Set(names).size !== names.length) { setPositionError("Document names must be unique within a position."); setSavingPosition(false); return }
    try {
      const position = await apiRequest("/positions/", { method: "POST", body: JSON.stringify({ title: positionTitle.trim(), description: positionDescription.trim() || null }) })
      for (const document of docs) await apiRequest(`/positions/${position.id}/documents`, { method: "POST", body: JSON.stringify(document) })
      setPositionMessage("Job position and document requirements created successfully.")
      setPositionTitle(""); setPositionDescription(""); setRequirements([{ document_name: "", is_required: true }])
      await loadPositions(); setPage("positions")
    } catch (err) {
      setPositionError(`${err instanceof Error ? err.message : "Failed to create position"} If the position was created before this error, review it and add any missing document requirements.`)
    } finally { setSavingPosition(false) }
  }

  const deleteRequirement = async (positionId, documentId) => {
    if (!window.confirm("Remove this document requirement? Existing candidate checklists may not be changed.")) return
    try { await apiRequest(`/positions/${positionId}/documents/${documentId}`, { method: "DELETE" }); await loadPositions() }
    catch (err) { setPositionError(err instanceof Error ? err.message : "Could not remove requirement") }
  }
  const deletePosition = async (positionId) => {
    if (!window.confirm("Delete this job position? This may fail if candidates are linked to it.")) return
    try { await apiRequest(`/positions/${positionId}`, { method: "DELETE" }); await loadPositions() }
    catch (err) { setPositionError(err instanceof Error ? err.message : "Could not delete position") }
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const term = search.trim().toLowerCase()
    const matches = !term || [candidate.id, candidate.name, candidate.email, candidate.phone].some((value) => String(value ?? "").toLowerCase().includes(term))
    return matches && (statusFilter === "ALL" || candidate.status === statusFilter)
  })
  const onboarded = candidates.filter((c) => c.status === "ONBOARDED").length
  const underReview = candidates.filter((c) => c.status === "UNDER_REVIEW").length
  const activeCandidates = candidates.filter((c) => !["REJECTED", "ONBOARDED"].includes(c.status)).length
  const nav = [["dashboard", "Dashboard"], ["candidates", "Candidates"], ["add-candidate", "Add Candidate"], ["interviews", "Interviews"], ["positions", "Job Positions"], ["add-position", "Add Job Position"]]
  const heading = Object.fromEntries(nav)[page] || "HR Dashboard"

  return <div className="dashboard">
    <aside className="sidebar"><div className="logo">Candidate<span>Onboarding System</span></div><nav>{nav.map(([key, label]) => <button key={key} className={`nav-item ${page === key ? "active" : ""}`} onClick={() => { setPage(key); setPositionError(""); setPositionMessage("") }}>{label}</button>)}</nav><button className="logout-btn" onClick={onLogout}>Logout</button></aside>
    <main className="main-content"><div className="topbar"><div><h1>{heading}</h1><p>Recruitment and candidate onboarding overview</p></div><button className="secondary-btn" onClick={loadHRData} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button></div>
      {error && <section className="content-card"><p className="error-message">{error}</p></section>}
      {positionError && <section className="content-card"><p className="error-message">{positionError}</p></section>}
      {loading && <section className="content-card"><div className="empty-state"><h3>Loading HR dashboard...</h3></div></section>}
      {!loading && !error && page === "dashboard" && <><section className="stats"><div className="stat-card"><span>Total Candidates</span><strong>{candidates.length}</strong></div><div className="stat-card"><span>Active Candidates</span><strong>{activeCandidates}</strong></div><div className="stat-card"><span>Under Review</span><strong>{underReview}</strong></div><div className="stat-card"><span>Onboarded</span><strong>{onboarded}</strong></div></section><section className="content-card"><div className="section-header"><div><h2>Recruitment Overview</h2><p>Manage candidate applications, interviews and job-position requirements from the sidebar.</p></div><button className="secondary-btn" onClick={() => setPage("positions")}>Manage Positions</button></div><p className="subtitle">Use Candidates to review applications and Job Positions to configure document checklists.</p></section><section className="content-card"><div className="section-header"><div><h2>Recent Candidates</h2><p>Latest candidate records in the system.</p></div><button className="view-btn" onClick={() => setPage("candidates")}>View All</button></div>{candidates.length === 0 ? <div className="empty-state"><h3>No candidates found</h3></div> : <div className="candidate-table-wrapper"><table className="candidate-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th></tr></thead><tbody>{candidates.slice(0, 5).map((c) => <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{c.email}</td><td><span className="status-badge">{c.status}</span></td></tr>)}</tbody></table></div>}<p className="subtitle">Scheduled and completed interviews: {sessions.length}</p></section></>}
      {!loading && !error && page === "add-candidate" && <AddCandidateForm positions={positions.map((p) => ({ ...p, documents: positionDocuments[p.id] || [] }))} onClose={() => setPage("dashboard")} onCreated={async () => { await loadHRData(); setPage("candidates") }} />}
      {!loading && !error && page === "candidates" && <section className="content-card"><div className="section-header"><div><h2>All Candidates</h2><p>Search and track candidate application status.</p></div><button className="primary-btn" onClick={() => setPage("add-candidate")}>+ Add Candidate</button></div><div className="candidate-filters"><input type="text" placeholder="Search by name, email, phone or ID" value={search} onChange={(e) => setSearch(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All Status</option>{["CREATED", "SESSION_1_SCHEDULED", "SESSION_1_COMPLETED", "CANDIDATE_CONFIRMED", "UNDER_REVIEW", "APPROVED", "REMEDIAL_REQUIRED", "REMEDIAL_COMPLETED", "FINAL_INTERVIEW", "SELECTED", "REJECTED", "ONBOARDED"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></div>{filteredCandidates.length === 0 ? <div className="empty-state"><h3>No candidates found</h3><p>Try another search or status.</p></div> : <div className="candidate-table-wrapper"><table className="candidate-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Position</th><th>Status</th><th>Documents</th></tr></thead><tbody>{filteredCandidates.map((c) => <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{c.email}</td><td>{c.phone || "-"}</td><td>{positions.find((p) => Number(p.id) === Number(c.position_id))?.title || positions.find((p) => Number(p.id) === Number(c.position_id))?.name || c.position_id || "-"}</td><td><span className="status-badge">{c.status}</span></td><td><button className="view-btn" onClick={() => openCandidateDocuments(c)}>View Documents</button></td></tr>)}</tbody></table></div>}</section>}
      {selectedDocumentCandidate && <div className="details-overlay" onClick={() => setSelectedDocumentCandidate(null)}><section className="details-card" onClick={(e) => e.stopPropagation()}><div className="details-header"><div><h2>Candidate Documents</h2><p>{selectedDocumentCandidate.name} · {selectedDocumentCandidate.email}</p></div><button className="close-btn" onClick={() => setSelectedDocumentCandidate(null)}>×</button></div>{documentsLoading ? <div className="empty-state"><h3>Loading document details...</h3></div> : documentsError ? <div className="empty-state"><h3>Unable to load documents</h3><p>{documentsError}</p><button className="secondary-btn" onClick={() => openCandidateDocuments(selectedDocumentCandidate)}>Retry</button></div> : Array.isArray(selectedDocumentCandidate.documents) && selectedDocumentCandidate.documents.length ? <div className="candidate-table-wrapper"><table className="candidate-table"><thead><tr><th>Document</th><th>Requirement</th><th>Status</th><th>File</th><th>Action</th></tr></thead><tbody>{selectedDocumentCandidate.documents.map((doc) => <tr key={doc.id}><td>{doc.document_name}</td><td>{doc.is_required ? "Required" : "Optional"}</td><td>{doc.status || (doc.file_name ? "UPLOADED" : "PENDING")}</td><td>{doc.file_name || "Not uploaded"}</td><td>{doc.file_name && doc.status === "UPLOADED" ? <button className="view-btn" onClick={() => openHRDocument(selectedDocumentCandidate.id, doc)}>View / Download</button> : <span className="subtitle">No file available</span>}</td></tr>)}</tbody></table></div> : <div className="empty-state"><h3>No document records found</h3><p>This candidate has no document checklist records yet.</p></div>}</section></div>}
      {!loading && !error && page === "interviews" && <section className="content-card"><div className="section-header"><div><h2>Interviews</h2><p>Scheduled and completed interview sessions.</p></div></div>{sessions.length === 0 ? <div className="empty-state"><h3>No interviews found</h3></div> : <div className="candidate-table-wrapper"><table className="candidate-table"><thead><tr><th>ID</th><th>Candidate ID</th><th>Session</th><th>Interviewer</th><th>Scheduled At</th><th>Status</th></tr></thead><tbody>{sessions.map((s) => <tr key={s.id}><td>{s.id}</td><td>{s.candidate_id}</td><td>{s.session_type}</td><td>{s.interviewer_id ?? "-"}</td><td>{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : "-"}</td><td><span className="status-badge">{s.status}</span></td></tr>)}</tbody></table></div>}</section>}
      {!loading && !error && page === "positions" && <section className="content-card"><div className="section-header"><div><h2>Job Positions</h2><p>Roles and their candidate document requirements.</p></div><button className="primary-btn" onClick={() => setPage("add-position")}>+ Add Job Position</button></div>{positions.length === 0 ? <div className="empty-state"><h3>No positions found</h3><p>Add a job position to get started.</p></div> : positions.map((p) => <div className="content-card" key={p.id}><div className="section-header"><div><h3>{p.title || p.name || "Untitled position"} <span className="subtitle">(ID: {p.id})</span></h3><p>{p.description || "No description"}</p><p className="subtitle">{p.is_active === false ? "Inactive" : "Active"}</p></div><button className="secondary-btn" onClick={() => deletePosition(p.id)}>Delete Position</button></div><h4>Document Requirements</h4>{(positionDocuments[p.id] || []).length ? <div className="candidate-table-wrapper"><table className="candidate-table"><thead><tr><th>Document</th><th>Requirement</th><th>Action</th></tr></thead><tbody>{positionDocuments[p.id].map((d) => <tr key={d.id}><td>{d.document_name}</td><td>{d.is_required ? "Required" : "Optional"}</td><td><button className="view-btn" onClick={() => deleteRequirement(p.id, d.id)}>Remove</button></td></tr>)}</tbody></table></div> : <p className="subtitle">No requirements configured.</p>}</div>)}</section>}
      {!loading && !error && page === "add-position" && <section className="content-card"><div className="section-header"><div><h2>Add Job Position</h2><p>Configure the documents candidates must or may provide.</p></div><button className="secondary-btn" onClick={() => setPage("positions")}>Cancel</button></div>{positionMessage && <p className="success-message">{positionMessage}</p>}<form className="candidate-form" onSubmit={createPosition}><div className="form-group"><label>Job Position Title</label><input type="text" placeholder="e.g. AI/ML Intern" value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} required /></div><div className="form-group"><label>Description</label><textarea rows="4" placeholder="Enter job description and requirements" value={positionDescription} onChange={(e) => setPositionDescription(e.target.value)} /></div><div className="section-header"><div><h3>Document Requirements</h3><p>Add each document and select whether it is required or optional.</p></div><button type="button" className="secondary-btn" onClick={addRequirement}>+ Add Document</button></div>{requirements.map((item, index) => <div className="candidate-actions" key={index} style={{ alignItems: "end", marginBottom: 12 }}><div className="form-group" style={{ flex: 2 }}><label>Document Name</label><input value={item.document_name} onChange={(e) => updateRequirement(index, "document_name", e.target.value)} placeholder="e.g. Resume / Aadhaar Card" /></div><div className="form-group" style={{ flex: 1 }}><label>Requirement</label><select value={item.is_required ? "required" : "optional"} onChange={(e) => updateRequirement(index, "is_required", e.target.value === "required")}><option value="required">Required</option><option value="optional">Optional</option></select></div><button type="button" className="view-btn" onClick={() => removeRequirement(index)}>Remove</button></div>)}<button className="primary-btn" type="submit" disabled={savingPosition}>{savingPosition ? "Creating..." : "Create Position"}</button></form></section>}
    </main>
  </div>
}

function App() {

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)

  const [userRole, setUserRole] = useState("")

  const candidatePath =

    window.location.pathname.match(

      /^\/candidate\/([^/]+)$/

    )

  const candidateToken = candidatePath?.[1]

  useEffect(() => {

    const savedRole =

      localStorage.getItem("user_role")

    if (savedRole) {

      setUserRole(savedRole)

    }

  }, [])

  const handleLogin = async (e) => {

    e.preventDefault()

    setError("")

    setLoading(true)

    try {

      const loginData = await loginUser(

        email,

        password

      )

      localStorage.setItem(

        "access_token",

        loginData.access_token

      )

      const userData = await getCurrentUser(

        loginData.access_token

      )

      const role = String(

        userData.role || ""

      ).toUpperCase()

      localStorage.setItem(

        "user_role",

        role

      )

      setUserRole(role)

    } catch (err) {

      localStorage.removeItem(

        "access_token"

      )

      localStorage.removeItem(

        "user_role"

      )

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  const handleLogout = () => {

    localStorage.removeItem(

      "access_token"

    )

    localStorage.removeItem(

      "user_role"

    )

    setUserRole("")

    setEmail("")

    setPassword("")

  }

  if (candidateToken) {

    return (

      <CandidatePortal

        token={candidateToken}

      />

    )

  }

  if (userRole === "ADMIN") {

    return (

      <AdminDashboard

        onLogout={handleLogout}

      />

    )

  }

  if (userRole === "HR") {
    return <HRDashboard onLogout={handleLogout} />
  }

  if (userRole === "MANAGEMENT") {

    return (

      <ManagementDashboard

        onLogout={handleLogout}

      />

    )

  }

  return (

    <div className="login-page">

      <div className="login-card">

        <h1>Candidate Onboarding</h1>

        <p className="subtitle">

          Management System

        </p>

        <form onSubmit={handleLogin}>

          <label>Email</label>

          <input

            type="email"

            placeholder="Enter your email"

            value={email}

            onChange={(e) =>

              setEmail(e.target.value)

            }

            required

          />

          <label>Password</label>

          <input

            type="password"

            placeholder="Enter your password"

            value={password}

            onChange={(e) =>

              setPassword(e.target.value)

            }

            required

          />

          {error && (

            <p className="error-message">

              {error}

            </p>

          )}

          <button

            type="submit"

            disabled={loading}

          >

            {loading

              ? "Logging in..."

              : "Login"}

          </button>

        </form>

      </div>

    </div>

  )

}

export default App
