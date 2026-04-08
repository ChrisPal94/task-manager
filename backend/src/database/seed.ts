import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

// Minimal inline entity setup — avoids importing the full NestJS app
const dataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH ?? './database.sqlite',
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  synchronize: false,
  logging: false,
});

const SALT_ROUNDS = 10;

const users = [
  { name: 'Mario',  email: 'mario@taskmanager.dev',  password: 'Mario123!'  },
  { name: 'Luigi',  email: 'luigi@taskmanager.dev',  password: 'Luigi123!'  },
  { name: 'Bowser', email: 'bowser@taskmanager.dev', password: 'Bowser123!' },
];

async function seed() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  console.log('🌱 Seeding users...');

  for (const user of users) {
    const exists = await queryRunner.query(
      `SELECT id FROM users WHERE email = ?`,
      [user.email],
    );

    if (exists.length > 0) {
      console.log(`  ⏩ Skipping ${user.email} (already exists)`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
    await queryRunner.query(
      `INSERT INTO users (email, password, name) VALUES (?, ?, ?)`,
      [user.email, hashed, user.name],
    );
    console.log(`  ✅ Created ${user.email}`);
  }

  await dataSource.destroy();
  console.log('\n✅ Seed complete.\n');
  console.log('Test credentials:');
  users.forEach((u) => console.log(`  ${u.email}  /  ${u.password}`));
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
