import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { logger } from '../utils/logger';

neonConfig.webSocketConstructor = ws;

let dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_KExeCVN9RH2r@ep-young-scene-b525tips-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Force Neon connection to use the -pooler endpoint to avoid Serverless cold start timeouts
if (dbUrl.includes('.neon.tech') && !dbUrl.includes('-pooler')) {
  dbUrl = dbUrl.replace(/\.c-([a-zA-Z0-9_-]+)\./, '-pooler.c-$1.');
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaNeon(pool);

export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

// Log raw database queries in development
if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    logger.debug(`Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
  });
}
export default prisma;
