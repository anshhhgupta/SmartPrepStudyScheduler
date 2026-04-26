"""
Seed the database with the 6 default subjects from the frontend mock data.
Run once: python backend/seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, get_subjects, create_subject

init_db()

if get_subjects(1):
    print("Database already has subjects — skipping seed.")
    sys.exit(0)

SUBJECTS = [
    {"name": "Data Structures & Algorithms", "short_name": "DSA",  "exam_deadline": 2,  "difficulty": 5, "required_hours": 20, "completed_hours": 5,  "color": "#8b5cf6", "topics": ["Arrays","Trees","Graphs","DP","Sorting"],       "prerequisites": []},
    {"name": "Database Management",          "short_name": "DBMS", "exam_deadline": 5,  "difficulty": 4, "required_hours": 15, "completed_hours": 10, "color": "#ec4899", "topics": ["SQL","Normalization","Transactions","Indexing"], "prerequisites": []},
    {"name": "Operating Systems",            "short_name": "OS",   "exam_deadline": 7,  "difficulty": 5, "required_hours": 25, "completed_hours": 5,  "color": "#06b6d4", "topics": ["Scheduling","Memory","Deadlock","File Systems"],"prerequisites": []},
    {"name": "Computer Networks",            "short_name": "CN",   "exam_deadline": 10, "difficulty": 3, "required_hours": 12, "completed_hours": 8,  "color": "#10b981", "topics": ["TCP/IP","Routing","DNS","HTTP"],                "prerequisites": []},
    {"name": "Software Engineering",         "short_name": "SE",   "exam_deadline": 12, "difficulty": 2, "required_hours": 10, "completed_hours": 6,  "color": "#f59e0b", "topics": ["SDLC","Agile","Testing","Design Patterns"],    "prerequisites": []},
    {"name": "Theory of Computation",        "short_name": "TOC",  "exam_deadline": 4,  "difficulty": 5, "required_hours": 18, "completed_hours": 3,  "color": "#ef4444", "topics": ["Automata","Grammars","Turing Machines","Complexity"], "prerequisites": []},
]

for s in SUBJECTS:
    create_subject(s, user_id=1)
    print(f"  Created: {s['name']}")

print(f"\nSeeded {len(SUBJECTS)} subjects.")
