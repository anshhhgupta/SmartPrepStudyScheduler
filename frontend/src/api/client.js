/**
 * Thin axios wrapper for the SmartPrepScheduler Flask API.
 * Base URL is read from VITE_API_URL env var, defaulting to localhost:5000.
 */
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Subjects ──────────────────────────────────────────────────────────────────
export const fetchSubjects       = ()        => api.get('/subjects').then(r => r.data);
export const createSubject       = (data)    => api.post('/subjects', data).then(r => r.data);
export const updateSubject       = (id, d)   => api.put(`/subjects/${id}`, d).then(r => r.data);
export const deleteSubject       = (id)      => api.delete(`/subjects/${id}`).then(r => r.data);
export const patchProgress       = (id, hrs) => api.patch(`/subjects/${id}/progress`, { completed_hours: hrs }).then(r => r.data);

// ── Schedule ──────────────────────────────────────────────────────────────────
export const generateSchedule    = (daily_limit) => api.post('/schedule/generate', { daily_limit }).then(r => r.data);
export const fetchLatestSchedule = ()             => api.get('/schedule/latest').then(r => r.data);
export const fetchMultiday       = (daily_limit)  => api.post('/schedule/multiday', { daily_limit }).then(r => r.data);

// ── Risk ──────────────────────────────────────────────────────────────────────
export const fetchRisk           = ()        => api.get('/risk').then(r => r.data);

// ── Priority Queue ────────────────────────────────────────────────────────────
export const fetchPriorityQueue  = ()        => api.get('/priority-queue').then(r => r.data);

// ── Feedback ──────────────────────────────────────────────────────────────────
export const submitFeedback      = (actual)  => api.post('/feedback', { actual_hours: actual }).then(r => r.data);

// ── Progress Logs ─────────────────────────────────────────────────────────────
export const fetchProgress       = (sid)     => api.get('/progress', { params: sid ? { subject_id: sid } : {} }).then(r => r.data);

// ── User ──────────────────────────────────────────────────────────────────────
export const fetchUser           = ()        => api.get('/user').then(r => r.data);
export const updateUser          = (data)    => api.put('/user', data).then(r => r.data);

// ── Health ────────────────────────────────────────────────────────────────────
export const checkHealth         = ()        => api.get('/health').then(r => r.data);
