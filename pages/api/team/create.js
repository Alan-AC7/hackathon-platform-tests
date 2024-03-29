import prisma from '@/lib/db';
import { config } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export default async function handle(req, res) {
  try {
    const session = await getServerSession(req, res, config);
    const { teamName, teamDescription, teamAvatarURL, colorAvatar } = req.body;

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findMany({
      select: {
        id: true,
        gamertag: true,
        image: true,
        name: true,
        lightningAddress: true,
        social: true,
        location: true,
        skill: true,
        availability: true,
      },
      where: {
        email: session.user.email,
      },
    });

    const result = await prisma.team.create({
      data: {
        name: teamName,
        description: teamDescription,
        teamAvatar: teamAvatarURL,
        creatorId: user[0].id,
        colorAvatar,
      },
    });
    res.json(result);
  } catch (error) {
    console.log(error);
  }
}
