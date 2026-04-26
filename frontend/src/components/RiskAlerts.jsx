import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { initialSubjects } from '../data/subjects';
import './RiskAlerts.css';

const riskConfig = {
  Critical: { Icon: ShieldAlert, color: 'var(--danger)',  bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)' },
  Warning:  { Icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  Safe:     { Icon: ShieldCheck, color: 'var(--success)', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)' },
  Completed:{ Icon: ShieldCheck, color: 'var(--success)', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)' },
};

export const RiskAlerts = () => {
  const { risk, subjects } = useApp();

  // Build display list from live risk data, or fall back to static subjects
  const items = risk.length
    ? risk.map(r => ({
        id: r.subject_id,
        name: r.name ?? r.subject_name,
        risk: r.risk_level,
        hoursLeft: r.remaining_hours,
        deadline: r.deadline,
        message: r.message,
        color: subjects.find(s => s.id === r.subject_id)?.color ?? '#8b5cf6',
        required: subjects.find(s => s.id === r.subject_id)?.required_hours ?? 1,
        completed: subjects.find(s => s.id === r.subject_id)?.completed_hours ?? 0,
      }))
    : initialSubjects.map(s => ({
        id: s.id, name: s.name, risk: s.risk,
        hoursLeft: s.required - s.completed,
        deadline: s.deadline, message: '', color: s.color,
        required: s.required, completed: s.completed,
      }));

  const sorted = [...items].sort((a, b) => {
    const order = { Critical: 0, Warning: 1, Safe: 2, Completed: 3 };
    return (order[a.risk] ?? 4) - (order[b.risk] ?? 4);
  });

  return (
    <div className="glass-panel widget risk-alerts">
      <div className="widget-header">
        <h3>Risk Alerts</h3>
        <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
          {items.filter(s => s.risk === 'Critical').length} critical
        </span>
      </div>
      <div className="alerts-list">
        {sorted.map((sub, i) => {
          const cfg = riskConfig[sub.risk] ?? riskConfig.Safe;
          const { Icon, color, bg, border } = cfg;
          const pct = sub.required > 0 ? Math.round((sub.completed / sub.required) * 100) : 100;
          return (
            <motion.div key={sub.id} className="alert-item"
              style={{ background: bg, borderColor: border }}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }} whileHover={{ x: -2 }}>
              <div className="alert-icon-wrap"><Icon size={18} color={color} /></div>
              <div className="alert-content">
                <div className="alert-top">
                  <span className="alert-name">{sub.name}</span>
                  <span className={`risk-badge ${sub.risk.toLowerCase()}`}>{sub.risk}</span>
                </div>
                <div className="alert-meta">
                  <Clock size={11} />
                  <span>{sub.hoursLeft}h needed · {sub.deadline} days left</span>
                  {sub.message && <span className="alert-urgent">{sub.message}</span>}
                </div>
                <div className="alert-bar-bg">
                  <motion.div className="alert-bar" style={{ background: color }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07 + 0.3 }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
