import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, email, name } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'Missing uid or email' });
  }

  try {
    // Upsert user ke PostgreSQL
    const user = await prisma.user.upsert({
      where: { id: uid },
      update: { email, name: name || null },
      create: { id: uid, email, name: name || null },
    });

    // Jika email adalah admin, buat admin record jika belum
    if (email === 'itsukakotori790@gmail.com') {
      await prisma.admin.upsert({
        where: { id: uid },
        update: { email },
        create: { id: uid, email },
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error('Sync user error:', error);
    return res.status(500).json({ error: error.message });
  }
}
