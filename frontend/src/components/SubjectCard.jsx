import React from 'react';
import { Star, Clock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import './SubjectCard.css';

export const SubjectCard = ({ subject, index = 0 }) => {
  const pct = Math.round((subject.completed / subject.required) * 100);
  const hoursLeft = subject.required - subject.completed;

  return (
    <motion.div
      className={`subject-card glass-panel risk-${subject.risk.toLowerCase()}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <div className="card-accent" style={{ background: subject.color }} />

      <div className="card-header">
        <div className="subject-short" style={{ background: `${subject.color}22`, color: subject.color }}>
          {subject.short}
        </div>
        <span className={`risk-badge ${subject.risk.toLowerCase()}`}>{subject.risk}</span>
      </div>

      <h4 className="subject-name">{subject.name}</h4>

      <div className="card-stats">
        <div className="stat-row">
          <Clock size={14} color="var(--text-secondary)" />
          <span>Deadline: <strong>{subject.deadline}d</strong></span>
        </div>
        <div className="stat-row">
          <BookOpen size={14} color="var(--text-secondary)" />
          <span>{hoursLeft}h remaining</span>
        </div>
        <div className="difficulty-row">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={13}
              fill={i < subject.difficulty ? subject.color : 'transparent'}
              color={i < subject.difficulty ? subject.color : 'rgba(255,255,255,0.15)'}
            />
          ))}
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-labels">
          <span>{subject.completed}h done</span>
          <span style={{ color: subject.color, fontWeight: 600 }}>{pct}%</span>
        </div>
        <div className="progress-bar-bg">
          <motion.div
            className="progress-bar-fill"
            style={{ background: `linear-gradient(90deg, ${subject.color}, ${subject.color}99)` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: index * 0.07 + 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};
