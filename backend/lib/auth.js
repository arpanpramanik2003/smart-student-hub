import jwt from 'jsonwebtoken';
import { initDB } from './database.js';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';
  if (!secret || secret === 'CHANGE_ME_IN_PRODUCTION' || secret === 'your-secret-key') {
    throw new Error('JWT_SECRET is missing or using an insecure default. Set a strong JWT_SECRET in environment variables.');
  }
  return secret;
}

export async function authenticate(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const { User } = await initDB();

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user || !user.isActive) {
      return { error: 'User not found or inactive', status: 403 };
    }

    return { user };
  } catch (error) {
    if (error.message && error.message.includes('JWT_SECRET')) {
      throw error;
    }
    return { error: 'Invalid or expired token', status: 403 };
  }
}

export async function authenticateAndAuthorize(request, allowedRoles) {
  const result = await authenticate(request);
  if (result.error) return result;

  if (!allowedRoles.includes(result.user.role)) {
    return {
      error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      status: 403,
    };
  }

  return result;
}

export function generateToken(userId, role) {
  return jwt.sign({ userId, role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}