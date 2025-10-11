// API client facade for UI-only demo
// TODO(API): Set your backend base URL in .env as VITE_API_URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

import { mockAnalyze } from './mock'

// TODO(API): Replace with real call
// Expected backend: POST `${BASE_URL}/analyses/` (multipart/form-data)
//   form fields: file: <image>, return: { id, createdAt, imageUrl, scores, summary, recommendations }
export async function analyzeImage({ imageDataUrl }) {
  // Example of how you'd implement real call:
  // const form = new FormData()
  // form.append('file', dataUrlToFile(imageDataUrl, 'selfie.jpg'))
  // const res = await fetch(`${BASE_URL}/analyses/`, { method: 'POST', body: form })
  // return res.json()
  return mockAnalyze(imageDataUrl)
}

// TODO(API): Replace with real call
// Expected backend: GET `${BASE_URL}/analyses/` -> list
export async function fetchHistory() {
  // const res = await fetch(`${BASE_URL}/analyses/`)
  // return res.json()
  return []
}

// TODO(API): Replace with real call
// Expected backend: GET `${BASE_URL}/analyses/{id}` -> item
export async function fetchAnalysisById(id) {
  // const res = await fetch(`${BASE_URL}/analyses/${id}`)
  // return res.json()
  return null
}

// Helper: convert dataURL to File (for real API)
export function dataUrlToFile(dataUrl, filename) {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], filename, { type: mime })
}
