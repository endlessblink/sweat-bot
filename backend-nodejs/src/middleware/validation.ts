import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { CustomError } from './errorHandler';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return next(new CustomError(errorMessage, 400));
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return next(new CustomError(errorMessage, 400));
    }

    req.query = value;
    next();
  };
};

// Validation schemas
export const schemas = {
  // Authentication
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Additional auth schemas
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  // Chat
  message: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    provider: Joi.string().valid('openai', 'groq', 'anthropic', 'gemini').default('openai'),
    context: Joi.string().optional(),
  }),

  // Exercise logging
  exerciseLog: Joi.object({
    exerciseName: Joi.string().min(1).max(100).required(),
    sets: Joi.number().integer().min(1).max(10).required(),
    reps: Joi.number().integer().min(1).max(100).required(),
    weight: Joi.number().min(0).max(1000).optional(),
    notes: Joi.string().max(500).optional(),
    workoutType: Joi.string().valid('strength', 'cardio', 'flexibility', 'sports').default('strength'),
  }),

  // Profile updates
  profileUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    age: Joi.number().integer().min(13).max(120).optional(),
    weight: Joi.number().min(20).max(500).optional(),
    height: Joi.number().min(50).max(300).optional(),
    fitnessGoals: Joi.array().items(Joi.string().max(100)).optional(),
    preferredLanguage: Joi.string().valid('en', 'he').default('en'),
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  }),

  // Additional schemas for exercises
  logWorkout: Joi.object({
    exercises: Joi.array().items(Joi.object({
      exerciseName: Joi.string().required(),
      sets: Joi.number().integer().min(1).required(),
      reps: Joi.number().integer().min(1).required(),
      weight: Joi.number().min(0).optional(),
      workoutType: Joi.string().valid('strength', 'cardio', 'flexibility').required(),
    })).min(1).required(),
    workoutNotes: Joi.string().max(1000).optional(),
    workoutType: Joi.string().valid('strength', 'cardio', 'mixed').required(),
  }),

  // Chat schemas
  chatMessage: Joi.object({
    message: Joi.string().min(1).max(4000).required(),
    provider: Joi.string().valid('openai', 'groq', 'anthropic', 'gemini').default('openai'),
    conversationId: Joi.string().optional(),
  }),

  messageId: Joi.string().required(),

  // Exercise batch schema
  exercises: Joi.array().items(Joi.object({
    exerciseName: Joi.string().required(),
    sets: Joi.number().integer().min(1).required(),
    reps: Joi.number().integer().min(1).required(),
    weight: Joi.number().min(0).optional(),
    workoutType: Joi.string().valid('strength', 'cardio', 'flexibility').required(),
  })).min(1).required(),
};

export default {
  validateBody,
  validateQuery,
  schemas
};