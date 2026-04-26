import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Play, Pause, SkipForward, ArrowUp, ArrowDown, Minus, Send, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { priorityQueueData } from '../data/subjects';
import './AdaptiveSchedule.css';

const OPERATIONS = [
  { type: 'enqueue', subject: 'DSA', msg: 'ENQUEUE DSA (score: 95) → deadline in 2 days', color: '#8b5cf6' },
  { type: 'enqueue', subject: 'TOC', msg: 'ENQUEUE TOC (score: 88) → deadline in 4 days', color: '#ef4444' },
  { type: 'heapify', subject: null, msg: 'HEAPIFY UP → DSA bubbles to top (max priority)', color: '#06b6d4' },
  { type: 'dequeue', subject: 'DSA', msg: 'DEQUEUE DSA → assigned 3h study block', color: '#8b5cf6' },
  { type: 'update',  subject: 'OS',  msg: 'UPDATE OS priority: deadline approaching', color: '#06b6d4' },
  { type: 'heapify', subject: null, msg: 'HEAPIFY DOWN → reorder queue after update', color: '#f59e0b' },
  { type: 'reorder', subject: null, msg: 'REORDER: CN swapped with SE (risk change)', color: '#10b981' },
];

const QueueNode = ({ item, index, isActive, isProcessing }) => (
  <motion.div layout
    className={`queue-node-card ${isActive ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
    style={{ borderColor: item.color }}
    initial={{ opacity: 0, scale: 0.8, y: -20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.8, x: 60 }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
    <div className="qn-rank" style={{ background: `${item.color}22`, color: item.color }}>#{index + 1}</div>
    <div className="qn-body">
      <div className="qn-label" style={{ color: item.color }}>{item.label}</div>
      <div className="qn-reason">{item.reason}</div>
    </div>
    <div className="qn-score" style={{ color: item.color }}>{item.score}</div>
    {isActive && <div className="qn-pulse" style={{ background: item.color }} />}
  </motion.div>
);

const LogEntry = ({ op, index }) => {
  const icons = { enqueue: <ArrowUp size={13} />, dequeue: <ArrowDown size={13} />,
    heapify: <RefreshCw size={13} />, update: <SkipForward size={13} />, reorder: <Minus size={13} /> };
  return (
    <motion.div className="log-entry" style={{ borderLeftColor: op.color }}
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}>
      <span className="log-icon" style={{ color: op.color }}>{icons[op.type]}</span>
      <span className="log-type" style={{ color: op.color }}>{op.type.toUpperCase()}</span>
      <span className="log-msg">{op.msg.split('→')[1] || op.msg}</span>
    </motion.div>
  );
};

// Feedback form to submit actual hours studied
const FeedbackForm = ({ subjects, schedule, onSubmit, loading }) => {
  const [hours, setHours] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const planned = {};
  if (schedule?.dp_log) {
    schedule.dp_log.forEach(e => { planned[e.subject_id] = e.hours; });
  }

  const handleSubmit = async () => {
    await onSubmit(hours);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="glass-panel widget">
      <div className="widget-header">
        <h3>Submit Today's Progress</h3>
        <span className="badge">Adaptive Feedback</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 16 }}>
        Enter actual hours studied. The algorithm will re-prioritize based on your performance.
      </p>
      <div className="feedback-list">
        {subjects.map(s => {
          const sid = s.id;
          const plan = planned[sid] ?? 0;
          const short = s.short_name ?? s.short ?? s.name?.slice(0, 4);
          return (
            <div key={sid} className="feedback-row">
              <span className="fb-subject" style={{ color: s.color }}>{short}</span>
              <span className="fb-planned">Planned: {plan}h</span>
              <input type="number" min={0} max={s.required_hours ?? s.required ?? 20}
                value={hours[sid] ?? ''}
                placeholder="0"
                onChange={e => setHours(p => ({ ...p, [sid]: +e.target.value }))}
                className="fb-input" />
              <span className="fb-unit">hrs actual</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="ctrl-btn primary" onClick={handleSubmit} disabled={loading || submitted}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {submitted ? <><Check size={15} /> Submitted!</> : <><Send size={15} /> Submit Feedback</>}
        </button>
      </div>
    </div>
  );
};

export const AdaptiveSchedule = () => {
  const { priorityQueue: livePQ, subjects, schedule, sendFeedback, loading, backendOnline } = useApp();

  const source = livePQ?.length ? livePQ : priorityQueueData;
  const [queue, setQueue] = useState([...source]);
  const [logs, setLogs] = useState([]);
  const [opIndex, setOpIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [fbResult, setFbResult] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (livePQ?.length) setQueue([...livePQ]);
  }, [livePQ]);

  const runStep = (idx) => {
    if (idx >= OPERATIONS.length) { setRunning(false); return; }
    const op = OPERATIONS[idx];
    setLogs(prev => [op, ...prev].slice(0, 12));

    if (op.type === 'dequeue') {
      setProcessingId(op.subject);
      setTimeout(() => {
        setQueue(prev => prev.filter(n => n.id !== op.subject && n.label !== op.subject));
        setProcessingId(null);
      }, 600);
    } else if (op.type === 'heapify' || op.type === 'reorder') {
      setQueue(prev => {
        const s = [...prev];
        if (s.length > 1) {
          const i = Math.floor(Math.random() * (s.length - 1));
          [s[i], s[i + 1]] = [s[i + 1], s[i]];
        }
        return s;
      });
    } else if (op.type === 'update' && op.subject) {
      setActiveId(op.subject);
      setQueue(prev => prev.map(n =>
        (n.id === op.subject || n.label === op.subject) ? { ...n, score: Math.min(100, n.score + 8) } : n
      ).sort((a, b) => b.score - a.score));
      setTimeout(() => setActiveId(null), 1000);
    }
    setOpIndex(idx + 1);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        // Use functional update to always read latest opIndex
        setOpIndex(prev => {
          if (prev >= OPERATIONS.length) {
            setRunning(false);
            return prev;
          }
          runStep(prev);
          return prev + 1;
        });
      }, 1800);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setRunning(false);
    setQueue([...source]);
    setLogs([]);
    setOpIndex(0);
    setActiveId(null);
    setProcessingId(null);
  };

  const handleFeedback = async (actualMap) => {
    const result = await sendFeedback(actualMap);
    setFbResult(result?.feedback_log ?? []);
  };

  const adaptedSchedule = subjects.map(s => {
    const qItem = queue.find(q => q.subject_id === s.id || q.label === (s.short_name ?? s.short));
    const score = qItem?.score ?? 0;
    const allocated = score > 80 ? 3 : score > 60 ? 2 : 1;
    return { ...s, allocated, score,
      short: s.short_name ?? s.short ?? s.name?.slice(0, 4),
      risk: s.risk ?? 'Safe' };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="adaptive-page">
      <div className="glass-panel widget adaptive-header">
        <div>
          <h2 style={{ margin: 0 }}>Adaptive Schedule Engine</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
            Live priority queue · Heapify operations · Dynamic reordering
          </p>
        </div>
        <div className="adaptive-controls">
          <motion.button className={`ctrl-btn primary ${running ? 'active' : ''}`}
            onClick={() => setRunning(r => !r)} whileTap={{ scale: 0.95 }}>
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? 'Pause' : 'Run Live'}
          </motion.button>
          <motion.button className="ctrl-btn" onClick={() => runStep(opIndex)} whileTap={{ scale: 0.95 }} disabled={running}>
            <SkipForward size={16} /> Step
          </motion.button>
          <motion.button className="ctrl-btn" onClick={handleReset} whileTap={{ scale: 0.95 }}>
            <RefreshCw size={16} /> Reset
          </motion.button>
        </div>
      </div>

      <div className="adaptive-grid">
        <div className="adaptive-left">
          <div className="glass-panel widget">
            <div className="widget-header">
              <h3>Priority Queue (Max-Heap)</h3>
              <span className="badge">{queue.length} items</span>
            </div>
            <div className="queue-list">
              <AnimatePresence mode="popLayout">
                {queue.map((item, i) => (
                  <QueueNode key={item.id ?? item.label} item={item} index={i}
                    isActive={activeId === (item.id ?? item.label)}
                    isProcessing={processingId === (item.id ?? item.label)} />
                ))}
              </AnimatePresence>
              {queue.length === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                  Queue empty — click Reset to reload
                </motion.p>
              )}
            </div>
          </div>

          <div className="glass-panel widget">
            <div className="widget-header">
              <h3>Operation Log</h3>
              <span className="badge">{logs.length} ops</span>
            </div>
            <div className="op-log">
              <AnimatePresence>
                {logs.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Press "Run Live" or "Step" to see operations
                  </p>
                )}
                {logs.map((log, i) => <LogEntry key={`${log.msg}-${i}`} op={log} index={i} />)}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="adaptive-right">
          <div className="glass-panel widget">
            <div className="widget-header">
              <h3>Adaptive Schedule Output</h3>
              <span className="badge">Live Updated</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 16 }}>
              Hours allocated based on current priority scores
            </p>
            <div className="adaptive-schedule-list">
              {adaptedSchedule.map((s, i) => (
                <motion.div key={s.id} className="adaptive-item" layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <div className="ai-rank" style={{ color: s.color }}>#{i + 1}</div>
                  <div className="ai-badge" style={{ background: `${s.color}22`, color: s.color }}>{s.short}</div>
                  <div className="ai-info">
                    <span className="ai-name">{s.name}</span>
                    <div className="ai-bar-bg">
                      <motion.div className="ai-bar" style={{ background: s.color }}
                        animate={{ width: `${(s.allocated / 3) * 100}%` }}
                        transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                  <div className="ai-hours" style={{ color: s.color }}>{s.allocated}h</div>
                  <span className={`risk-badge ${(s.risk ?? 'safe').toLowerCase()}`}>{s.risk}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {backendOnline && (
            <FeedbackForm subjects={subjects} schedule={schedule}
              onSubmit={handleFeedback} loading={loading} />
          )}

          {fbResult && (
            <motion.div className="glass-panel widget" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="widget-header"><h3>Feedback Results</h3></div>
              <div className="algo-table">
                {fbResult.map((e, i) => (
                  <div key={i} className="algo-row">
                    <span className="algo-name">{e.name}</span>
                    <span className="algo-meta">P:{e.planned}h A:{e.actual}h</span>
                    <span className={`risk-badge ${e.status === 'behind' ? 'critical' : e.status === 'ahead' ? 'safe' : 'warning'}`}>
                      {e.status}
                    </span>
                    <span className="algo-reason">{e.note}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="glass-panel widget">
            <h3 style={{ marginBottom: 16 }}>Algorithm Legend</h3>
            <div className="algo-legend">
              {[
                { op: 'ENQUEUE', desc: 'Add subject to priority queue',   color: '#8b5cf6' },
                { op: 'DEQUEUE', desc: 'Remove highest priority item',     color: '#ef4444' },
                { op: 'HEAPIFY', desc: 'Restore heap property',            color: '#06b6d4' },
                { op: 'UPDATE',  desc: 'Change priority score',            color: '#f59e0b' },
                { op: 'REORDER', desc: 'Swap positions in queue',          color: '#10b981' },
              ].map(item => (
                <div key={item.op} className="legend-row">
                  <span className="legend-op" style={{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}12` }}>
                    {item.op}
                  </span>
                  <span className="legend-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
