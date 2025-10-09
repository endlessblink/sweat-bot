import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Separator } from '../components/ui/separator';
import { 
  Settings, 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Save, 
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload
} from 'lucide-react';

interface ExercisePoints {
  exercise: string;
  name_he: string;
  name_en: string;
  category: string;
  points_base: number;
  primary_muscle: string;
  weight_multiplier: number;
  reps_multiplier: number;
  sets_multiplier: number;
}

interface Achievement {
  id: string;
  name: string;
  name_he: string;
  description: string;
  description_he: string;
  points: number;
  icon: string;
  enabled: boolean;
}

interface PointsRule {
  id: string;
  name: string;
  description: string;
  type: 'multiplier' | 'bonus' | 'threshold';
  value: number;
  condition: string;
  enabled: boolean;
}

interface Goal {
  id: string;
  name: string;
  name_he: string;
  description: string;
  description_he: string;
  category: string;
  target_type: string;
  target_value: number;
  time_period: string;
  points_reward: number;
  is_active: boolean;
}

import { marked } from 'marked';

const PointsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('exercises');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exercisePoints, setExercisePoints] = useState<ExercisePoints[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pointsRules, setPointsRules] = useState<PointsRule[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [rulesMarkdown, setRulesMarkdown] = useState('');
  const [achievementsMarkdown, setAchievementsMarkdown] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExercisePoints | null>(null);


  // Load points configuration
  useEffect(() => {
    loadPointsConfiguration();
    fetch('/src/content/points-system/rules.md').then(res => res.text()).then(text => setRulesMarkdown(marked(text)));
    fetch('/src/content/points-system/achievements.md').then(res => res.text()).then(text => setAchievementsMarkdown(marked(text)));
  }, []);

  const loadPointsConfiguration = async () => {
    setLoading(true);
    try {
      // Load exercise points
      const exercisesResponse = await fetch('/api/points/exercises');
      if (exercisesResponse.ok) {
        const data = await exercisesResponse.json();
        setExercisePoints(data.exercises || []);
      }

      // Load achievements
      const achievementsResponse = await fetch('/api/points/achievements');
      if (achievementsResponse.ok) {
        const data = await achievementsResponse.json();
        setAchievements(data.achievements || []);
      }

      // Load points rules
      const rulesResponse = await fetch('/api/points/rules');
      if (rulesResponse.ok) {
        const data = await rulesResponse.json();
        setPointsRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to load points configuration:', error);
      // Load default data for demo
      loadDefaultData();
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultData = () => {
    // Default exercise points (from backend service)
    const defaultExercises: ExercisePoints[] = [
      {
        exercise: 'squat',
        name_he: 'סקוואט',
        name_en: 'Squat',
        category: 'strength',
        points_base: 10,
        primary_muscle: 'legs',
        weight_multiplier: 0.1,
        reps_multiplier: 1.0,
        sets_multiplier: 5.0
      },
      {
        exercise: 'pushup',
        name_he: 'שכיבות סמיכה',
        name_en: 'Push-up',
        category: 'strength',
        points_base: 8,
        primary_muscle: 'chest',
        weight_multiplier: 0.1,
        reps_multiplier: 1.0,
        sets_multiplier: 5.0
      },
      {
        exercise: 'deadlift',
        name_he: 'דדליפט',
        name_en: 'Deadlift',
        category: 'strength',
        points_base: 20,
        primary_muscle: 'full_body',
        weight_multiplier: 0.1,
        reps_multiplier: 1.0,
        sets_multiplier: 5.0
      },
      {
        exercise: 'burpee',
        name_he: 'ברפי',
        name_en: 'Burpee',
        category: 'cardio',
        points_base: 15,
        primary_muscle: 'full_body',
        weight_multiplier: 0.1,
        reps_multiplier: 1.0,
        sets_multiplier: 5.0
      },
      {
        exercise: 'plank',
        name_he: 'פלאנק',
        name_en: 'Plank',
        category: 'core',
        points_base: 8,
        primary_muscle: 'core',
        weight_multiplier: 0.1,
        reps_multiplier: 1.0,
        sets_multiplier: 5.0
      }
    ];

    // Default achievements
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_workout',
        name: 'Getting Started',
        name_he: 'התחלה חדשה',
        description: 'Complete your first workout',
        description_he: 'השלם את האימון הראשון שלך',
        points: 100,
        icon: '🎯',
        enabled: true
      },
      {
        id: 'streak_7_days',
        name: 'Week Warrior',
        name_he: 'לוחם השבוע',
        description: 'Work out 7 days in a row',
        description_he: 'התאמן 7 ימים ברציפות',
        points: 300,
        icon: '⚡',
        enabled: true
      },
      {
        id: 'century_club',
        name: 'Century Club',
        name_he: 'מועדון המאה',
        description: 'Complete 100 reps in a single exercise',
        description_he: 'השלם 100 חזרות בתרגיל אחד',
        points: 200,
        icon: '💯',
        enabled: true
      }
    ];

    // Default points rules
    const defaultRules: PointsRule[] = [
      {
        id: 'weight_bonus',
        name: 'Weight Bonus',
        description: 'Bonus points for weighted exercises',
        type: 'multiplier',
        value: 0.1,
        condition: 'weight_kg > 0',
        enabled: true
      },
      {
        id: 'high_rep_bonus',
        name: 'High Rep Bonus',
        description: 'Bonus for exercises with 20+ reps',
        type: 'bonus',
        value: 50,
        condition: 'reps >= 20',
        enabled: true
      },
      {
        id: 'personal_record',
        name: 'Personal Record',
        description: 'Bonus for setting new personal records',
        type: 'bonus',
        value: 50,
        condition: 'is_personal_record = true',
        enabled: true
      }
    ];

    setExercisePoints(defaultExercises);
    setAchievements(defaultAchievements);
    setPointsRules(defaultRules);
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/points/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercises: exercisePoints,
          achievements: achievements,
          rules: pointsRules
        })
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateExercisePoints = (exercise: string, field: keyof ExercisePoints, value: any) => {
    setExercisePoints(prev => 
      prev.map(ex => 
        ex.exercise === exercise ? { ...ex, [field]: value } : ex
      )
    );
  };

  const updateAchievement = (id: string, field: keyof Achievement, value: any) => {
    setAchievements(prev => 
      prev.map(ach => 
        ach.id === id ? { ...ach, [field]: value } : ach
      )
    );
  };

  const updatePointsRule = (id: string, field: keyof PointsRule, value: any) => {
    setPointsRules(prev => 
      prev.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const updateGoal = (id: string, field: keyof Goal, value: any) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id ? { ...goal, [field]: value } : goal
      )
    );
  };

  const exportConfiguration = () => {
    const config = {
      exercises: exercisePoints,
      achievements: achievements,
      rules: pointsRules,
      export_date: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sweatbot-points-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.exercises) setExercisePoints(config.exercises);
        if (config.achievements) setAchievements(config.achievements);
        if (config.rules) setPointsRules(config.rules);
        alert('Configuration imported successfully!');
      } catch (error) {
        alert('Failed to import configuration. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      strength: 'bg-red-100 text-red-800',
      cardio: 'bg-blue-100 text-blue-800',
      core: 'bg-green-100 text-green-800',
      flexibility: 'bg-purple-100 text-purple-800',
      functional: 'bg-orange-100 text-orange-800',
      hiit: 'bg-yellow-100 text-yellow-800',
      sport: 'bg-pink-100 text-pink-800',
      recreation: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-muted/50 text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="mr-2">Loading points configuration...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Points Management
          </h1>
          <p className="text-gray-600 mt-2">Configure exercise points, achievements, and gamification rules</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportConfiguration}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importConfiguration}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          
          <Button
            onClick={saveConfiguration}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Exercises
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="markdown" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Markdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markdown">
          <Card>
            <CardHeader>
              <CardTitle>Markdown Content</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: rulesMarkdown }} />
              <div dangerouslySetInnerHTML={{ __html: achievementsMarkdown }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exercise Points Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Configure base points and multipliers for each exercise
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exercisePoints.map((exercise) => (
                  <div key={exercise.exercise} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{exercise.name_he}</h3>
                        <Badge className={getCategoryColor(exercise.category)}>
                          {exercise.category}
                        </Badge>
                        <span className="text-sm text-gray-500">{exercise.name_en}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExercise(exercise)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Base Points</Label>
                        <Input
                          type="number"
                          value={exercise.points_base}
                          onChange={(e) => updateExercisePoints(exercise.exercise, 'points_base', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <Label>Weight Multiplier</Label>
                        <Input
                          type="number"
                          value={exercise.weight_multiplier}
                          onChange={(e) => updateExercisePoints(exercise.exercise, 'weight_multiplier', parseFloat(e.target.value) || 0)}
                          step="0.1"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <Label>Reps Multiplier</Label>
                        <Input
                          type="number"
                          value={exercise.reps_multiplier}
                          onChange={(e) => updateExercisePoints(exercise.exercise, 'reps_multiplier', parseFloat(e.target.value) || 0)}
                          step="0.1"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <Label>Sets Multiplier</Label>
                        <Input
                          type="number"
                          value={exercise.sets_multiplier}
                          onChange={(e) => updateExercisePoints(exercise.exercise, 'sets_multiplier', parseFloat(e.target.value) || 0)}
                          step="0.1"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Achievement Configuration</CardTitle>
                  <p className="text-sm text-gray-600">
                    Manage achievements and their rewards
                  </p>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => { setSelectedAchievement(null); setIsAchievementFormOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  Add Achievement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <h3 className="font-semibold">{achievement.name_he}</h3>
                          <p className="text-sm text-gray-600">{achievement.description_he}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{achievement.points} pts</Badge>
                        <Button variant="outline" size="icon" onClick={() => { setSelectedAchievement(achievement); setIsAchievementFormOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={achievement.enabled}
                          onCheckedChange={(checked) => updateAchievement(achievement.id, 'enabled', checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Goal Configuration</CardTitle>
                  <p className="text-sm text-gray-600">
                    Manage user goals and their rewards
                  </p>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => { setSelectedGoal(null); setIsGoalFormOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  Add Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{goal.name_he}</h3>
                          <p className="text-sm text-gray-600">{goal.description_he}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{goal.points_reward} pts</Badge>
                        <Button variant="outline" size="icon" onClick={() => { setSelectedGoal(goal); setIsGoalFormOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={goal.is_active}
                          onCheckedChange={(checked) => updateGoal(goal.id, 'is_active', checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points Rules Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Configure bonus rules and multipliers
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointsRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{rule.name}</h3>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                        <code className="text-xs bg-muted/50 px-2 py-1 rounded">
                          {rule.condition}
                        </code>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{rule.type}</Badge>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => updatePointsRule(rule.id, 'enabled', checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Label>Value:</Label>
                      <Input
                        type="number"
                        value={rule.value}
                        onChange={(e) => updatePointsRule(rule.id, 'value', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                        className="w-32"
                      />
                      <span className="text-sm text-gray-500">
                        {rule.type === 'multiplier' ? 'multiplier' : 'points'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points Calculator Preview</CardTitle>
              <p className="text-sm text-gray-600">
                Test how points are calculated for different exercises
              </p>
            </CardHeader>
            <CardContent>
              <PointsCalculator 
                exercises={exercisePoints}
                rules={pointsRules}
              />
            </CardContent>
          </Card>
        </TabsContent>
        {isGoalFormOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>{selectedGoal ? 'Edit' : 'Add'} Goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name (Hebrew)</Label>
                    <Input
                      value={selectedGoal?.name_he || ''}
                      onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: prev?.name || '', name_he: e.target.value, description: prev?.description || '', description_he: prev?.description_he || '', category: prev?.category || '', target_type: prev?.target_type || '', target_value: prev?.target_value || 0, time_period: prev?.time_period || '', points_reward: prev?.points_reward || 0, is_active: prev?.is_active || false }))}
                    />
                  </div>
                  <div>
                    <Label>Name (English)</Label>
                    <Input
                      value={selectedGoal?.name || ''}
                      onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: e.target.value, name_he: prev?.name_he || '', description: prev?.description || '', description_he: prev?.description_he || '', category: prev?.category || '', target_type: prev?.target_type || '', target_value: prev?.target_value || 0, time_period: prev?.time_period || '', points_reward: prev?.points_reward || 0, is_active: prev?.is_active || false }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description (Hebrew)</Label>
                  <Input
                    value={selectedGoal?.description_he || ''}
                    onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: prev?.name || '', name_he: prev?.name_he || '', description: prev?.description || '', description_he: e.target.value, category: prev?.category || '', target_type: prev?.target_type || '', target_value: prev?.target_value || 0, time_period: prev?.time_period || '', points_reward: prev?.points_reward || 0, is_active: prev?.is_active || false }))}
                  />
                </div>
                <div>
                  <Label>Description (English)</Label>
                  <Input
                    value={selectedGoal?.description || ''}
                    onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: prev?.name || '', name_he: prev?.name_he || '', description: e.target.value, description_he: prev?.description_he || '', category: prev?.category || '', target_type: prev?.target_type || '', target_value: prev?.target_value || 0, time_period: prev?.time_period || '', points_reward: prev?.points_reward || 0, is_active: prev?.is_active || false }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={selectedGoal?.category || ''}
                      onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: prev?.name || '', name_he: prev?.name_he || '', description: prev?.description || '', description_he: prev?.description_he || '', category: e.target.value, target_type: prev?.target_type || '', target_value: prev?.target_value || 0, time_period: prev?.time_period || '', points_reward: prev?.points_reward || 0, is_active: prev?.is_active || false }))}
                    />
                  </div>
                  <div>
                    <Label>Time Period</Label>
                    <Input
                      value={selectedGoal?.time_period || ''}
                      onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: prev?.name || '', name_he: prev?.name_he || '', description: prev?.description || '', description_he: prev?.description_he || '', category: prev?.category || '', target_type: prev?.target_type || '', target_value: prev?.target_value || 0, time_period: e.target.value, points_reward: prev?.points_reward || 0, is_active: prev?.is_active || false }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Target Type</Label>
                    <Input
                      value={selectedGoal?.target_type || ''}
                      onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: prev?.name || '', name_he: prev?.name_he || '', description: prev?.description || '', description_he: prev?.description_he || '', category: prev?.category || '', target_type: e.target.value, target_value: prev?.target_value || 0, time_period: prev?.time_period || '', points_reward: prev?.points_reward || 0, is_active: prev?.is_active || false }))}
                    />
                  </div>
                  <div>
                    <Label>Target Value</Label>
                    <Input
                      type="number"
                      value={selectedGoal?.target_value || 0}
                      onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: prev?.name || '', name_he: prev?.name_he || '', description: prev?.description || '', description_he: prev?.description_he || '', category: prev?.category || '', target_type: prev?.target_type || '', target_value: parseInt(e.target.value) || 0, time_period: prev?.time_period || '', points_reward: prev?.points_reward || 0, is_active: prev?.is_active || false }))}
                    />
                  </div>
                  <div>
                    <Label>Points Reward</Label>
                    <Input
                      type="number"
                      value={selectedGoal?.points_reward || 0}
                      onChange={(e) => setSelectedGoal(prev => ({ ...prev, id: prev?.id || '', name: prev?.name || '', name_he: prev?.name_he || '', description: prev?.description || '', description_he: prev?.description_he || '', category: prev?.category || '', target_type: prev?.target_type || '', target_value: prev?.target_value || 0, time_period: prev?.time_period || '', points_reward: parseInt(e.target.value) || 0, is_active: prev?.is_active || false }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsGoalFormOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    if (selectedGoal) {
                      if (goals.find(g => g.id === selectedGoal.id)) {
                        setGoals(prev => prev.map(g => g.id === selectedGoal.id ? selectedGoal : g));
                      } else {
                        setGoals(prev => [...prev, { ...selectedGoal, id: new Date().toISOString() }]);
                      }
                    }
                    setIsGoalFormOpen(false);
                  }}>Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </Tabs>
    </div>
  );
};

