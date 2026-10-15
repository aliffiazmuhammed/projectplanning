import jwt from 'jsonwebtoken';
import { User, type UserDocument } from '../models/User.js';
import type { 
  IUser, 
  IAuthResponse, 
  SignUpRequest, 
  SignInRequest 
} from '@project-planner/types';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'project-planner-jwt-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  /**
   * Generates a signed JWT token for a user
   */
  static generateToken(user: UserDocument): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verifies and decodes a JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired authentication token');
    }
  }

  /**
   * Registers a new user account with hashed password and returns session token
   */
  static async register(input: SignUpRequest): Promise<IAuthResponse> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new AppError(409, 'An account with this email already exists');
    }

    const user = await User.create({
      email: normalizedEmail,
      password: input.password,
      name: input.name.trim(),
    });

    const token = this.generateToken(user);

    logger.info({ userId: user._id.toString(), email: user.email }, 'User registered successfully');

    return {
      user: user.toJSON() as unknown as IUser,
      token,
    };
  }

  /**
   * Authenticates user credentials and returns session token
   */
  static async login(input: SignInRequest): Promise<IAuthResponse> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = this.generateToken(user);

    logger.info({ userId: user._id.toString(), email: user.email }, 'User logged in successfully');

    return {
      user: user.toJSON() as unknown as IUser,
      token,
    };
  }

  /**
   * Retrieves user profile by ID
   */
  static async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user.toJSON() as unknown as IUser;
  }
}
