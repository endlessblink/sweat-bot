#!/usr/bin/env python3
"""
Enhanced Hebrew CrossFit AI Desktop Application
With advanced weight tracking and personal records
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

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.enhanced_exercise_tracker_fixed import EnhancedExerciseTracker
from utils.config import get_config

class EnhancedHebrewCrossFitUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Hebrew CrossFit AI - Enhanced 🏆")
        self.root.geometry("900x700")
        
        # Load configuration
        self.config = get_config()
        
        # Message queue
        self.message_queue = queue.Queue()
        
        # State
        self.conversation_active = False
        self.current_workout = []
        self.session_points = 0
        self.daily_points = 0
        
        # Initialize enhanced exercise tracker
        self.exercise_tracker = EnhancedExerciseTracker()
        
        # Gamification state
        self.user_points = self._load_user_points()
        self.user_level = 1
        self.workout_streak = 0
        self.achievements = []
        
        # Enhanced points system with weight bonuses
        self.EXERCISE_POINTS = {
            "שכיבות סמיכה": 2,
            "סקוואטים": 3,
            "בק סקווט": 4,
            "פרונט סקווט": 4,
            "דדליפט": 5,
            "סנאץ'": 6,
            "קלין": 5,
            "ג'רק": 5,
            "קלין אנד ג'רק": 8,
            "ברפיז": 5,
            "בורפיס": 5,
            "כפיפות בטן": 2,
            "משיכות": 4,
            "לחיצות": 3,
            "לחיצת כתפיים": 4,
            "לחיצת חזה": 4,
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
            "בקסקוואט": "בק סקווט",
            "בק סקוואט": "בק סקווט",
            "דד ליפט": "דדליפט",
        }
        
        # Setup UI
        self.setup_ui()
        
        # Start message processor
        self.root.after(100, self.process_messages)
    
    def _load_user_points(self):
        """Load user points from local storage"""
        try:
            if os.path.exists("user_data.json"):
                with open("user_data.json", "r") as f:
                    data = json.load(f)
                    return data.get("points", 0)
        except:
            pass
        return 0
    
    def _save_user_points(self):
        """Save user points to local storage"""
        try:
            data = {"points": self.user_points, "level": self.user_level}
            with open("user_data.json", "w") as f:
                json.dump(data, f)
        except:
            pass
    
    def setup_ui(self):
        """Setup enhanced UI with weight tracking display"""
        # Top panel - Enhanced stats
        stats_frame = ttk.Frame(self.root, relief=tk.RAISED, borderwidth=2)
        stats_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Level and points
        level_frame = ttk.Frame(stats_frame)
        level_frame.pack(side=tk.LEFT, padx=10)
        
        self.level_label = ttk.Label(level_frame, text="רמה 1: מתחיל", 
                                    font=('Arial', 16, 'bold'))
        self.level_label.pack()
        
        self.points_label = ttk.Label(level_frame, text="💪 0 נקודות",
                                     font=('Arial', 14))
        self.points_label.pack()
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(level_frame, length=200,
                                           variable=self.progress_var)
        self.progress_bar.pack(pady=5)
        
        # Streak
        self.streak_label = ttk.Label(stats_frame, text="🔥 רצף: 0 ימים",
                                     font=('Arial', 14))
        self.streak_label.pack(side=tk.LEFT, padx=20)
        
        # Session stats
        session_frame = ttk.Frame(stats_frame)
        session_frame.pack(side=tk.LEFT, padx=20)
        
        self.session_label = ttk.Label(session_frame, text="אימון: 0 נק'",
                                      font=('Arial', 12))
        self.session_label.pack()
        
        self.daily_label = ttk.Label(session_frame, text="היום: 0 נק'",
                                    font=('Arial', 12))
        self.daily_label.pack()
        
        # PR indicator
        self.pr_label = ttk.Label(stats_frame, text="",
                                 font=('Arial', 14, 'bold'),
                                 foreground='red')
        self.pr_label.pack(side=tk.RIGHT, padx=20)
        
        # Control panel
        control_frame = ttk.Frame(self.root)
        control_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.start_btn = ttk.Button(control_frame, text="🎤 התחל צ'אט",
                                   command=self.toggle_chat)
        self.start_btn.pack(side=tk.LEFT, padx=5)
        
        self.workout_btn = ttk.Button(control_frame, text="🏁 סיים אימון",
                                     command=self.finish_workout,
                                     state='disabled')
        self.workout_btn.pack(side=tk.LEFT, padx=5)
        
        ttk.Button(control_frame, text="📊 סטטיסטיקות",
                  command=self.show_stats).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(control_frame, text="🏆 שיאים אישיים",
                  command=self.show_personal_records).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(control_frame, text="📈 התקדמות",
                  command=self.show_progress).pack(side=tk.LEFT, padx=5)
        
        # Main chat area
        chat_frame = ttk.Frame(self.root)
        chat_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Chat log
        self.chat_text = scrolledtext.ScrolledText(chat_frame, height=20, width=70,
                                                   font=('Arial', 11))
        self.chat_text.pack(fill=tk.BOTH, expand=True)
        
        # Configure tags
        self.chat_text.tag_config('user', foreground='blue', font=('Arial', 11, 'bold'))
        self.chat_text.tag_config('ai', foreground='green', font=('Arial', 11))
        self.chat_text.tag_config('system', foreground='gray', font=('Arial', 10, 'italic'))
        self.chat_text.tag_config('success', foreground='darkgreen', font=('Arial', 11, 'bold'))
        self.chat_text.tag_config('error', foreground='red', font=('Arial', 10))
        self.chat_text.tag_config('pr', foreground='red', font=('Arial', 12, 'bold'))
        self.chat_text.tag_config('achievement', foreground='gold', font=('Arial', 12, 'bold'))
        
        # Status bar
        self.status_bar = ttk.Label(self.root, text="מוכן להתחיל", relief=tk.SUNKEN)
        self.status_bar.pack(fill=tk.X, side=tk.BOTTOM)
        
        # Update initial display
        self.update_points_display()
    
    def toggle_chat(self):
        """Toggle chat on/off"""
        if self.conversation_active:
            self.stop_chat()
        else:
            self.start_chat()
    
    def start_chat(self):
        """Start voice chat"""
        if not self.microphone:
            messagebox.showerror("שגיאה", "לא נמצא מיקרופון")
            return
        
        self.conversation_active = True
        self.start_btn.config(text="⏹️ עצור צ'אט")
        self.status_bar.config(text="צ'אט פעיל - דבר על אימונים!")
        self.add_message("system", "🎤 התחלנו - ספר לי על האימונים שלך! אפשר להגיד למשל: 'עשיתי בק סקווט 50 קילו'", animate=True)
        
        # Start chat thread
        threading.Thread(target=self.chat_loop, daemon=True).start()
    
    def chat_loop(self):
        """Voice chat loop"""
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            while self.conversation_active:
                try:
                    # Listen for audio
                    audio = self.recognizer.listen(
                        source,
                        timeout=1,
                        phrase_time_limit=7
                    )
                    
                    # Recognize speech
                    try:
                        transcription = self.recognizer.recognize_google(audio, language="he-IL")
                        
                        if transcription and len(transcription.strip()) > 2:
                            # Apply corrections
                            transcription = self.correct_text(transcription)
                            
                            # Add user message
                            self.add_message("user", f"אתה: {transcription}")
                            
                            # Process exercise
                            points, exercises, tracking_result = self.calculate_points(transcription)
                            
                            if points > 0:
                                # Add to user points
                                self.user_points += points
                                self.session_points += points
                                self.daily_points += points
                                
                                # Save points
                                self._save_user_points()
                                
                                # Update UI
                                self.update_points_display()
                                
                                # Check for level up
                                self.check_level_up()
                                
                                # Enable workout button
                                self.workout_btn.config(state='normal')
                                
                                # Generate response
                                if tracking_result:
                                    response = self.exercise_tracker.generate_ai_response(tracking_result)
                                    self.add_message("system", response, animate=True)
                                    
                                    # Check for PR announcement
                                    if tracking_result.get('pr_info'):
                                        self.announce_pr(tracking_result['pr_info'])
                                else:
                                    # Fallback response
                                    exercise_list = "\n".join([f"✅ {ex['name']}: {ex['reps']} חזרות = {ex['points']} נקודות" for ex in exercises])
                                    message = f"🎯 רשמתי את התרגילים:\n{exercise_list}\n💪 סה\"כ: {points} נקודות!"
                                    self.add_message("system", message, animate=True)
                                
                                # Achievement check
                                self.check_achievements(exercises)
                            else:
                                # Get AI response for non-exercise chat
                                response = self.generate_ai_response(transcription)
                                self.add_message("ai", f"AI: {response}")
                            
                            time.sleep(2)
                            
                    except sr.UnknownValueError:
                        pass
                    except sr.RequestError as e:
                        self.add_message("error", f"שגיאת Google: {e}")
                        time.sleep(2)
                        
                except sr.WaitTimeoutError:
                    pass
                except Exception as e:
                    if self.conversation_active:
                        self.add_message("error", f"שגיאה: {e}")
                    break
    
    def stop_chat(self):
        """Stop chat"""
        self.conversation_active = False
        self.start_btn.config(text="🎤 התחל צ'אט")
        self.status_bar.config(text="צ'אט מופסק")
        self.add_message("system", "⏹️ הופסק")
    
    def correct_text(self, text):
        """Apply Hebrew corrections"""
        corrected = text
        for wrong, right in self.corrections.items():
            corrected = corrected.replace(wrong, right)
        return corrected
    
    def calculate_points(self, text):
        """Calculate points using enhanced tracking"""
        # Check if this is a question
        question_words = ["כמה", "מה", "איך", "האם", "?", "אילו", "מתי", "איפה"]
        if any(word in text for word in question_words):
            return 0, [], None
        
        # Check if this is an action statement
        action_words = ["עושה", "עשיתי", "ביצעתי", "השלמתי", "סיימתי", "התחלתי", "אני"]
        if not any(word in text for word in action_words):
            return 0, [], None
        
        # Use enhanced tracker
        result = self.exercise_tracker.add_exercise_from_text(text)
        
        if result:
            parsed = result['parsed']
            exercises_found = []
            points = 0
            
            # Calculate points
            if parsed['exercise_he'] in self.EXERCISE_POINTS:
                base_points = self.EXERCISE_POINTS[parsed['exercise_he']]
                
                # Weight bonus
                if parsed.get('weight'):
                    weight_bonus = int(parsed['weight'] / 10)  # 1 point per 10kg
                    total_points = (base_points * parsed['reps'] + weight_bonus) * parsed['sets']
                else:
                    total_points = base_points * parsed['reps'] * parsed['sets']
                
                points = total_points
                
                # Create exercise entry
                exercise_desc = f"{parsed['exercise_he']}"
                if parsed.get('weight'):
                    exercise_desc += f" - {parsed['weight']} ק\"ג"
                
                exercises_found.append({
                    "name": exercise_desc,
                    "reps": parsed['reps'] * parsed['sets'],
                    "points": total_points,
                    "sets": parsed['sets'],
                    "weight": parsed.get('weight')
                })
                
                # Add to current workout
                self.current_workout.extend(exercises_found)
            
            return points, exercises_found, result
        
        return 0, [], None
    
    def announce_pr(self, pr_info):
        """Announce personal record"""
        self.pr_label.config(text="🎉 שיא אישי חדש!")
        
        # Animate PR label
        def flash_pr():
            for _ in range(5):
                self.pr_label.config(foreground='red')
                time.sleep(0.3)
                self.pr_label.config(foreground='gold')
                time.sleep(0.3)
            self.pr_label.config(text="")
        
        threading.Thread(target=flash_pr, daemon=True).start()
    
    def update_points_display(self):
        """Update points and level display"""
        self.points_label.config(text=f"💪 {self.user_points} נקודות")
        
        # Update level
        level_thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
        level_names = ["מתחיל", "חובב", "מתאמן", "ספורטאי", "אתלט",
                      "לוחם", "אלוף", "אגדה", "טיטאן", "אל האימונים"]
        
        old_level = self.user_level
        for i, threshold in enumerate(level_thresholds):
            if self.user_points >= threshold:
                self.user_level = i + 1
        
        level_name = level_names[min(self.user_level-1, len(level_names)-1)]
        self.level_label.config(text=f"רמה {self.user_level}: {level_name}")
        
        # Update progress bar
        if self.user_level < len(level_thresholds):
            current_threshold = level_thresholds[self.user_level-1]
            next_threshold = level_thresholds[self.user_level]
            progress = (self.user_points - current_threshold) / (next_threshold - current_threshold) * 100
            self.progress_var.set(progress)
        else:
            self.progress_var.set(100)
        
        # Update session stats
        self.session_label.config(text=f"אימון: {self.session_points} נק'")
        self.daily_label.config(text=f"היום: {self.daily_points} נק'")
    
    def check_level_up(self):
        """Check and announce level up"""
        level_thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
        level_names = ["מתחיל", "חובב", "מתאמן", "ספורטאי", "אתלט",
                      "לוחם", "אלוף", "אגדה", "טיטאן", "אל האימונים"]
        
        old_level = self.user_level
        new_level = 1
        
        for i, threshold in enumerate(level_thresholds):
            if self.user_points >= threshold:
                new_level = i + 1
        
        if new_level > old_level:
            self.user_level = new_level
            level_name = level_names[min(new_level-1, len(level_names)-1)]
            self.add_message("achievement", f"🎊 עלית רמה! אתה עכשיו {level_name}!", animate=True)
    
    def check_achievements(self, exercises):
        """Check for achievements"""
        # Check for heavy lifts
        for ex in exercises:
            if ex.get('weight'):
                if ex['weight'] >= 100:
                    self.add_message("achievement", "💯 הישג: הרמת 100 ק\"ג או יותר!")
                if ex['weight'] >= 150:
                    self.add_message("achievement", "🦾 הישג: הרמת 150 ק\"ג או יותר!")
    
    def show_personal_records(self):
        """Show personal records window"""
        pr_window = tk.Toplevel(self.root)
        pr_window.title("🏆 השיאים האישיים שלך")
        pr_window.geometry("600x500")
        
        # Create scrollable text
        text_widget = scrolledtext.ScrolledText(pr_window, font=('Arial', 12))
        text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Get all exercises with weights
        exercises = ["בק סקווט", "פרונט סקווט", "דדליפט", "סנאץ'", "קלין", "ג'רק", 
                    "קלין אנד ג'רק", "לחיצת כתפיים", "לחיצת חזה"]
        
        text_widget.insert(tk.END, "🏆 השיאים האישיים שלך\n", 'title')
        text_widget.insert(tk.END, "=" * 40 + "\n\n")
        
        for exercise in exercises:
            max_info = self.exercise_tracker.get_exercise_max(exercise)
            
            if max_info['current_max']['weight'] > 0:
                text_widget.insert(tk.END, f"{exercise}:\n", 'exercise')
                text_widget.insert(tk.END, f"  🏆 שיא: {max_info['current_max']['weight']} ק\"ג\n")
                text_widget.insert(tk.END, f"  📅 תאריך: {max_info['current_max']['date']}\n")
                text_widget.insert(tk.END, f"  🔢 חזרות: {max_info['current_max']['reps']}\n")
                
                if max_info['pr'] and max_info['pr']['improvement'] > 0:
                    text_widget.insert(tk.END, f"  📈 שיפור: +{max_info['pr']['improvement']:.1f} ק\"ג\n")
                
                text_widget.insert(tk.END, "\n")
        
        # Configure tags
        text_widget.tag_config('title', font=('Arial', 16, 'bold'), foreground='darkblue')
        text_widget.tag_config('exercise', font=('Arial', 14, 'bold'), foreground='darkgreen')
    
    def show_progress(self):
        """Show progress tracking window"""
        progress_window = tk.Toplevel(self.root)
        progress_window.title("📈 התקדמות")
        progress_window.geometry("700x600")
        
        # Exercise selector
        frame = ttk.Frame(progress_window)
        frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(frame, text="בחר תרגיל:").pack(side=tk.LEFT, padx=5)
        
        exercise_var = tk.StringVar()
        exercises = ["בק סקווט", "דדליפט", "לחיצת כתפיים", "לחיצת חזה"]
        exercise_combo = ttk.Combobox(frame, textvariable=exercise_var, values=exercises, width=20)
        exercise_combo.pack(side=tk.LEFT, padx=5)
        exercise_combo.current(0)
        
        # Text widget for progress
        text_widget = scrolledtext.ScrolledText(progress_window, font=('Arial', 11))
        text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        def show_exercise_progress():
            text_widget.delete(1.0, tk.END)
            
            exercise = exercise_var.get()
            progress_report = self.exercise_tracker.get_progress_report(exercise, days=30)
            
            text_widget.insert(tk.END, f"📈 התקדמות ב{exercise} - 30 ימים אחרונים\n", 'title')
            text_widget.insert(tk.END, "=" * 50 + "\n\n")
            
            text_widget.insert(tk.END, f"📊 סיכום:\n", 'section')
            text_widget.insert(tk.END, f"  • אימונים: {progress_report['workout_count']}\n")
            
            if progress_report['trends']['weight_change'] != 0:
                change = progress_report['trends']['weight_change']
                pct = progress_report['trends']['weight_change_pct']
                symbol = "📈" if change > 0 else "📉"
                text_widget.insert(tk.END, f"  • שינוי במשקל: {symbol} {change:+.1f} ק\"ג ({pct:+.1f}%)\n")
            
            text_widget.insert(tk.END, "\n📋 היסטוריה:\n", 'section')
            
            for entry in progress_report['progress'][-10:]:  # Last 10 entries
                text_widget.insert(tk.END, f"  {entry['date']}: {entry['max_weight']} ק\"ג")
                if entry['total_volume']:
                    text_widget.insert(tk.END, f" (נפח: {entry['total_volume']:.0f})")
                text_widget.insert(tk.END, "\n")
        
        ttk.Button(frame, text="הצג התקדמות", command=show_exercise_progress).pack(side=tk.LEFT, padx=20)
        
        # Configure tags
        text_widget.tag_config('title', font=('Arial', 14, 'bold'), foreground='darkblue')
        text_widget.tag_config('section', font=('Arial', 12, 'bold'), foreground='darkgreen')
        
        # Show initial progress
        show_exercise_progress()
    
    def generate_ai_response(self, text):
        """Generate AI response for non-exercise chat"""
        try:
            # Use Gemini API
            api_key = self.config.gemini_api_key
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
            
            system_msg = """אתה מאמן כושר ישראלי מדבר עברית.
