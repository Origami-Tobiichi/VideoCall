import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminAuth } from '../../../firebase/admin';
import { getDatabase, ref, get } from 'firebase/database';
import { realtimeDb } from '../../../firebase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error('Auth verification failed:', authError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const uid = decodedToken.uid;

    // Check if user is admin in Prisma
    let adminUser;
    try {
      adminUser = await prisma.admin.findUnique({
        where: { id: uid },
      });
    } catch (dbError) {
      console.error('Prisma admin check failed:', dbError);
      return res.status(500).json({ error: 'Database error while checking admin' });
    }

    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden - Not an admin' });
    }

    // Fetch all users from Prisma
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
    } catch (dbError) {
      console.error('Prisma fetch users failed:', dbError);
      return res.status(500).json({ error: 'Database error while fetching users' });
    }

    // Get online status from Realtime Database
    let onlineData = {};
    try {
      const onlineRef = ref(realtimeDb, 'online');
      const snapshot = await get(onlineRef);
      onlineData = snapshot.val() || {};
    } catch (rtdbError) {
      console.warn('Realtime DB fetch failed:', rtdbError);
      // Continue without online status
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
