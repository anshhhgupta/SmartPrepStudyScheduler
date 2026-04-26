import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Calendar, Zap, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMultiday } from '../api/client';
import { dpSchedule, heatmapData } from '../data/subjects';
import './TimelinePage.css';

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="glass-panel" style={{ padding: '10px 14px', fontSize: '0.85rem' }}>
        <strong style={{ color: d.color }}>{d.full ?? d.name}</strong>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          {d.start && d.end ? `${d.start} → ${d.end}` : ''}<br />
          {d.duration ?? d.value ?? d.hours}h allocated
        </p>
      </div>
    );
  }
  return null;
};

const HeatCell = ({ day }) => {
  const intensity = day.load / 8;
  const bg = day.load === 0
    ? 'rgba(255,255,255,0.04)'
    : `rgba(139, 92, 246, ${0.15 + intensity * 0.7})`;
  return (
    <motion.div className="heat-cell" style={{ background: bg }} whileHover={{ scale: 1.1 }}
      title={`${day.date}: ${day.load}h load${day.exams.length ? ' · Exams: ' + day.exams.join(', ') : ''}`}>
      <span className="heat-day">{day.day}</span>
      <span className="heat-date">{day.date.split(' ')[1]}</span>
      {day.exams.length > 0 && <div className="heat-exam-dot" />}
    </motion.div>
  );
};

export const TimelinePage = () => {
  const { schedule, subjects: liveSubjects, user } = useApp();
  const [view, setView] = useState('timeline');
  const [multiday, setMultiday] = useState(null);
  const [loadingMD, setLoadingMD] = useState(false);

  const blocks = schedule?.schedule_blocks?.length ? schedule.schedule_blocks : dpSchedule;
  const totalAllocated = blocks.reduce((a, b) => a + (b.duration ?? 0), 0);

  const barData = blocks.map(s => ({ ...s, value: s.duration }));

  const remainingData = liveSubjects.length
    ? liveSubjects.map(s => ({
        name: s.short_name ?? s.short ?? s.name?.slice(0, 4),
        remaining: (s.required_hours ?? s.required ?? 0) - (s.completed_hours ?? s.completed ?? 0),
        color: s.color ?? '#8b5cf6',
      }))
    : [];

  const loadMultiday = async () => {
    setLoadingMD(true);
    try {
      const res = await fetchMultiday(user?.daily_limit ?? 8);
      setMultiday(res);
      setView('multiday');
    } finally {
      setLoadingMD(false);
    }
  };

  return (
    <div className="timeline-page">
      <div className="page-header glass-panel widget">
        <div>
          <h2 style={{ margin: 0 }}>Study Timeline</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
            Knapsack DP output · {totalAllocated}h allocated today
          </p>
        </div>
        <div className="view-toggle" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['timeline', 'chart', 'heatmap', 'multiday'].map(v => (
            <button key={v} className={`filter-tab ${view === v ? 'active' : ''}`}
              onClick={() => v === 'multiday' ? loadMultiday() : setView(v)}>
              {v === 'multiday' && loadingMD ? <Loader size={12} className="spin" /> : null}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'timeline' && (
        <div className="glass-panel widget">
          <div className="widget-header">
            <h3>Today's Optimal Schedule</h3>
            <span className="badge">DP Optimized</span>
          </div>
          {blocks.length === 0
            ? <p style={{ color: 'var(--text-secondary)' }}>Run the scheduler to generate a plan.</p>
            : (
              <div className="timeline-visual">
                {blocks.map((item, i) => (
                  <motion.div key={i} className="tl-item"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}>
                    <div className="tl-time"><Clock size={13} /><span>{item.start}</span></div>
                    <div className="tl-connector">
                      <div className="tl-dot" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                      {i < blocks.length - 1 && <div className="tl-line" />}
                    </div>
                    <motion.div className="tl-card glass-panel" whileHover={{ x: 4, scale: 1.01 }}>
                      <div className="tl-card-accent" style={{ background: item.color }} />
                      <div className="tl-card-body">
                        <div className="tl-card-top">
                          <span className="tl-subject-badge" style={{ background: `${item.color}22`, color: item.color }}>
                            {item.subject}
                          </span>
                          <span className={`risk-badge ${(item.type ?? 'safe').toLowerCase()}`}>{item.type}</span>
                        </div>
                        <h4 className="tl-full-name">{item.full}</h4>
                        <div className="tl-card-meta">
                          <span>{item.start} – {item.end}</span>
                          <span style={{ color: item.color, fontWeight: 600 }}>{item.duration}h</span>
                        </div>
                        <div className="tl-duration-bar">
                          <motion.div
                            style={{ width: `${totalAllocated > 0 ? (item.duration / totalAllocated) * 100 : 0}%`, background: item.color, height: '100%', borderRadius: 4 }}
                            initial={{ width: 0 }}
                            animate={{ width: `${totalAllocated > 0 ? (item.duration / totalAllocated) * 100 : 0}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 + 0.3 }} />
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {view === 'chart' && (
        <div className="glass-panel widget">
          <div className="widget-header"><h3>Hours Allocated per Subject</h3><span className="badge">Bar Chart</span></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="subject" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === 'heatmap' && (
        <div className="glass-panel widget">
          <div className="widget-header">
            <h3>14-Day Deadline Heatmap</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(139,92,246,0.2)' }} /> Low
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(139,92,246,0.7)' }} /> High
            </div>
          </div>
          <div className="heatmap-grid">
            {heatmapData.map((day, i) => <HeatCell key={i} day={day} />)}
          </div>
        </div>
      )}

      {view === 'multiday' && multiday && (
        <div className="glass-panel widget">
          <div className="widget-header">
            <h3>Multi-Day Study Plan</h3>
            <span className="badge">{multiday.days} days</span>
          </div>
          <div className="multiday-table">
            {multiday.plan.map(day => (
              <div key={day.day} className="multiday-day">
                <div className="multiday-day-label">Day {day.day}</div>
                <div className="multiday-entries">
                  {day.entries.map((e, i) => (
                    <div key={i} className="multiday-entry">
                      <span className="multiday-subject" style={{ color: e.color }}>{e.subject}</span>
                      <span className="multiday-hours">{e.hours}h</span>
                      <div className="multiday-bar-bg">
                        <div className="multiday-bar" style={{ width: `${e.progress_pct}%`, background: e.color }} />
                      </div>
                      <span className="multiday-pct">{e.progress_pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {remainingData.length > 0 && (
        <div className="glass-panel widget">
          <div className="widget-header"><h3>Remaining Hours by Subject</h3><Zap size={16} color="var(--accent-primary)" /></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={remainingData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Bar dataKey="remaining" radius={[6, 6, 0, 0]}>
                {remainingData.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
