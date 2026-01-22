import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { registerValidation, loginValidation } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Register
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with $40 credit
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        credits: 40.00
      },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        role: true,
        createdAt: true
      }
    });

    // Create initial credit transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'welcome_credit',
        amount: 40.00,
        description: 'Welcome bonus credits'
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash }
    });

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: 'Registration successful',
      user,
      accessToken
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash }
    });

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        role: user.role,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Verify stored refresh token
    const isValidToken = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isValidToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user.id);

    // Rotate refresh token
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshTokenHash }
    });

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({ accessToken: tokens.accessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    next(error);
  }
});

// Logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null }
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Update user profile
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, address, city, state, zipCode, country } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim().slice(0, 100);
    if (address) updateData.address = address.trim().slice(0, 200);
    if (city) updateData.city = city.trim().slice(0, 100);
    if (state) updateData.state = state.trim().slice(0, 100);
    if (zipCode) updateData.zipCode = zipCode.trim().slice(0, 20);
    if (country) updateData.country = country.trim().slice(0, 100);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        role: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
