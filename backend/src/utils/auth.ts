import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateToken = (userId: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  };
  return jwt.sign(
    {
      userId,
      role,
    },
    (process.env.JWT_SECRET || 'your_secret') as string,
    options
  );
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
