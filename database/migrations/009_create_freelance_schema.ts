import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFreelanceSchema1658123600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create project_status and related enums
    await queryRunner.query(`
      CREATE TYPE project_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');
      CREATE TYPE project_duration AS ENUM ('less_than_1_month', '1_to_3_months', '3_to_6_months', 'more_than_6_months');
      CREATE TYPE project_complexity AS ENUM ('basic', 'intermediate', 'expert');
      CREATE TYPE budget_type AS ENUM ('fixed', 'hourly', 'to_be_determined');
      CREATE TYPE proposal_status AS ENUM ('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn');
    `);

    // Create freelance_projects table
    await queryRunner.query(`
      CREATE TABLE freelance_projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        short_description VARCHAR(255),
        skills TEXT[] NOT NULL,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        status project_status NOT NULL DEFAULT 'draft',
        duration project_duration,
        complexity project_complexity NOT NULL DEFAULT 'intermediate',
        budget_type budget_type NOT NULL DEFAULT 'fixed',
        budget_amount INTEGER,
        budget_currency VARCHAR(3) DEFAULT 'USD',
        budget_min_hourly INTEGER,
        budget_max_hourly INTEGER,
        visibility VARCHAR(20) NOT NULL DEFAULT 'public',
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        published_at TIMESTAMP WITH TIME ZONE,
        deadline TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        proposal_count INTEGER NOT NULL DEFAULT 0,
        views_count INTEGER NOT NULL DEFAULT 0,
        attachment_urls TEXT[],
        metadata JSONB
      );

      CREATE INDEX idx_freelance_projects_client_id ON freelance_projects(client_id);
      CREATE INDEX idx_freelance_projects_company_id ON freelance_projects(company_id);
      CREATE INDEX idx_freelance_projects_status ON freelance_projects(status);
      CREATE INDEX idx_freelance_projects_category ON freelance_projects(category);
      CREATE INDEX idx_freelance_projects_published_at ON freelance_projects(published_at);
      CREATE INDEX idx_freelance_projects_skills ON freelance_projects USING gin(skills);
    `);

    // Create project_proposals table
    await queryRunner.query(`
      CREATE TABLE project_proposals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
        freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cover_letter TEXT NOT NULL,
        payment_amount INTEGER NOT NULL,
        payment_currency VARCHAR(3) DEFAULT 'USD',
        payment_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
        estimated_duration INTEGER,
        duration_unit VARCHAR(20) DEFAULT 'days',
        status proposal_status NOT NULL DEFAULT 'pending',
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        attachment_urls TEXT[],
        metadata JSONB,
        
        UNIQUE(project_id, freelancer_id)
      );

      CREATE INDEX idx_project_proposals_project_id ON project_proposals(project_id);
      CREATE INDEX idx_project_proposals_freelancer_id ON project_proposals(freelancer_id);
      CREATE INDEX idx_project_proposals_status ON project_proposals(status);
      CREATE INDEX idx_project_proposals_submitted_at ON project_proposals(submitted_at);
    `);

    // Create freelancer_profiles table for specialized freelancer info
    await queryRunner.query(`
      CREATE TABLE freelancer_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        hourly_rate INTEGER,
        currency VARCHAR(3) DEFAULT 'USD',
        skills TEXT[] NOT NULL,
        categories TEXT[] NOT NULL,
        availability VARCHAR(50) DEFAULT 'full_time',
        available_hours_per_week INTEGER,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,
        
        UNIQUE(user_id)
      );

      CREATE INDEX idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);
      CREATE INDEX idx_freelancer_profiles_hourly_rate ON freelancer_profiles(hourly_rate);
      CREATE INDEX idx_freelancer_profiles_skills ON freelancer_profiles USING gin(skills);
      CREATE INDEX idx_freelancer_profiles_categories ON freelancer_profiles USING gin(categories);
    `);

    // Create freelancer_portfolio_items table
    await queryRunner.query(`
      CREATE TABLE freelancer_portfolio_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_url VARCHAR(1024),
        image_urls TEXT[],
        skills TEXT[],
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_freelancer_portfolio_items_freelancer_id ON freelancer_portfolio_items(freelancer_id);
    `);

    // Create freelancer_services table
    await queryRunner.query(`
      CREATE TABLE freelancer_services (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        delivery_time INTEGER NOT NULL,
        delivery_unit VARCHAR(20) DEFAULT 'days',
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        image_urls TEXT[],
        skills TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_freelancer_services_freelancer_id ON freelancer_services(freelancer_id);
      CREATE INDEX idx_freelancer_services_category ON freelancer_services(category);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS freelancer_services;`);
    await queryRunner.query(`DROP TABLE IF EXISTS freelancer_portfolio_items;`);
    await queryRunner.query(`DROP TABLE IF EXISTS freelancer_profiles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_proposals;`);
    await queryRunner.query(`DROP TABLE IF EXISTS freelance_projects;`);

    await queryRunner.query(`DROP TYPE IF EXISTS proposal_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS budget_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS project_complexity;`);
    await queryRunner.query(`DROP TYPE IF EXISTS project_duration;`);
    await queryRunner.query(`DROP TYPE IF EXISTS project_status;`);
  }
}