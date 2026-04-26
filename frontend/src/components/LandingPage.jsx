import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, BookOpen, Cpu, GitBranch, BarChart2, Shield, Zap, CheckCircle, Clock, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './LandingPage.css';

// Animated counter
const Counter = ({ target, suffix = '', duration = 2000 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <>{val}{suffix}</>;
};

const ALGO_CARDS = [
  { icon: '🏔️', name: "Kahn's Topological Sort", complexity: 'O(V + E)', color: '#8b5cf6',
    desc: 'Orders subjects respecting all prerequisite dependencies using BFS in-degree reduction.' },
  { icon: '⚡', name: 'Greedy Insertion Sort', complexity: 'O(n²)', color: '#06b6d4',
    desc: 'Dependency-aware insertion sort that bubbles higher-priority subjects forward.' },
  { icon: '🎒', name: '2D Knapsack DP', complexity: 'O(n × W)', color: '#ec4899',
    desc: 'Maximises study value = difficulty × (1/deadline) × hours within daily time budget.' },
  { icon: '🛡️', name: 'Risk Detection', complexity: 'O(n log n)', color: '#ef4444',
    desc: 'Composite scoring: urgency + effort ratio + difficulty weight, sorted descending.' },
  { icon: '📊', name: 'Max-Heap Priority Queue', complexity: 'O(log n)', color: '#f59e0b',
    desc: 'Maintains subject priority order with O(log n) insert/extract for live reordering.' },
];

const WORKFLOW = [
  { num: '01', title: 'Input Subjects', desc: 'Add subjects with deadlines, difficulty, hours', color: '#8b5cf6', icon: <BookOpen size={18} /> },
  { num: '02', title: 'Topo Sort', desc: "Kahn's BFS validates prerequisites", color: '#06b6d4', icon: <GitBranch size={18} /> },
  { num: '03', title: 'Greedy Order', desc: 'Priority-aware insertion sort', color: '#ec4899', icon: <Zap size={18} /> },
  { num: '04', title: 'DP Allocation', desc: 'Knapsack maximises daily value', color: '#f59e0b', icon: <BarChart2 size={18} /> },
  { num: '05', title: 'Risk Analysis', desc: 'Composite score flags danger', color: '#ef4444', icon: <Shield size={18} /> },
  { num: '06', title: 'Adaptive Update', desc: 'Feedback re-prioritises queue', color: '#10b981', icon: <TrendingUp size={18} /> },
];

const TECH_STACK = [
  { icon: '⚛️', name: 'React 19',      role: 'Frontend UI',        color: '#61dafb' },
  { icon: '🐍', name: 'Python Flask',  role: 'REST API Backend',   color: '#10b981' },
  { icon: '🗄️', name: 'SQLite',        role: 'Persistent Storage', color: '#06b6d4' },
  { icon: '🎞️', name: 'Framer Motion', role: 'Animations',         color: '#ec4899' },
  { icon: '📈', name: 'Recharts',      role: 'Data Visualization', color: '#8b5cf6' },
  { icon: '⚡', name: 'Vite',          role: 'Build Tool',         color: '#f59e0b' },
  { icon: '🎨', name: 'CSS Variables', role: 'Design System',      color: '#a78bfa' },
  { icon: '🔗', name: 'Axios',         role: 'HTTP Client',        color: '#ef4444' },
];

const HOW_IT_WORKS = [
  {
    icon: '🏔️', title: "Kahn's Topological Sort", color: '#8b5cf6',
    complexity: 'Time: O(V+E) · Space: O(V)',
    steps: [
      'Compute in-degree for every subject node',
      'Enqueue all nodes with in-degree = 0',
      'Dequeue node u → append to result order',
      'For each edge u→v: decrement in-degree[v]',
      'If in-degree[v] = 0 → enqueue v',
    ],
    code: `in_deg = [0] * n\nfor u in adj: in_deg[v]++\nqueue = [v for v if in_deg[v]==0]\nwhile queue: result.append(queue.pop())`,
  },
  {
    icon: '🎒', title: '2D Knapsack DP', color: '#ec4899',
    complexity: 'Time: O(n×W) · Space: O(n×W)',
    steps: [
      'dp[i][w] = max value using first i subjects, w hours',
      'value_per_hr = difficulty × (1 / deadline)',
      'For each subject: try allocating 1..min(rem,w) hours',
      'Traceback choice table to extract allocation',
      'Output: hours per subject maximising total value',
    ],
    code: `for i in range(1, n+1):\n  for w in range(W+1):\n    for h in range(1, min(rem,w)+1):\n      dp[i][w] = max(dp[i][w], dp[i-1][w-h]+h*vpH)`,
  },
  {
    icon: '⚡', title: 'Greedy Insertion Sort', color: '#06b6d4',
    complexity: 'Time: O(n²) · Space: O(n)',
    steps: [
      'Start from valid topological order',
      'For each subject: insert at end of working list',
      'Bubble backwards while higher greedy priority',
      'Priority: earliest deadline → highest difficulty → most remaining',
      'Never cross prerequisite boundary during bubble',
    ],
    code: `for curr in topo_order:\n  order.append(curr)\n  while pos > min_prereq+1:\n    if priority(curr) > priority(prev):\n      swap(order, pos, pos-1)`,
  },
  {
    icon: '🛡️', title: 'Risk Detection', color: '#ef4444',
    complexity: 'Time: O(n log n) · Space: O(n)',
    steps: [
      'urgency = max(0, 10 − deadline) × 10',
      'effort = (remaining / required) × 40',
      'diff_weight = difficulty × 6',
      'score = min(100, urgency + effort + diff_weight)',
      'Classify: Critical / Warning / Safe by ratio',
    ],
    code: `urgency = max(0, 10-deadline)*10\neffort = (rem/required)*40\nscore = min(100, urgency+effort+diff*6)\nlevel = "Critical" if rem>max_possible else ...`,
  },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export const LandingPage = ({ onEnter }) => {
  const { subjects, risk, backendOnline } = useApp();

  const totalHours   = subjects.reduce((a, s) => a + (s.required_hours ?? 0), 0);
  const doneHours    = subjects.reduce((a, s) => a + (s.completed_hours ?? 0), 0);
  const criticalCount = risk.filter(r => r.risk_level === 'Critical').length;
  const overallPct   = totalHours > 0 ? Math.round((doneHours / totalHours) * 100) : 37;

  return (
    <div className="landing">
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      <div className="landing-content">
        {/* ── Nav ── */}
        <nav className="landing-nav">
          <div className="nav-brand">
            <div className="nav-logo">SP</div>
            <div>
              <div className="nav-title">SmartPrep Scheduler</div>
              <div className="nav-subtitle">DAA Course Project · B.Tech CSE</div>
            </div>
          </div>
          <div className="nav-badges">
            <span className="nav-badge" style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.1)' }}>
              DAA Project
            </span>
            <span className="nav-badge" style={{ color: backendOnline ? '#10b981' : '#f59e0b', borderColor: backendOnline ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)', background: backendOnline ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
              ● {backendOnline ? 'Backend Live' : 'Offline Mode'}
            </span>
          </div>
          <button className="nav-cta" onClick={onEnter}>
            Open App <ArrowRight size={16} />
          </button>
        </nav>

        {/* ── Hero ── */}
        <motion.section className="hero"
          initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp} className="hero-eyebrow">
            <Cpu size={13} /> Design & Analysis of Algorithms · Final Project
          </motion.div>
          <motion.h1 variants={fadeUp} className="hero-title">
            Intelligent Study Scheduling<br />
            <span className="line-accent">Powered by DAA Algorithms</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="hero-desc">
            A full-stack research project combining Topological Sort, Greedy Scheduling,
            2D Knapsack DP, and Adaptive Risk Detection to optimise exam preparation.
          </motion.p>
          <motion.div variants={fadeUp} className="hero-actions">
            <button className="btn-primary" onClick={onEnter}>
              <Play size={18} fill="currentColor" /> Launch Application
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              <BookOpen size={18} /> How It Works
            </button>
          </motion.div>
        </motion.section>

        {/* ── Live Metrics ── */}
        <motion.div className="metrics-strip"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          {[
            { val: subjects.length || 6, suffix: '', label: 'Subjects Tracked', color: '#8b5cf6' },
            { val: overallPct, suffix: '%', label: 'Overall Progress', color: '#10b981' },
            { val: criticalCount || 3, suffix: '', label: 'Critical Alerts', color: '#ef4444' },
            { val: totalHours || 100, suffix: 'h', label: 'Total Study Hours', color: '#06b6d4' },
            { val: 5, suffix: '', label: 'Algorithms Used', color: '#ec4899' },
          ].map((m, i) => (
            <div key={i} className="metric-item">
              <div className="metric-val" style={{ color: m.color }}>
                <Counter target={m.val} suffix={m.suffix} duration={1500 + i * 200} />
              </div>
              <div className="metric-lbl">{m.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Demo Banner ── */}
        <motion.div className="demo-banner"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <div className="demo-banner-text">
            <h3>🎯 Demo Mode Available</h3>
            <p>Pre-loaded with 6 CS subjects (DSA, DBMS, OS, CN, SE, TOC) and realistic study data for immediate demonstration.</p>
          </div>
          <button className="btn-primary" style={{ fontSize: '0.88rem', padding: '10px 22px' }} onClick={onEnter}>
            View Demo <ChevronRight size={15} />
          </button>
        </motion.div>

        {/* ── Algorithms ── */}
        <section className="landing-section">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-eyebrow">Core Algorithms</motion.div>
            <motion.h2 variants={fadeUp} className="section-title">Five DAA Algorithms, One System</motion.h2>
            <motion.p variants={fadeUp} className="section-desc">
              Each algorithm solves a specific scheduling sub-problem, chained together into a complete optimization pipeline.
            </motion.p>
            <motion.div variants={stagger} className="algo-cards">
              {ALGO_CARDS.map((a, i) => (
                <motion.div key={i} variants={fadeUp} className="algo-card"
                  style={{ borderColor: `${a.color}30` }}
                  whileHover={{ borderColor: `${a.color}60`, background: `${a.color}08` }}>
                  <div className="algo-card-icon" style={{ background: `${a.color}18` }}>{a.icon}</div>
                  <div className="algo-card-name" style={{ color: a.color }}>{a.name}</div>
                  <div className="algo-card-complexity" style={{ color: a.color }}>{a.complexity}</div>
                  <div className="algo-card-desc">{a.desc}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── Workflow ── */}
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-eyebrow">Pipeline</motion.div>
            <motion.h2 variants={fadeUp} className="section-title">Algorithm Execution Workflow</motion.h2>
            <motion.p variants={fadeUp} className="section-desc">
              From raw subject data to an optimised daily schedule in 6 deterministic steps.
            </motion.p>
            <motion.div variants={fadeUp} className="workflow-steps">
              {WORKFLOW.map((step, i) => (
                <>
                  <div key={step.num} className="workflow-step">
                    <motion.div className="workflow-step-num"
                      style={{ borderColor: step.color, background: `${step.color}15`, color: step.color }}
                      whileHover={{ scale: 1.1 }}>
                      {step.icon}
                    </motion.div>
                    <div className="workflow-step-title">{step.title}</div>
                    <div className="workflow-step-desc">{step.desc}</div>
                  </div>
                  {i < WORKFLOW.length - 1 && <div key={`conn-${i}`} className="workflow-connector" />}
                </>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── How It Works ── */}
        <section className="landing-section" id="how-it-works" style={{ paddingTop: 0 }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-eyebrow">Deep Dive</motion.div>
            <motion.h2 variants={fadeUp} className="section-title">How Each Algorithm Works</motion.h2>
            <motion.p variants={fadeUp} className="section-desc">
              Step-by-step breakdown of every algorithm with pseudocode — ready for viva demonstration.
            </motion.p>
            <motion.div variants={stagger} className="how-grid">
              {HOW_IT_WORKS.map((h, i) => (
                <motion.div key={i} variants={fadeUp} className="how-card"
                  whileHover={{ borderColor: `${h.color}40` }}>
                  <div className="how-card-header">
                    <div className="how-card-icon" style={{ background: `${h.color}18` }}>{h.icon}</div>
                    <div>
                      <div className="how-card-title" style={{ color: h.color }}>{h.title}</div>
                      <div className="how-card-complexity" style={{ color: 'var(--text-secondary)' }}>{h.complexity}</div>
                    </div>
                  </div>
                  <div className="how-steps">
                    {h.steps.map((s, j) => (
                      <div key={j} className="how-step">
                        <div className="how-step-dot" style={{ background: h.color }} />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="how-code">{h.code}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── Tech Stack ── */}
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-eyebrow">Technology</motion.div>
            <motion.h2 variants={fadeUp} className="section-title">Full-Stack Tech Stack</motion.h2>
            <motion.p variants={fadeUp} className="section-desc">
              Production-grade tools chosen for performance, developer experience, and academic demonstration.
            </motion.p>
            <motion.div variants={stagger} className="tech-grid">
              {TECH_STACK.map((t, i) => (
                <motion.div key={i} variants={fadeUp} className="tech-card" whileHover={{ scale: 1.04 }}>
                  <div className="tech-icon">{t.icon}</div>
                  <div className="tech-name" style={{ color: t.color }}>{t.name}</div>
                  <div className="tech-role">{t.role}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── CTA ── */}
        <section className="landing-section" style={{ paddingTop: 0, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ padding: '60px 40px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: 16 }}>Ready for the Demo?</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1rem' }}>
                All 6 subjects pre-loaded. Run the scheduler to see all 5 algorithms execute live.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={onEnter} style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                  <Play size={20} fill="currentColor" /> Launch SmartPrep
                </button>
              </div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
                {[
                  { icon: <CheckCircle size={15} />, text: 'SQLite persistence' },
                  { icon: <CheckCircle size={15} />, text: 'Live backend API' },
                  { icon: <CheckCircle size={15} />, text: 'Real algorithm output' },
                  { icon: <CheckCircle size={15} />, text: 'Adaptive feedback loop' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#10b981' }}>{f.icon}</span> {f.text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Footer ── */}
        <footer className="landing-footer">
          <div className="footer-brand">
            <strong>SmartPrep Scheduler</strong> · Design & Analysis of Algorithms · B.Tech CSE
          </div>
          <div className="footer-tags">
            {['Topological Sort', 'Greedy', 'Knapsack DP', 'Risk Detection', 'Max-Heap'].map(t => (
              <span key={t} className="footer-tag">{t}</span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};
