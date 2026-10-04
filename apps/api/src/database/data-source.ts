import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from '../common/typeorm/snake-naming.strategy';
import { User } from '../modules/users/entities/user.entity';
import { Company } from '../modules/users/entities/company.entity';
import { AddMissingColumns1700000000000 } from './migrations/1700000000000-AddMissingColumns';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: true,
  entities: [User, Company],
  migrations: [AddMissingColumns1700000000000],
  namingStrategy: new SnakeNamingStrategy(),
  extra: {
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 30000,
  },
});
