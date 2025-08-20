#!/usr/bin/env python3
"""
Final Hebrew CrossFit AI with Gamification
- Better transcription with corrections
- Very short AI responses
- Full gamification system
"""

import os
import sys
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading
import queue
import time
from datetime import datetime, timedelta
import traceback
import speech_recognition as sr
import re
import json
import requests
from exercise_tracker import ExerciseTracker, ExerciseEntry

# Set API key directly
os.environ['GEMINI_API_KEY'] = 'AIzaSyA05LBkE0_ZLb1JuavvkVe8OVgmo3xGfJ4'

class GamifiedHebrewCrossFitUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Hebrew CrossFit AI - Gamified 🏆")
        self.root.geometry("850x650")
        
        # Message queue
        self.message_queue = queue.Queue()
        
        # State
        self.conversation_active = False
        self.current_workout = []
        
        # Initialize exercise tracker
        self.exercise_tracker = ExerciseTracker()
        
        # Gamification state
        self.user_points = 0
        self.user_level = 1
        self.workout_streak = 0
        self.achievements = []
        
        # Points system
        self.exercise_points = {
            "שכיבות סמיכה": 2,
            "סקוואטים": 3,
            "ברפיז": 5,
            "בורפיס": 5,
            "כפיפות בטן": 2,
            "משיכות": 4,
            "לחיצות": 3,
            "סקווט ג'אמפ": 4,
        }
        
        # Initialize speech recognizer
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 2000
        self.recognizer.dynamic_energy_threshold = False
        self.recognizer.pause_threshold = 0.8
        
        try:
            self.microphone = sr.Microphone()
        except Exception as e:
            print(f"Microphone error: {e}")
            self.microphone = None
        
        # Hebrew corrections
        self.corrections = {
            "עזר": "עשר",
            "עזרה": "עשרה",
            "שמיכה": "סמיכה",
            "שכיבת": "שכיבות",
            "תבנה": "תבנה לי",
            "סט": "סט",
            "סטים": "סטים",
        }
        
        # Setup UI
        self.setup_ui()
        
        # Load components
        self.load_components()
        
        # Start message processor
        self.root.after(100, self.process_messages)
    
    def setup_ui(self):
        """Setup gamified UI"""
        # Top panel - Gamification stats
        stats_frame = ttk.Frame(self.root, relief=tk.RAISED, borderwidth=2)
        stats_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Level and points
        level_frame = ttk.Frame(stats_frame)
        level_frame.pack(side=tk.LEFT, padx=20)
        
        self.level_label = ttk.Label(level_frame, text="רמה 1: מתחיל", 
                                   font=('Arial', 14, 'bold'))
        self.level_label.pack()
        
        self.points_label = ttk.Label(level_frame, text="💪 0 נקודות", 
                                    font=('Arial', 12))
        self.points_label.pack()
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(level_frame, variable=self.progress_var,
                                          length=200, mode='determinate')
        self.progress_bar.pack(pady=5)
        
        # Streak
        streak_frame = ttk.Frame(stats_frame)
        streak_frame.pack(side=tk.LEFT, padx=20)
        
        self.streak_label = ttk.Label(streak_frame, text="🔥 רצף: 0 ימים", 
                                    font=('Arial', 12))
        self.streak_label.pack()
        
        # Achievements preview
        achievements_frame = ttk.Frame(stats_frame)
        achievements_frame.pack(side=tk.RIGHT, padx=20)
        
        self.achievement_label = ttk.Label(achievements_frame, text="🏆 הישגים: 0", 
                                         font=('Arial', 12))
        self.achievement_label.pack()
        
        # Header
        header_frame = ttk.Frame(self.root)
        header_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(header_frame, text="🏆 Hebrew CrossFit AI - Gamified", 
                 font=('Arial', 16, 'bold')).pack()
        
        # Controls
        control_frame = ttk.Frame(self.root)
        control_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Sensitivity control
        threshold_frame = ttk.LabelFrame(control_frame, text="רגישות")
        threshold_frame.pack(side=tk.LEFT, padx=5)
        
        self.threshold_var = tk.IntVar(value=2000)
        self.threshold_scale = ttk.Scale(threshold_frame, from_=500, to=4000, 
                                       variable=self.threshold_var, 
                                       command=self.update_threshold,
                                       length=120)
        self.threshold_scale.pack(side=tk.LEFT)
        
        self.threshold_label = ttk.Label(threshold_frame, text="2000")
        self.threshold_label.pack(side=tk.LEFT, padx=5)
        
        # Buttons
        self.start_btn = ttk.Button(control_frame, text="🎤 התחל צ'אט", 
                                  command=self.toggle_chat, state='disabled')
        self.start_btn.pack(side=tk.LEFT, padx=5)
        
        self.workout_btn = ttk.Button(control_frame, text="💪 סיים אימון", 
                                    command=self.finish_workout, state='disabled')
        self.workout_btn.pack(side=tk.LEFT, padx=5)
        
        self.stats_btn = ttk.Button(control_frame, text="📊 סטטיסטיקות", 
                                  command=self.show_stats)
        self.stats_btn.pack(side=tk.LEFT, padx=5)
        
        self.history_btn = ttk.Button(control_frame, text="📈 היסטוריה", 
                                    command=self.show_history)
        self.history_btn.pack(side=tk.LEFT, padx=5)
        
        self.records_btn = ttk.Button(control_frame, text="🏆 שיאים", 
                                    command=self.show_records)
        self.records_btn.pack(side=tk.LEFT, padx=5)
        
        # Log area
        log_frame = ttk.Frame(self.root)
        log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        ttk.Label(log_frame, text="שיחה:", font=('Arial', 12)).pack(anchor=tk.W)
        
        self.log_text = scrolledtext.ScrolledText(
            log_frame, wrap=tk.WORD, height=20, font=('Arial', 11))
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        # Configure text styles
        self.log_text.tag_config('user', foreground='blue', font=('Arial', 11, 'bold'))
        self.log_text.tag_config('ai', foreground='green', font=('Arial', 11))
        self.log_text.tag_config('system', foreground='gray', font=('Arial', 10))
        self.log_text.tag_config('error', foreground='red')
        self.log_text.tag_config('success', foreground='darkgreen', font=('Arial', 11, 'bold'))
        self.log_text.tag_config('points', foreground='orange', font=('Arial', 12, 'bold'))
        self.log_text.tag_config('achievement', foreground='purple', font=('Arial', 12, 'bold'))
        
        # Status bar
        self.status_bar = ttk.Label(self.root, text="Starting...", relief=tk.SUNKEN)
        self.status_bar.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.log("🏆 Gamified UI loaded", 'success')
    
    def update_threshold(self, value):
        """Update energy threshold"""
        val = int(float(value))
        self.threshold_label.config(text=str(val))
        if hasattr(self, 'recognizer'):
            self.recognizer.energy_threshold = val
    
    def load_components(self):
        """Load components"""
        try:
            # Test microphone
            if self.microphone:
                with self.microphone as source:
                    self.recognizer.adjust_for_ambient_noise(source, duration=1)
                self.log("✅ מיקרופון מוכן", 'success')
                self.start_btn.config(state='normal')
            else:
                self.log("❌ לא נמצא מיקרופון", 'error')
            
            # Load workout parser
            try:
                from hebrew_workout_parser import HebrewWorkoutParser
                self.workout_parser = HebrewWorkoutParser()
                self.log("✅ מנתח אימונים טעון", 'success')
            except:
                self.workout_parser = None
            
            # Load gamification
            try:
                from hebrew_gamification import HebrewGamification
                self.gamification = HebrewGamification()
                self.log("✅ מערכת גיימיפיקציה פעילה", 'success')
            except:
                self.gamification = None
            
            self.status_bar.config(text="מוכן - דבר על אימונים וצבור נקודות!")
            
        except Exception as e:
            self.log(f"❌ שגיאת טעינה: {e}", 'error')
    
    def correct_text(self, text):
        """Apply corrections to Hebrew text"""
        if not text:
            return text
        
        corrected = text
        for wrong, right in self.corrections.items():
            corrected = corrected.replace(wrong, right)
        
        # Number corrections
        corrected = re.sub(r'עזר(\s+)', r'עשר\1', corrected)
        corrected = re.sub(r'עזרה(\s+)', r'עשרה\1', corrected)
        
        return corrected
    
    def calculate_points(self, text):
        """Calculate points for workout and save to tracker"""
        points = 0
        exercises_found = []
        
        # Check if this is a question (don't record questions)
        question_words = ["כמה", "מה", "איך", "האם", "?", "אילו", "מתי", "איפה"]
        if any(word in text for word in question_words):
            return 0, []  # Don't record questions as exercises
        
        # Check if this is a statement about doing exercise (עושה, עשיתי, etc.)
        action_words = ["עושה", "עשיתי", "ביצעתי", "השלמתי", "סיימתי", "התחלתי", "אני", "אתחיל"]
        if not any(word in text for word in action_words):
            return 0, []  # Only record when explicitly stating an action
        
        # Start session if not already started
        if not self.exercise_tracker.current_session:
            self.exercise_tracker.start_session("Voice workout")
        
        # Look for exercises and reps
        for exercise, base_points in self.exercise_points.items():
            if exercise in text:
                # Try to find number of reps - look for number before or after exercise
                numbers = re.findall(r'\d+', text)
                if numbers:
                    # Take the first number found
                    reps = int(numbers[0])
                    exercise_points = base_points * reps
                    points += exercise_points
                    exercises_found.append(exercise)
                    
                    # Add to current workout (for UI)
                    self.current_workout.append({
                        "exercise": exercise,
                        "reps": reps,
                        "points": exercise_points
                    })
                    
                    # Save to tracker database
                    self.exercise_tracker.add_exercise(
                        exercise=self._get_english_name(exercise),
                        exercise_he=exercise,
                        reps=reps,
                        points=exercise_points
                    )
                    
                    self.log(f"📝 נרשם: {exercise} - {reps} חזרות", 'success')
                # If no number found, don't assume - ask for clarification
                else:
                    self.log(f"⚠️ לא צוין מספר חזרות עבור {exercise}", 'system')
                    return 0, []
        
        # Bonus for sets
        if "סט" in text or "סטים" in text:
            sets_match = re.search(r'(\d+)\s*סטים?', text)
            if sets_match:
                sets = int(sets_match.group(1))
                points = points * sets
                self.log(f"🔢 מוכפל ב-{sets} סטים", 'system')
        
        return points, exercises_found
    
    def _get_english_name(self, hebrew_name):
        """Convert Hebrew exercise name to English"""
        name_map = {
            "שכיבות סמיכה": "push-ups",
            "סקוואטים": "squats",
            "ברפיז": "burpees",
            "בורפיס": "burpees",
            "כפיפות בטן": "crunches",
            "משיכות": "pull-ups",
            "לחיצות": "presses",
            "סקווט ג'אמפ": "squat-jumps"
        }
        return name_map.get(hebrew_name, hebrew_name)
    
    def add_points(self, points, reason=""):
        """Add points and check for level up"""
        self.user_points += points
        
        # Check level up
        level_thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
        level_names = ["מתחיל", "חובב", "מתאמן", "ספורטאי", "אתלט",
                      "לוחם", "אלוף", "אגדה", "טיטאן", "אל האימונים"]
        
        old_level = self.user_level
        for i, threshold in enumerate(level_thresholds):
            if self.user_points >= threshold:
                self.user_level = i + 1
        
        # Update UI
        self.points_label.config(text=f"💪 {self.user_points} נקודות")
        self.level_label.config(text=f"רמה {self.user_level}: {level_names[min(self.user_level-1, len(level_names)-1)]}")
        
        # Update progress bar
        if self.user_level < len(level_thresholds):
            current_threshold = level_thresholds[self.user_level-1]
            next_threshold = level_thresholds[self.user_level]
            progress = (self.user_points - current_threshold) / (next_threshold - current_threshold) * 100
            self.progress_var.set(progress)
        else:
            self.progress_var.set(100)
        
        # Log points
        self.log(f"🎯 +{points} נקודות! {reason}", 'points')
        
        # Check level up
        if self.user_level > old_level:
            self.log(f"🎊 עלית רמה! אתה עכשיו {level_names[self.user_level-1]}!", 'achievement')
            self.achievements.append(f"Level {self.user_level}")
            self.achievement_label.config(text=f"🏆 הישגים: {len(self.achievements)}")
    
    def generate_ai_response(self, text):
        """Generate gamification-aware AI response"""
        try:
            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                return "API key missing"
            
            # Check for points questions
            if "נקודות" in text or "כמה זה שווה" in text:
                return self.calculate_points_response(text)
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
            
            # Gamification-aware prompt
            system_msg = """אתה מאמן קרוספיט ישראלי עם מערכת ניקוד.
חוק 1: תשובות של משפט אחד או שניים בלבד!
חוק 2: ענה ישירות על השאלה.

נקודות לתרגילים:
- שכיבות סמיכה: 2 נקודות לחזרה
- סקוואטים: 3 נקודות לחזרה
- ברפיז/בורפיס: 5 נקודות לחזרה
- כפיפות בטן: 2 נקודות לחזרה

דוגמאות:
שאלה: תבנה לי אימון קצר
תשובה: 3 סטים: 10 סקוואטים (30 נק'), 10 שכיבות סמיכה (20 נק'), 5 ברפיז (25 נק').

שאלה: כמה נקודות יש בסט של 20 שכיבות סמיכה?
תשובה: 20 שכיבות סמיכה = 40 נקודות."""
            
            conversation = f"{system_msg}\n\nשאלה: {text}\nתשובה:"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": conversation
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 50,
                    "topK": 1,
                    "topP": 0.8,
                }
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "candidates" in result and result["candidates"]:
                    text = result["candidates"][0]["content"]["parts"][0]["text"]
                    return text.strip()
            
            return "נסה שוב"
            
        except Exception as e:
            self.log(f"AI error: {e}", 'error')
            return "שגיאה בתשובה"
    
    def calculate_points_response(self, text):
        """Calculate points for specific query or show workout history"""
        # Check if asking about current workout
        if "כמה" in text and ("עשיתי" in text or "ביצעתי" in text):
            if self.current_workout:
                response_parts = []
                total_points = 0
                for w in self.current_workout:
                    response_parts.append(f"{w['exercise']}: {w['reps']} חזרות ({w['points']} נק')")
                    total_points += w['points']
                
                if response_parts:
                    return f"באימון הנוכחי: {', '.join(response_parts)}. סה\"כ: {total_points} נקודות."
            else:
                # Check recent exercises from database
                if self.exercise_tracker.current_session:
                    session_exercises = self.exercise_tracker.current_session.exercises
                    if session_exercises:
                        response_parts = []
                        total_points = 0
                        for ex in session_exercises:
                            response_parts.append(f"{ex.exercise_he}: {ex.reps} חזרות ({ex.points} נק')")
                            total_points += ex.points
                        return f"באימון הנוכחי: {', '.join(response_parts)}. סה\"כ: {total_points} נקודות."
                
                return "עדיין לא התחלת אימון היום. ספר לי מה עשית!"
        
        # Extract numbers and exercises for hypothetical calculation
        total_points = 0
        response_parts = []
        
        for exercise, points_per_rep in self.exercise_points.items():
            if exercise in text:
                numbers = re.findall(r'\d+', text)
                if numbers:
                    reps = int(numbers[0])
                    points = reps * points_per_rep
                    total_points += points
                    response_parts.append(f"{reps} {exercise} = {points} נקודות")
        
        if response_parts:
            return f"{', '.join(response_parts)}. סה\"כ: {total_points} נקודות."
        
        return "ספר לי איזה תרגילים עשית וכמה חזרות, ואני אחשב לך את הנקודות."
    
    def finish_workout(self):
        """Finish workout and calculate total points"""
        if not self.current_workout and not self.exercise_tracker.current_session:
            self.log("אין אימון פעיל", 'error')
            return
        
        # End tracker session and get summary
        completed_session = self.exercise_tracker.end_session()
        
        total_points = sum(w['points'] for w in self.current_workout)
        
        self.log("🏁 סיכום אימון:", 'success')
        if completed_session:
            self.log(f"⏱️ משך: {completed_session.duration_minutes} דקות", 'system')
            self.log(f"📝 נשמר בהיסטוריה עם {len(completed_session.exercises)} תרגילים", 'system')
        
        for w in self.current_workout:
            self.log(f"  • {w['exercise']}: {w['reps']} חזרות = {w['points']} נקודות", 'system')
        
        self.add_points(total_points, "סיום אימון")
        
        # Update streak from tracker
        streak_info = self.exercise_tracker.get_streak_info()
        self.workout_streak = streak_info['current_streak']
        self.streak_label.config(text=f"🔥 רצף: {self.workout_streak} ימים")
        
        # Check achievements
        if self.workout_streak == 7:
            self.log("🏆 הישג חדש: שבוע של אימונים רצופים!", 'achievement')
            self.add_points(100, "הישג רצף שבועי")
        
        # Reset workout
        self.current_workout = []
        self.workout_btn.config(state='disabled')
    
    def show_stats(self):
        """Show comprehensive statistics"""
        stats_window = tk.Toplevel(self.root)
        stats_window.title("📊 הסטטיסטיקות שלך")
        stats_window.geometry("600x500")
        
        # Create notebook for tabs
        notebook = ttk.Notebook(stats_window)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Daily stats tab
        daily_frame = ttk.Frame(notebook)
        notebook.add(daily_frame, text="היום")
        
        daily_stats = self.exercise_tracker.get_daily_stats()
        daily_text = f"""
📅 {daily_stats['date_he']}

🏋️ אימונים היום: {daily_stats['session_count']}
💪 נקודות: {daily_stats['total_points']}
⏱️ זמן כולל: {daily_stats['total_duration_minutes']} דקות

תרגילים היום:
"""
        
        for ex in daily_stats['exercises']:
            daily_text += f"• {ex['name']}: {ex['sets']} סטים, {ex['total_reps']} חזרות ({ex['points']} נק')\n"
        
        if not daily_stats['exercises']:
            daily_text += "לא בוצעו תרגילים היום"
        
        ttk.Label(daily_frame, text=daily_text, font=('Arial', 12), 
                 justify=tk.LEFT).pack(padx=20, pady=20)
        
        # Weekly stats tab
        weekly_frame = ttk.Frame(notebook)
        notebook.add(weekly_frame, text="השבוע")
        
        weekly_stats = self.exercise_tracker.get_weekly_stats()
        weekly_text = f"""
📅 השבוע ({weekly_stats['week_start']} - {weekly_stats['week_end']})

🏋️ אימונים: {weekly_stats['session_count']}
💪 נקודות: {weekly_stats['total_points']}
⏱️ זמן כולל: {weekly_stats['total_duration_minutes']} דקות

התרגילים הפופולריים ביותר:
"""
        
        for ex in weekly_stats['top_exercises']:
            weekly_text += f"• {ex['name']}: {ex['sets']} סטים, {ex['total_reps']} חזרות ({ex['points']} נק')\n"
        
        weekly_text += "\nפירוט יומי:\n"
        for day in weekly_stats['daily_breakdown']:
            weekly_text += f"• {day['date']}: {day['sessions']} אימונים, {day['points']} נקודות\n"
        
        ttk.Label(weekly_frame, text=weekly_text, font=('Arial', 12), 
                 justify=tk.LEFT).pack(padx=20, pady=20)
        
        # Levels tab
        levels_frame = ttk.Frame(notebook)
        notebook.add(levels_frame, text="רמות")
        
        levels_text = f"""
הרמה הנוכחית שלך: {self.user_level}
נקודות: {self.user_points}
רצף אימונים: {self.workout_streak} ימים
הישגים: {len(self.achievements)}

מערכת הרמות:
1. מתחיל (0-99)
2. חובב (100-299)
3. מתאמן (300-599)
4. ספורטאי (600-999)
5. אתלט (1000-1499)
6. לוחם (1500-2499)
7. אלוף (2500-3999)
8. אגדה (4000-5999)
9. טיטאן (6000-9999)
10. אל האימונים (10000+)
"""
        
        ttk.Label(levels_frame, text=levels_text, font=('Arial', 12), 
                 justify=tk.LEFT).pack(padx=20, pady=20)
    
    def show_history(self):
        """Show workout history"""
        history_window = tk.Toplevel(self.root)
        history_window.title("📈 היסטוריית אימונים")
        history_window.geometry("700x500")
        
        # Create treeview for history
        tree_frame = ttk.Frame(history_window)
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL)
        v_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        h_scrollbar = ttk.Scrollbar(tree_frame, orient=tk.HORIZONTAL)
        h_scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Treeview
        columns = ('date', 'exercise', 'reps', 'points', 'time')
        tree = ttk.Treeview(tree_frame, columns=columns, show='headings',
                           yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Configure scrollbars
        v_scrollbar.config(command=tree.yview)
        h_scrollbar.config(command=tree.xview)
        
        # Define headings
        tree.heading('date', text='תאריך')
        tree.heading('exercise', text='תרגיל')
        tree.heading('reps', text='חזרות')
        tree.heading('points', text='נקודות')
        tree.heading('time', text='שעה')
        
        # Configure column widths
        tree.column('date', width=100)
        tree.column('exercise', width=150)
        tree.column('reps', width=80)
        tree.column('points', width=80)
        tree.column('time', width=100)
        
        tree.pack(fill=tk.BOTH, expand=True)
        
        # Load exercise history for popular exercises
        popular_exercises = ["שכיבות סמיכה", "סקוואטים", "ברפיז"]
        
        for exercise_he in popular_exercises:
            history = self.exercise_tracker.get_exercise_history(exercise_he, days=30)
            for entry in history:
                date_str = entry['date']
                time_str = entry['timestamp'][11:19] if len(entry['timestamp']) > 10 else ""
                tree.insert('', 'end', values=(
                    date_str, exercise_he, entry['reps'], entry['points'], time_str
                ))
    
    def show_records(self):
        """Show personal records"""
        records_window = tk.Toplevel(self.root)
        records_window.title("🏆 השיאים שלך")
        records_window.geometry("500x400")
        
        # Create notebook for different record types
        notebook = ttk.Notebook(records_window)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Max reps tab
        reps_frame = ttk.Frame(notebook)
        notebook.add(reps_frame, text="מירב חזרות")
        
        records = self.exercise_tracker.get_personal_records()
        
        reps_text = "🏆 מירב חזרות לתרגיל:\n\n"
        if records['max_reps']:
            for record in records['max_reps']:
                reps_text += f"• {record['exercise']}: {record['reps']} חזרות ({record['date']})\n"
        else:
            reps_text += "עדיין לא נקבעו שיאים"
        
        ttk.Label(reps_frame, text=reps_text, font=('Arial', 12), 
                 justify=tk.LEFT).pack(padx=20, pady=20)
        
        # Streak info tab
        streak_frame = ttk.Frame(notebook)
        notebook.add(streak_frame, text="רצפים")
        
        streak_info = self.exercise_tracker.get_streak_info()
        
        streak_text = f"""
🔥 הרצף הנוכחי: {streak_info['current_streak']} ימים
🏆 הרצף הארוך ביותר: {streak_info['longest_streak']} ימים
📅 האימון האחרון: {streak_info['last_workout'] or 'אין נתונים'}

טיפים לשמירה על רצף:
• התאמן לפחות פעם ביום
• אפילו 5 דקות אימון נחשבות!
• השתמש בתזכורות
• מצא חבר אימונים
"""
        
        ttk.Label(streak_frame, text=streak_text, font=('Arial', 12), 
                 justify=tk.LEFT).pack(padx=20, pady=20)
    
    def toggle_chat(self):
        """Toggle chat on/off"""
        if self.conversation_active:
            self.stop_chat()
        else:
            self.start_chat()
    
    def start_chat(self):
        """Start auto chat"""
        self.conversation_active = True
        self.start_btn.config(text="⏹️ עצור צ'אט")
        self.status_bar.config(text="צ'אט פעיל - דבר על אימונים!")
        self.log("🎤 התחלנו - ספר לי על האימונים שלך!", 'success')
        
        def chat_loop():
            with self.microphone as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                
                while self.conversation_active:
                    try:
                        audio = self.recognizer.listen(
                            source,
                            timeout=1,
                            phrase_time_limit=7
                        )
                        
                        try:
                            raw_text = self.recognizer.recognize_google(audio, language="he-IL")
                            
                            if raw_text and len(raw_text.strip()) > 2:
                                # Apply corrections
                                corrected_text = self.correct_text(raw_text)
                                
                                # Log user message
                                self.message_queue.put(('log', (f'אתה: {corrected_text}', 'user')))
                                
                                # Check for workout data
                                points, exercises = self.calculate_points(corrected_text)
                                if points > 0:
                                    self.message_queue.put(('add_points', (points, f"{', '.join(exercises)}")))
                                    self.message_queue.put(('enable_workout_btn', None))
                                
                                # Get AI response
                                self.message_queue.put(('log', ('🤖 חושב...', 'system')))
                                response = self.generate_ai_response(corrected_text)
                                self.message_queue.put(('log', (f'AI: {response}', 'ai')))
                                
                                time.sleep(2)
                                
                        except sr.UnknownValueError:
                            pass
                        except sr.RequestError as e:
                            self.message_queue.put(('error', f"Google error: {e}"))
                            time.sleep(2)
                            
                    except sr.WaitTimeoutError:
                        pass
                    except Exception as e:
                        if self.conversation_active:
                            self.message_queue.put(('error', f"Error: {e}"))
                        break
        
        threading.Thread(target=chat_loop, daemon=True).start()
    
    def stop_chat(self):
        """Stop chat"""
        self.conversation_active = False
        self.start_btn.config(text="🎤 התחל צ'אט")
        self.status_bar.config(text="צ'אט מופסק")
        self.log("⏹️ הופסק", 'system')
    
    def log(self, message, tag='system'):
        """Add message to log"""
        self.message_queue.put(('log', (message, tag)))
    
    def process_messages(self):
        """Process UI messages"""
        try:
            while not self.message_queue.empty():
                msg_type, data = self.message_queue.get_nowait()
                
                if msg_type == 'log':
                    message, tag = data
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    self.log_text.insert(tk.END, f"[{timestamp}] {message}\n", tag)
                    self.log_text.see(tk.END)
                    
                elif msg_type == 'error':
                    self.log(f"❌ {data}", 'error')
                    
                elif msg_type == 'add_points':
                    points, reason = data
                    self.add_points(points, reason)
                    
                elif msg_type == 'enable_workout_btn':
                    self.workout_btn.config(state='normal')
                    
        except Exception as e:
            print(f"Message error: {e}")
        
        self.root.after(100, self.process_messages)
    
    def run(self):
        """Run the application"""
        try:
            self.log("🏆 מערכת גיימיפיקציה פעילה!", 'success')
            self.log("דבר על האימונים שלך וצבור נקודות!", 'system')
            self.root.mainloop()
        except Exception as e:
            print(f"Runtime error: {e}")
            traceback.print_exc()


def main():
    """Main entry point"""
    try:
        print("Starting Gamified Hebrew CrossFit AI...")
        print("Features:")
        print("- Points system for exercises")
        print("- Levels and achievements")
        print("- Workout tracking")
        print("- Short AI responses")
        app = GamifiedHebrewCrossFitUI()
        app.run()
    except Exception as e:
        print(f"Failed to start: {e}")
        traceback.print_exc()
        input("Press Enter to exit...")


if __name__ == "__main__":
    main()