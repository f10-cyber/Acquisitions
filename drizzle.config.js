import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL_UNPOOLED (or DATABASE_URL) must be set to run Drizzle Kit');
}

export default defineConfig({
  schema: './src/models/index.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
