import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, '../../the-alternative-prototype-firebase-adminsdk-fbsvc-cb7e61a5e1.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export interface AuthRequest extends Request {
  uid?: string;
  email?: string;
}

export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  console.log('Auth header received:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
  
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.log('No token provided in request');
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    console.log('Verifying token...');
    const decoded = await admin.auth().verifyIdToken(token);
    console.log('Token verified successfully for uid:', decoded.uid);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
}