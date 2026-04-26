import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SubjectsPage } from './components/SubjectsPage';
import { TimelinePage } from './components/TimelinePage';
import { RiskPage } from './components/RiskPage';
import { AdaptiveSchedule } from './components/AdaptiveSchedule';
import { LandingPage } from './components/LandingPage';
import { useApp } from './context/AppContext';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  const { backendOnline } = useApp();

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'subjects': return <SubjectsPage />;
      case 'timeline': return <TimelinePage />;
      case 'risk': return <RiskPage />;
      case 'adaptive': return <AdaptiveSchedule />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onHome={() => setShowLanding(true)} />
      <div className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h1 className="gradient-text">SmartPrep Scheduler</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Algorithm-Powered Study Optimizer · DAA Project
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowLanding(true)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
              ← Home
            </button>
            <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: backendOnline ? 'var(--success)' : 'var(--warning)', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{backendOnline ? 'Backend Live' : 'Offline Mode'}</span>
            </div>
          </div>
        </header>
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
