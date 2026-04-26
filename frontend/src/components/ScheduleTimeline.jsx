import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dpSchedule } from '../data/subjects'; // fallback
import './ScheduleTimeline.css';

export const ScheduleTimeline = () => {
  const { schedule } = useApp();

  // Use live backend blocks if available, else fall back to static mock
  const blocks = schedule?.schedule_blocks?.length
    ? schedule.schedule_blocks
    : dpSchedule;

  const totalHours = blocks.reduce((a, b) => a + (b.duration ?? 0), 0);
  const isLive = !!schedule?.schedule_blocks?.length;

  return (
    <div className="glass-panel widget timeline-container">
      <div className="widget-header">
        <h3>Today's DP Schedule</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive && <span style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={12} />Live</span>}
          <span className="badge">{totalHours}h total</span>
        </div>
      </div>

      {blocks.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Run the scheduler to generate today's plan.
        </p>
      ) : (
        <div className="timeline">
          {blocks.map((item, index) => (
            <motion.div
              key={index}
              className="timeline-item"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="timeline-time">
                <Clock size={12} />
                <span>{item.start}</span>
              </div>
              <div className="timeline-connector">
                <div className="tl-dot-sm" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                {index < blocks.length - 1 && <div className="tl-line-sm" />}
              </div>
              <motion.div className="timeline-bar" style={{ borderLeftColor: item.color }} whileHover={{ x: 3 }}>
                <div className="tl-bar-top">
                  <span className="tl-subject" style={{ color: item.color }}>{item.subject}</span>
                  <span className={`risk-badge ${(item.type ?? 'safe').toLowerCase()}`}>{item.type}</span>
                </div>
                <div className="tl-bar-meta">
                  <span>{item.start} – {item.end}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.duration}h</span>
                </div>
                <div className="tl-mini-bar-bg">
                  <motion.div
                    style={{ width: `${totalHours > 0 ? (item.duration / totalHours) * 100 : 0}%`, background: item.color, height: '100%', borderRadius: 3 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${totalHours > 0 ? (item.duration / totalHours) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                  />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
