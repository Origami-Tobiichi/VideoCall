import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminAuth } from '../../../firebase/admin';
import { realtimeDb } from '../../../firebase/client';
import { ref, get } from 'firebase/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validasi environment variables penting
  const missingEnv = [];
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingEnv.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!process.env.FIREBASE_PRIVATE_KEY) missingEnv.push('FIREBASE_PRIVATE_KEY');
  if (!process.env.FIREBASE_CLIENT_EMAIL) missingEnv.push('FIREBASE_CLIENT_EMAIL');
  if (!process.env.DATABASE_URL) missingEnv.push('DATABASE_URL');

  if (missingEnv.length > 0) {
    console.error('Missing environment variables:', missingEnv);
    return res.status(500).json({
      error: 'Server configuration error',
      missing: missingEnv,
    });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    // Verifikasi token Firebase
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError: any) {
      console.error('Auth verification failed:', authError.message);
      return res.status(401).json({ error: 'Invalid token', details: authError.message });
    }

    const uid = decodedToken.uid;

    // Cek admin di Prisma
    let adminUser;
    try {
      adminUser = await prisma.admin.findUnique({
        where: { id: uid },
      });
    } catch (dbError: any) {
      console.error('Prisma admin check failed:', dbError.message);
      return res.status(500).json({ error: 'Database error', details: dbError.message });
    }

    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden - Not an admin' });
    }

    // Ambil semua user
    let users;
    try {
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          gender: true,
          age: true,
          country: true,
          banned: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError: any) {
      console.error('Prisma fetch users failed:', dbError.message);
      return res.status(500).json({ error: 'Database error', details: dbError.message });
    }

    // Ambil online status dari Realtime DB
    let onlineData: Record<string, any> = {};
    try {
      const onlineRef = ref(realtimeDb, 'online');
      const snapshot = await get(onlineRef);
      onlineData = snapshot.val() || {};
    } catch (rtdbError: any) {
      console.warn('Realtime DB fetch failed:', rtdbError.message);
      // Lanjut tanpa online status
    }

    const usersWithOnline = users.map((user) => ({
      ...user,
      isOnline: !!onlineData[user.id],
    }));

    return res.status(200).json(usersWithOnline);
  } catch (error: any) {
    console.error('Admin users API error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Unknown error',
    });
  }
}
