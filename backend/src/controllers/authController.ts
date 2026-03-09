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
        schoolEmail: (user as any).schoolEmail || user.email,
        role: user.role,
        fullName: user.fullName,
        staffId: (user as any).staffId,
        position: (user as any).position,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      email,
      password,
      fullName,
      role,
      gradeLevel,
      section,
      schoolEmail,
      staffId,
      position,
      profilePhoto,
      permissions,
      specialization,
      rank,
      clusterRole,
      assignedGradeLevelIds,
      assignedSectionIds,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    let user;
    if (role === 'student') {
      const studentId = req.body.studentId || req.body.lrn;
      if (!gradeLevel || !section || !studentId) {
        return res.status(400).json({ error: 'gradeLevel, section, and studentId are required for student' });
      }

      user = new Student({
        email,
        password: hashedPassword,
        fullName,
        role: 'student',
        gradeLevel,
        section,
        schoolEmail: schoolEmail || email,
        studentId,
      });
    } else {
      user = new User({
        email,
        password: hashedPassword,
        fullName,
        role,
        schoolEmail: schoolEmail || email,
        staffId,
        position,
        profilePhoto,
        permissions,
        specialization,
        rank,
        clusterRole,
        assignedGradeLevelIds,
        assignedSectionIds,
      });
    }

    await user.save();

    const token = generateToken(user._id.toString(), user.role);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        schoolEmail: (user as any).schoolEmail || user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: (user as any).studentId,
        staffId: (user as any).staffId,
        position: (user as any).position,
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

export const getStaffUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffUsers = await User.find({
      role: { $in: ['admin', 'teacher'] },
      isActive: true,
    }).select('-password');

    return res.json(staffUsers);
  } catch (error) {
    logger.error('Get staff users error:', error);
    next(error);
  }
};

export const updateStaffUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete (updates as any).password;

    const user = await User.findOneAndUpdate(
      { _id: id, role: { $in: ['admin', 'teacher'] } },
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Staff user not found' });
    }

    return res.json(user);
  } catch (error) {
    logger.error('Update staff user error:', error);
    next(error);
  }
};

export const changeStaffPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
    }

    const hashed = await hashPassword(newPassword);
    const user = await User.findOneAndUpdate(
      { _id: id, role: { $in: ['admin', 'teacher'] } },
      { password: hashed },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Staff user not found' });
    }

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change staff password error:', error);
    next(error);
  }
};

export const deleteStaffUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, role: { $in: ['admin', 'teacher'] } },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Staff user not found' });
    }

    return res.json({ message: 'Staff user deleted successfully' });
  } catch (error) {
    logger.error('Delete staff user error:', error);
    next(error);
  }
};
