import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminAuth } from '../../../firebase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, action } = req.body;
  if (!userId || !action || !['ban', 'unban'].includes(action)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const adminUser = await prisma.admin.findUnique({ where: { id: uid } });
    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { banned: action === 'ban' },
    });

    await prisma.log.create({
      data: {
        userId: uid,
        action: `${action}_user`,
        details: `User ${userId} (${updatedUser.email}) was ${action}ned by admin ${uid}`,
      },
    });

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Ban API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
