"""
Python port of the C++ SmartPrepScheduler algorithms:
  - Graph (Kahn's topological sort + cycle detection)
  - Greedy scheduler (dependency-aware insertion sort)
  - DPOptimizer (2D knapsack)
  - RiskDetector
  - FeedbackSystem
"""
from collections import deque


# ── Graph / Topological Sort (Kahn's Algorithm) ───────────────────────────────

class Graph:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]

    def build(self, subjects):
        """subjects: list of dicts with 'prerequisites' (list of 0-based indices)"""
        for i, s in enumerate(subjects):
            for prereq in s.get("prerequisites", []):
                if 0 <= prereq < self.n:
                    self.adj[prereq].append(i)

    def has_cycle(self):
        visited = [False] * self.n
        rec_stack = [False] * self.n

        def dfs(v):
            visited[v] = True
            rec_stack[v] = True
            for nb in self.adj[v]:
                if not visited[nb]:
                    if dfs(nb):
                        return True
                elif rec_stack[nb]:
                    return True
            rec_stack[v] = False
            return False

        for i in range(self.n):
            if not visited[i]:
                if dfs(i):
                    return True
        return False

    def topological_sort(self):
        if self.has_cycle():
            return []
        in_degree = [0] * self.n
        for i in range(self.n):
            for nb in self.adj[i]:
                in_degree[nb] += 1

        q = deque(i for i in range(self.n) if in_degree[i] == 0)
        order = []
        while q:
            u = q.popleft()
            order.append(u)
            for nb in self.adj[u]:
                in_degree[nb] -= 1
                if in_degree[nb] == 0:
                    q.append(nb)
        return order


# ── Greedy Scheduler ──────────────────────────────────────────────────────────

def _higher_greedy_priority(a, b):
    """True if subject dict `a` has strictly higher greedy priority than `b`."""
    if a["exam_deadline"] != b["exam_deadline"]:
        return a["exam_deadline"] < b["exam_deadline"]
    if a["difficulty"] != b["difficulty"]:
        return a["difficulty"] > b["difficulty"]
    rem_a = a["required_hours"] - a["completed_hours"]
    rem_b = b["required_hours"] - b["completed_hours"]
    return rem_a > rem_b


def greedy_schedule(topo_order, subjects):
    """
    Dependency-aware insertion sort that respects prerequisites
    while bubbling higher-priority subjects forward.
    Returns (greedy_order: list[int], log: list[str])
    """
    greedy_order = []
    log = []

    for curr_idx in topo_order:
        greedy_order.append(curr_idx)
        pos = len(greedy_order) - 1

        # Find the rightmost prerequisite position
        prereqs = subjects[curr_idx].get("prerequisites", [])
        min_idx = -1
        for p in prereqs:
            for i in range(pos):
                if greedy_order[i] == p:
                    min_idx = max(min_idx, i)
                    break

        # Bubble backwards
        while pos > min_idx + 1:
            prev_idx = greedy_order[pos - 1]
            if _higher_greedy_priority(subjects[curr_idx], subjects[prev_idx]):
                greedy_order[pos], greedy_order[pos - 1] = greedy_order[pos - 1], greedy_order[pos]
                pos -= 1
            else:
                break

    for i, idx in enumerate(greedy_order):
        s = subjects[idx]
        rem = s["required_hours"] - s["completed_hours"]
        reason = "Highest priority" if i == 0 else _reason(subjects, greedy_order, i)
        log.append({
            "rank": i + 1,
            "subject_id": s.get("id"),
            "name": s["name"],
            "short": s.get("short_name", s["name"][:4]),
            "deadline": s["exam_deadline"],
            "difficulty": s["difficulty"],
            "remaining": rem,
            "reason": reason,
        })

    return greedy_order, log


def _reason(subjects, order, i):
    curr = subjects[order[i]]
    prev = subjects[order[i - 1]]
    if prev["exam_deadline"] < curr["exam_deadline"]:
        return f"Later deadline than {prev['name']}"
    if prev["difficulty"] > curr["difficulty"]:
        return f"Lower difficulty than {prev['name']}"
    rem_prev = prev["required_hours"] - prev["completed_hours"]
    rem_curr = curr["required_hours"] - curr["completed_hours"]
    if rem_prev > rem_curr:
        return f"Fewer remaining hours than {prev['name']}"
    return f"Equal priority to {prev['name']}; topo tie-break"


# ── 2D Knapsack DP ────────────────────────────────────────────────────────────

