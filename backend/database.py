"""
SQLite database layer for SmartPrepScheduler.
All tables are created on first run; file persists at backend/smartprep.db
"""
import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "smartprep.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL DEFAULT 'Student',
            daily_limit INTEGER NOT NULL DEFAULT 8,
            created_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS subjects (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id          INTEGER NOT NULL DEFAULT 1,
            name             TEXT    NOT NULL,
            short_name       TEXT    NOT NULL,
            exam_deadline    INTEGER NOT NULL,
            difficulty       INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
            required_hours   INTEGER NOT NULL,
            completed_hours  INTEGER NOT NULL DEFAULT 0,
            color            TEXT    DEFAULT '#8b5cf6',
            topics           TEXT    DEFAULT '[]',
            prerequisites    TEXT    DEFAULT '[]',
            created_at       TEXT    DEFAULT (datetime('now')),
            updated_at       TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS study_tasks (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id   INTEGER NOT NULL,
            task_name    TEXT    NOT NULL,
            duration_hrs INTEGER NOT NULL DEFAULT 1,
            status       TEXT    NOT NULL DEFAULT 'pending',
            scheduled_at TEXT,
            completed_at TEXT,
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        );

        CREATE TABLE IF NOT EXISTS deadlines (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id   INTEGER NOT NULL,
            deadline_date TEXT   NOT NULL,
            notes        TEXT,
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        );

        CREATE TABLE IF NOT EXISTS risk_flags (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id   INTEGER NOT NULL,
            risk_level   TEXT    NOT NULL,
            risk_score   INTEGER NOT NULL DEFAULT 0,
            min_daily_hrs REAL   NOT NULL DEFAULT 0,
            message      TEXT,
            flagged_at   TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        );

        CREATE TABLE IF NOT EXISTS generated_schedules (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL DEFAULT 1,
            schedule_date   TEXT    NOT NULL DEFAULT (date('now')),
            topo_order      TEXT    NOT NULL DEFAULT '[]',
            greedy_order    TEXT    NOT NULL DEFAULT '[]',
            dp_allocation   TEXT    NOT NULL DEFAULT '[]',
            total_hours     INTEGER NOT NULL DEFAULT 0,
            algorithm_log   TEXT    DEFAULT '',
            created_at      TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS progress_logs (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id   INTEGER NOT NULL,
            log_date     TEXT    NOT NULL DEFAULT (date('now')),
            planned_hrs  INTEGER NOT NULL DEFAULT 0,
            actual_hrs   INTEGER NOT NULL DEFAULT 0,
            status       TEXT    NOT NULL DEFAULT 'on_track',
            note         TEXT,
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        );
    """)

    # Seed default user if empty
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO users (name, daily_limit) VALUES ('Student', 8)")

    conn.commit()
    conn.close()


# ── Generic helpers ──────────────────────────────────────────────────────────

def row_to_dict(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [dict(r) for r in rows]


# ── Users ────────────────────────────────────────────────────────────────────

def get_user(user_id=1):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


def update_user(user_id, data):
    conn = get_conn()
    conn.execute(
        "UPDATE users SET name=?, daily_limit=? WHERE id=?",
        (data.get("name", "Student"), data.get("daily_limit", 8), user_id)
    )
    conn.commit()
    conn.close()


# ── Subjects ─────────────────────────────────────────────────────────────────

def get_subjects(user_id=1):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM subjects WHERE user_id=? ORDER BY exam_deadline ASC",
        (user_id,)
    ).fetchall()
    conn.close()
    result = rows_to_list(rows)
    for s in result:
        s["topics"] = json.loads(s["topics"])
        s["prerequisites"] = json.loads(s["prerequisites"])
    return result


def get_subject(subject_id):
    conn = get_conn()
    row = conn.execute("SELECT * FROM subjects WHERE id=?", (subject_id,)).fetchone()
    conn.close()
    if not row:
        return None
    s = dict(row)
    s["topics"] = json.loads(s["topics"])
    s["prerequisites"] = json.loads(s["prerequisites"])
    return s


def create_subject(data, user_id=1):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO subjects
            (user_id, name, short_name, exam_deadline, difficulty,
             required_hours, completed_hours, color, topics, prerequisites)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (
        user_id,
        data["name"],
        data.get("short_name", data["name"][:4].upper()),
        data["exam_deadline"],
        data["difficulty"],
        data["required_hours"],
        data.get("completed_hours", 0),
        data.get("color", "#8b5cf6"),
        json.dumps(data.get("topics", [])),
        json.dumps(data.get("prerequisites", [])),
    ))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return get_subject(new_id)


def update_subject(subject_id, data):
    conn = get_conn()
    conn.execute("""
        UPDATE subjects SET
            name=?, short_name=?, exam_deadline=?, difficulty=?,
            required_hours=?, completed_hours=?, color=?, topics=?,
            prerequisites=?, updated_at=datetime('now')
        WHERE id=?
    """, (
        data["name"],
        data.get("short_name", data["name"][:4].upper()),
        data["exam_deadline"],
        data["difficulty"],
        data["required_hours"],
        data.get("completed_hours", 0),
        data.get("color", "#8b5cf6"),
        json.dumps(data.get("topics", [])),
        json.dumps(data.get("prerequisites", [])),
        subject_id,
    ))
    conn.commit()
    conn.close()
    return get_subject(subject_id)


def delete_subject(subject_id):
    conn = get_conn()
    # Remove dependent rows first to avoid FK constraint errors
    conn.execute("DELETE FROM study_tasks   WHERE subject_id=?", (subject_id,))
    conn.execute("DELETE FROM risk_flags    WHERE subject_id=?", (subject_id,))
    conn.execute("DELETE FROM progress_logs WHERE subject_id=?", (subject_id,))
    conn.execute("DELETE FROM deadlines     WHERE subject_id=?", (subject_id,))
    conn.execute("DELETE FROM subjects      WHERE id=?",         (subject_id,))
    conn.commit()
    conn.close()


def patch_subject_progress(subject_id, completed_hours):
    conn = get_conn()
    conn.execute(
        "UPDATE subjects SET completed_hours=?, updated_at=datetime('now') WHERE id=?",
        (completed_hours, subject_id)
    )
    conn.commit()
    conn.close()
    return get_subject(subject_id)


# ── Study Tasks ───────────────────────────────────────────────────────────────

def get_tasks(subject_id=None):
    conn = get_conn()
    if subject_id:
        rows = conn.execute("SELECT * FROM study_tasks WHERE subject_id=?", (subject_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM study_tasks").fetchall()
    conn.close()
    return rows_to_list(rows)


def create_task(data):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO study_tasks (subject_id, task_name, duration_hrs, status, scheduled_at)
        VALUES (?,?,?,?,?)
    """, (data["subject_id"], data["task_name"], data.get("duration_hrs", 1),
          data.get("status", "pending"), data.get("scheduled_at")))
    conn.commit()
    task_id = c.lastrowid
    conn.close()
    row = get_conn().execute("SELECT * FROM study_tasks WHERE id=?", (task_id,)).fetchone()
    return row_to_dict(row)


def update_task_status(task_id, status):
    conn = get_conn()
    if status == "done":
        conn.execute(
            "UPDATE study_tasks SET status=?, completed_at=datetime('now') WHERE id=?",
            (status, task_id)
        )
    else:
        conn.execute(
            "UPDATE study_tasks SET status=?, completed_at=NULL WHERE id=?",
            (status, task_id)
        )
    conn.commit()
    conn.close()


# ── Generated Schedules ───────────────────────────────────────────────────────

def save_schedule(user_id, topo_order, greedy_order, dp_allocation, total_hours, algorithm_log):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO generated_schedules
            (user_id, topo_order, greedy_order, dp_allocation, total_hours, algorithm_log)
        VALUES (?,?,?,?,?,?)
    """, (
        user_id,
        json.dumps(topo_order),
        json.dumps(greedy_order),
        json.dumps(dp_allocation),
        total_hours,
        algorithm_log,
    ))
    conn.commit()
    sched_id = c.lastrowid
    conn.close()
    return sched_id


def get_latest_schedule(user_id=1):
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM generated_schedules WHERE user_id=? ORDER BY id DESC LIMIT 1",
        (user_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    s = dict(row)
    s["topo_order"] = json.loads(s["topo_order"])
    s["greedy_order"] = json.loads(s["greedy_order"])
    s["dp_allocation"] = json.loads(s["dp_allocation"])
    return s


# ── Risk Flags ────────────────────────────────────────────────────────────────

def save_risk_flags(flags):
    conn = get_conn()
    conn.execute("DELETE FROM risk_flags")
    for f in flags:
        conn.execute("""
            INSERT INTO risk_flags (subject_id, risk_level, risk_score, min_daily_hrs, message)
            VALUES (?,?,?,?,?)
        """, (f["subject_id"], f["risk_level"], f["risk_score"], f["min_daily_hrs"], f["message"]))
    conn.commit()
    conn.close()


def get_risk_flags():
    conn = get_conn()
    rows = conn.execute("""
        SELECT rf.*, s.name as subject_name, s.short_name
        FROM risk_flags rf
        JOIN subjects s ON s.id = rf.subject_id
        ORDER BY rf.risk_score DESC
    """).fetchall()
    conn.close()
    return rows_to_list(rows)


# ── Progress Logs ─────────────────────────────────────────────────────────────

def log_progress(subject_id, planned_hrs, actual_hrs, status, note=""):
    conn = get_conn()
    conn.execute("""
        INSERT INTO progress_logs (subject_id, planned_hrs, actual_hrs, status, note)
        VALUES (?,?,?,?,?)
    """, (subject_id, planned_hrs, actual_hrs, status, note))
    conn.commit()
    conn.close()


def get_progress_logs(subject_id=None):
    conn = get_conn()
    if subject_id:
        rows = conn.execute(
            "SELECT * FROM progress_logs WHERE subject_id=? ORDER BY log_date DESC",
            (subject_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT pl.*, s.name as subject_name, s.short_name FROM progress_logs pl JOIN subjects s ON s.id=pl.subject_id ORDER BY pl.log_date DESC"
        ).fetchall()
    conn.close()
    return rows_to_list(rows)
