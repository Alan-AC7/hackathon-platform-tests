import prisma from '@/lib/db';
import { config } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export default async function handle(req, res) {
  const session = await getServerSession(req, res, config);
  const referer = req.headers.referer;
  if (!referer || !referer.startsWith('https://www.ghl.gg')) {
    return res.status(403).json({ error: 'Access Denied' });
  }

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // hackathonId
  const {
    query: { id },
  } = req;

  const user = await prisma.user.findUnique({
    select: {
      id: id,
    },
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const teams = await prisma.team.findMany({
    where: {
      creatorId: user.id,
    },
  });

  for (const team of teams) {
    const registration = await prisma.hackathonRegistration.findMany({
      where: {
        hackathonId: id,
        teamId: team.id,
      },
    });

    //getting the current date
    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toISOString().split('T')[0];

    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: id,
      },
    });

    if (registration.length > 0 && formattedCurrentDate <= hackathon.endDate) {
      const {
        projectName,
        projectDescription,
        loomLink,
        pitchLink,
        projectResourceLink,
        comments,
      } = req.body;

      // Input Validation
      if (!projectName || !projectDescription) {
        return res
          .status(400)
          .json({ error: 'Project name and description are required' });
      }

      try {
        const result = await prisma.project.create({
          data: {
            name: projectName,
            description: projectDescription,
            loomLink: loomLink || null,
            pitchLink: pitchLink || null,
            projectResourceLink: projectResourceLink || null,
            comments: comments || null,

            hackathonId: id,
            teamId: team.id,
          },
        });

        return res.json(result);
      } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  return res.status(404).json({ error: 'Registration not found' });
}
