// API client with graceful fallback to mocks
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
import { mockAnalyze } from './mock'

const TOKEN_KEY = 'aiface_access_token'
let accessToken = localStorage.getItem(TOKEN_KEY) || null

function setToken(token) {
  accessToken = token
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeader() {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

async function safeJson(res) {
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

async function tryFetch(url, opts = {}) {
  const res = await fetch(url, { credentials: 'include', ...opts })
  if (!res.ok) throw Object.assign(new Error('HTTP ' + res.status), { res, data: await safeJson(res) })
  return res
}

// Auth
export async function signup({ email, password }) {
  const res = await tryFetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  setToken(data.access_token)
  return data
}

export async function login({ email, password }) {
  const res = await tryFetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  setToken(data.access_token)
  return data
}

export async function refresh() {
  const res = await tryFetch(`${BASE_URL}/auth/refresh`, { method: 'POST' })
  const data = await res.json()
  setToken(data.access_token)
  return data
}

export async function logout() {
  try { await tryFetch(`${BASE_URL}/auth/logout`, { method: 'POST', headers: { ...authHeader() } }) } catch {}
  setToken(null)
}

async function ensureAuth() {
  if (!accessToken) return
  try {
    // probe by decoding token exp would be better; we optimistically use it and rely on 401 to refresh
    return
  } catch {}
}

async function withAuthFetch(url, opts = {}) {
  await ensureAuth()
  let res
  try {
    res = await tryFetch(url, { headers: { ...authHeader(), ...(opts.headers || {}) }, ...opts })
  } catch (e) {
    if (e?.res?.status === 401) {
      try { await refresh() } catch {}
      res = await tryFetch(url, { headers: { ...authHeader(), ...(opts.headers || {}) }, ...opts })
    } else {
      throw e
    }
  }
  return res
}

// Analyses
export async function analyzeImage({ imageDataUrl }) {
  try {
    const form = new FormData()
    form.append('file', dataUrlToFile(imageDataUrl, 'selfie.jpg'))
    const res = await withAuthFetch(`${BASE_URL}/analyses/`, { method: 'POST', body: form })
    return res.json()
  } catch (e) {
    // fallback to mock
    return mockAnalyze(imageDataUrl)
  }
}

export async function fetchHistory() {
  try {
    const res = await withAuthFetch(`${BASE_URL}/analyses/`)
    return res.json()
  } catch (e) {
    return []
  }
}

export async function fetchAnalysisById(id) {
  try {
    const res = await withAuthFetch(`${BASE_URL}/analyses/${id}`)
    return res.json()
  } catch (e) {
    return null
  }
}

// Helper: convert dataURL to File
export function dataUrlToFile(dataUrl, filename) {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], filename, { type: mime })
}
