"""
SmartPrepScheduler Flask API
Run: python backend/app.py
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

from database import (
    init_db, get_user, update_user,
    get_subjects, get_subject, create_subject, update_subject,
    delete_subject, patch_subject_progress,
    get_tasks, create_task, update_task_status,
    save_schedule, get_latest_schedule,
    save_risk_flags, get_risk_flags,
    log_progress, get_progress_logs,
)
from algorithms import (
    Graph, greedy_schedule, dp_allocate,
    compute_risk, process_feedback, build_priority_queue,
)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

init_db()


def err(msg, code=400):
    return jsonify({"error": msg}), code


def ok(data, code=200):
    return jsonify(data), code


# ── Health ────────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return ok({"status": "ok", "service": "SmartPrepScheduler"})


# ── User ──────────────────────────────────────────────────────────────────────

@app.route("/api/user", methods=["GET"])
def get_user_route():
    return ok(get_user(1))


@app.route("/api/user", methods=["PUT"])
def update_user_route():
    update_user(1, request.json)
    return ok(get_user(1))


# ── Subjects CRUD ─────────────────────────────────────────────────────────────

@app.route("/api/subjects", methods=["GET"])
def list_subjects():
    return ok(get_subjects(1))


@app.route("/api/subjects", methods=["POST"])
def add_subject():
    data = request.json
    required = ["name", "exam_deadline", "difficulty", "required_hours"]
    for f in required:
        if f not in data:
            return err(f"Missing field: {f}")
    return ok(create_subject(data, user_id=1), 201)


@app.route("/api/subjects/<int:sid>", methods=["GET"])
def get_subject_route(sid):
    s = get_subject(sid)
    return ok(s) if s else err("Not found", 404)


@app.route("/api/subjects/<int:sid>", methods=["PUT"])
def update_subject_route(sid):
    s = update_subject(sid, request.json)
    return ok(s) if s else err("Not found", 404)


@app.route("/api/subjects/<int:sid>", methods=["DELETE"])
def delete_subject_route(sid):
    delete_subject(sid)
    return ok({"deleted": sid})


@app.route("/api/subjects/<int:sid>/progress", methods=["PATCH"])
def patch_progress(sid):
    completed = request.json.get("completed_hours")
    if completed is None:
        return err("completed_hours required")
    s = patch_subject_progress(sid, completed)
    return ok(s)


# ── Study Tasks ───────────────────────────────────────────────────────────────

@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    sid = request.args.get("subject_id")
    return ok(get_tasks(int(sid) if sid else None))


@app.route("/api/tasks", methods=["POST"])
def add_task():
    return ok(create_task(request.json), 201)


@app.route("/api/tasks/<int:tid>/status", methods=["PATCH"])
def patch_task_status(tid):
    status = request.json.get("status")
    if not status:
        return err("status required")
    update_task_status(tid, status)
    return ok({"updated": tid, "status": status})


# ── Core Algorithm: Generate Schedule ────────────────────────────────────────

@app.route("/api/schedule/generate", methods=["POST"])
def generate_schedule():
    """
    Full pipeline: topo sort → greedy → knapsack DP.
    Saves result to generated_schedules table.
    Returns rich response for frontend live visualization.
    """
    user = get_user(1)
    daily_limit = request.json.get("daily_limit", user["daily_limit"]) if request.json else user["daily_limit"]

    subjects = get_subjects(1)
    if not subjects:
        return err("No subjects found. Add subjects first.")

    n = len(subjects)
    g = Graph(n)
    g.build(subjects)

    topo_order = g.topological_sort()
    if not topo_order:
        return err("Cycle detected in prerequisites. Fix circular dependencies.")

    greedy_order, greedy_log = greedy_schedule(topo_order, subjects)
    allocation, dp_table, dp_log, total_value, total_hrs = dp_allocate(greedy_order, subjects, daily_limit)

    # Build schedule blocks for timeline
    schedule_blocks = []
    hour_cursor = 9  # start at 9 AM
    for i, idx in enumerate(greedy_order):
        h = allocation[i]
        if h > 0:
            s = subjects[idx]
            start_h = hour_cursor
            end_h = hour_cursor + h
            schedule_blocks.append({
                "subject_id": s["id"],
                "subject": s.get("short_name", s["name"][:4]),
                "full": s["name"],
                "duration": h,
                "start": _fmt_time(start_h),
                "end": _fmt_time(end_h),
                "color": s.get("color", "#8b5cf6"),
                "type": _risk_label(s, daily_limit),
            })
            hour_cursor = end_h + (0.5 if end_h < 17 else 0)

    # Build algorithm log string
    algo_log_lines = ["=== TOPOLOGICAL SORT (Kahn's) ==="]
    for i, idx in enumerate(topo_order):
        algo_log_lines.append(f"  {i+1}. {subjects[idx]['name']}")
    algo_log_lines.append("\n=== GREEDY PRIORITIZATION ===")
    for entry in greedy_log:
        algo_log_lines.append(f"  #{entry['rank']} {entry['name']} — {entry['reason']}")
    algo_log_lines.append("\n=== KNAPSACK DP ALLOCATION ===")
    for entry in dp_log:
        algo_log_lines.append(f"  {entry['name']}: {entry['hours']}h (value={entry['value']})")
    algo_log_lines.append(f"\nTotal: {total_hrs}h / {daily_limit}h  |  Value: {total_value}")
    algo_log = "\n".join(algo_log_lines)

    sched_id = save_schedule(1, topo_order, greedy_order, allocation, total_hrs, algo_log)

    # Compute and save risk flags
    risk_data = compute_risk(subjects, daily_limit)
    save_risk_flags([{
        "subject_id": r["subject_id"],
        "risk_level": r["risk_level"],
        "risk_score": r["risk_score"],
        "min_daily_hrs": r["min_daily_hrs"],
        "message": r["message"],
    } for r in risk_data])

    # Priority queue
    pq = build_priority_queue(subjects, daily_limit)

    return ok({
        "schedule_id": sched_id,
        "daily_limit": daily_limit,
        "topo_order": [subjects[i]["name"] for i in topo_order],
        "greedy_log": greedy_log,
        "dp_log": dp_log,
        "dp_table": dp_table,
        "schedule_blocks": schedule_blocks,
        "total_hours": total_hrs,
        "total_value": total_value,
        "algorithm_log": algo_log,
        "risk": risk_data,
        "priority_queue": pq,
    })


@app.route("/api/schedule/latest", methods=["GET"])
def latest_schedule():
    sched = get_latest_schedule(1)
    if not sched:
        # Return consistent shape — frontend checks schedule_blocks
        return ok({"schedule_blocks": [], "total_hours": 0, "algorithm_log": ""})
    subjects = get_subjects(1)
    user = get_user(1)
    daily_limit = user["daily_limit"]

    greedy_order = sched["greedy_order"]
    allocation = sched["dp_allocation"]

    schedule_blocks = []
    hour_cursor = 9
    for i, idx in enumerate(greedy_order):
        if idx >= len(subjects):
            continue
        h = allocation[i] if i < len(allocation) else 0
        if h > 0:
            s = subjects[idx]
            start_h = hour_cursor
            end_h = hour_cursor + h
            schedule_blocks.append({
                "subject_id": s["id"],
                "subject": s.get("short_name", s["name"][:4]),
                "full": s["name"],
                "duration": h,
                "start": _fmt_time(start_h),
                "end": _fmt_time(end_h),
                "color": s.get("color", "#8b5cf6"),
                "type": _risk_label(s, daily_limit),
            })
            hour_cursor = end_h + 0.5

    return ok({**sched, "schedule_blocks": schedule_blocks})


# ── Risk Analysis ─────────────────────────────────────────────────────────────

@app.route("/api/risk", methods=["GET"])
def risk_report():
    subjects = get_subjects(1)
    user = get_user(1)
    risk_data = compute_risk(subjects, user["daily_limit"])
    save_risk_flags([{
        "subject_id": r["subject_id"],
        "risk_level": r["risk_level"],
        "risk_score": r["risk_score"],
        "min_daily_hrs": r["min_daily_hrs"],
        "message": r["message"],
    } for r in risk_data])
    return ok(risk_data)


@app.route("/api/risk/flags", methods=["GET"])
def risk_flags():
    return ok(get_risk_flags())


# ── Priority Queue ────────────────────────────────────────────────────────────

@app.route("/api/priority-queue", methods=["GET"])
def priority_queue():
    subjects = get_subjects(1)
    user = get_user(1)
    return ok(build_priority_queue(subjects, user["daily_limit"]))


# ── Adaptive Feedback ─────────────────────────────────────────────────────────

@app.route("/api/feedback", methods=["POST"])
def feedback():
    """
    Body: { actual_hours: { subject_id: hours, ... } }
    Uses latest schedule's greedy_order + dp_allocation.
    """
    data = request.json or {}
    actual_map = data.get("actual_hours", {})

    sched = get_latest_schedule(1)
    if not sched:
        return err("No schedule found. Generate a schedule first.")

    subjects = get_subjects(1)
    greedy_order = sched["greedy_order"]
    planned_alloc = sched["dp_allocation"]

    updated_subjects, fb_log = process_feedback(subjects, greedy_order, planned_alloc, actual_map)

    # Persist updated subjects
    for s in updated_subjects:
        patch_subject_progress(s["id"], s["completed_hours"])

    # Log progress
    for entry in fb_log:
        log_progress(
            entry["subject_id"],
            entry["planned"],
            entry["actual"],
            entry["status"],
            entry["note"],
        )

    # Recompute risk after feedback
    refreshed = get_subjects(1)
    user = get_user(1)
    risk_data = compute_risk(refreshed, user["daily_limit"])
    save_risk_flags([{
        "subject_id": r["subject_id"],
        "risk_level": r["risk_level"],
        "risk_score": r["risk_score"],
        "min_daily_hrs": r["min_daily_hrs"],
        "message": r["message"],
    } for r in risk_data])

    return ok({
        "feedback_log": fb_log,
        "updated_subjects": refreshed,
        "risk": risk_data,
    })


# ── Progress Logs ─────────────────────────────────────────────────────────────

@app.route("/api/progress", methods=["GET"])
def progress():
    sid = request.args.get("subject_id")
    return ok(get_progress_logs(int(sid) if sid else None))


# ── Multi-day Plan ────────────────────────────────────────────────────────────

@app.route("/api/schedule/multiday", methods=["POST"])
def multiday():
    user = get_user(1)
    daily_limit = request.json.get("daily_limit", user["daily_limit"]) if request.json else user["daily_limit"]
    subjects_orig = get_subjects(1)
    if not subjects_orig:
        return err("No subjects found.")

    import copy
    subjects = copy.deepcopy(subjects_orig)
    max_days = max((s["exam_deadline"] for s in subjects), default=0)
    if max_days <= 0:
        return err("No upcoming deadlines.")

    plan = []
    for day in range(1, max_days + 1):
        n = len(subjects)
        g = Graph(n)
        g.build(subjects)
        topo = g.topological_sort()
        if not topo:
            break
        greedy, _ = greedy_schedule(topo, subjects)
        alloc, _, dp_log, _, total_hrs = dp_allocate(greedy, subjects, daily_limit)

        day_entries = []
        for i, idx in enumerate(greedy):
            h = alloc[i]
            if h > 0:
                subjects[idx]["completed_hours"] = min(
                    subjects[idx]["required_hours"],
                    subjects[idx]["completed_hours"] + h
                )
                pct = round(subjects[idx]["completed_hours"] / subjects[idx]["required_hours"] * 100, 1)
                day_entries.append({
                    "subject": subjects[idx].get("short_name", subjects[idx]["name"][:4]),
                    "name": subjects[idx]["name"],
                    "hours": h,
                    "progress_pct": pct,
                    "color": subjects[idx].get("color", "#8b5cf6"),
                })

        if day_entries:
            plan.append({"day": day, "entries": day_entries, "total_hours": total_hrs})

        for s in subjects:
            if s["exam_deadline"] > 0:
                s["exam_deadline"] -= 1

    return ok({"plan": plan, "days": max_days})


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt_time(h):
    hour = int(h)
    mins = int(round((h - hour) * 60))
    if mins == 60:
        hour += 1
        mins = 0
    suffix = "AM" if hour < 12 else "PM"
    display = hour % 12
    if display == 0:
        display = 12
    return f"{display}:{mins:02d} {suffix}"


def _risk_label(s, daily_limit):
    rem = s["required_hours"] - s["completed_hours"]
    deadline = max(1, s["exam_deadline"])
    max_possible = deadline * daily_limit
    if rem > max_possible:
        return "Critical"
    if rem > 0.75 * max_possible:
        return "Warning"
    return "Safe"


if __name__ == "__main__":
    app.run(debug=True, port=5000)
