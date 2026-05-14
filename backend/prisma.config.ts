import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DIRECT_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? 'postgresql://mayu:password@localhost:5433/mayu_db',
  },
});
