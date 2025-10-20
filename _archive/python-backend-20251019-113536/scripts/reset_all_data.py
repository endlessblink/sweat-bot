#!/usr/bin/env python3
"""
Reset ALL SweatBot data across all databases.
Use this during development to start with a clean slate.

Usage:
    python backend/scripts/reset_all_data.py
"""

import subprocess
import sys
from typing import Tuple

def run_command(command: str, description: str) -> Tuple[bool, str]:
    """Execute a shell command and return success status and output"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True,
            check=False
        )
        
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            return True, result.stdout
        else:
            print(f"❌ {description} - FAILED")
            print(f"   Error: {result.stderr}")
            return False, result.stderr
    except Exception as e:
        print(f"❌ {description} - EXCEPTION: {e}")
        return False, str(e)

def reset_postgresql():
    """Reset PostgreSQL database"""
    command = """docker exec sweatbot_postgres psql -U fitness_user -d hebrew_fitness -c "TRUNCATE TABLE exercises, workouts, personal_records, users CASCADE; SELECT 'PostgreSQL tables cleared' as status;" """
    return run_command(command, "Clearing PostgreSQL tables")

def reset_mongodb():
    """Reset MongoDB database"""
    command = """docker exec sweatbot_mongodb mongosh --eval "use sweatbot_conversations; db.dropDatabase(); print('MongoDB cleared');" """
    return run_command(command, "Clearing MongoDB conversations")

def reset_redis():
    """Reset Redis cache"""
    command = """docker exec sweatbot_redis redis-cli -a sweatbot_redis_pass FLUSHALL"""
    return run_command(command, "Clearing Redis cache")

def main():
    """Main reset function"""
    print("=" * 60)
    print("🚀 SweatBot Data Reset Tool")
    print("=" * 60)
    print("\n⚠️  WARNING: This will DELETE all data from:")
    print("   - PostgreSQL (exercises, workouts, records, users)")
    print("   - MongoDB (conversation history)")
    print("   - Redis (session cache)")
    
    # Ask for confirmation
    confirmation = input("\n❓ Are you sure you want to reset ALL data? (yes/no): ")
    
    if confirmation.lower() != 'yes':
        print("\n❌ Reset cancelled.")
        return
    
    print("\n🔧 Starting data reset process...")
    
    # Track success
    results = []
    
    # Reset each database
    success, _ = reset_postgresql()
    results.append(("PostgreSQL", success))
    
    success, _ = reset_mongodb()
    results.append(("MongoDB", success))
    
    success, _ = reset_redis()
    results.append(("Redis", success))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 RESET SUMMARY:")
    print("=" * 60)
    
    all_success = True
    for db_name, success in results:
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"   {db_name}: {status}")
        if not success:
            all_success = False
    
    if all_success:
        print("\n🎉 All databases reset successfully!")
        print("💡 You can now start testing with clean data.")
    else:
        print("\n⚠️  Some databases failed to reset.")
        print("💡 Check the errors above and ensure Docker containers are running.")
        print("   Run 'docker ps' to check container status.")
        sys.exit(1)

if __name__ == "__main__":
    main()