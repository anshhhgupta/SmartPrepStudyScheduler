import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, TrendingUp, Clock, AlertTriangle, CheckCircle, Loader, Terminal, Cpu, GitBranch, BarChart2, Shield, Zap, Activity } from 'lucide-react';
import { SubjectCard } from './SubjectCard';
import { PriorityQueueVisualizer } from './PriorityQueueVisualizer';
import { RiskAlerts } from './RiskAlerts';
import { DeadlineHeatmap } from './DeadlineHeatmap';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ProgressTracker } from './ProgressTracker';
import { useApp } from '../context/AppContext';
import './Dashboard.css';

const StatCard = ({ icon, label, value, color, delay }) => (
  <motion.div
    className="glass-panel stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -3, scale: 1.02 }}
  >
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </motion.div>
);

const AlgoLogPanel = ({ log, dpLog, greedyLog }) => {
  const [tab, setTab] = useState('log');
  return (
    <div className="glass-panel widget algo-log-panel">
      <div className="widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={16} color="var(--accent-primary)" />
          <h3>Algorithm Output</h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['log', 'greedy', 'dp'].map(t => (
            <button key={t} className={`filter-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              {t === 'log' ? 'Full Log' : t === 'greedy' ? 'Greedy' : 'DP Alloc'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'log' && (
        <pre className="algo-log-pre">{log || 'Run the scheduler to see algorithm output...'}</pre>
      )}

      {tab === 'greedy' && (
        <div className="algo-table">
          {greedyLog.length === 0
            ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No greedy log yet.</p>
            : greedyLog.map(e => (
              <div key={e.rank} className="algo-row">
                <span className="algo-rank">#{e.rank}</span>
                <span className="algo-name" style={{ color: 'var(--text-primary)' }}>{e.name}</span>
                <span className="algo-meta">{e.deadline}d · {e.remaining}h left</span>
                <span className="algo-reason">{e.reason}</span>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'dp' && (
        <div className="algo-table">
          {dpLog.length === 0
            ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No DP allocation yet.</p>
            : dpLog.map((e, i) => (
              <div key={i} className="algo-row">
                <span className="algo-name" style={{ color: e.color }}>{e.name}</span>
                <span className="algo-meta">{e.hours}h allocated</span>
                <span className="algo-reason">value = {e.value}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

// ── Live Metrics Panel ────────────────────────────────────────────────────────
const LiveMetricsPanel = ({ subjects, risk, schedule }) => {
  const totalHours   = subjects.reduce((a, s) => a + (s.required_hours ?? s.required ?? 0), 0);
  const doneHours    = subjects.reduce((a, s) => a + (s.completed_hours ?? s.completed ?? 0), 0);
  const overallPct   = totalHours > 0 ? Math.round((doneHours / totalHours) * 100) : 0;
  const criticalCount = risk.filter(r => r.risk_level === 'Critical').length;
  const allocatedToday = schedule?.total_hours ?? schedule?.schedule_blocks?.reduce((a, b) => a + (b.duration ?? 0), 0) ?? 0;

  const metrics = [
    { label: 'Progress', value: `${overallPct}%`, sub: `${doneHours}h of ${totalHours}h`, color: '#8b5cf6', icon: <TrendingUp size={16} /> },
    { label: 'Today Allocated', value: `${allocatedToday}h`, sub: 'by Knapsack DP', color: '#06b6d4', icon: <Clock size={16} /> },
    { label: 'Critical', value: criticalCount, sub: 'subjects at risk', color: '#ef4444', icon: <AlertTriangle size={16} /> },
    { label: 'Algorithms', value: 5, sub: 'running live', color: '#10b981', icon: <Activity size={16} /> },
  ];

  return (
    <div className="glass-panel widget live-metrics-panel">
      <div className="widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="var(--accent-tertiary)" />
          <h3>Live Metrics</h3>
        </div>
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontSize: '0.72rem', color: 'var(--accent-tertiary)', fontWeight: 700 }}>
          ● LIVE
        </motion.div>
      </div>
      <div className="live-metrics-grid">
        {metrics.map((m, i) => (
          <motion.div key={m.label} className="live-metric-card"
            style={{ borderColor: `${m.color}25`, background: `${m.color}08` }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }} whileHover={{ scale: 1.03 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="live-metric-val" style={{ color: m.color }}>{m.value}</div>
              <div style={{ color: m.color, opacity: 0.7 }}>{m.icon}</div>
            </div>
            <div className="live-metric-label">{m.label}</div>
            <div className="live-metric-sub">{m.sub}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ── Algorithm Info Panel ──────────────────────────────────────────────────────
const AlgoInfoPanel = ({ schedule }) => {
  const [open, setOpen] = useState(false);
  const algos = [
    { icon: <GitBranch size={14} />, name: "Kahn's Topo Sort", complexity: 'O(V+E)', color: '#8b5cf6',
      desc: 'Validates prerequisite order using BFS in-degree reduction' },
    { icon: <Zap size={14} />, name: 'Greedy Insertion', complexity: 'O(n²)', color: '#06b6d4',
      desc: 'Bubbles high-priority subjects forward respecting dependencies' },
    { icon: <BarChart2 size={14} />, name: 'Knapsack DP', complexity: 'O(n×W)', color: '#ec4899',
      desc: 'Maximises value = difficulty × (1/deadline) × hours' },
    { icon: <Shield size={14} />, name: 'Risk Detection', complexity: 'O(n log n)', color: '#ef4444',
      desc: 'Composite score: urgency + effort ratio + difficulty weight' },
    { icon: <Cpu size={14} />, name: 'Max-Heap PQ', complexity: 'O(log n)', color: '#f59e0b',
      desc: 'Maintains priority order with O(log n) insert/extract' },
  ];

  return (
    <div className="glass-panel widget">
      <div className="widget-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={16} color="var(--accent-primary)" />
          <h3>Algorithm Pipeline</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {schedule && <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }}>Executed</span>}
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      <div className="algo-pipeline-row">
        {algos.map((a, i) => (
          <div key={i} className="algo-pipeline-chip" style={{ borderColor: `${a.color}35`, background: `${a.color}0c` }}>
            <span style={{ color: a.color }}>{a.icon}</span>
            <span style={{ color: a.color, fontWeight: 700, fontSize: '0.75rem' }}>{a.name}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', fontFamily: 'monospace' }}>{a.complexity}</span>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {algos.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 10, background: `${a.color}08`, border: `1px solid ${a.color}20` }}>
                  <span style={{ color: a.color }}>{a.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: a.color, minWidth: 130 }}>{a.name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: 70 }}>{a.complexity}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{a.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Dashboard = () => {
  const { subjects, schedule, risk, loading, runScheduler, algoLog, dpLog, greedyLog, backendOnline } = useApp();
  const [ran, setRan] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setError('');
    try {
      await runScheduler();
      setRan(true);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to run scheduler');
    }
  };

  // Compute stats from live subjects
  const totalHours   = subjects.reduce((a, s) => a + (s.required_hours ?? s.required ?? 0), 0);
  const doneHours    = subjects.reduce((a, s) => a + (s.completed_hours ?? s.completed ?? 0), 0);
  const criticalCount = risk.filter(r => r.risk_level === 'Critical').length;
  const safeCount     = risk.filter(r => r.risk_level === 'Safe').length;
  const overallPct    = totalHours > 0 ? Math.round((doneHours / totalHours) * 100) : 0;

  // Normalise subject shape (backend uses snake_case, fallback to camelCase for offline)
  const normSubjects = subjects.map(s => ({
    ...s,
    required:  s.required_hours  ?? s.required  ?? 0,
    completed: s.completed_hours ?? s.completed ?? 0,
    deadline:  s.exam_deadline   ?? s.deadline  ?? 0,
    short:     s.short_name      ?? s.short     ?? s.name?.slice(0, 4),
    risk:      risk.find(r => r.subject_id === s.id)?.risk_level ?? s.risk ?? 'Safe',
  }));

  const scheduleBlocks = schedule?.schedule_blocks ?? schedule?.dpSchedule ?? [];
  const totalAllocated = schedule?.total_hours ?? scheduleBlocks.reduce((a, b) => a + (b.duration ?? 0), 0);

  return (
    <div className="dashboard-layout">
      <div className="stats-row">
        <StatCard icon={<TrendingUp size={22} />} label="Overall Progress"  value={`${overallPct}%`}          color="var(--accent-primary)"   delay={0}   />
        <StatCard icon={<Clock size={22} />}       label="Hours Remaining"   value={`${totalHours - doneHours}h`} color="var(--accent-tertiary)" delay={0.1} />
        <StatCard icon={<AlertTriangle size={22} />} label="Critical Subjects" value={criticalCount}            color="var(--danger)"           delay={0.2} />
        <StatCard icon={<CheckCircle size={22} />}  label="Subjects On Track" value={safeCount}                color="var(--success)"          delay={0.3} />
      </div>

      {/* Algorithm pipeline info */}
      <AlgoInfoPanel schedule={schedule} />

      <motion.div className="glass-panel action-banner"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
        <div className="banner-text">
          <h2>{ran ? '✅ Schedule Optimized!' : 'Ready to Optimize Your Schedule?'}</h2>
          <p>{ran
            ? `Knapsack DP allocated ${totalAllocated}h across ${scheduleBlocks.length} subjects. Priority queue updated.`
            : backendOnline
              ? 'Run the Knapsack DP + Greedy algorithm to allocate your study hours today.'
              : '⚠️ Backend offline — start the Flask server to enable live scheduling.'
          }</p>
          {error && <p style={{ color: 'var(--danger)', marginTop: 4, fontSize: '0.85rem' }}>⚠️ {error}</p>}
        </div>
        <motion.button
          className={`run-algo-btn ${loading ? 'running' : ''} animate-pulse-glow`}
          onClick={handleRun}
          whileTap={{ scale: 0.95 }}
          disabled={loading || !backendOnline}
        >
          {loading ? <Loader size={18} className="spin" /> : <Play size={18} fill="currentColor" />}
          <span>{loading ? 'Optimizing...' : 'Run Scheduler'}</span>
        </motion.button>
      </motion.div>

      <div className="dashboard-grid">
        <div className="grid-col-left">
          <div className="glass-panel widget">
            <div className="widget-header">
              <h3>Active Subjects</h3>
              <span className="badge">{normSubjects.length} subjects</span>
            </div>
            <div className="subjects-grid">
              {normSubjects.map((sub, i) => (
                <SubjectCard key={sub.id} subject={sub} index={i} />
              ))}
            </div>
          </div>

          <PriorityQueueVisualizer />
          <ProgressTracker />
        </div>

        <div className="grid-col-right">
          <LiveMetricsPanel subjects={subjects} risk={risk} schedule={schedule} />
          <ScheduleTimeline />
          <DeadlineHeatmap />
          <RiskAlerts />
          <AnimatePresence>
            {(ran || algoLog) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AlgoLogPanel log={algoLog} dpLog={dpLog} greedyLog={greedyLog} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
