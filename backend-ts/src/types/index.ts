// Authenticated user (from JWT token)
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

// User related types
export interface CreateUserRequest {
  email: string;
  username?: string;
  password: string;
  fullName?: string;
  fullNameHe?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage?: 'he' | 'en';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  expiresIn: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  fullNameHe: string | null;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  fitnessLevel: string;
  preferredLanguage: string;
  isActive: boolean;
  isVerified: boolean;
  role: string;
  createdAt: string;
  lastLogin: string | null;
}

// Exercise related types
export interface CreateExerciseRequest {
  nameEn: string;
  nameHe?: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'sports' | 'other';
  category?: string;
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationMinutes?: number;
  distanceKm?: number;
  calories?: number;
  intensity?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface ExerciseResponse {
  id: string;
  userId: string;
  workoutId: string;
  nameEn: string;
  nameHe: string | null;
  type: string;
  category: string | null;
  sets: number | null;
  reps: number | null;
  weightKg: number | null;
  durationMinutes: number | null;
  distanceKm: number | null;
  calories: number | null;
  intensity: string | null;
  notes: string | null;
  points: number;
  timestamp: string;
  isPersonalRecord: boolean;
}

// Workout related types
export interface WorkoutResponse {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  totalPoints: number;
  totalExercises: number;
  duration: number;
  exercises: ExerciseResponse[];
}

// Statistics related types
export interface StatisticsResponse {
  period: string;
  totalPoints: number;
  totalExercises: number;
  totalWorkouts: number;
  recentExercises: ExerciseResponse[];
  personalRecords: PersonalRecordResponse[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface AchievementResponse {
  id: string;
  achievementType: string;
  achievementName: string;
  achievementNameHe: string;
  description: string;
  tier: string;
  pointsAwarded: number;
  earnedAt: string;
}

export interface PersonalRecordResponse {
  id: string;
  userId: string;
  exerciseType: string;
  recordType: string;
  value: number;
  achievedAt: string;
  exercise: ExerciseResponse | null;
}

// Goal related types
export interface GoalInput {
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  category: 'consistency' | 'performance' | 'strength' | 'endurance' | 'weight_loss';
  targetType: 'sessions' | 'reps' | 'distance' | 'weight' | 'duration' | 'calories';
  targetValue: number;
  timePeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  pointsReward?: number;
}

export interface GoalResponse {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  category: string;
  targetType: string;
  targetValue: number;
  timePeriod: string;
  pointsReward: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Points related types
export interface PointsBreakdown {
  exerciseType: string;
  basePoints: number;
  multiplierBonus: number;
  intensityBonus: number;
  durationBonus: number;
  volumeBonus: number;
  weightBonus: number;
  totalPoints: number;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// Pagination
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}