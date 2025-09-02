import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompaniesSchema1658123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create company_profiles table
    await queryRunner.query(`
      CREATE TYPE company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+');
      CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');

      CREATE TABLE company_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        short_description VARCHAR(255),
        logo_url VARCHAR(1024),
        cover_image_url VARCHAR(1024),
        website_url VARCHAR(1024),
        founded_year SMALLINT,
        size company_size,
        industry VARCHAR(100),
        headquarters VARCHAR(255),
        verification_status verification_status NOT NULL DEFAULT 'unverified',
        verified_at TIMESTAMP WITH TIME ZONE,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        social_links JSONB,
        benefits JSONB,
        metadata JSONB
      );

      CREATE INDEX idx_company_profiles_slug ON company_profiles(slug);
      CREATE INDEX idx_company_profiles_industry ON company_profiles(industry);
      CREATE INDEX idx_company_profiles_verification_status ON company_profiles(verification_status);
    `);

    // Create company_admins table
    await queryRunner.query(`
      CREATE TABLE company_admins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(company_id, user_id)
      );

      CREATE INDEX idx_company_admins_company_id ON company_admins(company_id);
      CREATE INDEX idx_company_admins_user_id ON company_admins(user_id);
    `);

    // Create company_verification_documents table
    await queryRunner.query(`
      CREATE TABLE company_verification_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        document_type VARCHAR(100) NOT NULL,
        document_url VARCHAR(1024) NOT NULL,
        status verification_status NOT NULL DEFAULT 'pending',
        submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        notes TEXT
      );

      CREATE INDEX idx_company_verification_documents_company_id ON company_verification_documents(company_id);
    `);

    // Create company_locations table
    await queryRunner.query(`
      CREATE TABLE company_locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        is_headquarters BOOLEAN NOT NULL DEFAULT FALSE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_company_locations_company_id ON company_locations(company_id);
    `);

    // Create company_departments table
    await queryRunner.query(`
      CREATE TABLE company_departments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(company_id, name)
      );

      CREATE INDEX idx_company_departments_company_id ON company_departments(company_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS company_departments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS company_locations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS company_verification_documents;`);
    await queryRunner.query(`DROP TABLE IF EXISTS company_admins;`);
    await queryRunner.query(`DROP TABLE IF EXISTS company_profiles;`);

    await queryRunner.query(`DROP TYPE IF EXISTS verification_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS company_size;`);
  }
}