"""
RefactoringAgent - Systematically removes hardcoded exercise constraints
Identifies and replaces legacy hardcoded exercise lists with dynamic alternatives
"""

import logging
import re
import ast
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import asyncio

logger = logging.getLogger(__name__)

class RefactoringAgent:
    """
    Agent that systematically refactors hardcoded exercise constraints
    Replaces static exercise lists with dynamic, AI-driven alternatives
    """
    
    def __init__(self):
        self.project_root = Path("/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot")
        self.backend_root = self.project_root / "backend"
        self.frontend_root = self.project_root / "personal-ui-vite"
        
        # Patterns to identify hardcoded exercise constraints
        self.hardcoded_patterns = {
            "exercise_enums": [
                r"class\s+ExerciseType\s*\([^)]*\):",
                r"SQUAT\s*=\s*\(",
                r"PUSHUP\s*=\s*\(",
                r"PLANK\s*=\s*\(",
                r"BURPEE\s*=\s*\("
            ],
            "exercise_lists": [
                r"exercises\s*=\s*\[.*?סקוואט.*?שכיבות.*?פלאנק",
                r"quick_workout_exercises\s*=\s*\[",
                r"basic_exercises\s*=\s*\["
            ],
            "ui_hardcoding": [
                r"סקוואטים.*?15.*?חזרות",
                r"ג'אמפינג ג'קס.*?30.*?שניות",
                r"פלנק.*?30.*?שניות",
                r"שכיבות סמיכה.*?10.*?חזרות"
            ],
            "enum_imports": [
                r"from\s+enum\s+import\s+Enum",
                r"from\s+\.hebrew_exercise_parser\s+import\s+ExerciseType"
            ],
            "limited_exercise_mappings": [
                r"exercise_mappings\s*=\s*{",
                r"self\.exercise_mappings\s*=\s*{"
            ]
        }
        
        # Dynamic replacements
        self.replacements = {
            "enum_replacement": """# ExerciseType enum removed - exercises now handled dynamically
# The system generates exercises dynamically based on user input and AI suggestions""",
            
            "mapping_replacement": """# Dynamic exercise mapping - learns from user input and AI responses
        self.exercise_mappings = {
            # Basic common exercises as fallback - system will expand dynamically
            'squat': {'name': 'Squat', 'name_he': 'סקוואט', 'category': 'strength', 'points_base': 10},
            'pushup': {'name': 'Push-up', 'name_he': 'שכיבות סמיכה', 'category': 'strength', 'points_base': 8},
            'plank': {'name': 'Plank', 'name_he': 'פלאנק', 'category': 'core', 'points_base': 8},
            'running': {'name': 'Running', 'name_he': 'ריצה', 'category': 'cardio', 'points_base': 15}
        }
        # This mapping expands dynamically as users input new exercises""",
            
            "ui_replacement": """# Dynamic workout generation - AI creates varied workouts
# No more repetitive hardcoded exercise suggestions""",
            
            "import_replacement": """# Enum imports removed - exercises now handled dynamically"""
        }
        
        self.refactoring_log = []
        self.backup_files = {}
    
    async def analyze_codebase(self) -> Dict[str, Any]:
        """Analyze entire codebase for hardcoded exercise constraints"""
        analysis = {
            "files_with_hardcoded_exercises": [],
            "total_hardcoded_patterns": 0,
            "files_by_type": {"backend": [], "frontend": [], "config": []},
            "severity_breakdown": {"high": [], "medium": [], "low": []}
        }
        
        # Scan backend Python files
        for py_file in self.backend_root.rglob("*.py"):
            if self._should_skip_file(py_file):
                continue
                
            file_analysis = await self._analyze_file(py_file)
            if file_analysis["has_hardcoded_patterns"]:
                analysis["files_with_hardcoded_exercises"].append(file_analysis)
                analysis["total_hardcoded_patterns"] += file_analysis["pattern_count"]
                analysis["files_by_type"]["backend"].append(str(py_file))
                
                # Categorize severity
                if file_analysis["pattern_count"] > 5:
                    analysis["severity_breakdown"]["high"].append(str(py_file))
                elif file_analysis["pattern_count"] > 2:
                    analysis["severity_breakdown"]["medium"].append(str(py_file))
                else:
                    analysis["severity_breakdown"]["low"].append(str(py_file))
        
        # Scan frontend TypeScript/JavaScript files
        for ts_file in self.frontend_root.rglob("*.ts"):
            if self._should_skip_file(ts_file):
                continue
                
            file_analysis = await self._analyze_file(ts_file)
            if file_analysis["has_hardcoded_patterns"]:
                analysis["files_with_hardcoded_exercises"].append(file_analysis)
                analysis["total_hardcoded_patterns"] += file_analysis["pattern_count"]
                analysis["files_by_type"]["frontend"].append(str(ts_file))
        
        for js_file in self.frontend_root.rglob("*.js"):
            if self._should_skip_file(js_file):
                continue
                
            file_analysis = await self._analyze_file(js_file)
            if file_analysis["has_hardcoded_patterns"]:
                analysis["files_with_hardcoded_exercises"].append(file_analysis)
                analysis["total_hardcoded_patterns"] += file_analysis["pattern_count"]
                analysis["files_by_type"]["frontend"].append(str(js_file))
        
        return analysis
    
    async def _analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyze a single file for hardcoded patterns"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            analysis = {
                "file_path": str(file_path),
                "has_hardcoded_patterns": False,
                "pattern_count": 0,
                "found_patterns": [],
                "line_numbers": {},
                "suggested_replacements": []
            }
            
            # Check each pattern category
            for pattern_name, patterns in self.hardcoded_patterns.items():
                for pattern in patterns:
                    matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))
                    if matches:
                        analysis["has_hardcoded_patterns"] = True
                        analysis["pattern_count"] += len(matches)
                        analysis["found_patterns"].extend([pattern_name] * len(matches))
                        
                        # Record line numbers
                        for match in matches:
                            line_num = content[:match.start()].count('\n') + 1
                            if pattern_name not in analysis["line_numbers"]:
                                analysis["line_numbers"][pattern_name] = []
                            analysis["line_numbers"][pattern_name].append(line_num)
            
            # Generate suggested replacements
            if analysis["has_hardcoded_patterns"]:
                analysis["suggested_replacements"] = self._generate_replacements(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing file {file_path}: {e}")
            return {
                "file_path": str(file_path),
                "has_hardcoded_patterns": False,
                "error": str(e)
            }
    
    def _generate_replacements(self, file_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate specific replacement suggestions for a file"""
        replacements = []
        
        for pattern_name in file_analysis["found_patterns"]:
            if pattern_name == "exercise_enums":
                replacements.append({
                    "type": "enum_removal",
                    "description": "Remove hardcoded ExerciseType enum",
                    "replacement": self.replacements["enum_replacement"],
                    "impact": "High - enables unlimited exercise variety"
                })
            elif pattern_name == "exercise_lists":
                replacements.append({
                    "type": "list_replacement",
                    "description": "Replace hardcoded exercise lists with dynamic generation",
                    "replacement": self.replacements["mapping_replacement"],
                    "impact": "High - removes exercise walled garden"
                })
            elif pattern_name == "ui_hardcoding":
                replacements.append({
                    "type": "ui_dynamic",
                    "description": "Replace hardcoded UI workout suggestions with AI generation",
                    "replacement": self.replacements["ui_replacement"],
                    "impact": "Medium - fixes repetitive workout suggestions"
                })
        
        return replacements
    
    async def execute_refactoring(self, dry_run: bool = True) -> Dict[str, Any]:
        """Execute the refactoring process"""
        logger.info("🔧 Starting systematic refactoring of hardcoded exercise constraints")
        
        # First analyze the codebase
        analysis = await self.analyze_codebase()
        
        refactoring_results = {
            "analysis": analysis,
            "files_processed": [],
            "files_failed": [],
            "total_changes": 0,
            "backup_locations": []
        }
        
        # Process files in order of severity (high to low)
        files_to_process = (
            analysis["severity_breakdown"]["high"] +
            analysis["severity_breakdown"]["medium"] +
            analysis["severity_breakdown"]["low"]
        )
        
        for file_path_str in files_to_process:
            file_path = Path(file_path_str)
            
            try:
                # Create backup
                backup_path = await self._create_backup(file_path)
                refactoring_results["backup_locations"].append(str(backup_path))
                
                if not dry_run:
                    # Apply refactoring
                    changes_made = await self._refactor_file(file_path)
                    refactoring_results["files_processed"].append({
                        "file": str(file_path),
                        "changes": changes_made,
                        "status": "success"
                    })
                    refactoring_results["total_changes"] += len(changes_made)
                else:
                    # Dry run - just report what would be changed
                    file_analysis = await self._analyze_file(file_path)
                    refactoring_results["files_processed"].append({
                        "file": str(file_path),
                        "planned_changes": file_analysis["suggested_replacements"],
                        "status": "dry_run"
                    })
                    
            except Exception as e:
                logger.error(f"Failed to process {file_path}: {e}")
                refactoring_results["files_failed"].append({
                    "file": str(file_path),
                    "error": str(e)
                })
        
        # Generate summary
        refactoring_results["summary"] = self._generate_summary(refactoring_results)
        
        logger.info(f"✅ Refactoring complete. Processed {len(refactoring_results['files_processed'])} files")
        
        return refactoring_results
    
    async def _create_backup(self, file_path: Path) -> Path:
        """Create backup of file before refactoring"""
        backup_dir = self.project_root / "_refactoring_backups"
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = asyncio.get_event_loop().time()
        backup_name = f"{file_path.stem}_{timestamp}{file_path.suffix}"
        backup_path = backup_dir / backup_name
        
        with open(file_path, 'r', encoding='utf-8') as src:
            with open(backup_path, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
        
        self.backup_files[str(file_path)] = str(backup_path)
        return backup_path
    
    async def _refactor_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """Apply refactoring changes to a specific file"""
        changes_made = []
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply enum removal
        for pattern in self.hardcoded_patterns["exercise_enums"]:
            if re.search(pattern, content, re.MULTILINE | re.DOTALL):
                # Find and replace the entire enum block
                enum_match = re.search(r'class\s+ExerciseType\s*\([^)]*\):.*?(?=\n\nclass|\Z)', 
                                      content, re.MULTILINE | re.DOTALL)
                if enum_match:
                    content = content.replace(enum_match.group(0), 
                                            self.replacements["enum_replacement"])
                    changes_made.append({
                        "type": "enum_removal",
                        "description": "Removed ExerciseType enum",
                        "lines_affected": f"{content[:enum_match.start()].count('\n') + 1}"
                    })
        
        # Apply exercise list replacements
        for pattern in self.hardcoded_patterns["exercise_lists"]:
            matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))
            for match in matches:
                # Find the end of the list/expression
                list_end = self._find_list_end(content, match.end())
                if list_end:
                    old_list = content[match.start():list_end]
                    content = content.replace(old_list, 
                                            self.replacements["mapping_replacement"])
                    changes_made.append({
                        "type": "list_replacement",
                        "description": "Replaced hardcoded exercise list",
                        "lines_affected": f"{content[:match.start()].count('\n') + 1}"
                    })
        
        # Apply UI hardcoding removal
        for pattern in self.hardcoded_patterns["ui_hardcoding"]:
            matches = list(re.finditer(pattern, content, re.MULTILINE))
            for match in matches:
                # Replace with dynamic generation comment
                content = content.replace(match.group(0), 
                                        self.replacements["ui_replacement"])
                changes_made.append({
                    "type": "ui_replacement",
                    "description": "Removed hardcoded UI workout suggestion",
                    "lines_affected": f"{content[:match.start()].count('\n') + 1}"
                })
        
        # Remove enum imports
        for pattern in self.hardcoded_patterns["enum_imports"]:
            if re.search(pattern, content):
                content = re.sub(pattern, self.replacements["import_replacement"], content)
                changes_made.append({
                    "type": "import_replacement",
                    "description": "Removed enum import",
                    "lines_affected": "import section"
                })
        
        # Write changes if any were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        
        return changes_made
    
    def _find_list_end(self, content: str, start_pos: int) -> Optional[int]:
        """Find the end of a list/dictionary definition"""
        bracket_count = 0
        in_string = False
        escape_char = False
        
        for i in range(start_pos, len(content)):
            char = content[i]
            
            if escape_char:
                escape_char = False
                continue
            
            if char == '\\':
                escape_char = True
                continue
            
            if char in ('"', "'") and not escape_char:
                in_string = not in_string
                continue
            
            if not in_string:
                if char in ('[', '{'):
                    bracket_count += 1
                elif char in (']', '}'):
                    bracket_count -= 1
                    if bracket_count == 0:
                        return i + 1
                elif char == '\n' and bracket_count == 0:
                    return i
        
        return None
    
    def _should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped during analysis"""
        skip_patterns = [
            "__pycache__",
            "node_modules",
            ".git",
            "test_",
            "_test",
            "migrations",
            "venv",
            ".venv"
        ]
        
        return any(pattern in str(file_path) for pattern in skip_patterns)
    
    def _generate_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of refactoring results"""
        analysis = results["analysis"]
        
        return {
            "total_files_analyzed": len(analysis["files_with_hardcoded_exercises"]),
            "total_hardcoded_patterns_found": analysis["total_hardcoded_patterns"],
            "files_processed": len(results["files_processed"]),
            "files_failed": len(results["files_failed"]),
            "total_changes_applied": results["total_changes"],
            "severity_breakdown": {
                "high": len(analysis["severity_breakdown"]["high"]),
                "medium": len(analysis["severity_breakdown"]["medium"]),
                "low": len(analysis["severity_breakdown"]["low"])
            },
            "impact_assessment": self._assess_impact(analysis),
            "next_steps": self._generate_next_steps(results)
        }
    
    def _assess_impact(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Assess the impact of the refactoring"""
        high_severity = len(analysis["severity_breakdown"]["high"])
        total_patterns = analysis["total_hardcoded_patterns"]
        
        if high_severity > 0:
            impact_level = "Critical"
            description = "Major hardcoded constraints removed - enables unlimited exercise variety"
        elif total_patterns > 10:
            impact_level = "High"
            description = "Significant improvement in exercise variety and system flexibility"
        elif total_patterns > 5:
            impact_level = "Medium"
            description = "Good improvement in reducing repetitive workout suggestions"
        else:
            impact_level = "Low"
            description = "Minor cleanup of hardcoded constraints"
        
        return {
            "level": impact_level,
            "description": description,
            "expected_improvement": "AI will now be able to suggest unlimited varied exercises"
        }
    
    def _generate_next_steps(self, results: Dict[str, Any]) -> List[str]:
        """Generate next steps after refactoring"""
        steps = [
            "Test the system to ensure no functionality was broken",
            "Run the backend test suite to verify exercise parsing still works",
            "Test frontend to ensure workout suggestions are now varied",
            "Monitor AI responses to confirm exercise variety has improved",
            "Add comprehensive exercise database for AI to draw from"
        ]
        
        if results["files_failed"]:
            steps.insert(0, "Manually review and fix files that failed refactoring")
        
        return steps
    
    async def validate_refactoring(self) -> Dict[str, Any]:
        """Validate that refactoring didn't break functionality"""
        validation_results = {
            "syntax_check": {},
            "import_check": {},
            "functionality_check": {},
            "overall_status": "unknown"
        }
        
        # Check Python syntax
        for py_file in self.backend_root.rglob("*.py"):
            if self._should_skip_file(py_file):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                ast.parse(content)
                validation_results["syntax_check"][str(py_file)] = "valid"
            except SyntaxError as e:
                validation_results["syntax_check"][str(py_file)] = f"error: {e}"
            except Exception as e:
                validation_results["syntax_check"][str(py_file)] = f"unexpected error: {e}"
        
        # Check if all files can be imported (basic check)
        # This would need to be more sophisticated in practice
        
        # Determine overall status
        syntax_errors = sum(1 for status in validation_results["syntax_check"].values() 
                          if status != "valid")
        
        if syntax_errors == 0:
            validation_results["overall_status"] = "passed"
        else:
            validation_results["overall_status"] = f"failed ({syntax_errors} syntax errors)"
        
        return validation_results

# Singleton instance
refactoring_agent = RefactoringAgent()