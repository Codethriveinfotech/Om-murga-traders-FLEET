import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const names = (name || '').split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    const newId = require('crypto').randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "phoneNumber", "isActive", "createdAt", "updatedAt", name, phone, password_hash, created_at, updated_at, license_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW(), $8, $9, $10, NOW(), NOW(), $11)`,
      newId, email || null, passwordHash, firstName, lastName, (role || 'DRIVER').toUpperCase(), phone || null,
      name || '', phone || '', passwordHash, req.body.licenseNumber || null
    );
    return res.status(201).json({ success: true, message: 'User registered successfully', data: { id: newId } });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identity, password } = req.body;

    if (!identity || !password) {
      return res.status(400).json({ success: false, message: 'Identity and password are required' });
    }

    console.log(`[LOGIN ATTEMPT] Identity: ${identity}`);
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: identity },
          { firstName: { equals: identity, mode: 'insensitive' } },
          { phoneNumber: identity }
        ]
      }
    });
    console.log(`[LOGIN RESULT] User found: ${user ? user.email : 'NONE'}`);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_key_here',
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your_super_secret_key_here',
      { expiresIn: '7d' }
    );

    const userDto = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      phone: user.phoneNumber
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userDto,
        accessToken,
        refreshToken
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
  }
};
