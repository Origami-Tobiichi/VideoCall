import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminAuth } from '../../../firebase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }

  try {
    // Verifikasi token Firebase
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Cek apakah user adalah admin di database Prisma
    const admin = await prisma.admin.findUnique({
      where: { id: uid },
    });

    if (!admin) {
      return res.status(403).json({ error: 'Forbidden - Not an admin' });
    }

    // Ambil semua user dari Prisma
    const users = await prisma.user.findMany({
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

    // Ambil online status dari Firebase Realtime DB
    const { realtimeDb } = await import('../../../firebase/client');
    const { ref, get } = await import('firebase/database');
    const snapshot = await get(ref(realtimeDb, 'online'));
    const onlineData = snapshot.val() || {};

    // Tambahkan field isOnline ke setiap user
    const usersWithOnline = users.map((user) => ({
      ...user,
      isOnline: !!onlineData[user.id],
    }));

    return res.status(200).json(usersWithOnline);
  } catch (error: any) {
    console.error('Admin users API error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
