import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ShieldAlert, AlertTriangle, ShieldCheck, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './RiskPage.css';

const riskConfig = {
  Critical:  { icon: ShieldAlert,   color: 'var(--danger)',  bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)' },
  Warning:   { icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
  Safe:      { icon: ShieldCheck,   color: 'var(--success)', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
  Completed: { icon: ShieldCheck,   color: 'var(--success)', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
};

const ScatterTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="glass-panel" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
        <strong style={{ color: d.color }}>{d.name}</strong>
        <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
          Deadline: {d.x}d · Remaining: {d.y}h
        </p>
      </div>
    );
  }
  return null;
};

export const RiskPage = () => {
  const { risk, subjects, refreshSubjects, loading } = useApp();

  // Merge risk data with subject colors
  const enriched = risk.map(r => ({
    ...r,
    color: subjects.find(s => s.id === r.subject_id)?.color ?? '#8b5cf6',
  }));

  const radarData = enriched.map(r => ({
    subject: r.short_name ?? r.name?.slice(0, 4),
    score: r.risk_score,
    fullMark: 100,
  }));

  const scatterData = enriched.map(r => ({
    x: r.deadline,
    y: r.remaining_hours,
    name: r.short_name ?? r.name?.slice(0, 4),
    color: r.color,
  }));

  const critical  = enriched.filter(r => r.risk_level === 'Critical');
  const warning   = enriched.filter(r => r.risk_level === 'Warning');
  const safe      = enriched.filter(r => ['Safe', 'Completed'].includes(r.risk_level));

  return (
    <div className="risk-page">
      <div className="risk-summary-row">
        {[
          { label: 'Critical', count: critical.length, ...riskConfig.Critical },
          { label: 'Warning',  count: warning.length,  ...riskConfig.Warning },
          { label: 'Safe',     count: safe.length,     ...riskConfig.Safe },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.label} className="glass-panel risk-summary-card"
              style={{ background: item.bg, borderColor: item.border }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}>
              <Icon size={28} color={item.color} />
              <div>
                <div className="risk-count" style={{ color: item.color }}>{item.count}</div>
                <div className="risk-label">{item.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="ctrl-btn" onClick={refreshSubjects} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.85rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Risk
        </button>
      </div>

      <div className="risk-charts-row">
        <div className="glass-panel widget">
          <div className="widget-header"><h3>Risk Radar</h3><span className="badge">Multi-factor</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Radar name="Risk Score" dataKey="score" stroke="var(--accent-primary)"
                fill="var(--accent-primary)" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel widget">
          <div className="widget-header"><h3>Deadline vs Effort Matrix</h3><span className="badge">Scatter</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis type="number" dataKey="x" name="Days" stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                label={{ value: 'Days to Deadline', position: 'insideBottom', offset: -8, fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Hours" stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                label={{ value: 'Hours Left', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} shape={(props) => {
                const { cx, cy, payload } = props;
                return <circle cx={cx} cy={cy} r={10} fill={payload.color} fillOpacity={0.8}
                  stroke={payload.color} strokeWidth={2} />;
              }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel widget">
        <div className="widget-header">
          <h3>Detailed Risk Analysis</h3>
          <TrendingDown size={16} color="var(--danger)" />
        </div>
        <div className="risk-detail-list">
          {enriched.map((r, i) => {
            const cfg = riskConfig[r.risk_level] ?? riskConfig.Safe;
            const Icon = cfg.icon;
            return (
              <motion.div key={r.subject_id} className="risk-detail-item"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}>
                <div className="rdi-rank" style={{ color: r.color }}>#{i + 1}</div>
                <Icon size={18} color={cfg.color} />
                <div className="rdi-info">
                  <div className="rdi-name">{r.name}</div>
                  <div className="rdi-meta">
                    <Clock size={12} />
                    <span>{r.deadline}d deadline · {r.remaining_hours}h remaining · {r.min_daily_hrs}h/day needed</span>
                  </div>
                  {r.message && <div style={{ fontSize: '0.72rem', color: cfg.color, marginTop: 2 }}>{r.message}</div>}
                </div>
                <div className="rdi-score-wrap">
                  <div className="rdi-score" style={{ color: cfg.color }}>{r.risk_score}</div>
                  <div className="rdi-score-bar-bg">
                    <motion.div className="rdi-score-bar" style={{ background: cfg.color }}
                      initial={{ width: 0 }} animate={{ width: `${r.risk_score}%` }}
                      transition={{ duration: 0.8, delay: i * 0.07 + 0.3 }} />
                  </div>
                </div>
                <span className={`risk-badge ${r.risk_level.toLowerCase()}`}>{r.risk_level}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
