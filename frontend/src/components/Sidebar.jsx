import { useState } from 'react';
import { Home, BookOpen, Clock, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

export const Sidebar = ({ activePage, setActivePage, onHome }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard',  icon: <Home size={20} />,          label: 'Dashboard' },
    { id: 'subjects',   icon: <BookOpen size={20} />,       label: 'Subjects' },
    { id: 'timeline',   icon: <Clock size={20} />,          label: 'Timeline' },
    { id: 'risk',       icon: <AlertTriangle size={20} />,  label: 'Risk Analysis' },
    { id: 'adaptive',   icon: <RefreshCw size={20} />,      label: 'Adaptive Schedule' },
  ];

  return (
    <motion.aside
      className="sidebar glass-panel"
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="sidebar-logo">
        <div className="logo-icon">SP</div>
        <AnimatePresence>
          {!collapsed && (
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              SmartPrep
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="nav-label"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {activePage === item.id && <div className="active-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={onHome} title={collapsed ? 'Home' : ''}>
          <span className="nav-icon"><Settings size={20} /></span>
          {!collapsed && <span className="nav-label">← Home</span>}
        </button>
        <button className="nav-item" title={collapsed ? 'Profile' : ''}>
          <span className="nav-icon"><User size={20} /></span>
          {!collapsed && <span className="nav-label">Profile</span>}
        </button>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
};