תשובות קצרות מאוד (מקסימום 40 מילים).
השתמש באמוג'י."""
            
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
            return "שגיאה בתשובה"
    
    def finish_workout(self):
        """Finish workout session"""
        if not self.current_workout:
            self.add_message("error", "אין אימון פעיל")
            return
        
        # Calculate totals
        total_points = self.session_points
        total_exercises = len(self.current_workout)
        
        # Show summary
        self.add_message("success", "🏁 סיכום אימון:", animate=True)
        self.add_message("system", f"📝 בוצעו {total_exercises} תרגילים")
        self.add_message("system", f"💪 נצברו {total_points} נקודות")
        
        # Reset session
        self.current_workout = []
        self.session_points = 0
        self.workout_btn.config(state='disabled')
        
        # Update display
        self.update_points_display()
    
    def show_stats(self):
        """Show statistics window"""
        stats_window = tk.Toplevel(self.root)
        stats_window.title("📊 סטטיסטיקות")
        stats_window.geometry("600x500")
        
        text_widget = scrolledtext.ScrolledText(stats_window, font=('Arial', 12))
        text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Add statistics content
        text_widget.insert(tk.END, "📊 הסטטיסטיקות שלך\n", 'title')
        text_widget.insert(tk.END, "=" * 40 + "\n\n")
        
        text_widget.insert(tk.END, f"💪 סה\"כ נקודות: {self.user_points}\n")
        text_widget.insert(tk.END, f"📈 רמה: {self.user_level}\n")
        text_widget.insert(tk.END, f"🔥 רצף: {self.workout_streak} ימים\n")
        
        # Configure tags
        text_widget.tag_config('title', font=('Arial', 16, 'bold'), foreground='darkblue')
    
    def add_message(self, tag, message, animate=False):
        """Add message to chat"""
        self.message_queue.put(('message', (tag, message, animate)))
    
    def process_messages(self):
        """Process UI messages"""
        try:
            while not self.message_queue.empty():
                msg_type, data = self.message_queue.get_nowait()
                
                if msg_type == 'message':
                    tag, message, animate = data
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    
                    if animate and tag in ['system', 'success', 'achievement', 'pr']:
                        # Animate character by character
                        self.chat_text.insert(tk.END, f"[{timestamp}] ", 'timestamp')
                        for char in message:
                            self.chat_text.insert(tk.END, char, tag)
                            self.chat_text.see(tk.END)
                            self.root.update()
                            time.sleep(0.02)
                        self.chat_text.insert(tk.END, "\n")
                    else:
                        self.chat_text.insert(tk.END, f"[{timestamp}] {message}\n", tag)
                    
                    self.chat_text.see(tk.END)
                    
        except Exception as e:
            print(f"Message error: {e}")
        
        self.root.after(100, self.process_messages)
    
    def run(self):
        """Run the application"""
        try:
            self.add_message("success", "🏆 מערכת משופרת עם מעקב משקלים פעילה!", animate=True)
            self.add_message("system", "דוגמה: 'עשיתי בק סקווט 50 קילו' או 'עשיתי דדליפט 80 קילו 5 חזרות'")
            self.root.mainloop()
        except Exception as e:
            print(f"Runtime error: {e}")
            traceback.print_exc()


def main():
    """Main entry point"""
    try:
        print("Starting Enhanced Hebrew CrossFit AI...")
        print("Features:")
        print("- Weight tracking and personal records")
        print("- Progress monitoring")
        print("- Enhanced points system")
        print("- Intelligent AI responses")
        app = EnhancedHebrewCrossFitUI()
        app.run()
    except Exception as e:
        print(f"Failed to start: {e}")
        traceback.print_exc()
        input("Press Enter to exit...")


if __name__ == "__main__":
    main()