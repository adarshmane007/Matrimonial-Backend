import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}
