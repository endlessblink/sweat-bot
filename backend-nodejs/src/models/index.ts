export interface User {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  fitnessGoals?: string[];
  preferredLanguage?: string;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  age?: number;
  weight?: number;
  height?: number;
  fitnessGoals?: string[];
  preferredLanguage?: 'en' | 'he';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface LoginRequest {
  email: string;
  password: string;
}