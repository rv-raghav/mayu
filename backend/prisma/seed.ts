/**
 * Database seed script.
 * Creates sample users, polls, questions, and options for development.
 */

import { prisma } from '../src/config/database';
import bcrypt from 'bcrypt';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('DemoPassword1!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@mayu.app' },
    update: {},
    create: {
      email: 'demo@mayu.app',
      displayName: 'Demo User',
      emailVerified: true,
      passwordHash,
    },
  });

  await prisma.poll.upsert({
    where: { slug: 'team-lunch-preferences-demo' },
    update: {},
    create: {
      slug: 'team-lunch-preferences-demo',
      creatorId: user.id,
      title: 'Team Lunch Preferences',
      description: 'Help us pick the best lunch spot for the team!',
      status: 'ACTIVE',
      isAnonymous: true,
      requiresAuth: false,
      questions: {
        create: [
          {
            text: 'What cuisine do you prefer?',
            order: 1,
            isMandatory: true,
            options: {
              create: [
                { text: 'Japanese', order: 1 },
                { text: 'Italian', order: 2 },
                { text: 'Mexican', order: 3 },
                { text: 'Indian', order: 4 },
              ],
            },
          },
          {
            text: 'What time works best?',
            order: 2,
            isMandatory: true,
            options: {
              create: [
                { text: '11:30 AM', order: 1 },
                { text: '12:00 PM', order: 2 },
                { text: '12:30 PM', order: 3 },
                { text: '1:00 PM', order: 4 },
              ],
            },
          },
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete ✓');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
