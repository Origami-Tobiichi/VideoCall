import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'Missing uid' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: uid as string },
      select: { banned: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ banned: user.banned });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