def dp_allocate(ordered_indices, subjects, daily_limit):
    """
    Knapsack DP: maximise value = difficulty * (1/deadline) * hours.
    Returns (allocation: list[int], dp_table: list[list[float]], log: list[str])
    """
    n = len(ordered_indices)
    if n == 0:
        return [], [], []

    dp = [[0.0] * (daily_limit + 1) for _ in range(n + 1)]
    choice = [[0] * (daily_limit + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        idx = ordered_indices[i - 1]
        s = subjects[idx]
        rem = max(0, s["required_hours"] - s["completed_hours"])
        deadline = max(1, s["exam_deadline"])
        value_per_hr = s["difficulty"] * (1.0 / deadline)

        for w in range(daily_limit + 1):
            dp[i][w] = dp[i - 1][w]
            choice[i][w] = 0
            for h in range(1, min(rem, w) + 1):
                val = dp[i - 1][w - h] + h * value_per_hr
                if val > dp[i][w]:
                    dp[i][w] = val
                    choice[i][w] = h

    # Traceback
    allocation = [0] * n
    w = daily_limit
    for i in range(n, 0, -1):
        h = choice[i][w]
        allocation[i - 1] = h
        w -= h

    # Build log
    log = []
    total_val = 0.0
    total_hrs = 0
    for i, idx in enumerate(ordered_indices):
        s = subjects[idx]
        h = allocation[i]
        if h > 0:
            deadline = max(1, s["exam_deadline"])
            v = s["difficulty"] * (1.0 / deadline) * h
            total_val += v
            total_hrs += h
            log.append({
                "subject_id": s.get("id"),
                "name": s["name"],
                "short": s.get("short_name", s["name"][:4]),
                "hours": h,
                "value": round(v, 3),
                "color": s.get("color", "#8b5cf6"),
            })

    # Flatten dp table for frontend (just first/last few rows to keep payload small)
    dp_preview = [
        {"row": i, "values": [round(dp[i][w], 2) for w in range(daily_limit + 1)]}
        for i in range(n + 1)
    ]

    return allocation, dp_preview, log, round(total_val, 3), total_hrs


# ── Risk Detector ─────────────────────────────────────────────────────────────

def compute_risk(subjects, daily_limit):
    """Returns list of risk dicts, one per subject."""
    results = []
    for s in subjects:
        rem = s["required_hours"] - s["completed_hours"]
        deadline = s["exam_deadline"]

        if rem <= 0:
            level, score, msg = "Completed", 0, "Fully prepared"
            min_daily = 0.0
        elif deadline <= 0:
            level, score, msg = "Failed", 100, "Deadline passed with work remaining"
            min_daily = 0.0
        else:
            max_possible = deadline * daily_limit
            min_daily = rem / deadline
            ratio = rem / max_possible if max_possible > 0 else 1

            # Composite score (mirrors C++ logic + difficulty weight)
            urgency = max(0, 10 - deadline) * 10
            effort = (rem / s["required_hours"]) * 40 if s["required_hours"] > 0 else 0
            diff_w = s["difficulty"] * 6
            score = min(100, round(urgency + effort + diff_w))

            if rem > max_possible:
                level, msg = "Critical", f"Impossible to finish in {deadline} days at {daily_limit}h/day"
            elif ratio > 0.75:
                level, msg = "Warning", f"Heavy load: need {min_daily:.1f}h/day"
            else:
                level, msg = "Safe", f"On track: {min_daily:.1f}h/day needed"

        results.append({
            "subject_id": s.get("id"),
            "name": s["name"],
            "short_name": s.get("short_name", s["name"][:4]),
            "color": s.get("color", "#8b5cf6"),
            "risk_level": level,
            "risk_score": score,
            "min_daily_hrs": round(min_daily, 2),
            "remaining_hours": max(0, s["required_hours"] - s["completed_hours"]),
            "deadline": s["exam_deadline"],
            "message": msg,
        })

    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results


# ── Adaptive Feedback ─────────────────────────────────────────────────────────

def process_feedback(subjects, ordered_indices, planned_allocation, actual_hours_map):
    """
    actual_hours_map: {subject_id: actual_hours_studied}
    Returns updated subjects list + feedback log.
    """
    log = []
    updated = []

    for i, idx in enumerate(ordered_indices):
        s = dict(subjects[idx])
        planned = planned_allocation[i] if i < len(planned_allocation) else 0
        actual = actual_hours_map.get(str(s.get("id")), actual_hours_map.get(s.get("id"), 0))

        s["completed_hours"] = min(s["required_hours"], s["completed_hours"] + actual)

        if actual < planned:
            status = "behind"
            note = f"Behind by {planned - actual}h"
        elif actual > planned:
            status = "ahead"
            note = f"Ahead by {actual - planned}h"
        else:
            status = "on_track"
            note = "Met target"

        log.append({
            "subject_id": s.get("id"),
            "name": s["name"],
            "planned": planned,
            "actual": actual,
            "status": status,
            "note": note,
        })
        updated.append(s)

    # Advance deadlines by 1 day
    for s in updated:
        if s["exam_deadline"] > 0:
            s["exam_deadline"] -= 1

    return updated, log


# ── Priority Queue (for visualizer) ──────────────────────────────────────────

def build_priority_queue(subjects, daily_limit):
    """Compute urgency scores and return sorted priority queue."""
    queue = []
    for s in subjects:
        rem = s["required_hours"] - s["completed_hours"]
        if rem <= 0:
            continue
        deadline = max(1, s["exam_deadline"])
        urgency = max(0, 10 - deadline) * 10
        effort = (rem / s["required_hours"]) * 40 if s["required_hours"] > 0 else 0
        diff_w = s["difficulty"] * 6
        score = min(100, round(urgency + effort + diff_w))
        queue.append({
            "id": s.get("short_name", s["name"][:4]),
            "subject_id": s.get("id"),
            "label": s.get("short_name", s["name"][:4]),
            "name": s["name"],
            "score": score,
            "color": s.get("color", "#8b5cf6"),
            "reason": f"Deadline in {deadline} days",
        })
    queue.sort(key=lambda x: x["score"], reverse=True)
    return queue
