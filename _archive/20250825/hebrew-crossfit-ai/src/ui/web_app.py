#!/usr/bin/env python3
"""
Hebrew CrossFit AI - Streamlit Web App
Quick prototype for online hosting
"""

import streamlit as st
import sqlite3
import os
import re
import requests
import json
from datetime import datetime, timedelta
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Page config
st.set_page_config(
    page_title="Hebrew CrossFit AI",
    page_icon="🏋️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Hebrew support
st.markdown("""
<style>
.hebrew-text {
    direction: rtl;
    text-align: right;
    font-family: 'Arial', 'Noto Sans Hebrew', sans-serif;
}
.exercise-card {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e1e5e9;
    margin: 0.5rem 0;
}
.points-display {
    font-size: 2rem;
    font-weight: bold;
    color: #1f77b4;
}
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'user_points' not in st.session_state:
    st.session_state.user_points = 0
    st.session_state.user_level = 1
    st.session_state.current_workout = []
    st.session_state.workout_streak = 0
    st.session_state.achievements = []

# Exercise points system
EXERCISE_POINTS = {
    "שכיבות סמיכה": 2,
    "סקוואטים": 3,
    "ברפיז": 5,
    "בורפיס": 5,
    "כפיפות בטן": 2,
    "משיכות": 4,
    "לחיצות": 3,
    "סקווט ג'אמפ": 4,
}

# Level system
LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
LEVEL_NAMES = ["מתחיל", "חובב", "מתאמן", "ספורטאי", "אתלט",
               "לוחם", "אלוף", "אגדה", "טיטאן", "אל האימונים"]

def init_database():
    """Initialize SQLite database"""
    conn = sqlite3.connect('web_workout_data.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise_he TEXT NOT NULL,
            exercise_en TEXT NOT NULL,
            reps INTEGER NOT NULL,
            points INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            session_date TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

def save_exercise(exercise_he, exercise_en, reps, points):
    """Save exercise to database"""
    conn = sqlite3.connect('web_workout_data.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO exercises (exercise_he, exercise_en, reps, points, timestamp, session_date)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (exercise_he, exercise_en, reps, points, 
          datetime.now().isoformat(), 
          datetime.now().strftime('%Y-%m-%d')))
    
    conn.commit()
    conn.close()

def get_today_stats():
    """Get today's exercise statistics"""
    conn = sqlite3.connect('web_workout_data.db')
    cursor = conn.cursor()
    
    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute('''
        SELECT exercise_he, SUM(reps), SUM(points), COUNT(*)
        FROM exercises 
        WHERE session_date = ?
        GROUP BY exercise_he
    ''', (today,))
    
    results = cursor.fetchall()
    conn.close()
    
    return results

def get_weekly_data():
    """Get weekly exercise data for charts"""
    conn = sqlite3.connect('web_workout_data.db')
    cursor = conn.cursor()
    
    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    cursor.execute('''
        SELECT session_date, SUM(points) as daily_points, COUNT(*) as exercises
        FROM exercises 
        WHERE session_date >= ?
        GROUP BY session_date
        ORDER BY session_date
    ''', (week_ago,))
    
    results = cursor.fetchall()
    conn.close()
    
    return results

def calculate_points(text):
    """Calculate points for workout text"""
    # Check if this is a question (don't record questions)
    question_words = ["כמה", "מה", "איך", "האם", "?", "אילו", "מתי", "איפה"]
    if any(word in text for word in question_words):
        return 0, [], "❌ זו שאלה - לא נרשם"
    
    # Check if this is a statement about doing exercise
    action_words = ["עושה", "עשיתי", "ביצעתי", "השלמתי", "סיימתי", "התחלתי", "אני"]
    if not any(word in text for word in action_words):
        return 0, [], "❌ לא זוהתה פעולת אימון"
    
    points = 0
    exercises_found = []
    
    # Look for exercises and reps
    for exercise, base_points in EXERCISE_POINTS.items():
        if exercise in text:
            numbers = re.findall(r'\d+', text)
            if numbers:
                reps = int(numbers[0])
                exercise_points = base_points * reps
                points += exercise_points
                exercises_found.append({
                    "name": exercise,
                    "reps": reps,
                    "points": exercise_points
                })
            else:
                return 0, [], f"⚠️ לא צוין מספר חזרות עבור {exercise}"
    
    return points, exercises_found, "✅ נרשם בהצלחה" if exercises_found else "❌ לא זוהו תרגילים"

def get_level_info(points):
    """Get current level and progress"""
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if points >= threshold:
            level = i + 1
    
    current_threshold = LEVEL_THRESHOLDS[level-1] if level <= len(LEVEL_THRESHOLDS) else LEVEL_THRESHOLDS[-1]
    next_threshold = LEVEL_THRESHOLDS[level] if level < len(LEVEL_THRESHOLDS) else LEVEL_THRESHOLDS[-1]
    
    if level >= len(LEVEL_THRESHOLDS):
        progress = 100
    else:
        progress = (points - current_threshold) / (next_threshold - current_threshold) * 100
    
    level_name = LEVEL_NAMES[min(level-1, len(LEVEL_NAMES)-1)]
    
    return level, level_name, progress, next_threshold - points

def generate_ai_response(text):
    """Generate AI response (simplified for demo)"""
    if "נקודות" in text:
        return "ספר לי איזה תרגילים עשית ואני אחשב לך את הנקודות!"
    
    responses = [
        "נהדר! תמשיך כך!",
        "איזה התקדמות מעולה!",
        "אתה על הדרך הנכונה!",
        "כל הכבוד על המאמץ!",
    ]
    
    import random
    return random.choice(responses)

# Initialize database
init_database()

# Header
st.title("🏋️ Hebrew CrossFit AI - Web Version")
st.markdown('<div class="hebrew-text">מערכת אימונים חכמה בעברית</div>', unsafe_allow_html=True)

# Sidebar - User Stats
with st.sidebar:
    st.header("📊 הסטטיסטיקות שלך")
    
    level, level_name, progress, points_to_next = get_level_info(st.session_state.user_points)
    st.session_state.user_level = level
    
    # Level display
    st.metric("רמה", f"{level}: {level_name}")
    st.metric("נקודות", st.session_state.user_points)
    
    # Progress bar
    st.progress(progress / 100)
    if points_to_next > 0:
        st.caption(f"עוד {points_to_next} נקודות לרמה הבאה")
    
    # Today's stats
    st.subheader("היום")
    today_stats = get_today_stats()
    if today_stats:
        for exercise, total_reps, total_points, count in today_stats:
            st.write(f"• {exercise}: {total_reps} חזרות ({total_points} נק')")
    else:
        st.write("עדיין לא התאמנת היום")

# Main content
col1, col2 = st.columns([2, 1])

with col1:
    st.header("💬 דבר על האימונים שלך")
    
    # Text input
    user_input = st.text_area(
        "ספר לי מה עשית:",
        placeholder="דוגמה: עשיתי 20 שכיבות סמיכה ו-15 סקוואטים",
        height=100,
        key="exercise_input"
    )
    
    col_submit, col_clear = st.columns([1, 1])
    
    with col_submit:
        if st.button("🎯 רשום אימון", type="primary"):
            if user_input:
                points, exercises, status = calculate_points(user_input)
                
                if points > 0:
                    # Add points
                    st.session_state.user_points += points
                    
                    # Save exercises to database
                    for ex in exercises:
                        save_exercise(
                            exercise_he=ex["name"],
                            exercise_en=ex["name"],  # Simplified for demo
                            reps=ex["reps"],
                            points=ex["points"]
                        )
                        st.session_state.current_workout.append(ex)
                    
                    # Success message
                    st.success(f"🎉 {status}")
                    for ex in exercises:
                        st.write(f"✅ {ex['name']}: {ex['reps']} חזרות = {ex['points']} נקודות")
                    
                    # Generate AI response
                    ai_response = generate_ai_response(user_input)
                    st.info(f"🤖 AI: {ai_response}")
                    
                    # Check for level up
                    old_level = level
                    new_level, _, _, _ = get_level_info(st.session_state.user_points)
                    if new_level > old_level:
                        st.balloons()
                        st.success(f"🎊 עלית רמה! אתה עכשיו {LEVEL_NAMES[new_level-1]}!")
                
                else:
                    st.warning(status)
                    
                # Clear input
                st.session_state.exercise_input = ""
    
    with col_clear:
        if st.button("🧹 נקה"):
            st.session_state.exercise_input = ""

with col2:
    st.header("🎮 מערכת הניקוד")
    
    st.subheader("נקודות לתרגיל:")
    for exercise, points in EXERCISE_POINTS.items():
        st.write(f"• {exercise}: {points} נק'/חזרה")
    
    if st.button("🏁 סיים אימון"):
        if st.session_state.current_workout:
            total = sum(ex['points'] for ex in st.session_state.current_workout)
            st.success(f"🎉 אימון הושלם! סה\"כ: {total} נקודות")
            st.session_state.current_workout = []
        else:
            st.warning("אין אימון פעיל")

# Statistics section
st.header("📈 סטטיסטיקות")

# Weekly chart
weekly_data = get_weekly_data()
if weekly_data:
    df = pd.DataFrame(weekly_data, columns=['Date', 'Points', 'Exercises'])
    
    col1, col2 = st.columns(2)
    
    with col1:
        fig_points = px.line(df, x='Date', y='Points', title='נקודות יומיות השבוע')
        fig_points.update_layout(
            xaxis_title="תאריך",
            yaxis_title="נקודות"
        )
        st.plotly_chart(fig_points, use_container_width=True)
    
    with col2:
        fig_exercises = px.bar(df, x='Date', y='Exercises', title='מספר תרגילים יומי')
        fig_exercises.update_layout(
            xaxis_title="תאריך",
            yaxis_title="תרגילים"
        )
        st.plotly_chart(fig_exercises, use_container_width=True)

# Exercise history table
st.subheader("היסטוריית תרגילים")
if today_stats:
    df_today = pd.DataFrame(today_stats, columns=['תרגיל', 'סה"כ חזרות', 'סה"כ נקודות', 'מספר פעמים'])
    st.dataframe(df_today, use_container_width=True)
else:
    st.write("אין נתונים להצגה")

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center;">
    <p>🏋️ Hebrew CrossFit AI - Web Version | Made with Streamlit</p>
    <p>Features: Voice recognition simulation, Exercise tracking, Gamification, Statistics</p>
</div>
""", unsafe_allow_html=True)