// Shared data store for SmartPrepScheduler
export const initialSubjects = [
  {
    id: '1',
    name: 'Data Structures & Algorithms',
    short: 'DSA',
    deadline: 2,
    required: 20,
    completed: 5,
    difficulty: 5,
    risk: 'Critical',
    color: '#8b5cf6',
    topics: ['Arrays', 'Trees', 'Graphs', 'DP', 'Sorting'],
    priority: 1,
  },
  {
    id: '2',
    name: 'Database Management',
    short: 'DBMS',
    deadline: 5,
    required: 15,
    completed: 10,
    difficulty: 4,
    risk: 'Warning',
    color: '#ec4899',
    topics: ['SQL', 'Normalization', 'Transactions', 'Indexing'],
    priority: 2,
  },
  {
    id: '3',
    name: 'Operating Systems',
    short: 'OS',
    deadline: 7,
    required: 25,
    completed: 5,
    difficulty: 5,
    risk: 'Critical',
    color: '#06b6d4',
    topics: ['Scheduling', 'Memory', 'Deadlock', 'File Systems'],
    priority: 3,
  },
  {
    id: '4',
    name: 'Computer Networks',
    short: 'CN',
    deadline: 10,
    required: 12,
    completed: 8,
    difficulty: 3,
    risk: 'Safe',
    color: '#10b981',
    topics: ['TCP/IP', 'Routing', 'DNS', 'HTTP'],
    priority: 4,
  },
  {
    id: '5',
    name: 'Software Engineering',
    short: 'SE',
    deadline: 12,
    required: 10,
    completed: 6,
    difficulty: 2,
    risk: 'Safe',
    color: '#f59e0b',
    topics: ['SDLC', 'Agile', 'Testing', 'Design Patterns'],
    priority: 5,
  },
  {
    id: '6',
    name: 'Theory of Computation',
    short: 'TOC',
    deadline: 4,
    required: 18,
    completed: 3,
    difficulty: 5,
    risk: 'Critical',
    color: '#ef4444',
    topics: ['Automata', 'Grammars', 'Turing Machines', 'Complexity'],
    priority: 6,
  },
];

// Knapsack DP schedule output (8 hours available)
export const dpSchedule = [
  { subject: 'DSA', full: 'Data Structures & Algorithms', duration: 3, start: '09:00 AM', end: '12:00 PM', color: '#8b5cf6', type: 'Critical' },
  { subject: 'TOC', full: 'Theory of Computation', duration: 2, start: '12:30 PM', end: '02:30 PM', color: '#ef4444', type: 'Critical' },
  { subject: 'DBMS', full: 'Database Management', duration: 2, start: '03:00 PM', end: '05:00 PM', color: '#ec4899', type: 'Warning' },
  { subject: 'OS', full: 'Operating Systems', duration: 1, start: '05:30 PM', end: '06:30 PM', color: '#06b6d4', type: 'Critical' },
];

// Priority queue state (min-heap by urgency score)
export const priorityQueueData = [
  { id: 'DSA', label: 'DSA', score: 95, color: '#8b5cf6', reason: 'Deadline in 2 days' },
  { id: 'TOC', label: 'TOC', score: 88, color: '#ef4444', reason: 'Deadline in 4 days' },
  { id: 'DBMS', label: 'DBMS', score: 72, color: '#ec4899', reason: 'Deadline in 5 days' },
  { id: 'OS', label: 'OS', score: 65, color: '#06b6d4', reason: 'High effort needed' },
  { id: 'CN', label: 'CN', score: 40, color: '#10b981', reason: 'On track' },
  { id: 'SE', label: 'SE', score: 30, color: '#f59e0b', reason: 'Low risk' },
];

// Heatmap calendar data (next 14 days)
export const heatmapData = (() => {
  const today = new Date();
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const load = [0, 3, 5, 2, 8, 4, 6, 1, 7, 3, 5, 2, 4, 6][i];
    days.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      load,
      exams: i === 2 ? ['DSA'] : i === 4 ? ['TOC', 'DBMS'] : i === 7 ? ['OS'] : [],
    });
  }
  return days;
})();
