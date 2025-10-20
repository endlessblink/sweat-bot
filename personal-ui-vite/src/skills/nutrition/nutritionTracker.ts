/**
 * Nutrition Tracker Skill
 * Tracks nutrition intake, provides meal recommendations, and analyzes dietary patterns
 */

import { z } from 'zod';
import {
  BaseSkill,
  SkillCategory,
  SkillContext,
  SkillResult,
  ValidationResult
} from '../core/types';

// Schema for nutrition tracking input
const nutritionTrackerSchema = z.object({
  meal: z.object({
    type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'post_workout']).describe('Meal type'),
    foods: z.array(z.object({
      name: z.string().describe('Food name'),
      quantity: z.number().describe('Quantity in grams or ml'),
      unit: z.string().describe('Unit (g, ml, pieces, cups, etc.)'),
      calories: z.number().optional().describe('Calories if known'),
      protein: z.number().optional().describe('Protein in grams'),
      carbs: z.number().optional().describe('Carbohydrates in grams'),
      fat: z.number().optional().describe('Fat in grams'),
      fiber: z.number().optional().describe('Fiber in grams')
    })).describe('Foods consumed in the meal'),
    time: z.string().optional().describe('Meal time in HH:MM format'),
    rating: z.number().min(1).max(10).optional().describe('Satisfaction rating 1-10')
  }).optional().describe('Meal data to log'),
  dailyGoals: z.object({
    calories: z.number().optional().describe('Daily calorie goal'),
    protein: z.number().optional().describe('Daily protein goal in grams'),
    carbs: z.number().optional().describe('Daily carb goal in grams'),
    fat: z.number().optional().describe('Daily fat goal in grams'),
    fiber: z.number().optional().describe('Daily fiber goal in grams'),
    water: z.number().optional().describe('Daily water goal in liters')
  }).optional().describe('Daily nutrition goals'),
  timeframe: z.enum(['today', 'week', 'month']).default('today').describe('Timeframe for analysis'),
  preferences: z.object({
    diet: z.enum(['omnivore', 'vegetarian', 'vegan', 'paleo', 'keto', 'mediterranean', 'gluten_free']).optional().describe('Dietary preference'),
    allergies: z.array(z.string()).optional().describe('Food allergies'),
    restrictions: z.array(z.string()).optional().describe('Dietary restrictions'),
    favorites: z.array(z.string()).optional().describe('Favorite foods')
  }).optional().describe('Nutrition preferences')
});

export type NutritionTrackerParams = z.infer<typeof nutritionTrackerSchema>;

export class NutritionTrackerSkill extends BaseSkill {
  public readonly id = 'nutrition_tracker';
  public readonly name = 'Advanced Nutrition Tracker';
  public readonly description = 'Tracks nutrition intake, analyzes dietary patterns, and provides personalized meal recommendations';
  public readonly version = '1.0.0';
  public readonly category = SkillCategory.NUTRITION;

  public readonly tags = ['nutrition', 'diet', 'meals', 'tracking', 'calories', 'macros', 'he', 'en'];
  public readonly dependencies = [];

  public readonly config = {
    timeout: 8000,
    retryAttempts: 2,
    requiresBackend: true,
    cacheable: true,
    memoryUsage: 'medium' as const,
    cpuUsage: 'medium' as const,
    requiresAuth: true,
    permissions: ['read_nutrition_data', 'write_nutrition_data'],
    compatibleSkills: ['health_monitor', 'workout_planner', 'meal_planner'],
    conflictsWith: []
  };

