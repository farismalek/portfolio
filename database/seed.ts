import { createConnection } from 'typeorm';
import { seedTemplates } from './seeds/templates.seed';
import { seedComponents } from './seeds/components.seed';
import ormConfig from '../backend/src/config/orm.config';

async function seed() {
  try {
    console.log('Connecting to database...');
    const connection = await createConnection({
      ...ormConfig,
      synchronize: false
    });

    console.log('Connected to database, starting seed process...');

    // Run seed functions
    await seedTemplates(connection);
    await seedComponents(connection);

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();