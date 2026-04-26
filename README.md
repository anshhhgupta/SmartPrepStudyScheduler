# SmartPrepScheduler

Algorithm-powered study optimizer — DAA Project.

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 19 + Vite + Framer Motion   |
| Backend  | Python Flask + SQLite             |
| Algorithms | Kahn's Topo Sort, Greedy, 2D Knapsack DP, Risk Detection |

## Quick Start (Windows)

```powershell
# From project root — starts both servers
.\start.ps1
```

Then open **http://localhost:5173**

---

## Manual Setup

### Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Seed database with demo subjects
python backend/seed.py

# Start API server (port 5000)
python backend/app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| GET    | /api/health                 | Health check                       |
| GET    | /api/subjects               | List all subjects                  |
| POST   | /api/subjects               | Add subject                        |
| PUT    | /api/subjects/:id           | Update subject                     |
| DELETE | /api/subjects/:id           | Delete subject                     |
| PATCH  | /api/subjects/:id/progress  | Update completed hours             |
| POST   | /api/schedule/generate      | Run full algorithm pipeline        |
| GET    | /api/schedule/latest        | Get last generated schedule        |
| POST   | /api/schedule/multiday      | Generate multi-day plan            |
| GET    | /api/risk                   | Compute risk for all subjects      |
| GET    | /api/priority-queue         | Get priority queue state           |
| POST   | /api/feedback               | Submit actual hours (adaptive)     |
| GET    | /api/progress               | Get progress logs                  |
| GET    | /api/user                   | Get user settings                  |
| PUT    | /api/user                   | Update daily limit                 |

---

## Database Tables (SQLite — backend/smartprep.db)

- `users` — user profile + daily study limit
- `subjects` — subject data with deadlines, difficulty, hours
- `study_tasks` — individual tasks per subject
- `deadlines` — deadline records
- `risk_flags` — computed risk levels
- `generated_schedules` — saved algorithm outputs
- `progress_logs` — daily actual vs planned hours

---

## Algorithms Implemented

| Algorithm | Complexity | Purpose |
|-----------|-----------|---------|
| Kahn's Topological Sort | O(V+E) | Prerequisite ordering |
| Greedy Insertion Sort | O(n²) | Priority-aware scheduling |
| 2D Knapsack DP | O(n×W) | Optimal hour allocation |
| Risk Scoring | O(n log n) | Deadline risk detection |
| Max-Heap Priority Queue | O(log n) | Subject prioritization |

---

## Pages

| Page | Description |
|------|-------------|
| Dashboard | Stats, run scheduler, live algorithm output |
| Subjects | CRUD — add/edit/delete subjects, update progress |
| Timeline | DP schedule, bar charts, 14-day heatmap, multi-day plan |
| Risk Analysis | Radar chart, scatter matrix, ranked risk list |
| Adaptive Schedule | Live priority queue simulation + feedback form |
| DAA Visualizer | Step-by-step algorithm visualization for viva |

---

## Re-seed Database

```bash
# Delete existing DB and re-seed
del backend\smartprep.db
python backend/seed.py
```
