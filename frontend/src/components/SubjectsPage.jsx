import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Star, ChevronDown, ChevronUp, Zap, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createSubject, updateSubject, deleteSubject, patchProgress } from '../api/client';
import './SubjectsPage.css';

const COLORS = ['#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444','#3b82f6','#a855f7'];

const TopicChip = ({ label, color }) => (
  <span className="topic-chip" style={{ background: `${color}18`, color, borderColor: `${color}40` }}>{label}</span>
);

const AddSubjectModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '', short_name: '', exam_deadline: 7, difficulty: 3,
    required_hours: 10, completed_hours: 0, color: COLORS[0], topics: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!form.name.trim()) return setErr('Name is required');
    setSaving(true);
    try {
      await onSave({
        ...form,
        short_name: form.short_name || form.name.slice(0, 4).toUpperCase(),
        topics: form.topics.split(',').map(t => t.trim()).filter(Boolean),
      });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal-box glass-panel"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
        <div className="modal-header">
          <h3>Add New Subject</h3>
          <button className="expand-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {err && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: 8 }}>{err}</p>}
        <div className="modal-form">
          {[
            { label: 'Subject Name', key: 'name', type: 'text' },
            { label: 'Short Name (e.g. DSA)', key: 'short_name', type: 'text' },
            { label: 'Deadline (days)', key: 'exam_deadline', type: 'number' },
            { label: 'Difficulty (1-5)', key: 'difficulty', type: 'number' },
            { label: 'Required Hours', key: 'required_hours', type: 'number' },
            { label: 'Completed Hours', key: 'completed_hours', type: 'number' },
            { label: 'Topics (comma separated)', key: 'topics', type: 'text' },
          ].map(f => (
            <div key={f.key} className="form-row">
              <label>{f.label}</label>
              <input type={f.type} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))} />
            </div>
          ))}
          <div className="form-row">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <div key={c} className={`color-dot ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setForm(p => ({ ...p, color: c }))} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="ctrl-btn" onClick={onClose}>Cancel</button>
          <button className="ctrl-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Add Subject'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SubjectDetail = ({ subject, onDelete, onProgressUpdate }) => {
  const [open, setOpen] = useState(false);
  const [editHours, setEditHours] = useState(false);
  const [newHours, setNewHours] = useState(subject.completed_hours ?? subject.completed ?? 0);
  const [saving, setSaving] = useState(false);

  const required  = subject.required_hours  ?? subject.required  ?? 0;
  const completed = subject.completed_hours ?? subject.completed ?? 0;
  const deadline  = subject.exam_deadline   ?? subject.deadline  ?? 0;
  const short     = subject.short_name      ?? subject.short     ?? subject.name?.slice(0, 4);
  const pct       = required > 0 ? Math.round((completed / required) * 100) : 100;

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      await patchProgress(subject.id, newHours);
      onProgressUpdate();
    } finally {
      setSaving(false);
      setEditHours(false);
    }
  };

  return (
    <motion.div className="subject-detail-card glass-panel" initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }} layout>
      <div className="sdc-accent" style={{ background: subject.color }} />
      <div className="sdc-top">
        <div className="sdc-left">
          <div className="sdc-badge" style={{ background: `${subject.color}22`, color: subject.color }}>{short}</div>
          <div>
            <h3 className="sdc-name">{subject.name}</h3>
            <div className="sdc-meta">
              <Clock size={13} />
              <span>Deadline in {deadline} days</span>
              <span className="dot">·</span>
              <span>{required - completed}h remaining</span>
            </div>
          </div>
        </div>
        <div className="sdc-right">
          <div className="sdc-stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13}
                fill={i < subject.difficulty ? subject.color : 'transparent'}
                color={i < subject.difficulty ? subject.color : 'rgba(255,255,255,0.15)'} />
            ))}
          </div>
          <button className="expand-btn" onClick={() => onDelete(subject.id)} title="Delete"
            style={{ color: 'var(--danger)' }}>
            <Trash2 size={14} />
          </button>
          <button className="expand-btn" onClick={() => setOpen(o => !o)}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <div className="sdc-progress">
        <div className="progress-labels">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {editHours ? (
              <>
                <input type="number" value={newHours} min={0} max={required}
                  onChange={e => setNewHours(+e.target.value)}
                  style={{ width: 60, background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '2px 6px', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ {required}h</span>
                <button className="expand-btn" onClick={handleSaveProgress} disabled={saving}><Check size={13} /></button>
                <button className="expand-btn" onClick={() => setEditHours(false)}><X size={13} /></button>
              </>
            ) : (
              <>
                <span>{completed}h done</span>
                <button className="expand-btn" onClick={() => setEditHours(true)} title="Edit progress">
                  <Edit2 size={12} />
                </button>
              </>
            )}
          </div>
          <span style={{ color: subject.color, fontWeight: 600 }}>{pct}%</span>
        </div>
        <div className="progress-bar-bg">
          <motion.div className="progress-bar-fill"
            style={{ background: `linear-gradient(90deg, ${subject.color}, ${subject.color}99)` }}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="sdc-expanded"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <div className="sdc-topics">
              <Zap size={14} color={subject.color} />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginRight: 8 }}>Topics:</span>
              {(subject.topics ?? []).map(t => <TopicChip key={t} label={t} color={subject.color} />)}
            </div>
            <div className="sdc-stats-row">
              {[
                { label: 'Total Required', val: `${required}h`, color: subject.color },
                { label: 'Completed',      val: `${completed}h`, color: 'var(--success)' },
                { label: 'Remaining',      val: `${required - completed}h`, color: 'var(--warning)' },
                { label: 'Deadline',       val: `${deadline}d`, color: 'var(--danger)' },
              ].map(s => (
                <div key={s.label} className="sdc-stat">
                  <span className="sdc-stat-val" style={{ color: s.color }}>{s.val}</span>
                  <span className="sdc-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const SubjectsPage = () => {
  const { subjects, refreshSubjects, backendOnline, risk } = useApp();
  const [filter, setFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const filters = ['All', 'Critical', 'Warning', 'Safe'];

  const withRisk = subjects.map(s => ({
    ...s,
    riskLabel: risk.find(r => r.subject_id === s.id)?.risk_level ?? 'Safe',
  }));

  const filtered = filter === 'All' ? withRisk : withRisk.filter(s => s.riskLabel === filter);

  const handleAdd = async (data) => {
    await createSubject(data);
    await refreshSubjects();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    await deleteSubject(id);
    await refreshSubjects();
  };

  return (
    <div className="subjects-page">
      <div className="page-header glass-panel widget">
        <div>
          <h2 style={{ margin: 0 }}>Subject Management</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
            {subjects.length} subjects tracked · Click any card to expand details
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-tabs">
            {filters.map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f}
                <span className="filter-count">
                  {f === 'All' ? withRisk.length : withRisk.filter(s => s.riskLabel === f).length}
                </span>
              </button>
            ))}
          </div>
          {backendOnline && (
            <button className="ctrl-btn primary" onClick={() => setShowAdd(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> Add Subject
            </button>
          )}
        </div>
      </div>

      <div className="subjects-summary-row">
        {[
          { label: 'Total Hours',  value: `${subjects.reduce((a, s) => a + (s.required_hours ?? s.required ?? 0), 0)}h`, color: 'var(--accent-primary)' },
          { label: 'Completed',    value: `${subjects.reduce((a, s) => a + (s.completed_hours ?? s.completed ?? 0), 0)}h`, color: 'var(--success)' },
          { label: 'Remaining',    value: `${subjects.reduce((a, s) => a + ((s.required_hours ?? s.required ?? 0) - (s.completed_hours ?? s.completed ?? 0)), 0)}h`, color: 'var(--warning)' },
          { label: 'Critical',     value: withRisk.filter(s => s.riskLabel === 'Critical').length, color: 'var(--danger)' },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="glass-panel summary-stat"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <span className="summary-val" style={{ color: stat.color }}>{stat.value}</span>
            <span className="summary-lbl">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="subjects-list">
        <AnimatePresence mode="popLayout">
          {filtered.map(s => (
            <SubjectDetail key={s.id} subject={s}
              onDelete={handleDelete}
              onProgressUpdate={refreshSubjects} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAdd && <AddSubjectModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      </AnimatePresence>
    </div>
  );
};
