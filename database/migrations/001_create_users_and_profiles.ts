import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndProfiles1656864000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('user', 'creator', 'recruiter', 'admin');
      
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        role user_role NOT NULL DEFAULT 'user',
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        auth0_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_users_auth0_id ON users(auth0_id);
    `);

    // Create profiles table
    await queryRunner.query(`
      CREATE TABLE profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(100) NOT NULL,
        bio TEXT,
        avatar_url VARCHAR(255),
        cover_image_url VARCHAR(255),
        location VARCHAR(255),
        website_url VARCHAR(255),
        skills TEXT[],
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        theme VARCHAR(50) NOT NULL DEFAULT 'cosmic',
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_profiles_user_id ON profiles(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE profiles;`);
    await queryRunner.query(`DROP TABLE users;`);
    await queryRunner.query(`DROP TYPE user_role;`);
  }
}