// Points Calculator Component
const PointsCalculator: React.FC<{
  exercises: ExercisePoints[];
  rules: PointsRule[];
}> = ({ exercises, rules }) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [reps, setReps] = useState<number>(10);
  const [sets, setSets] = useState<number>(1);
  const [weight, setWeight] = useState<number>(0);
  const [calculatedPoints, setCalculatedPoints] = useState<number>(0);

  const calculatePoints = () => {
    if (!selectedExercise) return;

    const exercise = exercises.find(ex => ex.exercise === selectedExercise);
    if (!exercise) return;

    let points = exercise.points_base;
    
    // Apply multipliers
    points *= reps * exercise.reps_multiplier;
    points *= sets * exercise.sets_multiplier;
    
    // Weight bonus
    if (weight > 0) {
      points += weight * exercise.weight_multiplier;
    }

    // Apply rules
    rules.forEach(rule => {
      if (!rule.enabled) return;
      
      if (rule.type === 'bonus' && rule.condition === 'reps >= 20' && reps >= 20) {
        points += rule.value;
      }
      
      if (rule.type === 'bonus' && rule.condition === 'weight_kg > 0' && weight > 0) {
        points += rule.value;
      }
    });

    setCalculatedPoints(Math.round(points));
  };

  useEffect(() => {
    calculatePoints();
  }, [selectedExercise, reps, sets, weight]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label>Exercise</Label>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger>
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((exercise) => (
                <SelectItem key={exercise.exercise} value={exercise.exercise}>
                  {exercise.name_he}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Reps</Label>
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        
        <div>
          <Label>Sets</Label>
          <Input
            type="number"
            value={sets}
            onChange={(e) => setSets(parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        
        <div>
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.5"
          />
        </div>
      </div>
      
      <Separator />
      
      <div className="text-center">
        <div className="text-4xl font-bold text-yellow-500 mb-2">
          {calculatedPoints} points
        </div>
        <p className="text-gray-600">
          Total points for this exercise
        </p>
      </div>
      
      {selectedExercise && (
        <div className="bg-muted/20 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Calculation Breakdown:</h4>
          <div className="space-y-1 text-sm">
            <div>Base: {exercises.find(ex => ex.exercise === selectedExercise)?.points_base} pts</div>
            <div>Reps multiplier: ×{reps} × {exercises.find(ex => ex.exercise === selectedExercise)?.reps_multiplier}</div>
            <div>Sets multiplier: ×{sets} × {exercises.find(ex => ex.exercise === selectedExercise)?.sets_multiplier}</div>
            {weight > 0 && <div>Weight bonus: +{weight * (exercises.find(ex => ex.exercise === selectedExercise)?.weight_multiplier || 0)} pts</div>}
            {reps >= 20 && rules.find(r => r.id === 'high_rep_bonus' && r.enabled) && (
              <div>High rep bonus: +{rules.find(r => r.id === 'high_rep_bonus')?.value} pts</div>
            )}
            {weight > 0 && rules.find(r => r.id === 'weight_bonus' && r.enabled) && (
              <div>Weight bonus: +{rules.find(r => r.id === 'weight_bonus')?.value} pts</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsManagementPage;