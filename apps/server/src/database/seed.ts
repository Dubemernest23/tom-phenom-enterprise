// src/database/seed.ts

import { db } from '../config/db.js';
import { seedUsers } from './seeds/001_seed_users.js';

const seed = async (): Promise<void> => {
  try {
    await seedUsers(db);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
};

void seed();