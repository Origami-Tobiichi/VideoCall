import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminAuth } from '../../../firebase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, action, reason } = req.body;

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const admin = await prisma.admin.findUnique({ where: { id: uid } });
    if (!admin) return res.status(403).json({ error: 'Forbidden' });

    // Update user banned status
    await prisma.user.update({
      where: { id: userId },
      data: { banned: action === 'ban' },
    });

    // Log aksi
    await prisma.log.create({
      data: {
        userId: uid,
        action: action === 'ban' ? 'BAN_USER' : 'UNBAN_USER',
        details: `User ${userId} ${action}ned. Reason: ${reason || 'No reason provided'}`,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
