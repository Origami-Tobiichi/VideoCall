import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminAuth } from '../../../firebase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const admin = await prisma.admin.findUnique({ where: { id: decodedToken.uid } });
    if (!admin) return res.status(403).json({ error: 'Forbidden' });

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
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
