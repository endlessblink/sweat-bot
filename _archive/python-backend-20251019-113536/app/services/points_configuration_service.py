"""
Points Configuration Management Service
Handles CRUD operations for points configurations with validation and caching
"""

from typing import Dict, List, Optional, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
import json
import logging
from datetime import datetime
from pydantic import BaseModel, validator

from app.core.database import get_db
from app.models.models import PointsConfiguration
from app.services.scalable_points_engine import scalable_points_engine

logger = logging.getLogger(__name__)

# Pydantic models for validation
class ExerciseConfigModel(BaseModel):
    exercise_key: str
    name: str
    name_he: str
    category: str
    points_base: int
    multipliers: Dict[str, float]
    enabled: bool = True
    
    @validator('points_base')
    def validate_points_base(cls, v):
        if v < 0:
            raise ValueError('Base points must be non-negative')
        return v
    
    @validator('multipliers')
    def validate_multipliers(cls, v):
        required_keys = ['reps', 'sets', 'weight']
        for key in required_keys:
            if key not in v:
                v[key] = 1.0 if key == 'reps' else 0.0
            if v[key] < 0:
                raise ValueError(f'Multiplier {key} must be non-negative')
        return v

class AchievementConfigModel(BaseModel):
    id: str
    name: str
    name_he: str
    description: str
    description_he: str
    points: int
    icon: str
    enabled: bool = True
    conditions: Dict[str, Any] = {}
    
    @validator('points')
    def validate_points(cls, v):
        if v < 0:
            raise ValueError('Achievement points must be non-negative')
        return v

class RuleConfigModel(BaseModel):
    id: str
    name: str
    name_he: str
    description: str
    description_he: str
    rule_type: str  # bonus, multiplier
    value: float
    condition: str
    enabled: bool = True
    
    @validator('rule_type')
    def validate_rule_type(cls, v):
        if v not in ['bonus', 'multiplier']:
            raise ValueError('Rule type must be either "bonus" or "multiplier"')
        return v

