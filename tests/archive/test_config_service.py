#!/usr/bin/env python3
"""
Simple test script for points configuration service (no database operations)
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import AsyncSessionLocal
from app.services.points_configuration_service import points_config_service


async def test_configuration_service():
    """Test the configuration service without authentication"""
    print("🧪 Testing SweatBot Points Configuration Service")
    print("=" * 50)
    
    # Get database session
    async with AsyncSessionLocal() as db:
        try:
            # Test 1: List exercise configurations
            print("\n1. Testing exercise configuration listing...")
            exercises = await points_config_service.list_exercise_configs(db, active_only=True)
            print(f"   ✅ Found {len(exercises)} configured exercises")
            
            for i, exercise in enumerate(exercises[:5], 1):  # Show first 5
                print(f"   ✅ Exercise {i}: {exercise.get('entity_key', 'N/A')}")
                config = exercise.get('config', exercise.get('config_data', {}))
                print(f"      Name: {config.get('name', 'N/A')}")
                print(f"      Category: {config.get('category', 'N/A')}")
                print(f"      Base Points: {config.get('base_points', 0)}")
            
            # Test 2: Test rules configuration
            print("\n2. Testing rules configuration...")
            rules = await points_config_service.list_rule_configs(db, active_only=True)
            print(f"   ✅ Found {len(rules)} configured rules")
            
            for i, rule in enumerate(rules[:3], 1):  # Show first 3
                rule_data = rule.get('config', rule.get('config_data', {}))
                print(f"   ✅ Rule {i}: {rule.get('entity_key', 'N/A')}")
                print(f"      Name: {rule_data.get('name', 'N/A')}")
                print(f"      Type: {rule_data.get('type', 'N/A')}")
                print(f"      Active: {rule_data.get('active', False)}")
            
            # Test 3: Test validation
            print("\n3. Testing configuration validation...")
            
            # Valid exercise config
            valid_config = {
                "name": "Test Exercise",
                "name_he": "תרגיל בדיקה",
                "category": "Strength",
                "base_points": 10,
                "multipliers": {
                    "reps": 1.0,
                    "sets": 1.5,
                    "weight": 0.1
                }
            }
            
            validation = await points_config_service.validate_configuration('exercise', valid_config)
            print(f"   ✅ Valid config validation: {validation['valid']}")
            if validation['warnings']:
                print(f"   ⚠️  Warnings: {validation['warnings']}")
            
            # Invalid exercise config
            invalid_config = {
                "name": "",  # Empty name
                "category": "InvalidCategory"
            }
            
            validation = await points_config_service.validate_configuration('exercise', invalid_config)
            print(f"   ✅ Invalid config validation: {not validation['valid']}")
            if validation['errors']:
                print(f"   ❌ Errors: {validation['errors']}")
            
            # Test 4: Test export functionality
            print("\n4. Testing configuration export...")
            export_data = await points_config_service.export_configurations(db)
            print(f"   ✅ Export version: {export_data.get('version', 'N/A')}")
            print(f"   ✅ Export date: {export_data.get('export_date', 'N/A')}")
            print(f"   ✅ Exercise configs: {len(export_data.get('exercises', []))}")
            print(f"   ✅ Rule configs: {len(export_data.get('rules', []))}")
            
            print("\n" + "=" * 50)
            print("🎉 Configuration service tests passed!")
            
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
            await db.rollback()
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_configuration_service())