  public validate(input: any): ValidationResult {
    try {
      const parsed = nutritionTrackerSchema.parse(input);
      return {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedInput: parsed
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: []
        };
      }
      return {
        isValid: false,
        errors: ['Invalid input format'],
        warnings: []
      };
    }
  }

  public getSchema(): z.ZodSchema {
    return nutritionTrackerSchema;
  }

  public async execute(input: NutritionTrackerParams, context: SkillContext): Promise<SkillResult> {
    try {
      // Get historical nutrition data
      const nutritionHistory = await this.getNutritionHistory(context, input.timeframe);

      // Process meal data if provided
      let mealAnalysis = null;
      if (input.meal) {
        mealAnalysis = this.analyzeMeal(input.meal, context.userProfile);
        await this.saveMealToBackend(input.meal, context);
      }

      // Calculate daily nutrition totals
      const dailyAnalysis = this.analyzeDailyNutrition(nutritionHistory, input.dailyGoals, context.userProfile);

      // Generate insights and recommendations
      const insights = this.generateNutritionInsights(dailyAnalysis, nutritionHistory, input.preferences, context);
      const recommendations = this.generateNutritionRecommendations(dailyAnalysis, input.dailyGoals, input.preferences, context);

      // Create meal suggestions
      const mealSuggestions = this.generateMealSuggestions(dailyAnalysis, input.preferences, context);

      // Create nutrition visualizations
      const visualizations = this.createNutritionVisualizations(dailyAnalysis, nutritionHistory);

      return this.createSuccessResult({
        mealAnalysis,
        dailyAnalysis,
        insights,
        recommendations,
        mealSuggestions,
        nutritionScore: this.calculateNutritionScore(dailyAnalysis),
        trends: this.analyzeNutritionTrends(nutritionHistory),
        hydrationStatus: this.analyzeHydration(dailyAnalysis, input.dailyGoals)
      }, [
        input.meal ? `Logged ${input.meal.type} with ${input.meal.foods.length} foods` : 'Analyzed nutrition data',
        `Daily nutrition score: ${this.calculateNutritionScore(dailyAnalysis)}/100`,
        `${recommendations.length} personalized recommendations generated`
      ], recommendations, [
        'Follow the meal suggestions for balanced nutrition',
        'Track your intake consistently for better insights',
        'Stay hydrated throughout the day'
      ], visualizations);

    } catch (error) {
      console.error('Nutrition tracking error:', error);
      return this.createErrorResult('Failed to track nutrition. Please try again.');
    }
  }

  private async getNutritionHistory(context: SkillContext, timeframe: string): Promise<any[]> {
    try {
      const response = await this.callBackend('/api/v1/nutrition/history', {
        userId: context.userId,
        timeframe,
        limit: timeframe === 'today' ? 10 : timeframe === 'week' ? 50 : 200
      }, context);
      return response.data || [];
    } catch (error) {
      console.warn('Could not fetch nutrition history:', error);
      return [];
    }
  }

  private analyzeMeal(meal: any, userProfile: any): any {
    const mealAnalysis = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      foods: [] as any[],
      nutrition: {
        proteinRatio: 0,
        carbRatio: 0,
        fatRatio: 0
      },
      quality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
      suggestions: [] as string[]
    };

    // Calculate totals and analyze each food
    meal.foods.forEach((food: any) => {
      // Use provided values or estimate from food database
      const foodData = this.getFoodNutrition(food.name, food.quantity);

      const calories = food.calories || foodData.calories;
      const protein = food.protein || foodData.protein;
      const carbs = food.carbs || foodData.carbs;
      const fat = food.fat || foodData.fat;
      const fiber = food.fiber || foodData.fiber;

      mealAnalysis.totalCalories += calories;
      mealAnalysis.totalProtein += protein;
      mealAnalysis.totalCarbs += carbs;
      mealAnalysis.totalFat += fat;
      mealAnalysis.totalFiber += fiber;

      mealAnalysis.foods.push({
        ...food,
        nutrition: { calories, protein, carbs, fat, fiber }
      });
    });

    // Calculate macro ratios
    const totalMacros = mealAnalysis.totalProtein * 4 + mealAnalysis.totalCarbs * 4 + mealAnalysis.totalFat * 9;
    if (totalMacros > 0) {
      mealAnalysis.nutrition.proteinRatio = Math.round((mealAnalysis.totalProtein * 4 / totalMacros) * 100);
      mealAnalysis.nutrition.carbRatio = Math.round((mealAnalysis.totalCarbs * 4 / totalMacros) * 100);
      mealAnalysis.nutrition.fatRatio = Math.round((mealAnalysis.totalFat * 9 / totalMacros) * 100);
    }

    // Assess meal quality
    mealAnalysis.quality = this.assessMealQuality(mealAnalysis, meal.type);

    // Generate suggestions
    mealAnalysis.suggestions = this.generateMealSuggestions(mealAnalysis, meal.type);

    return mealAnalysis;
  }

  private getFoodNutrition(foodName: string, quantity: number): any {
    // Simplified food database - in production, this would use a comprehensive API
    const foodDatabase: Record<string, any> = {
      'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
      'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
      'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
      'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
      'eggs': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 },
      'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11 },
      'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
      'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7 },
      'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 },
      'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 13 }
    };

    const normalizedName = foodName.toLowerCase();
    const baseData = foodDatabase[normalizedName] || { calories: 100, protein: 10, carbs: 15, fat: 5, fiber: 2 };

    // Scale by quantity (assuming 100g base for database values)
    const scaleFactor = quantity / 100;

    return {
      calories: Math.round(baseData.calories * scaleFactor),
      protein: Math.round(baseData.protein * scaleFactor * 10) / 10,
      carbs: Math.round(baseData.carbs * scaleFactor * 10) / 10,
      fat: Math.round(baseData.fat * scaleFactor * 10) / 10,
      fiber: Math.round(baseData.fiber * scaleFactor * 10) / 10
    };
  }

  private assessMealQuality(mealAnalysis: any, mealType: string): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;

    // Macro balance scoring
    const proteinRatio = mealAnalysis.nutrition.proteinRatio;
    const carbRatio = mealAnalysis.nutrition.carbRatio;
    const fatRatio = mealAnalysis.nutrition.fatRatio;

    // Ideal macro ratios depend on meal type
    let idealProtein = 25, idealCarb = 45, idealFat = 30;

    if (mealType === 'post_workout') {
      idealProtein = 30; idealCarb = 50; idealFat = 20;
    } else if (mealType === 'breakfast') {
      idealProtein = 20; idealCarb = 50; idealFat = 30;
    }

    const proteinScore = Math.max(0, 20 - Math.abs(proteinRatio - idealProtein));
    const carbScore = Math.max(0, 20 - Math.abs(carbRatio - idealCarb));
    const fatScore = Math.max(0, 20 - Math.abs(fatRatio - idealFat));

    score += proteinScore + carbScore + fatScore;

    // Fiber scoring
    if (mealAnalysis.totalFiber >= 5) score += 20;
    else if (mealAnalysis.totalFiber >= 3) score += 10;

    // Calorie appropriateness (based on meal type)
    const idealCalories = {
      breakfast: 400,
      lunch: 600,
      dinner: 700,
      snack: 200,
      post_workout: 300
    };

    const calorieScore = Math.max(0, 20 - Math.abs(mealAnalysis.totalCalories - idealCalories[mealType]) / 20);
    score += calorieScore;

    // Food variety scoring
    if (mealAnalysis.foods.length >= 4) score += 20;
    else if (mealAnalysis.foods.length >= 2) score += 10;

    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private generateMealSuggestions(mealAnalysis: any, mealType: string): string[] {
    const suggestions = [];

    // Macro balance suggestions
    const proteinRatio = mealAnalysis.nutrition.proteinRatio;
    if (proteinRatio < 20) {
      suggestions.push('Add more protein-rich foods like lean meat, eggs, or legumes');
    } else if (proteinRatio > 35) {
      suggestions.push('Consider reducing protein slightly and adding more complex carbs');
    }

    // Fiber suggestions
    if (mealAnalysis.totalFiber < 3) {
      suggestions.push('Add more fiber-rich vegetables, fruits, or whole grains');
    }

    // Hydration reminder
    suggestions.push('Remember to drink water with your meal');

    // Meal type specific suggestions
    if (mealType === 'post_workout') {
      if (mealAnalysis.totalProtein < 20) {
        suggestions.push('Include at least 20g of protein for muscle recovery');
      }
      if (mealAnalysis.totalCarbs < 30) {
        suggestions.push('Add complex carbs to replenish glycogen stores');
      }
    }

    return suggestions;
  }

  private async saveMealToBackend(meal: any, context: SkillContext): Promise<void> {
    try {
      await this.callBackend('/api/v1/nutrition/meal', {
        userId: context.userId,
        meal,
        timestamp: new Date().toISOString()
      }, context);
    } catch (error) {
      console.warn('Could not save meal to backend:', error);
    }
  }

  private analyzeDailyNutrition(nutritionHistory: any[], goals: any, userProfile: any): any {
    const dailyTotals = nutritionHistory.reduce((acc, entry) => {
      acc.calories += entry.totalCalories || 0;
      acc.protein += entry.totalProtein || 0;
      acc.carbs += entry.totalCarbs || 0;
      acc.fat += entry.totalFat || 0;
      acc.fiber += entry.totalFiber || 0;
      acc.meals += 1;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: 0 });

    // Calculate goals
    const calculatedGoals = this.calculateNutritionGoals(userProfile);
    const targetGoals = { ...calculatedGoals, ...goals };

    // Calculate progress
    const progress = {
      calories: Math.round((dailyTotals.calories / targetGoals.calories) * 100),
      protein: Math.round((dailyTotals.protein / targetGoals.protein) * 100),
      carbs: Math.round((dailyTotals.carbs / targetGoals.carbs) * 100),
      fat: Math.round((dailyTotals.fat / targetGoals.fat) * 100),
      fiber: Math.round((dailyTotals.fiber / targetGoals.fiber) * 100)
    };

    // Calculate macro ratios
    const totalMacroCalories = dailyTotals.protein * 4 + dailyTotals.carbs * 4 + dailyTotals.fat * 9;
    const ratios = totalMacroCalories > 0 ? {
      protein: Math.round((dailyTotals.protein * 4 / totalMacroCalories) * 100),
      carbs: Math.round((dailyTotals.carbs * 4 / totalMacroCalories) * 100),
      fat: Math.round((dailyTotals.fat * 9 / totalMacroCalories) * 100)
    } : { protein: 0, carbs: 0, fat: 0 };

    return {
      totals: dailyTotals,
      goals: targetGoals,
      progress,
      ratios,
      status: this.assessDailyNutritionStatus(progress),
      mealFrequency: dailyTotals.meals
    };
  }

  private calculateNutritionGoals(userProfile: any): any {
    // Basic calculation - in production, this would be more sophisticated
    const weight = userProfile.weight || 70;
    const activityLevel = userProfile.activityLevel || 'moderate';

    let calorieMultiplier = 30; // Base: 30 calories per kg

    if (activityLevel === 'sedentary') calorieMultiplier = 25;
    else if (activityLevel === 'light') calorieMultiplier = 28;
    else if (activityLevel === 'very_active') calorieMultiplier = 35;

    const calories = Math.round(weight * calorieMultiplier);

    return {
      calories,
      protein: Math.round(weight * 1.2), // 1.2g per kg
      carbs: Math.round(calories * 0.45 / 4), // 45% of calories
      fat: Math.round(calories * 0.25 / 9), // 25% of calories
      fiber: 25, // 25g daily recommendation
      water: weight * 0.033 // 33ml per kg
    };
  }

  private assessDailyNutritionStatus(progress: any): string {
    const avgProgress = (progress.calories + progress.protein + progress.carbs + progress.fat) / 4;

    if (avgProgress >= 90 && avgProgress <= 110) return 'excellent';
    if (avgProgress >= 75 && avgProgress <= 125) return 'good';
    if (avgProgress >= 50 && avgProgress <= 150) return 'fair';
    return 'poor';
  }

  private generateNutritionInsights(dailyAnalysis: any, nutritionHistory: any[], preferences: any, context: SkillContext): string[] {
    const insights = [];

    // Calorie insights
    if (dailyAnalysis.progress.calories > 120) {
      insights.push('Your calorie intake is significantly above target - watch portion sizes');
    } else if (dailyAnalysis.progress.calories < 80) {
      insights.push('Your calorie intake is below target - ensure adequate nutrition for energy');
    }

    // Protein insights
    if (dailyAnalysis.progress.protein < 80) {
      insights.push('Low protein intake may affect muscle recovery and maintenance');
    } else if (dailyAnalysis.progress.protein > 120) {
      insights.push('High protein intake - ensure adequate hydration and fiber');
    }

    // Macro balance insights
    const { protein, carbs, fat } = dailyAnalysis.ratios;
    if (protein < 20) {
      insights.push('Low protein ratio - include more protein-rich foods');
    } else if (carbs < 35) {
      insights.push('Low carbohydrate ratio - ensure adequate energy for activity');
    } else if (fat < 15) {
      insights.push('Low fat ratio - include healthy fats for hormone function');
    }

    // Meal frequency insights
    if (dailyAnalysis.mealFrequency < 3) {
      insights.push('Consider eating more frequent, smaller meals for steady energy');
    } else if (dailyAnalysis.mealFrequency > 6) {
      insights.push('High meal frequency - ensure total calories align with goals');
    }

    // Trend insights
    if (nutritionHistory.length > 1) {
      const recent = nutritionHistory.slice(-3);
      const older = nutritionHistory.slice(-6, -3);

      if (recent.length > 1 && older.length > 1) {
        const recentAvg = recent.reduce((sum, entry) => sum + (entry.totalCalories || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, entry) => sum + (entry.totalCalories || 0), 0) / older.length;

        if (recentAvg > olderAvg * 1.1) {
          insights.push('Calorie intake has been increasing recently');
        } else if (recentAvg < olderAvg * 0.9) {
          insights.push('Calorie intake has been decreasing recently');
        }
      }
    }

    return insights;
  }

  private generateNutritionRecommendations(dailyAnalysis: any, goals: any, preferences: any, context: SkillContext): string[] {
    const recommendations = [];

    // Calorie recommendations
    if (dailyAnalysis.progress.calories < 80) {
      recommendations.push('Increase portion sizes or add nutrient-dense foods');
      recommendations.push('Include healthy snacks between meals');
    } else if (dailyAnalysis.progress.calories > 120) {
      recommendations.push('Reduce portion sizes slightly');
      recommendations.push('Choose lower-calorie, nutrient-dense foods');
    }

    // Protein recommendations
    if (dailyAnalysis.progress.protein < 80) {
      recommendations.push('Add protein to each meal (eggs, Greek yogurt, lean meat, legumes)');
    }

    // Fiber recommendations
    if (dailyAnalysis.progress.fiber < 80) {
      recommendations.push('Include more vegetables, fruits, and whole grains');
      recommendations.push('Add beans, lentils, or nuts for extra fiber');
    }

    // Hydration recommendations
    recommendations.push('Drink water consistently throughout the day');
    recommendations.push('Aim for 2-3 liters of water daily');

    // Meal timing recommendations
    if (dailyAnalysis.mealFrequency < 4) {
      recommendations.push('Consider 4-6 smaller meals for better energy management');
    }

    // Diet-specific recommendations
    if (preferences?.diet) {
      switch (preferences.diet) {
        case 'vegetarian':
          recommendations.push('Ensure complete protein sources (quinoa, beans, rice)');
          break;
        case 'vegan':
          recommendations.push('Include B12-fortified foods and consider supplementation');
          recommendations.push('Combine different plant proteins for complete amino acids');
          break;
        case 'keto':
          recommendations.push('Monitor electrolytes and stay well hydrated');
          break;
      }
    }

    return recommendations;
  }

  private generateMealSuggestions(dailyAnalysis: any, preferences: any, context: SkillContext): any[] {
    const suggestions = [];

    // Next meal suggestions based on what's missing
    if (dailyAnalysis.progress.protein < 80) {
      suggestions.push({
        type: 'high_protein',
        name: 'Grilled Chicken Salad',
        description: 'Mixed greens with grilled chicken breast, vegetables, and light dressing',
        calories: 350,
        protein: 35,
        carbs: 15,
        fat: 12
      });
    }

    if (dailyAnalysis.progress.carbs < 80) {
      suggestions.push({
        type: 'complex_carbs',
        name: 'Quinoa Bowl',
        description: 'Quinoa with roasted vegetables and tahini dressing',
        calories: 420,
        protein: 12,
        carbs: 65,
        fat: 15
      });
    }

    if (dailyAnalysis.progress.fat < 80) {
      suggestions.push({
        type: 'healthy_fats',
        name: 'Avocado Toast',
        description: 'Whole grain toast with avocado, hemp seeds, and cherry tomatoes',
        calories: 380,
        protein: 8,
        carbs: 35,
        fat: 22
      });
    }

    // General balanced meal
    suggestions.push({
      type: 'balanced',
      name: 'Mediterranean Bowl',
      description: 'Mixed greens, grilled salmon, quinoa, olive oil, and herbs',
      calories: 480,
      protein: 32,
      carbs: 40,
      fat: 20
    });

    return suggestions.slice(0, 3);
  }

  private calculateNutritionScore(dailyAnalysis: any): number {
    let score = 0;

    // Calorie progress (25% of score)
    const calorieScore = Math.max(0, 100 - Math.abs(dailyAnalysis.progress.calories - 100));
    score += calorieScore * 0.25;

    // Macro balance (25% of score)
    const { protein, carbs, fat } = dailyAnalysis.ratios;
    const macroBalance = 100 - Math.abs(protein - 25) - Math.abs(carbs - 45) - Math.abs(fat - 30);
    score += Math.max(0, macroBalance) * 0.25;

    // Fiber intake (20% of score)
    const fiberScore = Math.min(100, dailyAnalysis.progress.fiber);
    score += fiberScore * 0.20;

    // Meal frequency (15% of score)
    const mealScore = dailyAnalysis.mealFrequency >= 4 ? 100 : (dailyAnalysis.mealFrequency / 4) * 100;
    score += mealScore * 0.15;

    // Protein intake (15% of score)
    const proteinScore = Math.min(100, dailyAnalysis.progress.protein);
    score += proteinScore * 0.15;

    return Math.round(score);
  }

  private analyzeNutritionTrends(nutritionHistory: any[]): any {
    if (nutritionHistory.length < 2) return { insufficient: true };

    const trends = {
      calories: 'stable' as 'increasing' | 'decreasing' | 'stable',
      protein: 'stable' as 'increasing' | 'decreasing' | 'stable',
      consistency: 'good' as 'good' | 'improving' | 'declining'
    };

    // Calculate recent trends
    const recent = nutritionHistory.slice(-7);
    if (recent.length > 1) {
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));

      const firstAvg = firstHalf.reduce((sum, entry) => sum + (entry.totalCalories || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, entry) => sum + (entry.totalCalories || 0), 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.1) trends.calories = 'increasing';
      else if (secondAvg < firstAvg * 0.9) trends.calories = 'decreasing';

      // Similar analysis for protein
      const firstProtein = firstHalf.reduce((sum, entry) => sum + (entry.totalProtein || 0), 0) / firstHalf.length;
      const secondProtein = secondHalf.reduce((sum, entry) => sum + (entry.totalProtein || 0), 0) / secondHalf.length;

      if (secondProtein > firstProtein * 1.1) trends.protein = 'increasing';
      else if (secondProtein < firstProtein * 0.9) trends.protein = 'decreasing';
    }

    return trends;
  }

  private analyzeHydration(dailyAnalysis: any, goals: any): any {
    const waterProgress = goals?.water ?
      Math.round((dailyAnalysis.totals.water || 0 / goals.water) * 100) :
      null;

    let status = 'unknown';
    if (waterProgress !== null) {
      if (waterProgress >= 100) status = 'excellent';
      else if (waterProgress >= 80) status = 'good';
      else if (waterProgress >= 60) status = 'fair';
      else status = 'poor';
    }

    return {
      intake: dailyAnalysis.totals.water || 0,
      goal: goals?.water || 2.5,
      progress: waterProgress,
      status
    };
  }

  private createNutritionVisualizations(dailyAnalysis: any, nutritionHistory: any[]): any[] {
    const visualizations = [];

    // Macro distribution chart
    visualizations.push({
      type: 'pie' as const,
      title: 'Daily Macro Distribution',
      data: {
        labels: ['Protein', 'Carbohydrates', 'Fat'],
        datasets: [{
          data: [dailyAnalysis.ratios.protein, dailyAnalysis.ratios.carbs, dailyAnalysis.ratios.fat],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }]
      }
    });

    // Progress towards goals
    visualizations.push({
      type: 'bar' as const,
      title: 'Nutrition Goals Progress',
      data: {
        labels: ['Calories', 'Protein', 'Carbs', 'Fat', 'Fiber'],
        datasets: [{
          label: 'Progress %',
          data: [
            dailyAnalysis.progress.calories,
            dailyAnalysis.progress.protein,
            dailyAnalysis.progress.carbs,
            dailyAnalysis.progress.fat,
            dailyAnalysis.progress.fiber
          ],
          backgroundColor: dailyAnalysis.progress.calories >= 80 && dailyAnalysis.progress.calories <= 120 ? '#4CAF50' : '#FF9800'
        }]
      }
    });

    // Trend chart if historical data available
    if (nutritionHistory.length > 1) {
      visualizations.push({
        type: 'line' as const,
        title: 'Calorie Intake Trend',
        data: {
          labels: nutritionHistory.map((_, i) => `Day ${i + 1}`),
          datasets: [{
            label: 'Calories',
            data: nutritionHistory.map(d => d.totalCalories || 0),
            borderColor: 'rgb(75, 192, 192)'
          }]
        }
      });
    }

    return visualizations;
  }
}