import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { heatmapData, initialSubjects as staticSubjects } from '../data/subjects';
import './DeadlineHeatmap.css';

// Build heatmap from live subjects deadlines
function buildHeatmap(subjects) {
  const today = new Date();
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const exams = subjects
      .filter(s => (s.exam_deadline ?? s.deadline) === i + 1)
      .map(s => s.short_name ?? s.short ?? s.name?.slice(0, 4));
    const load = exams.length > 0
      ? Math.min(8, exams.length * 3 + 2)
      : Math.max(0, 8 - i);
    days.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day:  d.toLocaleDateString('en-US', { weekday: 'short' }),
      load,
      exams,
    });
  }
  return days;
}

export const DeadlineHeatmap = () => {
  const { subjects: liveSubjects } = useApp();

  const subjects = liveSubjects.length ? liveSubjects : staticSubjects;
  const data = liveSubjects.length ? buildHeatmap(liveSubjects) : heatmapData;
  const maxLoad = Math.max(...data.map(d => d.load), 1);

  return (
    <div className="glass-panel widget heatmap-container">
      <div className="widget-header">
        <h3>Deadline Heatmap</h3>
        <div className="heatmap-legend-inline">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Low</span>
          {[0.15, 0.35, 0.55, 0.75, 0.95].map(o => (
            <div key={o} style={{ width: 12, height: 12, borderRadius: 3, background: `rgba(139,92,246,${o})` }} />
          ))}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>High</span>
        </div>
      </div>

      <div className="heatmap-grid-sm">
        {data.map((day, i) => {
          const intensity = day.load / maxLoad;
          const bg = day.load === 0
            ? 'rgba(255,255,255,0.04)'
            : `rgba(139, 92, 246, ${0.12 + intensity * 0.75})`;
          return (
            <motion.div key={i} className="hm-cell" style={{ background: bg }}
              whileHover={{ scale: 1.12 }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              title={`${day.date}: ${day.load}h${day.exams.length ? ' · ' + day.exams.join(', ') : ''}`}>
              <span className="hm-day">{day.day}</span>
              <span className="hm-date">{day.date.split(' ')[1]}</span>
              {day.exams.length > 0 && <div className="hm-exam-dot" />}
            </motion.div>
          );
        })}
      </div>

      <div className="hm-exam-list">
        {data.filter(d => d.exams.length > 0).map((d, i) => (
          <div key={i} className="hm-exam-item">
            <div className="hm-exam-dot-inline" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{d.date}:</span>
            {d.exams.map(e => {
              const sub = subjects.find(s => (s.short_name ?? s.short) === e);
              return (
                <span key={e} className="hm-exam-badge"
                  style={{ background: `${sub?.color ?? '#888'}22`, color: sub?.color ?? '#888' }}>
                  {e}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
