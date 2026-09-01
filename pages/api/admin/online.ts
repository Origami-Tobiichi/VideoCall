import { NextApiRequest, NextApiResponse } from 'next';
import { realtimeDb } from '../../../firebase/client';
import { ref, get } from 'firebase/database';
import { adminAuth } from '../../../firebase/admin';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const admin = await prisma.admin.findUnique({ where: { id: uid } });
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const snapshot = await get(ref(realtimeDb, 'online'));
    const data = snapshot.val();
    const onlineList = data ? Object.values(data) : [];
    return res.status(200).json(onlineList);
  } catch (error: any) {
    console.error('Online API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
