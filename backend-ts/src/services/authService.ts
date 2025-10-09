import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { serverConfig } from '../config/server';
import { CreateUserRequest, LoginRequest, AuthResponse, UserResponse } from '../types';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: userData.email },
        ...(userData.username ? [{ username: userData.username }] : [])
      ]
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create new user
    const newUser = new User();
    newUser.email = userData.email;
    newUser.username = userData.username || null;
    newUser.hashedPassword = hashedPassword;
    newUser.fullName = userData.fullName || null;
    newUser.fullNameHe = userData.fullNameHe || null;
    newUser.age = userData.age || null;
    newUser.weightKg = userData.weightKg || null;
    newUser.heightCm = userData.heightCm || null;
    newUser.fitnessLevel = userData.fitnessLevel || 'beginner';
    newUser.preferredLanguage = userData.preferredLanguage || 'he';
    newUser.isActive = true;
    newUser.isVerified = false;
    newUser.isGuest = false;
    newUser.role = 'user';
    newUser.totalPoints = 0;

    const savedUser = await this.userRepository.save(newUser);

    // Generate JWT token
    const token = this.generateToken(savedUser.id);

    return {
      user: this.formatUserResponse(savedUser),
      token,
      expiresIn: serverConfig.jwt.expiresIn
    };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginData.email }
    });

    if (!user || !user.hashedPassword) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: this.formatUserResponse(user),
      token,
      expiresIn: serverConfig.jwt.expiresIn
    };
  }

  async refreshToken(userId: string): Promise<{ token: string; expiresIn: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true }
    });

    if (!user) {
      throw new Error('User not found or inactive');
    }

    const token = this.generateToken(userId);

    return {
      token,
      expiresIn: serverConfig.jwt.expiresIn
    };
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.formatUserResponse(user);
  }

  private generateToken(userId: string): string {
    const payload = { userId };
    const secret = serverConfig.jwt.secret;
    const options = {
      expiresIn: serverConfig.jwt.expiresIn
    } as SignOptions;
    return jwt.sign(payload, secret, options);
  }

  private formatUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      fullNameHe: user.fullNameHe,
      age: user.age,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      fitnessLevel: user.fitnessLevel,
      preferredLanguage: user.preferredLanguage,
      isActive: user.isActive,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || null
    };
  }

  async verifyToken(token: string): Promise<{ userId: string }> {
    try {
      const decoded = jwt.verify(token, serverConfig.jwt.secret) as { userId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}