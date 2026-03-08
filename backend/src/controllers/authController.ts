import { NextFunction, Request, Response } from 'express';
import { User, Student } from '../models';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import logger from '../utils/logger';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString(), user.role);

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, role, gradeLevel, section } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    let user;
    if (role === 'student') {
      user = new Student({
        email,
        password: hashedPassword,
        fullName,
        role: 'student',
        gradeLevel,
        section,
        schoolEmail: email,
      });
    } else {
      user = new User({
        email,
        password: hashedPassword,
        fullName,
        role,
        schoolEmail: email,
      });
    }

    await user.save();

    const token = generateToken(user._id.toString(), user.role);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    logger.error('Register error:', error);
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
};
