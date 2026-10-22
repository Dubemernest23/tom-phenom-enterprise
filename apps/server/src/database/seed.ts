// src/database/seed.ts

import { db } from '../config/db.js';
import { env } from '../config/env.js';
import { seedAdmin } from './seeds/001_seed_admin.js';


const seed = async (): Promise<void> => {
  try {
    await seedAdmin(db, env.ownerUsername, env.ownerPassword);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
};

void seed();
