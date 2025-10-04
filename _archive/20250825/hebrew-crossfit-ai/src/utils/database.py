#!/usr/bin/env python3
"""
View the contents of the workout database
"""

import sqlite3
import os
from datetime import datetime

def view_database(db_path="workout_data.db"):
    """View all data in the workout database"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database file '{db_path}' not found")
        return
    
    print(f"📊 Database Location: {os.path.abspath(db_path)}")
    print(f"📁 File Size: {os.path.getsize(db_path)} bytes")
    print("=" * 60)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Show workout sessions
    print("\n🏋️ WORKOUT SESSIONS:")
    print("-" * 60)
    cursor.execute('''
        SELECT session_id, date, start_time, end_time, total_points, duration_minutes, notes
        FROM workout_sessions 
        ORDER BY date DESC, start_time DESC
    ''')
    
    sessions = cursor.fetchall()
    if sessions:
        print(f"{'Session ID':<25} {'Date':<12} {'Time':<15} {'Points':<8} {'Duration':<10} {'Notes'}")
        print("-" * 85)
        for session in sessions:
            session_id, date, start_time, end_time, points, duration, notes = session
            time_range = f"{start_time}"
            if end_time:
                time_range += f" - {end_time}"
            duration_str = f"{duration}min" if duration else "ongoing"
            notes_short = (notes[:15] + "...") if notes and len(notes) > 15 else (notes or "")
            print(f"{session_id:<25} {date:<12} {time_range:<15} {points or 0:<8} {duration_str:<10} {notes_short}")
    else:
        print("No workout sessions found")
    
    # Show exercises
    print("\n💪 INDIVIDUAL EXERCISES:")
    print("-" * 60)
    cursor.execute('''
        SELECT e.timestamp, s.date, e.exercise_he, e.reps, e.points, e.session_id
        FROM exercises e
        JOIN workout_sessions s ON e.session_id = s.session_id
        ORDER BY e.timestamp DESC
        LIMIT 20
    ''')
    
    exercises = cursor.fetchall()
    if exercises:
        print(f"{'Timestamp':<20} {'Date':<12} {'Exercise':<20} {'Reps':<6} {'Points':<8} {'Session'}")
        print("-" * 85)
        for exercise in exercises:
            timestamp, date, exercise_he, reps, points, session_id = exercise
            time_only = timestamp[11:19] if len(timestamp) > 10 else timestamp
            session_short = session_id[-8:]  # Last 8 chars
            print(f"{time_only:<20} {date:<12} {exercise_he:<20} {reps:<6} {points:<8} {session_short}")
    else:
        print("No exercises found")
    
    # Show summary statistics
    print("\n📈 SUMMARY STATISTICS:")
    print("-" * 60)
    
    # Total exercises
    cursor.execute('SELECT COUNT(*) FROM exercises')
    total_exercises = cursor.fetchone()[0]
    
    # Total points
    cursor.execute('SELECT COALESCE(SUM(points), 0) FROM exercises')
    total_points = cursor.fetchone()[0]
    
    # Total sessions
    cursor.execute('SELECT COUNT(*) FROM workout_sessions')
    total_sessions = cursor.fetchone()[0]
    
    # Most popular exercise
    cursor.execute('''
        SELECT exercise_he, COUNT(*) as count, SUM(reps) as total_reps
        FROM exercises 
        GROUP BY exercise_he 
        ORDER BY count DESC 
        LIMIT 1
    ''')
    popular = cursor.fetchone()
    
    print(f"Total Sessions: {total_sessions}")
    print(f"Total Exercises: {total_exercises}")
    print(f"Total Points: {total_points}")
    if popular:
        print(f"Most Popular Exercise: {popular[0]} ({popular[1]} times, {popular[2]} total reps)")
    
    # Recent activity
    cursor.execute('''
        SELECT date, COUNT(*) as sessions, SUM(total_points) as points
        FROM workout_sessions 
        WHERE date >= date('now', '-7 days')
        GROUP BY date 
        ORDER BY date DESC
    ''')
    recent = cursor.fetchall()
    
    if recent:
        print(f"\nRecent Activity (Last 7 days):")
        for day in recent:
            print(f"  {day[0]}: {day[1]} sessions, {day[2]} points")
    
    conn.close()

def show_database_schema():
    """Show the database structure"""
    print("\n🏗️ DATABASE SCHEMA:")
    print("-" * 60)
    
    print("""
TABLE: workout_sessions
├── session_id (TEXT, PRIMARY KEY) - Unique session identifier
├── date (TEXT) - Date in YYYY-MM-DD format  
├── start_time (TEXT) - Start time in HH:MM:SS format
├── end_time (TEXT) - End time in HH:MM:SS format
├── total_points (INTEGER) - Total points earned in session
├── duration_minutes (INTEGER) - Session duration in minutes
└── notes (TEXT) - Optional session notes

TABLE: exercises  
├── id (INTEGER, AUTO INCREMENT) - Unique exercise record ID
├── session_id (TEXT, FOREIGN KEY) - Links to workout_sessions
├── exercise (TEXT) - Exercise name in English
├── exercise_he (TEXT) - Exercise name in Hebrew
├── reps (INTEGER) - Number of repetitions
├── weight (REAL) - Weight used (optional)
├── duration (INTEGER) - Exercise duration in seconds (optional)
├── points (INTEGER) - Points earned for this exercise
└── timestamp (TEXT) - Exact timestamp when exercise was recorded

INDEXES:
├── idx_date ON workout_sessions(date) - Fast date queries
├── idx_exercise ON exercises(exercise) - Fast exercise lookups
└── idx_timestamp ON exercises(timestamp) - Fast time-based queries
""")

if __name__ == "__main__":
    print("=== Hebrew CrossFit AI - Database Viewer ===")
    view_database()
    show_database_schema()
    
    print(f"\n📍 Database Location:")
    print(f"   File: {os.path.abspath('workout_data.db')}")
    print(f"   Type: SQLite 3 Database")
    print(f"   Format: Persistent, portable, standard SQL")
    print(f"\n🔧 Access Methods:")
    print(f"   1. This script: python view_database.py")
    print(f"   2. SQLite CLI: sqlite3 workout_data.db")
    print(f"   3. Database browsers: DB Browser for SQLite, etc.")
    print(f"   4. App statistics windows: 📊 📈 🏆 buttons")