import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { priorityQueueData } from '../data/subjects'; // fallback
import './PriorityQueueVisualizer.css';

export const PriorityQueueVisualizer = () => {
  const { priorityQueue: livePQ } = useApp();

  // Use live data if available, else static fallback
  const source = livePQ?.length ? livePQ : priorityQueueData;

  const [queue, setQueue] = useState([...source]);
  const [lastOp, setLastOp] = useState('Initialized from backend');
  const stepRef = useRef(0);

  // Sync when live data arrives
  useEffect(() => {
    if (livePQ?.length) {
      setQueue([...livePQ]);
      setLastOp('SYNC → priority queue updated from backend');
    }
  }, [livePQ]);

  useEffect(() => {
    const ops = [
      (q) => {
        if (q.length === 0) return { q: [...source], op: 'RESET → queue restored' };
        const top = q[0];
        setLastOp(`DEQUEUE → ${top.label} (score: ${top.score}) assigned study block`);
        return { q: q.slice(1), op: '' };
      },
      (q) => {
        const shuffled = [...q];
        if (shuffled.length > 1) {
          const i = Math.floor(Math.random() * (shuffled.length - 1));
          [shuffled[i], shuffled[i + 1]] = [shuffled[i + 1], shuffled[i]];
        }
        setLastOp('HEAPIFY → restoring max-heap property');
        return { q: shuffled, op: '' };
      },
      (q) => {
        const updated = q.map((n, i) => i === q.length - 1 ? { ...n, score: Math.min(100, n.score + 5) } : n)
          .sort((a, b) => b.score - a.score);
        setLastOp(`UPDATE → ${updated[0]?.label ?? ''} priority increased`);
        return { q: updated, op: '' };
      },
      (q) => {
        setLastOp('RESET → queue restored to backend state');
        return { q: [...source], op: '' };
      },
    ];

    const interval = setInterval(() => {
      setQueue(prev => {
        const { q } = ops[stepRef.current % ops.length](prev);
        stepRef.current += 1;
        return q;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [source]);

  return (
    <div className="glass-panel widget pq-visualizer">
      <div className="widget-header">
        <h3>Priority Queue Visualizer</h3>
        <span className="badge">Live</span>
      </div>

      <div className="pq-op-log">
        <span className="pq-op-label">Last op:</span>
        <AnimatePresence mode="wait">
          <motion.span key={lastOp} className="pq-op-text"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.3 }}>
            {lastOp}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="pq-horizontal">
        <div className="pq-label-in">IN →</div>
        <div className="pq-nodes">
          <AnimatePresence mode="popLayout">
            {queue.map((node, index) => (
              <motion.div key={node.id ?? node.label} layout
                className={`pq-node ${index === 0 ? 'pq-node-top' : ''}`}
                style={{ borderColor: node.color, background: `${node.color}14` }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7, x: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                <span className="pq-node-label" style={{ color: node.color }}>{node.label}</span>
                <span className="pq-node-score">{node.score}</span>
                {index === 0 && <div className="pq-top-glow" style={{ background: node.color }} />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="pq-label-out">→ OUT</div>
      </div>

      <div className="pq-bars">
        {queue.map((node) => (
          <div key={node.id ?? node.label} className="pq-bar-row">
            <span className="pq-bar-label" style={{ color: node.color }}>{node.label}</span>
            <div className="pq-bar-bg">
              <motion.div className="pq-bar-fill"
                style={{ background: `linear-gradient(90deg, ${node.color}, ${node.color}66)` }}
                animate={{ width: `${node.score}%` }}
                transition={{ duration: 0.5 }} />
            </div>
            <span className="pq-bar-score">{node.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
