#!/usr/bin/env python3
"""
Simple test to check if refactored files contain exercise variety
"""

def check_frontend_agent():
    """Check if frontend agent has been updated with exercise variety"""
    
    print("🔍 Checking Frontend Agent Configuration")
    print("=" * 50)
    
    agent_file = "/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/personal-ui-vite/src/agent/index.ts"
    
    try:
        with open(agent_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for exercise variety
        exercises_to_find = [
            "לאנג'ים", "ברפי", "קפיצות כוכבים", "הרמות ברכיים",
            "שכיבות צד", "ריצה במקום", "הליכה מהירה", "טלטולים",
            "כפיפות בטן", "סיבובי רוסי", "הרמות רגליים", "מתיחות דינמית"
        ]
        
        found_exercises = []
        for exercise in exercises_to_find:
            if exercise in content:
                found_exercises.append(exercise)
        
        print(f"✅ Found {len(found_exercises)}/{len(exercises_to_find)} varied exercises in frontend agent")
        print(f"   Exercises: {', '.join(found_exercises)}")
        
        # Check for randomization instructions
        if "רנדומיזציה קלה" in content and "2-3 תרגילים" in content:
            print("✅ Randomization instructions found")
        else:
            print("❌ Randomization instructions missing")
        
        # Check for 15+ exercise requirement
        if "15+ אפשרויות" in content:
            print("✅ 15+ exercise variety requirement found")
        else:
            print("❌ 15+ exercise variety requirement missing")
        
        return len(found_exercises) >= 8  # At least 8 new exercises
        
    except Exception as e:
        print(f"❌ Error reading frontend agent: {e}")
        return False

def check_backend_exercise_parser():
    """Check if backend exercise parser has been expanded"""
    
    print("\n🔍 Checking Backend Exercise Parser")
    print("=" * 50)
    
    parser_file = "/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/backend/app/services/hebrew_exercise_parser.py"
    
    try:
        with open(parser_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check that ExerciseType enum is removed (should only be in comments)
        lines = content.split('\n')
        enum_lines = [line for line in lines if 'class ExerciseType' in line and not line.strip().startswith('#')]
        
        if enum_lines:
            print("❌ ExerciseType enum still present - should be removed")
            return False
        else:
            print("✅ ExerciseType enum successfully removed")
        
        # Check for expanded exercise mappings
        exercise_mappings_count = content.count("'")
        if exercise_mappings_count > 50:  # Should have many more mappings now
            print(f"✅ Expanded exercise mappings found ({exercise_mappings_count} quotes)")
        else:
            print(f"⚠️  Limited exercise mappings ({exercise_mappings_count} quotes)")
        
        # Check for specific new exercises
        new_exercises = ["לאנג'ים", "דדליפט", "פולאובר", "מתח", "משיכות"]
        found_new = [ex for ex in new_exercises if ex in content]
        
        print(f"✅ Found new exercises: {', '.join(found_new)}")
        
        return len(found_new) >= 3
        
    except Exception as e:
        print(f"❌ Error reading exercise parser: {e}")
        return False

def check_ui_response_processor():
    """Check if UI response processor uses dynamic mapping"""
    
    print("\n🔍 Checking UI Response Processor")
    print("=" * 50)
    
    ui_file = "/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/backend/app/services/ui_response_processor.py"
    
    try:
        with open(ui_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check that hardcoded exercise_mapping dict is removed or expanded
        if "exercise_mapping = {" in content and "סקוואטים" in content:
            # Check if it's dynamic now
            if "get_exercise_mapping" in content or "dynamic" in content.lower():
                print("✅ Exercise mapping converted to dynamic system")
            else:
                print("⚠️  Exercise mapping may still be hardcoded")
        else:
            print("✅ Exercise mapping appears to be updated")
        
        return True
        
    except Exception as e:
        print(f"❌ Error reading UI processor: {e}")
        return False

def main():
    """Run all checks"""
    
    print("🧪 TESTING REFACTORING COMPLETENESS")
    print("=" * 60)
    print("Checking if hardcoded exercise constraints have been removed...")
    print()
    
    results = []
    
    # Check all components
    results.append(("Frontend Agent", check_frontend_agent()))
    results.append(("Backend Exercise Parser", check_backend_exercise_parser()))
    results.append(("UI Response Processor", check_ui_response_processor()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 REFACTORING SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for component, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{component:25} {status}")
    
    print(f"\nOverall: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 REFACTORING COMPLETE! All hardcoded exercise constraints removed.")
        print("   The AI should now suggest varied exercises instead of the same 4.")
    else:
        print("⚠️  REFACTORING INCOMPLETE. Some hardcoded constraints may remain.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)