#!/usr/bin/env python3
"""
Hebrew CrossFit AI - Mobile Voice-First Web App
Enhanced Streamlit app with voice interaction for Android
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
import base64
import asyncio

# Page config optimized for mobile
st.set_page_config(
    page_title="Hebrew CrossFit AI",
    page_icon="🏋️",
    layout="wide",
    initial_sidebar_state="collapsed",  # Better for mobile
    menu_items={
        'Get Help': None,
        'Report a bug': None,
        'About': "Hebrew CrossFit AI - Voice-powered fitness coaching in Hebrew"
    }
)

# Mobile-optimized CSS
st.markdown("""
<style>
/* Mobile-first responsive design */
.main-container {
    max-width: 100%;
    padding: 1rem;
}

/* Hebrew RTL support */
.hebrew-text {
    direction: rtl;
    text-align: right;
    font-family: 'Arial', 'Noto Sans Hebrew', 'David', sans-serif;
    line-height: 1.6;
}

/* Voice interaction styles */
.voice-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    gap: 10px;
}

.voice-button {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    border: none;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.voice-button.recording {
    animation: pulse 1s infinite;
    background: linear-gradient(45deg, #ff4444, #cc0000);
    color: white;
}

.voice-button.idle {
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
}

.voice-button.processing {
    background: linear-gradient(45deg, #2196F3, #1976D2);
    color: white;
    animation: spin 1s linear infinite;
}

@keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 68, 68, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Mobile stats cards */
.stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 15px;
    text-align: center;
    margin: 0.5rem 0;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.stat-value {
    font-size: 2.5rem;
    font-weight: bold;
    margin: 0;
}

.stat-label {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
}

/* Exercise cards */
.exercise-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    margin: 0.5rem 0;
    border-left: 4px solid #4CAF50;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 6rem;
        padding-left: 1rem;
        padding-right: 1rem;
    }
    
    .voice-container {
        bottom: 10px;
    }
    
    .stButton > button {
        width: 100%;
        height: 50px;
        font-size: 16px;
    }
}

/* Hide default streamlit elements on mobile */
@media (max-width: 768px) {
    .reportview-container .main .block-container {
        max-width: 100%;
    }
    
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
}

/* TTS animation */
.speaking {
    animation: talking 0.5s ease-in-out infinite alternate;
}

@keyframes talking {
    from { opacity: 0.7; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1.02); }
}
</style>
""", unsafe_allow_html=True)

# JavaScript for voice interaction
voice_js = """
<script>
class MobileVoiceInterface {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.hebrewVoice = null;
        this.initVoice();
    }
    
    initVoice() {
        // Check browser support
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
        }
        
        if (this.recognition) {
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'he-IL';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton('recording');
            };
            
            this.recognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    this.processVoiceInput(result[0].transcript);
                }
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton('idle');
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateVoiceButton('idle');
            };
        }
        
        // Initialize Hebrew TTS voice
        this.synthesis.onvoiceschanged = () => {
            const voices = this.synthesis.getVoices();
            this.hebrewVoice = voices.find(voice => 
                voice.lang === 'he-IL' || voice.lang.startsWith('he')
            );
        };
    }
    
    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Failed to start recognition:', error);
            }
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    speak(text) {
        if (this.synthesis && text) {
            // Stop any current speech
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'he-IL';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            
            if (this.hebrewVoice) {
                utterance.voice = this.hebrewVoice;
            }
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateVoiceButton('speaking');
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateVoiceButton('idle');
            };
            
            this.synthesis.speak(utterance);
        }
    }
    
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.updateVoiceButton('idle');
        }
    }
    
    processVoiceInput(text) {
        this.updateVoiceButton('processing');
        
        // Send to Streamlit
        const event = new CustomEvent('voiceInput', {
            detail: { text: text }
        });
        window.dispatchEvent(event);
        
        // Set text in Streamlit input
        const textInput = document.querySelector('textarea[data-testid="stTextArea"]');
        if (textInput) {
            textInput.value = text;
            textInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    updateVoiceButton(state) {
        const button = document.getElementById('voice-button');
        if (button) {
            button.className = `voice-button ${state}`;
            
            switch(state) {
                case 'recording':
                    button.innerHTML = '🎤';
                    button.title = 'מקשיב...';
                    break;
                case 'processing':
                    button.innerHTML = '⚙️';
                    button.title = 'מעבד...';
                    break;
                case 'speaking':
                    button.innerHTML = '🔊';
                    button.title = 'מדבר...';
                    break;
                default:
                    button.innerHTML = '🎤';
                    button.title = 'לחץ כדי לדבר';
            }
        }
    }
}

// Initialize voice interface
let voiceInterface;
document.addEventListener('DOMContentLoaded', () => {
    voiceInterface = new MobileVoiceInterface();
});

// Handle voice button click
function toggleVoice() {
    if (!voiceInterface) return;
    
    if (voiceInterface.isSpeaking) {
        voiceInterface.stopSpeaking();
    } else if (voiceInterface.isListening) {
        voiceInterface.stopListening();
    } else {
        voiceInterface.startListening();
    }
}

// Handle TTS from Streamlit
function speakText(text) {
    if (voiceInterface) {
        voiceInterface.speak(text);
    }
}

// Listen for voice input events
window.addEventListener('voiceInput', (event) => {
    console.log('Voice input received:', event.detail.text);
});
</script>

<div class="voice-container">
    <button id="voice-button" class="voice-button idle" onclick="toggleVoice()" title="לחץ כדי לדבר">
        🎤
    </button>
</div>
"""

# Initialize session state
if 'user_points' not in st.session_state:
    st.session_state.user_points = 0
    st.session_state.user_level = 1
    st.session_state.current_workout = []
    st.session_state.workout_streak = 0
    st.session_state.achievements = []
    st.session_state.voice_enabled = True
    st.session_state.auto_tts = True

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
    "פלאנק": 1,  # per second
    "ריצה": 1,   # per minute
}

# Level system
LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
LEVEL_NAMES = ["מתחיל", "חובב", "מתאמן", "ספורטאי", "אתלט",
               "לוחם", "אלוף", "אגדה", "טיטאן", "אל האימונים"]

def init_database():
    """Initialize SQLite database"""
    conn = sqlite3.connect('mobile_workout_data.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise_he TEXT NOT NULL,
            exercise_en TEXT NOT NULL,
            reps INTEGER NOT NULL,
            points INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            session_date TEXT NOT NULL,
            source TEXT DEFAULT 'voice'
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_input TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            voice_used BOOLEAN DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()

def save_exercise(exercise_he, exercise_en, reps, points, source='voice'):
    """Save exercise to database"""
    conn = sqlite3.connect('mobile_workout_data.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO exercises (exercise_he, exercise_en, reps, points, timestamp, session_date, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (exercise_he, exercise_en, reps, points, 
          datetime.now().isoformat(), 
          datetime.now().strftime('%Y-%m-%d'),
          source))
    
    conn.commit()
    conn.close()

def save_conversation(user_input, ai_response, voice_used=False):
    """Save conversation to database"""
    conn = sqlite3.connect('mobile_workout_data.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO conversations (user_input, ai_response, timestamp, voice_used)
        VALUES (?, ?, ?, ?)
    ''', (user_input, ai_response, datetime.now().isoformat(), voice_used))
    
    conn.commit()
    conn.close()

def calculate_points(text):
    """Enhanced points calculation with better detection"""
    # Check if this is a question (don't record questions)
    question_words = ["כמה", "מה", "איך", "האם", "?", "אילו", "מתי", "איפה", "למה", "מדוע"]
    if any(word in text for word in question_words):
        return 0, [], "❌ זו שאלה - לא נרשם"
    
    # Check if this is a statement about doing exercise
    action_words = ["עושה", "עשיתי", "ביצעתי", "השלמתי", "סיימתי", "התחלתי", "אני", "רצתי", "קפצתי"]
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
                
                # Special handling for time-based exercises
                if exercise in ["פלאנק"]:
                    # Assume seconds for plank
                    exercise_points = base_points * reps
                    unit = "שניות"
                elif exercise in ["ריצה"]:
                    # Assume minutes for running
                    exercise_points = base_points * reps
                    unit = "דקות"
                else:
                    # Regular rep-based exercises
                    exercise_points = base_points * reps
                    unit = "חזרות"
                
                points += exercise_points
                exercises_found.append({
                    "name": exercise,
                    "reps": reps,
                    "points": exercise_points,
                    "unit": unit
                })
            else:
                return 0, [], f"⚠️ לא צוין מספר {exercise}"
    
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
        points_to_next = 0
    else:
        progress = (points - current_threshold) / (next_threshold - current_threshold) * 100
        points_to_next = next_threshold - points
    
    level_name = LEVEL_NAMES[min(level-1, len(LEVEL_NAMES)-1)]
    
    return level, level_name, progress, points_to_next

def generate_ai_response(text):
    """Enhanced AI response with personality"""
    
    # Handle specific questions
    if "נקודות" in text and any(word in text for word in ["כמה", "מה"]):
        return "ספר לי איזה תרגילים עשית עם המספרים ואני אחשב לך את הנקודות!"
    
    if "רמה" in text and any(word in text for word in ["כמה", "מה"]):
        level, level_name, _, _ = get_level_info(st.session_state.user_points)
        return f"אתה ברמה {level}: {level_name}. {st.session_state.user_points} נקודות!"
    
    # Motivational responses based on exercises
    if any(ex in text for ex in EXERCISE_POINTS.keys()):
        responses = [
            "וואו! איזה עבודה מעולה! 💪",
            "אתה על הדרך הנכונה! תמשיך כך! 🔥",
            "כל הכבוד! הרגשתי את האנרגיה שלך! ⚡",
            "מדהים! הכוח שלך גדל כל יום! 🚀",
            "נפלא! אני גאה בהתקדמות שלך! 🏆"
        ]
    elif "עייף" in text or "קשה" in text:
        responses = [
            "אני מבין. בוא נעשה משהו קל יותר היום.",
            "לא נורא להיות עייף. מה דעתך על מתיחה קלה?",
            "זה חלק מהתהליך. בוא ננוח קצת ונחזור חזקים יותר."
        ]
    elif "כואב" in text or "פציעה" in text:
        responses = [
            "חשוב לא להתעלם מכאב. בוא נתמקד בתרגילי שיקום.",
            "הבריאות היא הכי חשובה. מה דעתך על תרגילי גמישות?",
            "כדאי לנוח מהאזור הכואב. יש תרגילים אחרים שנוכל לעשות."
        ]
    else:
        responses = [
            "איך אני יכול לעזור לך היום? 😊",
            "מה תרצה להתאמן היום? יש לי כמה רעיונות! 💡",
            "בוא נעשה משהו נהדר ביחד! מה אתה מרגיש? 🎯",
            "איזה אימון יתאים לך היום? אני כאן לעזור! 🏋️"
        ]
    
    import random
    return random.choice(responses)

# Initialize database
init_database()

# Inject voice JavaScript
st.components.v1.html(voice_js, height=0)

# Header - Mobile optimized
st.markdown("""
<div style="text-align: center; padding: 1rem 0;">
    <h1 style="color: #1976D2; margin: 0;">🏋️ Hebrew CrossFit AI</h1>
    <p style="color: #666; margin: 0.5rem 0;">מאמן כושר חכם בעברית</p>
</div>
""", unsafe_allow_html=True)

# Top stats bar - Mobile optimized
level, level_name, progress, points_to_next = get_level_info(st.session_state.user_points)
st.session_state.user_level = level

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown(f"""
    <div class="stat-card">
        <p class="stat-value">{level}</p>
        <p class="stat-label">רמה: {level_name}</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="stat-card">
        <p class="stat-value">{st.session_state.user_points}</p>
        <p class="stat-label">נקודות</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="stat-card">
        <p class="stat-value">{st.session_state.workout_streak}</p>
        <p class="stat-label">רצף ימים</p>
    </div>
    """, unsafe_allow_html=True)

# Progress bar
if points_to_next > 0:
    st.progress(progress / 100)
    st.caption(f"עוד {points_to_next} נקודות לרמה הבאה")
else:
    st.progress(1.0)
    st.caption("🏆 הגעת לרמה המקסימלית!")

# Main interaction area
st.header("💬 דבר עם המאמן שלך")

# Voice/Text input
st.markdown("""
<div class="hebrew-text">
    <p><strong>🎤 לחץ על הכפתור למטה ודבר בעברית</strong></p>
    <p>או הקלד כאן בעברית:</p>
</div>
""", unsafe_allow_html=True)

# Text input as fallback
user_input = st.text_area(
    "",
    placeholder="דוגמה: עשיתי 20 שכיבות סמיכה ו-15 סקוואטים",
    height=100,
    key="exercise_input",
    help="ספר לי על האימונים שלך או שאל שאלות"
)

# Action buttons
col1, col2 = st.columns(2)

with col1:
    if st.button("🎯 רשום אימון", type="primary", use_container_width=True):
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
                        points=ex["points"],
                        source="manual"
                    )
                    st.session_state.current_workout.append(ex)
                
                # Generate AI response
                ai_response = generate_ai_response(user_input)
                save_conversation(user_input, ai_response, voice_used=False)
                
                # Success message
                st.success(f"🎉 {status}")
                for ex in exercises:
                    unit = ex.get("unit", "חזרות")
                    st.write(f"✅ {ex['name']}: {ex['reps']} {unit} = {ex['points']} נקודות")
                
                # AI response with TTS
                st.info(f"🤖 {ai_response}")
                if st.session_state.auto_tts:
                    st.components.v1.html(f"""
                    <script>
                    setTimeout(() => speakText('{ai_response}'), 1000);
                    </script>
                    """, height=0)
                
                # Check for level up
                old_level = level
                new_level, _, _, _ = get_level_info(st.session_state.user_points)
                if new_level > old_level:
                    st.balloons()
                    level_up_msg = f"🎊 עלית רמה! אתה עכשיו {LEVEL_NAMES[new_level-1]}!"
                    st.success(level_up_msg)
                    if st.session_state.auto_tts:
                        st.components.v1.html(f"""
                        <script>
                        setTimeout(() => speakText('{level_up_msg}'), 2000);
                        </script>
                        """, height=0)
            
            else:
                ai_response = generate_ai_response(user_input)
                save_conversation(user_input, ai_response, voice_used=False)
                st.warning(status)
                st.info(f"🤖 {ai_response}")
                if st.session_state.auto_tts:
                    st.components.v1.html(f"""
                    <script>
                    setTimeout(() => speakText('{ai_response}'), 1000);
                    </script>
                    """, height=0)

with col2:
    if st.button("🧹 נקה", use_container_width=True):
        st.session_state.exercise_input = ""
        st.rerun()

# Settings panel
with st.expander("⚙️ הגדרות"):
    st.session_state.auto_tts = st.checkbox("תגובה קולית אוטומטית", value=st.session_state.auto_tts)
    st.session_state.voice_enabled = st.checkbox("הפעל זיהוי קול", value=st.session_state.voice_enabled)
    
    if st.button("🧪 בדוק קול"):
        test_message = "שלום! אני המאמן הכושר שלך בעברית!"
        st.info(f"🔊 {test_message}")
        st.components.v1.html(f"""
        <script>
        speakText('{test_message}');
        </script>
        """, height=0)

# Exercise guide
st.header("💪 מדריך תרגילים")

exercise_guide = """
**תרגילים נתמכים:**
- שכיבות סמיכה (2 נק'/חזרה)
- סקוואטים (3 נק'/חזרה)
- ברפיז/בורפיס (5 נק'/חזרה)
- כפיפות בטן (2 נק'/חזרה)
- משיכות (4 נק'/חזרה)
- לחיצות (3 נק'/חזרה)
- סקווט ג'אמפ (4 נק'/חזרה)
- פלאנק (1 נק'/שנייה)
- ריצה (1 נק'/דקה)

**דוגמאות לקלט קולי:**
- "עשיתי 20 שכיבות סמיכה"
- "ביצעתי 15 סקוואטים ו-10 ברפיז"
- "התחלתי עם 30 שניות פלאנק"
- "רצתי 15 דקות"
"""

st.markdown(f'<div class="hebrew-text">{exercise_guide}</div>', unsafe_allow_html=True)

# Current workout summary
if st.session_state.current_workout:
    st.header("🏃‍♂️ אימון נוכחי")
    total_points = sum(ex['points'] for ex in st.session_state.current_workout)
    
    for ex in st.session_state.current_workout:
        unit = ex.get("unit", "חזרות")
        st.markdown(f"""
        <div class="exercise-card">
            <strong>{ex['name']}</strong><br>
            {ex['reps']} {unit} = {ex['points']} נקודות
        </div>
        """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        st.metric("סה\"כ נקודות באימון", total_points)
    with col2:
        if st.button("🏁 סיים אימון", use_container_width=True):
            finish_msg = f"🎉 אימון הושלם! סה\"כ: {total_points} נקודות"
            st.success(finish_msg)
            if st.session_state.auto_tts:
                st.components.v1.html(f"""
                <script>
                setTimeout(() => speakText('{finish_msg}'), 1000);
                </script>
                """, height=0)
            st.session_state.current_workout = []
            st.rerun()

# Footer with voice instructions
st.markdown("---")
st.markdown("""
<div style="text-align: center; padding: 1rem; background: #f0f0f0; border-radius: 10px; margin-top: 2rem;">
    <h4>🎤 הוראות שימוש בקול</h4>
    <p><strong>לחץ על הכפתור הירוק למטה ודבר בעברית</strong></p>
    <p>המערכת תזהה את הדיבור שלך ותגיב בקול</p>
    <p>עובד בצורה הטובה ביותר בדפדפן Chrome באנדרואיד</p>
</div>
""", unsafe_allow_html=True)

# Debug info (remove in production)
if st.checkbox("🔧 מידע טכני", help="לבדיקת תקלות"):
    st.write("Session State:", st.session_state)
    st.write("Voice API Support:", "✅ נתמך" if "webkitSpeechRecognition" in str(st.get_option) else "❌ לא נתמך")