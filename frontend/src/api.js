
const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://candidate-onboarding-backend-1sow.onrender.com").replace(/\/$/, "")

export async function loginUser(email, password) {
  const formData = new URLSearchParams()
  formData.append("username", email)
  formData.append("password", password)

  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Login failed")
  return data
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to get user information")
  return data
}

export async function getCandidates(token) {
  const response = await fetch(`${API_BASE_URL}/candidates/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to fetch candidates")
  return data
}

export async function createCandidate(token, candidateData) {
  const response = await fetch(`${API_BASE_URL}/candidates/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(candidateData),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to create candidate")
  return data
}

export async function getSessions(token) {
  const response = await fetch(`${API_BASE_URL}/sessions/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to fetch sessions")
  return data
}

export async function createSession(token, sessionData) {
  const response = await fetch(`${API_BASE_URL}/sessions/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to schedule interview")
  return data
}

export async function completeSession(token, sessionId, outcome, notes) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/complete`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ outcome, notes }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to complete session")
  return data
}

export async function confirmSession(token, sessionId) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/confirm`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to confirm session")
  return data
}

export async function createRemedialSession(token, candidateId, sessionData) {
  const response = await fetch(`${API_BASE_URL}/sessions/${candidateId}/remedial`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to create remedial session")
  return data
}

export async function createFinalInterview(token, candidateId, sessionData) {
  const response = await fetch(`${API_BASE_URL}/sessions/${candidateId}/final`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to create final interview")
  return data
}

export async function finalInterviewDecision(token, sessionId, result, notes) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/final-decision`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ decision: result, notes }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to update final decision")
  return data
}

export async function getCandidatePortal(token) {
  const response = await fetch(`${API_BASE_URL}/candidate/${encodeURIComponent(token)}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) throw new Error(data.detail || "Failed to fetch candidate portal")
  return data
}

export async function uploadCandidateDocument(token, documentId, file) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(
    `${API_BASE_URL}/candidate/${encodeURIComponent(token)}/documents/${documentId}/upload`,
    {
      method: "POST",
      body: formData,
    }
  )

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to upload document")
  return data
}

export async function submitCandidateApplication(token) {
  const response = await fetch(
    `${API_BASE_URL}/candidate/${encodeURIComponent(token)}/submit`,
    { method: "POST" }
  )

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to submit application")
  return data
}

export async function confirmCandidateSession(token, sessionId) {
  if (!token || sessionId === undefined || sessionId === null || sessionId === "") {
    throw new Error("Candidate token and session ID are required")
  }

  const response = await fetch(
    `${API_BASE_URL}/candidate/${encodeURIComponent(token)}/sessions/${encodeURIComponent(sessionId)}/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  )

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || "Failed to confirm session")
  return data
}