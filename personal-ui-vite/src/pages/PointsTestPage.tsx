import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Trophy, Target, Zap, Calculator } from 'lucide-react';

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

const PointsTestPage: React.FC = () => {
  const [exercises, setExercises] = useState<ExercisePoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [reps, setReps] = useState<number>(10);
  const [sets, setSets] = useState<number>(1);
  const [weight, setWeight] = useState<number>(0);
  const [calculatedPoints, setCalculatedPoints] = useState<number>(0);

  // Load default exercise data (without API call for testing)
  useEffect(() => {
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
    
    setExercises(defaultExercises);
    setLoading(false);
  }, []);

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

    // High rep bonus
    if (reps >= 20) {
      points += 50;
    }

    // Weight bonus rule
    if (weight > 0) {
      points += 50;
    }

    setCalculatedPoints(Math.round(points));
  };

  useEffect(() => {
    calculatePoints();
  }, [selectedExercise, reps, sets, weight]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      strength: 'bg-red-100 text-red-800',
      cardio: 'bg-blue-100 text-blue-800',
      core: 'bg-green-100 text-green-800',
      flexibility: 'bg-purple-100 text-purple-800',
      functional: 'bg-orange-100 text-orange-800',
      hiit: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-muted/50 text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="mr-2">Loading points configuration...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Points System Test</h1>
          <p className="text-gray-600">Test the exercise points calculation system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Exercise Points Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {exercises.map((exercise) => (
                <div key={exercise.exercise} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{exercise.name_he}</h3>
                      <Badge className={getCategoryColor(exercise.category)}>
                        {exercise.category}
                      </Badge>
                    </div>
                    <Badge variant="secondary">{exercise.points_base} pts</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Weight:</span>
                      <span className="ml-1">{exercise.weight_multiplier}x</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reps:</span>
                      <span className="ml-1">{exercise.reps_multiplier}x</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sets:</span>
                      <span className="ml-1">{exercise.sets_multiplier}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Points Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Points Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Exercise</Label>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select exercise</option>
                  {exercises.map((exercise) => (
                    <option key={exercise.exercise} value={exercise.exercise}>
                      {exercise.name_he}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
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
              
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {calculatedPoints} points
                </div>
                <p className="text-gray-600 text-sm">
                  Total points for this exercise
                </p>
              </div>
              
              {selectedExercise && (
                <div className="bg-muted/20 p-3 rounded-lg text-sm">
                  <h4 className="font-semibold mb-2">Calculation Breakdown:</h4>
                  <div className="space-y-1">
                    <div>Base: {exercises.find(ex => ex.exercise === selectedExercise)?.points_base} pts</div>
                    <div>Reps: ×{reps} × {exercises.find(ex => ex.exercise === selectedExercise)?.reps_multiplier}</div>
                    <div>Sets: ×{sets} × {exercises.find(ex => ex.exercise === selectedExercise)?.sets_multiplier}</div>
                    {weight > 0 && <div>Weight bonus: +{weight * (exercises.find(ex => ex.exercise === selectedExercise)?.weight_multiplier || 0)} pts</div>}
                    {reps >= 20 && <div>High rep bonus: +50 pts</div>}
                    {weight > 0 && <div>Weight rule bonus: +50 pts</div>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Rules */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Active Points Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-sm">Weight Bonus</h4>
              <p className="text-xs text-gray-600 mt-1">+50 points for any weighted exercise</p>
              <Badge className="mt-2" variant="secondary">Bonus</Badge>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-sm">High Rep Bonus</h4>
              <p className="text-xs text-gray-600 mt-1">+50 points for 20+ reps</p>
              <Badge className="mt-2" variant="secondary">Bonus</Badge>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-sm">Weight Multiplier</h4>
              <p className="text-xs text-gray-600 mt-1">0.1 × weight_kg added to points</p>
              <Badge className="mt-2" variant="secondary">Multiplier</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex gap-4">
        <Button
          onClick={() => window.location.href = '/points'}
          className="flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          Open Points Management
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2"
        >
          Back to Chat
        </Button>
      </div>
    </div>
  );
};

export default PointsTestPage;