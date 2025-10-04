#!/usr/bin/env python3
"""
Enhanced Exercise Tracking System for Hebrew CrossFit AI
Supports weight tracking, personal records, and intelligent progress monitoring
FIXED version with proper database handling
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import sqlite3
from pathlib import Path
import re

@dataclass
class ExerciseEntry:
    """Enhanced exercise entry with weight tracking"""
    exercise: str
    exercise_he: str
    reps: int
    weight: Optional[float] = None
    weight_unit: str = "kg"  # kg or lbs
    duration: Optional[int] = None  # seconds
    points: int = 0
    timestamp: str = ""
    pr_type: Optional[str] = None  # "weight", "reps", "time"
    notes: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

class EnhancedExerciseTracker:
    """Enhanced exercise tracking with weight support and personal records"""
    
    # Hebrew exercise names mapping
    EXERCISE_MAPPING = {
        "בק סקווט": "back_squat",
        "פרונט סקווט": "front_squat",
        "דדליפט": "deadlift",
        "סנאץ'": "snatch",
        "קלין": "clean",
        "ג'רק": "jerk",
        "קלין אנד ג'רק": "clean_and_jerk",
        "לחיצת כתפיים": "shoulder_press",
        "לחיצת חזה": "bench_press",
        "משיכות": "pull_ups",
        "שכיבות סמיכה": "push_ups",
        "סקוואטים": "squats",
        "ברפיז": "burpees",
        "בורפיס": "burpees"
    }
    
    def __init__(self, db_path: str = "workout_data.db"):
        self.db_path = db_path
        self.current_session_id: Optional[str] = None
        # For in-memory databases, keep connection open
        self._persistent_conn = None if db_path != ":memory:" else None
        self.init_database()
        # Auto-start a session
        self.current_session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def _get_connection(self):
        """Get database connection"""
        if self.db_path == ":memory:":
            if self._persistent_conn is None:
                self._persistent_conn = sqlite3.connect(":memory:")
                self._init_tables(self._persistent_conn)
            return self._persistent_conn
        else:
            return sqlite3.connect(self.db_path)
    
    def _close_connection(self, conn):
        """Close connection if not in-memory"""
        if self.db_path != ":memory:":
            conn.close()
    
    def init_database(self):
        """Initialize enhanced SQLite database"""
        conn = self._get_connection()
        self._init_tables(conn)
        conn.commit()
        self._close_connection(conn)
    
    def _init_tables(self, conn):
        """Initialize database tables"""
        cursor = conn.cursor()
        
        # Enhanced exercises table with weight tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exercises_enhanced (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                exercise TEXT NOT NULL,
                exercise_he TEXT NOT NULL,
                reps INTEGER NOT NULL,
                weight REAL,
                weight_unit TEXT DEFAULT 'kg',
                duration INTEGER,
                points INTEGER DEFAULT 0,
                pr_type TEXT,
                notes TEXT,
                timestamp TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL
            )
        ''')
        
        # Personal records table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS personal_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise TEXT NOT NULL,
                exercise_he TEXT NOT NULL,
                record_type TEXT NOT NULL,  -- 'weight', 'reps', 'time'
                value REAL NOT NULL,
                weight REAL,  -- For weighted exercises
                reps INTEGER,  -- For weight PRs
                date TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                previous_value REAL,
                improvement REAL,
                notes TEXT,
                UNIQUE(exercise, record_type)
            )
        ''')
        
        # Exercise history for tracking progress
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exercise_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise TEXT NOT NULL,
                exercise_he TEXT NOT NULL,
                date TEXT NOT NULL,
                weight REAL,
                reps INTEGER,
                max_weight REAL,
                total_volume REAL,  -- weight * reps * sets
                total_reps INTEGER,
                sets INTEGER DEFAULT 1,
                timestamp TEXT NOT NULL
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_exercise_date ON exercises_enhanced(exercise, date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_pr_exercise ON personal_records(exercise)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_progress_date ON exercise_progress(exercise, date)')
    
    def parse_exercise_input(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse Hebrew exercise input to extract exercise, weight, and reps"""
        # Normalize text
        text = text.strip()
        
        # Pattern for weight exercises: "עשיתי בק סקווט 50 קילו"
        weight_pattern = r'עשיתי\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(קילו|ק"ג|קג|kg)'
        match = re.search(weight_pattern, text)
        
        if match:
            exercise_he = match.group(1).strip()
            weight = float(match.group(2))
            
            # Look for reps in the text
            reps_pattern = r'(\d+)\s*(חזרות|פעמים|רפס)'
            reps_match = re.search(reps_pattern, text)
            reps = int(reps_match.group(1)) if reps_match else 1
            
            # Look for sets
            sets_pattern = r'(\d+)\s*(סטים|סטס|סט)'
            sets_match = re.search(sets_pattern, text)
            sets = int(sets_match.group(1)) if sets_match else 1
            
            return {
                "exercise_he": exercise_he,
                "exercise": self.EXERCISE_MAPPING.get(exercise_he, exercise_he),
                "weight": weight,
                "reps": reps,
                "sets": sets,
                "type": "weight"
            }
        
        # Pattern for rep exercises: "עשיתי 20 שכיבות סמיכה"
        reps_pattern = r'עשיתי\s+(\d+)\s+(.+?)(?:\s|$)'
        match = re.search(reps_pattern, text)
        
        if match:
            reps = int(match.group(1))
            exercise_he = match.group(2).strip()
            
            return {
                "exercise_he": exercise_he,
                "exercise": self.EXERCISE_MAPPING.get(exercise_he, exercise_he),
                "weight": None,
                "reps": reps,
                "sets": 1,
                "type": "bodyweight"
            }
        
        return None
    
    def add_exercise_from_text(self, text: str, points: int = 0) -> Optional[Dict[str, Any]]:
        """Add exercise from Hebrew text input"""
        parsed = self.parse_exercise_input(text)
        if not parsed:
            return None
        
        # Start session if needed
        if not self.current_session_id:
            self.current_session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        results = []
        
        # Add each set
        for set_num in range(parsed['sets']):
            entry = self.add_exercise(
                exercise=parsed['exercise'],
                exercise_he=parsed['exercise_he'],
                reps=parsed['reps'],
                weight=parsed['weight'],
                points=points
            )
            results.append(entry)
        
        # Check for personal records
        pr_info = self.check_and_update_pr(
            exercise=parsed['exercise'],
            exercise_he=parsed['exercise_he'],
            weight=parsed['weight'],
            reps=parsed['reps']
        )
        
        return {
            "parsed": parsed,
            "entries": results,
            "pr_info": pr_info,
            "total_volume": parsed.get('weight', 0) * parsed['reps'] * parsed['sets'] if parsed.get('weight') else None
        }
    
    def add_exercise(self, exercise: str, exercise_he: str, reps: int, 
                    weight: Optional[float] = None, duration: Optional[int] = None,
                    points: int = 0, notes: str = "") -> ExerciseEntry:
        """Add enhanced exercise entry"""
        entry = ExerciseEntry(
            exercise=exercise,
            exercise_he=exercise_he,
            reps=reps,
            weight=weight,
            duration=duration,
            points=points,
            notes=notes
        )
        
        now = datetime.now()
        date = now.strftime("%Y-%m-%d")
        time = now.strftime("%H:%M:%S")
        
        # Save to database
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO exercises_enhanced 
            (session_id, exercise, exercise_he, reps, weight, weight_unit, 
             duration, points, notes, timestamp, date, time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (self.current_session_id, exercise, exercise_he, reps, weight, 
              entry.weight_unit, duration, points, notes, entry.timestamp, date, time))
        
        # Update progress tracking
        self._update_progress(exercise, exercise_he, date, weight, reps)
        
        conn.commit()
        self._close_connection(conn)
        
        return entry
    
    def check_and_update_pr(self, exercise: str, exercise_he: str, 
                           weight: Optional[float] = None, reps: int = 0) -> Optional[Dict[str, Any]]:
        """Check if this is a personal record and update if necessary"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        pr_info = None
        
        # Check weight PR
        if weight is not None:
            cursor.execute('''
                SELECT value, date FROM personal_records 
                WHERE exercise = ? AND record_type = 'weight'
            ''', (exercise,))
            
            current_pr = cursor.fetchone()
            
            if not current_pr or weight > current_pr[0]:
                # New PR!
                previous_value = current_pr[0] if current_pr else 0
                improvement = weight - previous_value if previous_value else weight
                
                cursor.execute('''
                    INSERT OR REPLACE INTO personal_records 
                    (exercise, exercise_he, record_type, value, reps, date, timestamp, 
                     previous_value, improvement, notes)
                    VALUES (?, ?, 'weight', ?, ?, ?, ?, ?, ?, ?)
                ''', (exercise, exercise_he, weight, reps, datetime.now().strftime("%Y-%m-%d"),
                      datetime.now().isoformat(), previous_value, improvement,
                      f"New weight PR! Previous: {previous_value}kg"))
                
                pr_info = {
                    "type": "weight",
                    "new_value": weight,
                    "previous_value": previous_value,
                    "improvement": improvement,
                    "percentage_increase": (improvement / previous_value * 100) if previous_value else 100
                }
        
        conn.commit()
        self._close_connection(conn)
        
        return pr_info
    
    def get_exercise_max(self, exercise_he: str) -> Dict[str, Any]:
        """Get maximum weight and details for an exercise"""
        exercise = self.EXERCISE_MAPPING.get(exercise_he, exercise_he)
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Get max weight
        cursor.execute('''
            SELECT MAX(weight) as max_weight, date, reps
            FROM exercises_enhanced
            WHERE exercise = ? AND weight IS NOT NULL
            GROUP BY date, reps
            ORDER BY max_weight DESC
            LIMIT 1
        ''', (exercise,))
        
        max_result = cursor.fetchone()
        
        # Get recent history
        cursor.execute('''
            SELECT date, weight, reps, time
            FROM exercises_enhanced
            WHERE exercise = ? AND weight IS NOT NULL
            ORDER BY timestamp DESC
            LIMIT 10
        ''', (exercise,))
        
        recent_history = cursor.fetchall()
        
        # Get PR info
        cursor.execute('''
            SELECT value, date, previous_value, improvement
            FROM personal_records
            WHERE exercise = ? AND record_type = 'weight'
        ''', (exercise,))
        
        pr_info = cursor.fetchone()
        
        self._close_connection(conn)
        
        return {
            "exercise": exercise_he,
            "current_max": {
                "weight": max_result[0] if max_result else 0,
                "date": max_result[1] if max_result else None,
                "reps": max_result[2] if max_result else 0
            },
            "pr": {
                "value": pr_info[0] if pr_info else 0,
                "date": pr_info[1] if pr_info else None,
                "previous": pr_info[2] if pr_info else 0,
                "improvement": pr_info[3] if pr_info else 0
            } if pr_info else None,
            "recent_history": [
                {
                    "date": h[0],
                    "weight": h[1],
                    "reps": h[2],
                    "time": h[3]
                } for h in recent_history
            ]
        }
    
    def _update_progress(self, exercise: str, exercise_he: str, date: str, 
                        weight: Optional[float], reps: int):
        """Update progress tracking table"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Check if we already have an entry for this exercise today
        cursor.execute('''
            SELECT id, total_reps, total_volume, max_weight, sets
            FROM exercise_progress
            WHERE exercise = ? AND date = ?
        ''', (exercise, date))
        
        existing = cursor.fetchone()
        
        if existing:
            # Update existing entry
            prog_id, total_reps, total_volume, max_weight, sets = existing
            new_total_reps = total_reps + reps
            new_volume = (total_volume or 0) + (weight * reps if weight else 0)
            new_max_weight = max(max_weight or 0, weight or 0)
            new_sets = sets + 1
            
            cursor.execute('''
                UPDATE exercise_progress
                SET total_reps = ?, total_volume = ?, max_weight = ?, sets = ?
                WHERE id = ?
            ''', (new_total_reps, new_volume, new_max_weight, new_sets, prog_id))
        else:
            # Create new entry
            cursor.execute('''
                INSERT INTO exercise_progress
                (exercise, exercise_he, date, weight, reps, max_weight, 
                 total_volume, total_reps, sets, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (exercise, exercise_he, date, weight, reps, weight or 0,
                  weight * reps if weight else 0, reps, 1, datetime.now().isoformat()))
        
        conn.commit()
        self._close_connection(conn)
    
    def get_progress_report(self, exercise_he: str, days: int = 30) -> Dict[str, Any]:
        """Get detailed progress report for an exercise"""
        exercise = self.EXERCISE_MAPPING.get(exercise_he, exercise_he)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Get progress data
        cursor.execute('''
            SELECT date, max_weight, total_volume, total_reps, sets
            FROM exercise_progress
            WHERE exercise = ? AND date BETWEEN ? AND ?
            ORDER BY date
        ''', (exercise, start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")))
        
        progress_data = cursor.fetchall()
        
        # Calculate trends
        if len(progress_data) >= 2:
            first_weight = progress_data[0][1] or 0
            last_weight = progress_data[-1][1] or 0
            weight_change = last_weight - first_weight
            weight_change_pct = (weight_change / first_weight * 100) if first_weight else 0
            
            first_volume = progress_data[0][2] or 0
            last_volume = progress_data[-1][2] or 0
            volume_change = last_volume - first_volume
            volume_change_pct = (volume_change / first_volume * 100) if first_volume else 0
        else:
            weight_change = weight_change_pct = 0
            volume_change = volume_change_pct = 0
        
        self._close_connection(conn)
        
        return {
            "exercise": exercise_he,
            "period_days": days,
            "workout_count": len(progress_data),
            "progress": [
                {
                    "date": p[0],
                    "max_weight": p[1],
                    "total_volume": p[2],
                    "total_reps": p[3],
                    "sets": p[4]
                } for p in progress_data
            ],
            "trends": {
                "weight_change": weight_change,
                "weight_change_pct": weight_change_pct,
                "volume_change": volume_change,
                "volume_change_pct": volume_change_pct
            }
        }
    
    def generate_ai_response(self, result: Dict[str, Any]) -> str:
        """Generate intelligent response based on exercise tracking"""
        if not result:
            return "לא הצלחתי להבין את התרגיל. אפשר לנסות שוב?"
        
        parsed = result['parsed']
        pr_info = result['pr_info']
        
        # Base response
        if parsed['weight']:
            response = f"רשמתי: {parsed['exercise_he']} - {parsed['weight']} ק\"ג, {parsed['reps']} חזרות"
            if parsed['sets'] > 1:
                response += f", {parsed['sets']} סטים"
        else:
            response = f"רשמתי: {parsed['reps']} {parsed['exercise_he']}"
        
        # Add PR congratulations
        if pr_info:
            response += f"\n\n🎉 שיא אישי חדש! {pr_info['new_value']} ק\"ג!"
            if pr_info['previous_value']:
                response += f"\n📈 שיפור של {pr_info['improvement']:.1f} ק\"ג ({pr_info['percentage_increase']:.1f}%)"
                response += f"\n💪 השיא הקודם היה {pr_info['previous_value']} ק\"ג"
        
        # Get exercise max for context
        max_info = self.get_exercise_max(parsed['exercise_he'])
        if max_info['current_max']['weight'] and not pr_info:
            response += f"\n📊 השיא שלך ב{parsed['exercise_he']}: {max_info['current_max']['weight']} ק\"ג"
        
        return response

# Example usage
if __name__ == "__main__":
    tracker = EnhancedExerciseTracker()
    
    # Test parsing and tracking
    tests = [
        "עשיתי בק סקווט 50 קילו",
        "עשיתי בק סקווט 60 קילו 5 חזרות",
        "עשיתי דדליפט 80 קג 3 חזרות 3 סטים",
        "עשיתי 20 שכיבות סמיכה"
    ]
    
    for test in tests:
        result = tracker.add_exercise_from_text(test)
        if result:
            response = tracker.generate_ai_response(result)
            print(f"\nInput: {test}")
            print(f"Response: {response}")
            print(f"Parsed: {result['parsed']}")