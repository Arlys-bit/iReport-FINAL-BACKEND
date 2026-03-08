import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    {
      userId,
      role,
    },
    process.env.JWT_SECRET || 'your_secret',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
