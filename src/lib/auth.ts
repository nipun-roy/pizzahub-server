import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthUserPayload } from '../models/types';

export function signUserToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyUserToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthUserPayload;
  } catch (err) {
    return null;
  }
}
