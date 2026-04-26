/**
 * Global app state — subjects, schedule, risk, priority queue.
 * All components read from here; API calls are centralised.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchSubjects, generateSchedule, fetchLatestSchedule,
  fetchRisk, fetchPriorityQueue, submitFeedback,
  fetchUser, updateUser as apiUpdateUser,
  checkHealth,
} from '../api/client';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [subjects,      setSubjects]      = useState([]);
  const [schedule,      setSchedule]      = useState(null);   // latest generated schedule
  const [risk,          setRisk]          = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [user,          setUser]          = useState({ name: 'Student', daily_limit: 8 });
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [algoLog,       setAlgoLog]       = useState('');
  const [dpTable,       setDpTable]       = useState([]);
  const [greedyLog,     setGreedyLog]     = useState([]);
  const [dpLog,         setDpLog]         = useState([]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  const bootstrap = useCallback(async () => {
    try {
      await checkHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
      return; // backend offline — keep using static data
    }

    try {
      const [subs, usr, riskData, pq, sched] = await Promise.all([
        fetchSubjects(),
        fetchUser(),
        fetchRisk(),
        fetchPriorityQueue(),
        fetchLatestSchedule(),
      ]);
      setSubjects(subs);
      setUser(usr);
      setRisk(riskData);
      setPriorityQueue(pq);
      // schedule_blocks always present now (empty array when no schedule exists)
      if (sched?.schedule_blocks?.length > 0) setSchedule(sched);
    } catch (e) {
      console.error('Bootstrap error:', e);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  // ── Run Scheduler ──────────────────────────────────────────────────────────
  const runScheduler = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateSchedule(user.daily_limit);
      setSchedule(result);
      setAlgoLog(result.algorithm_log || '');
      setDpTable(result.dp_table || []);
      setGreedyLog(result.greedy_log || []);
      setDpLog(result.dp_log || []);
      setRisk(result.risk || []);
      setPriorityQueue(result.priority_queue || []);
      // Refresh subjects (completed_hours unchanged but risk may differ)
      const subs = await fetchSubjects();
      setSubjects(subs);
      return result;
    } finally {
      setLoading(false);
    }
  }, [user.daily_limit]);

  // ── Refresh subjects + risk ────────────────────────────────────────────────
  const refreshSubjects = useCallback(async () => {
    const [subs, riskData, pq] = await Promise.all([
      fetchSubjects(),
      fetchRisk(),
      fetchPriorityQueue(),
    ]);
    setSubjects(subs);
    setRisk(riskData);
    setPriorityQueue(pq);
  }, []);

  // ── Submit feedback ────────────────────────────────────────────────────────
  const sendFeedback = useCallback(async (actualMap) => {
    setLoading(true);
    try {
      const result = await submitFeedback(actualMap);
      setSubjects(result.updated_subjects || []);
      setRisk(result.risk || []);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Update user settings ───────────────────────────────────────────────────
  const saveUser = useCallback(async (data) => {
    const updated = await apiUpdateUser(data);
    setUser(updated);
  }, []);

  return (
    <AppContext.Provider value={{
      subjects, setSubjects,
      schedule, setSchedule,
      risk, setRisk,
      priorityQueue, setPriorityQueue,
      user, saveUser,
      backendOnline,
      loading,
      algoLog, dpTable, greedyLog, dpLog,
      runScheduler,
      refreshSubjects,
      sendFeedback,
      bootstrap,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
