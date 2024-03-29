import prisma from '@/lib/db';
import { config } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export default async function handle(req, res) {
  try {
    const session = await getServerSession(req, res, config);
    const referer = req.headers.referer;
    if (!referer || !referer.startsWith('https://www.ghl.gg')) {
      return res.status(403).json({ error: 'Access Denied' });
    }
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      query: { id },
    } = req;

    const user = await prisma.user.findMany({
      where: {
        id,
      },
    });

    res.json(user[0]);
  } catch (error) {
    console.log(error);
  }
}