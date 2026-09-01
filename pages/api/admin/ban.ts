import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminAuth } from '../../../firebase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, action } = req.body;

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const admin = await prisma.admin.findUnique({ where: { id: decodedToken.uid } });
    if (!admin) return res.status(403).json({ error: 'Forbidden' });

    await prisma.user.update({
      where: { id: userId },
      data: { banned: action === 'ban' },
    });

    await prisma.log.create({
      data: {
        userId: decodedToken.uid,
        action: `${action}_user`,
        details: `User ${userId} was ${action}ned`,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
