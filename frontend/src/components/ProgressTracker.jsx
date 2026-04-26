import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../context/AppContext';
import { initialSubjects } from '../data/subjects';
import './ProgressTracker.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="glass-panel" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
        <strong style={{ color: d.fill }}>{d.name}</strong>
        <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{d.pct}% complete</p>
      </div>
    );
  }
  return null;
};

export const ProgressTracker = () => {
  const { subjects: liveSubjects } = useApp();

  // Normalise to a common shape
  const subjects = (liveSubjects.length ? liveSubjects : initialSubjects).map(s => ({
    id:        s.id,
    short:     s.short_name ?? s.short ?? s.name?.slice(0, 4),
    name:      s.name,
    required:  s.required_hours  ?? s.required  ?? 0,
    completed: s.completed_hours ?? s.completed ?? 0,
    color:     s.color ?? '#8b5cf6',
  }));

  const data = subjects.map(s => ({
    name: s.short,
    pct:  s.required > 0 ? Math.round((s.completed / s.required) * 100) : 100,
    fill: s.color,
  }));

  const totalReq  = subjects.reduce((a, s) => a + s.required, 0);
  const totalDone = subjects.reduce((a, s) => a + s.completed, 0);
  const overall   = totalReq > 0 ? Math.round((totalDone / totalReq) * 100) : 0;

  return (
    <div className="glass-panel widget progress-tracker">
      <div className="widget-header">
        <h3>Progress Tracking</h3>
        <span className="badge">{overall}% overall</span>
      </div>

      <div className="progress-tracker-body">
        <div className="radial-chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%"
              data={data} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="pct" cornerRadius={6} background={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="radial-center">
            <span className="radial-pct">{overall}%</span>
            <span className="radial-label">Done</span>
          </div>
        </div>

        <div className="progress-list">
          {subjects.map((s, i) => {
            const pct = s.required > 0 ? Math.round((s.completed / s.required) * 100) : 100;
            return (
              <motion.div key={s.id} className="progress-row"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}>
                <div className="progress-row-header">
                  <span className="progress-short" style={{ color: s.color }}>{s.short}</span>
                  <span className="progress-pct">{pct}%</span>
                </div>
                <div className="progress-bar-bg">
                  <motion.div className="progress-bar-fill"
                    style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: i * 0.06 + 0.3, ease: 'easeOut' }} />
                </div>
                <div className="progress-row-sub">
                  <span>{s.completed}h / {s.required}h</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.required - s.completed}h left</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