class PointsConfigurationService:
    """Service for managing points configurations"""
    
    def __init__(self):
        self.cache_ttl = 1800  # 30 minutes
    
    async def create_exercise_config(
        self,
        config_data: Union[Dict[str, Any], ExerciseConfigModel],
        db: AsyncSession
    ) -> PointsConfiguration:
        """Create new exercise configuration"""
        if isinstance(config_data, dict):
            config_data = ExerciseConfigModel(**config_data)
        
        # Check if exercise already exists
        existing = await self.get_exercise_config(config_data.exercise_key, db)
        if existing:
            # Create new version instead
            return await self.update_exercise_config(config_data.exercise_key, config_data.dict(), db)
        
        # Create new configuration
        config = PointsConfiguration(
            entity_type='exercise',
            entity_key=config_data.exercise_key,
            config_data=config_data.dict(),
            is_active=True,
            version=1
        )
        
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
        # Invalidate cache
        await scalable_points_engine.invalidate_cache(f"exercise_config:{config_data.exercise_key}")
        
        logger.info(f"Created exercise configuration: {config_data.exercise_key}")
        return config
    
    async def get_exercise_config(
        self,
        exercise_key: str,
        db: AsyncSession,
        active_only: bool = True
    ) -> Optional[PointsConfiguration]:
        """Get exercise configuration by key"""
        query = select(PointsConfiguration).where(
            PointsConfiguration.entity_type == 'exercise',
            PointsConfiguration.entity_key == exercise_key
        )
        
        if active_only:
            query = query.where(PointsConfiguration.is_active == True)
        
        query = query.order_by(PointsConfiguration.version.desc())
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_exercise_config(
        self,
        exercise_key: str,
        config_data: Union[Dict[str, Any], ExerciseConfigModel],
        db: AsyncSession
    ) -> PointsConfiguration:
        """Update exercise configuration (creates new version)"""
        if isinstance(config_data, dict):
            config_data = ExerciseConfigModel(**config_data)
        
        # Get latest version
        latest = await self.get_exercise_config(exercise_key, db, active_only=False)
        next_version = (latest.version + 1) if latest else 1
        
        # Deactivate old version
        if latest:
            latest.is_active = False
        
        # Create new version
        config = PointsConfiguration(
            entity_type='exercise',
            entity_key=exercise_key,
            config_data=config_data.dict(),
            is_active=True,
            version=next_version
        )
        
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
        # Invalidate cache
        await scalable_points_engine.invalidate_cache(f"exercise_config:{exercise_key}")
        
        logger.info(f"Updated exercise configuration: {exercise_key} v{next_version}")
        return config
    
    async def delete_exercise_config(
        self,
        exercise_key: str,
        db: AsyncSession
    ) -> bool:
        """Deactivate exercise configuration"""
        config = await self.get_exercise_config(exercise_key, db)
        if not config:
            return False
        
        config.is_active = False
        await db.commit()
        
        # Invalidate cache
        await scalable_points_engine.invalidate_cache(f"exercise_config:{exercise_key}")
        
        logger.info(f"Deactivated exercise configuration: {exercise_key}")
        return True
    
    async def list_exercise_configs(
        self,
        db: AsyncSession,
        active_only: bool = True,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """List all exercise configurations"""
        query = select(PointsConfiguration).where(
            PointsConfiguration.entity_type == 'exercise'
        )
        
        if active_only:
            query = query.where(PointsConfiguration.is_active == True)
        
        query = query.order_by(PointsConfiguration.entity_key).limit(limit)
        result = await db.execute(query)
        
        configs = []
        for config in result.scalars().all():
            configs.append({
                'id': config.id,
                'exercise_key': config.entity_key,
                'config': config.config_data,
                'version': config.version,
                'created_at': config.created_at,
                'updated_at': config.updated_at
            })
        
        return configs
    
    async def create_achievement_config(
        self,
        config_data: Union[Dict[str, Any], AchievementConfigModel],
        db: AsyncSession
    ) -> PointsConfiguration:
        """Create new achievement configuration"""
        if isinstance(config_data, dict):
            config_data = AchievementConfigModel(**config_data)
        
        # Check if achievement already exists
        existing = await self.get_achievement_config(config_data.id, db)
        if existing:
            return await self.update_achievement_config(config_data.id, config_data.dict(), db)
        
        config = PointsConfiguration(
            entity_type='achievement',
            entity_key=config_data.id,
            config_data=config_data.dict(),
            is_active=True,
            version=1
        )
        
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
        # Invalidate cache
        await scalable_points_engine.invalidate_cache("achievement_configs")
        
        logger.info(f"Created achievement configuration: {config_data.id}")
        return config
    
    async def get_achievement_config(
        self,
        achievement_id: str,
        db: AsyncSession,
        active_only: bool = True
    ) -> Optional[PointsConfiguration]:
        """Get achievement configuration by ID"""
        query = select(PointsConfiguration).where(
            PointsConfiguration.entity_type == 'achievement',
            PointsConfiguration.entity_key == achievement_id
        )
        
        if active_only:
            query = query.where(PointsConfiguration.is_active == True)
        
        query = query.order_by(PointsConfiguration.version.desc())
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_achievement_config(
        self,
        achievement_id: str,
        config_data: Union[Dict[str, Any], AchievementConfigModel],
        db: AsyncSession
    ) -> PointsConfiguration:
        """Update achievement configuration"""
        if isinstance(config_data, dict):
            config_data = AchievementConfigModel(**config_data)
        
        # Get latest version
        latest = await self.get_achievement_config(achievement_id, db, active_only=False)
        next_version = (latest.version + 1) if latest else 1
        
        # Deactivate old version
        if latest:
            latest.is_active = False
        
        # Create new version
        config = PointsConfiguration(
            entity_type='achievement',
            entity_key=achievement_id,
            config_data=config_data.dict(),
            is_active=True,
            version=next_version
        )
        
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
        # Invalidate cache
        await scalable_points_engine.invalidate_cache("achievement_configs")
        
        logger.info(f"Updated achievement configuration: {achievement_id} v{next_version}")
        return config
    
    async def create_rule_config(
        self,
        config_data: Union[Dict[str, Any], RuleConfigModel],
        db: AsyncSession
    ) -> PointsConfiguration:
        """Create new rule configuration"""
        if isinstance(config_data, dict):
            config_data = RuleConfigModel(**config_data)
        
        # Check if rule already exists
        existing = await self.get_rule_config(config_data.id, db)
        if existing:
            return await self.update_rule_config(config_data.id, config_data.dict(), db)
        
        config = PointsConfiguration(
            entity_type='rule',
            entity_key=config_data.id,
            config_data=config_data.dict(),
            is_active=True,
            version=1
        )
        
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
        # Invalidate cache
        await scalable_points_engine.invalidate_cache("points_rules")
        
        logger.info(f"Created rule configuration: {config_data.id}")
        return config
    
    async def get_rule_config(
        self,
        rule_id: str,
        db: AsyncSession,
        active_only: bool = True
    ) -> Optional[PointsConfiguration]:
        """Get rule configuration by ID"""
        query = select(PointsConfiguration).where(
            PointsConfiguration.entity_type == 'rule',
            PointsConfiguration.entity_key == rule_id
        )
        
        if active_only:
            query = query.where(PointsConfiguration.is_active == True)
        
        query = query.order_by(PointsConfiguration.version.desc())
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_rule_config(
        self,
        rule_id: str,
        config_data: Union[Dict[str, Any], RuleConfigModel],
        db: AsyncSession
    ) -> PointsConfiguration:
        """Update rule configuration"""
        if isinstance(config_data, dict):
            config_data = RuleConfigModel(**config_data)
        
        # Get latest version
        latest = await self.get_rule_config(rule_id, db, active_only=False)
        next_version = (latest.version + 1) if latest else 1
        
        # Deactivate old version
        if latest:
            latest.is_active = False
        
        # Create new version
        config = PointsConfiguration(
            entity_type='rule',
            entity_key=rule_id,
            config_data=config_data.dict(),
            is_active=True,
            version=next_version
        )
        
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
        # Invalidate cache
        await scalable_points_engine.invalidate_cache("points_rules")
        
        logger.info(f"Updated rule configuration: {rule_id} v{next_version}")
        return config
    
    async def list_rule_configs(
        self,
        db: AsyncSession,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """List all rule configurations"""
        query = select(PointsConfiguration).where(
            PointsConfiguration.entity_type == 'rule'
        )
        
        if active_only:
            query = query.where(PointsConfiguration.is_active == True)
        
        query = query.order_by(PointsConfiguration.entity_key)
        result = await db.execute(query)
        
        configs = []
        for config in result.scalars().all():
            configs.append(config.config_data)
        
        return configs
    
    async def bulk_import_configurations(
        self,
        import_data: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, int]:
        """Bulk import configurations from JSON data"""
        results = {
            'exercises': 0,
            'achievements': 0,
            'rules': 0,
            'errors': 0
        }
        
        try:
            # Import exercises
            if 'exercises' in import_data:
                for exercise_data in import_data['exercises']:
                    try:
                        await self.create_exercise_config(exercise_data, db)
                        results['exercises'] += 1
                    except Exception as e:
                        logger.error(f"Failed to import exercise {exercise_data.get('exercise_key', 'unknown')}: {e}")
                        results['errors'] += 1
            
            # Import achievements
            if 'achievements' in import_data:
                for achievement_data in import_data['achievements']:
                    try:
                        await self.create_achievement_config(achievement_data, db)
                        results['achievements'] += 1
                    except Exception as e:
                        logger.error(f"Failed to import achievement {achievement_data.get('id', 'unknown')}: {e}")
                        results['errors'] += 1
            
            # Import rules
            if 'rules' in import_data:
                for rule_data in import_data['rules']:
                    try:
                        await self.create_rule_config(rule_data, db)
                        results['rules'] += 1
                    except Exception as e:
                        logger.error(f"Failed to import rule {rule_data.get('id', 'unknown')}: {e}")
                        results['errors'] += 1
            
            # Invalidate all caches
            await scalable_points_engine.invalidate_cache()
            
            logger.info(f"Bulk import completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Bulk import failed: {e}")
            raise
    
    async def export_configurations(
        self,
        db: AsyncSession,
        include_versions: bool = False
    ) -> Dict[str, Any]:
        """Export all configurations to JSON format"""
        export_data = {
            'exercises': [],
            'achievements': [],
            'rules': [],
            'export_date': datetime.now().isoformat(),
            'version': '2.0'
        }
        
        # Export exercises
        exercises = await self.list_exercise_configs(db, active_only=not include_versions)
        export_data['exercises'] = [config['config'] for config in exercises]
        
        # Export achievements
        query = select(PointsConfiguration).where(
            PointsConfiguration.entity_type == 'achievement'
        )
        if not include_versions:
            query = query.where(PointsConfiguration.is_active == True)
        
        result = await db.execute(query)
        for config in result.scalars().all():
            if include_versions or config.is_active:
                export_data['achievements'].append(config.config_data)
        
        # Export rules
        rules = await self.list_rule_configs(db, active_only=not include_versions)
        export_data['rules'] = rules
        
        return export_data
    
    async def validate_configuration(
        self,
        config_type: str,
        config_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate configuration data"""
        errors = []
        warnings = []
        
        try:
            if config_type == 'exercise':
                ExerciseConfigModel(**config_data)
            elif config_type == 'achievement':
                AchievementConfigModel(**config_data)
            elif config_type == 'rule':
                RuleConfigModel(**config_data)
            else:
                errors.append(f"Unknown configuration type: {config_type}")
        except Exception as e:
            errors.append(str(e))
        
        # Additional validation logic
        if config_type == 'exercise':
            if config_data.get('points_base', 0) > 1000:
                warnings.append("High base points value may imbalance the system")
            
            if config_data.get('category') not in ['strength', 'cardio', 'flexibility', 'core', 'general']:
                warnings.append(f"Unknown exercise category: {config_data.get('category')}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }

# Singleton instance
points_config_service = PointsConfigurationService()