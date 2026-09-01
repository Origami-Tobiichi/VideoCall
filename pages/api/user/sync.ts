import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { uid, email, name } = req.body;

  try {
    const user = await prisma.user.upsert({
      where: { id: uid },
      update: { email, name },
      create: { id: uid, email, name },
    });

    // Jika email adalah admin, buat admin record
    if (email === 'itsukakotori790@gmail.com') {
      await prisma.admin.upsert({
        where: { id: uid },
        update: { email },
        create: { id: uid, email },
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
