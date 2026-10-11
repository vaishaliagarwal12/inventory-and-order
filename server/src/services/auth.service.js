import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepo from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Service Layer for Authentication.
 * Handles input validation, email normalization, password hashing, JWT generation, and user login/registration workflows.
 */
export const registerUser = async ({ name, email, password }) => {
  // 1. Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Full name is required and cannot be empty', 400);
  }

  // 2. Validate email
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new AppError('A valid email address is required', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 3. Validate password (minimum 8 characters)
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AppError('Password is required and must be at least 8 characters long', 400);
  }

  // 4. Check whether email already exists
  const existingUser = await userRepo.findByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  // 5. Hash password with bcrypt (10 rounds)
  const passwordHash = await bcrypt.hash(password, 10);

  // 6. Create user with default role 'CUSTOMER' (Server determines role)
  const newDbUser = await userRepo.create({
    name: name.trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    role: 'CUSTOMER',
  });

  // Return safe user representation (without password_hash)
  return {
    id: newDbUser.id,
    name: newDbUser.name,
    email: newDbUser.email,
    role: newDbUser.role,
    created_at: newDbUser.created_at,
    updated_at: newDbUser.updated_at,
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Invalid email or password', 401);
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // 1. Find user by normalized email
  const user = await userRepo.findByEmail(normalizedEmail);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // 2. Compare password with stored bcrypt password_hash
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // 3. Generate JWT containing userId and role
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return {
    message: 'Login successful',
    token,
    user: safeUser,
  };
};

export const getCurrentUser = async (userId) => {
  const numericId = parseInt(userId, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid user ID', 400);
  }

  const user = await userRepo.findById(numericId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

export const getAllUsers = async () => {
  const users = await userRepo.findAll();
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    order_count: u.order_count,
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));
};

