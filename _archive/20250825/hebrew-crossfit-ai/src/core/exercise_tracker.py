#!/usr/bin/env python3
"""
Exercise Tracking System for Hebrew CrossFit AI
Stores workout data with timestamps and provides statistics
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import sqlite3
from pathlib import Path

@dataclass
class ExerciseEntry:
    """Single exercise entry"""
    exercise: str
    exercise_he: str
    reps: int
    weight: Optional[float] = None
    duration: Optional[int] = None  # seconds
    points: int = 0
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

@dataclass
class WorkoutSession:
    """Complete workout session"""
    session_id: str
    date: str
    start_time: str
    end_time: Optional[str] = None
    exercises: List[ExerciseEntry] = None
    total_points: int = 0
    duration_minutes: Optional[int] = None
    notes: str = ""
    
    def __post_init__(self):
        if self.exercises is None:
            self.exercises = []
        if not self.date:
            self.date = datetime.now().strftime("%Y-%m-%d")
        if not self.start_time:
            self.start_time = datetime.now().strftime("%H:%M:%S")

class ExerciseTracker:
    """Exercise tracking and statistics system"""
    
    def __init__(self, db_path: str = "workout_data.db"):
        self.db_path = db_path
        self.current_session: Optional[WorkoutSession] = None
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS workout_sessions (
                session_id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                total_points INTEGER DEFAULT 0,
                duration_minutes INTEGER,
                notes TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                exercise TEXT NOT NULL,
                exercise_he TEXT NOT NULL,
                reps INTEGER NOT NULL,
                weight REAL,
                duration INTEGER,
                points INTEGER DEFAULT 0,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES workout_sessions (session_id)
            )
        ''')
        
        # Create indexes for faster queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_date ON workout_sessions(date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_exercise ON exercises(exercise)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON exercises(timestamp)')
        
        conn.commit()
        conn.close()
    
    def start_session(self, notes: str = "") -> str:
        """Start a new workout session"""
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.current_session = WorkoutSession(
            session_id=session_id,
            date=datetime.now().strftime("%Y-%m-%d"),
            start_time=datetime.now().strftime("%H:%M:%S"),
            notes=notes
        )
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO workout_sessions (session_id, date, start_time, notes)
            VALUES (?, ?, ?, ?)
        ''', (session_id, self.current_session.date, self.current_session.start_time, notes))
        conn.commit()
        conn.close()
        
        return session_id
    
    def add_exercise(self, exercise: str, exercise_he: str, reps: int, 
                    weight: Optional[float] = None, duration: Optional[int] = None,
                    points: int = 0) -> ExerciseEntry:
        """Add exercise to current session"""
        if not self.current_session:
            self.start_session()
        
        entry = ExerciseEntry(
            exercise=exercise,
            exercise_he=exercise_he,
            reps=reps,
            weight=weight,
            duration=duration,
            points=points
        )
        
        # Add to current session
        self.current_session.exercises.append(entry)
        self.current_session.total_points += points
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO exercises (session_id, exercise, exercise_he, reps, weight, duration, points, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (self.current_session.session_id, exercise, exercise_he, reps, weight, duration, points, entry.timestamp))
        conn.commit()
        conn.close()
        
        return entry
    
    def end_session(self) -> Optional[WorkoutSession]:
        """End current workout session"""
        if not self.current_session:
            return None
        
        end_time = datetime.now().strftime("%H:%M:%S")
        
        # Calculate duration
        start_dt = datetime.strptime(f"{self.current_session.date} {self.current_session.start_time}", "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(f"{self.current_session.date} {end_time}", "%Y-%m-%d %H:%M:%S")
        duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
        
        # Update database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE workout_sessions 
            SET end_time = ?, total_points = ?, duration_minutes = ?
            WHERE session_id = ?
        ''', (end_time, self.current_session.total_points, duration_minutes, self.current_session.session_id))
        conn.commit()
        conn.close()
        
        # Update session object
        self.current_session.end_time = end_time
        self.current_session.duration_minutes = duration_minutes
        
        completed_session = self.current_session
        self.current_session = None
        
        return completed_session
    
    def get_daily_stats(self, date: str = None) -> Dict[str, Any]:
        """Get statistics for a specific day"""
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get session count and total points for the day
        cursor.execute('''
            SELECT COUNT(*), COALESCE(SUM(total_points), 0), COALESCE(SUM(duration_minutes), 0)
            FROM workout_sessions 
            WHERE date = ?
        ''', (date,))
        session_count, total_points, total_duration = cursor.fetchone()
        
        # Get exercise breakdown
        cursor.execute('''
            SELECT e.exercise_he, COUNT(*), SUM(e.reps), COALESCE(SUM(e.points), 0)
            FROM exercises e
            JOIN workout_sessions s ON e.session_id = s.session_id
            WHERE s.date = ?
            GROUP BY e.exercise_he
            ORDER BY SUM(e.points) DESC
        ''', (date,))
        exercises = cursor.fetchall()
        
        conn.close()
        
        return {
            "date": date,
            "date_he": self._format_hebrew_date(date),
            "session_count": session_count,
            "total_points": total_points,
            "total_duration_minutes": total_duration,
            "exercises": [
                {
                    "name": ex[0],
                    "sets": ex[1],
                    "total_reps": ex[2],
                    "points": ex[3]
                } for ex in exercises
            ]
        }
    
    def get_weekly_stats(self, week_start: str = None) -> Dict[str, Any]:
        """Get statistics for a week"""
        if not week_start:
            today = datetime.now()
            days_since_monday = today.weekday()
            monday = today - timedelta(days=days_since_monday)
            week_start = monday.strftime("%Y-%m-%d")
        
        # Calculate week end
        week_start_dt = datetime.strptime(week_start, "%Y-%m-%d")
        week_end_dt = week_start_dt + timedelta(days=6)
        week_end = week_end_dt.strftime("%Y-%m-%d")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get weekly totals
        cursor.execute('''
            SELECT COUNT(*), COALESCE(SUM(total_points), 0), COALESCE(SUM(duration_minutes), 0)
            FROM workout_sessions 
            WHERE date BETWEEN ? AND ?
        ''', (week_start, week_end))
        session_count, total_points, total_duration = cursor.fetchone()
        
        # Get daily breakdown
        cursor.execute('''
            SELECT date, COUNT(*), COALESCE(SUM(total_points), 0)
            FROM workout_sessions 
            WHERE date BETWEEN ? AND ?
            GROUP BY date
            ORDER BY date
        ''', (week_start, week_end))
        daily_data = cursor.fetchall()
        
        # Get top exercises for the week
        cursor.execute('''
            SELECT e.exercise_he, COUNT(*), SUM(e.reps), COALESCE(SUM(e.points), 0)
            FROM exercises e
            JOIN workout_sessions s ON e.session_id = s.session_id
            WHERE s.date BETWEEN ? AND ?
            GROUP BY e.exercise_he
            ORDER BY SUM(e.points) DESC
            LIMIT 5
        ''', (week_start, week_end))
        top_exercises = cursor.fetchall()
        
        conn.close()
        
        return {
            "week_start": week_start,
            "week_end": week_end,
            "session_count": session_count,
            "total_points": total_points,
            "total_duration_minutes": total_duration,
            "daily_breakdown": [
                {
                    "date": day[0],
                    "sessions": day[1],
                    "points": day[2]
                } for day in daily_data
            ],
            "top_exercises": [
                {
                    "name": ex[0],
                    "sets": ex[1],
                    "total_reps": ex[2],
                    "points": ex[3]
                } for ex in top_exercises
            ]
        }
    
    def get_exercise_history(self, exercise_he: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get history for a specific exercise"""
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.date, e.reps, e.weight, e.points, e.timestamp
            FROM exercises e
            JOIN workout_sessions s ON e.session_id = s.session_id
            WHERE e.exercise_he = ? AND s.date BETWEEN ? AND ?
            ORDER BY e.timestamp DESC
        ''', (exercise_he, start_date, end_date))
        
        history = cursor.fetchall()
        conn.close()
        
        return [
            {
                "date": h[0],
                "reps": h[1],
                "weight": h[2],
                "points": h[3],
                "timestamp": h[4]
            } for h in history
        ]
    
    def get_personal_records(self) -> Dict[str, Any]:
        """Get personal records for each exercise"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Max reps per exercise
        cursor.execute('''
            SELECT exercise_he, MAX(reps) as max_reps, timestamp
            FROM exercises
            GROUP BY exercise_he
            ORDER BY max_reps DESC
        ''', )
        max_reps = cursor.fetchall()
        
        # Max weight per exercise (where applicable)
        cursor.execute('''
            SELECT exercise_he, MAX(weight) as max_weight, reps, timestamp
            FROM exercises
            WHERE weight IS NOT NULL
            GROUP BY exercise_he
            ORDER BY max_weight DESC
        ''', )
        max_weights = cursor.fetchall()
        
        conn.close()
        
        return {
            "max_reps": [
                {
                    "exercise": pr[0],
                    "reps": pr[1],
                    "date": pr[2][:10] if pr[2] else ""
                } for pr in max_reps
            ],
            "max_weights": [
                {
                    "exercise": pr[0],
                    "weight": pr[1],
                    "reps": pr[2],
                    "date": pr[3][:10] if pr[3] else ""
                } for pr in max_weights
            ]
        }
    
    def get_streak_info(self) -> Dict[str, Any]:
        """Calculate workout streak information"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get all workout dates in descending order
        cursor.execute('''
            SELECT DISTINCT date 
            FROM workout_sessions 
            ORDER BY date DESC
        ''')
        dates = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        if not dates:
            return {"current_streak": 0, "longest_streak": 0, "last_workout": None}
        
        # Calculate current streak
        current_streak = 0
        today = datetime.now().date()
        
        for date_str in dates:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
            days_diff = (today - date).days
            
            if days_diff == current_streak:
                current_streak += 1
            else:
                break
        
        # Calculate longest streak
        longest_streak = 0
        current_run = 1
        
        if len(dates) > 1:
            for i in range(1, len(dates)):
                prev_date = datetime.strptime(dates[i-1], "%Y-%m-%d").date()
                curr_date = datetime.strptime(dates[i], "%Y-%m-%d").date()
                
                if (prev_date - curr_date).days == 1:
                    current_run += 1
                else:
                    longest_streak = max(longest_streak, current_run)
                    current_run = 1
            
            longest_streak = max(longest_streak, current_run)
        else:
            longest_streak = 1
        
        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_workout": dates[0] if dates else None
        }
    
    def _format_hebrew_date(self, date_str: str) -> str:
        """Format date in Hebrew"""
        date = datetime.strptime(date_str, "%Y-%m-%d")
        hebrew_months = [
            "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
            "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
        ]
        hebrew_days = ["יום ב'", "יום ג'", "יום ד'", "יום ה'", "יום ו'", "שבת", "יום א'"]
        
        day_name = hebrew_days[date.weekday()]
        month_name = hebrew_months[date.month - 1]
        
        return f"{day_name}, {date.day} {month_name} {date.year}"

# Example usage
if __name__ == "__main__":
    tracker = ExerciseTracker()
    
    # Start a session
    session_id = tracker.start_session("Evening workout")
    
    # Add some exercises
    tracker.add_exercise("push-ups", "שכיבות סמיכה", 20, points=40)
    tracker.add_exercise("squats", "סקוואטים", 15, points=45)
    tracker.add_exercise("burpees", "ברפיז", 10, points=50)
    
    # End session
    completed = tracker.end_session()
    
    # Get stats
    daily_stats = tracker.get_daily_stats()
    print("Daily stats:", daily_stats)
    
    weekly_stats = tracker.get_weekly_stats()
    print("Weekly stats:", weekly_stats)
    
    prs = tracker.get_personal_records()
    print("Personal records:", prs)