---
id: 175250271230697s9i2pwi
timestamp: 2025-07-14T14:18:32.306Z
complexity: 4
category: code
project: hebrew-crossfit-ai
tags: ["gamification", "points-system", "levels", "achievements", "ui-design", "title:[object Promise]", "summary:- שכיבות סמיכה (Push-ups): 2 points per rep"]
priority: medium
status: active
access_count: 0
last_accessed: 2025-07-14T14:18:32.306Z
metadata:
  content_type: text
  size: 1535
  mermaid_diagram: false
---Hebrew CrossFit AI - Gamification System Details

## Points System:
- שכיבות סמיכה (Push-ups): 2 points per rep
- סקוואטים (Squats): 3 points per rep  
- ברפיז/בורפיס (Burpees): 5 points per rep
- כפיפות בטן (Crunches): 2 points per rep
- משיכות (Pull-ups): 4 points per rep
- לחיצות (Presses): 3 points per rep

## Level System (10 levels):
1. מתחיל (Beginner): 0-99 points
2. חובב (Amateur): 100-299 points
3. מתאמן (Trainee): 300-599 points
4. ספורטאי (Athlete): 600-999 points
5. אתלט (Elite): 1000-1499 points
6. לוחם (Warrior): 1500-2499 points
7. אלוף (Champion): 2500-3999 points
8. אגדה (Legend): 4000-5999 points
9. טיטאן (Titan): 6000-9999 points
10. אל האימונים (Training God): 10000+ points

## Features Implemented:
- Real-time points calculation when exercises mentioned
- Progress bar showing advancement to next level
- Workout streak tracking with fire emoji 🔥
- Achievement system with level-up notifications
- "Finish Workout" button to sum total session points
- Stats window with detailed progression information
- Auto-detection of sets multiplier (e.g., "3 סטים" multiplies points by 3)

## UI Elements:
- Top stats panel with level, points, streak, achievements
- Progress bar for next level
- Points notifications in orange text
- Achievement notifications in purple text
- Dedicated stats window accessible via button

## Integration:
- Works seamlessly with Hebrew speech recognition
- AI responses include point calculations
- Automatic workout detection and scoring
- Persistent user progression tracking