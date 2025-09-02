import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsSchema1658123500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create employment_type enum
    await queryRunner.query(`
      CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'volunteer');
      CREATE TYPE experience_level AS ENUM ('entry', 'associate', 'mid_level', 'senior', 'director', 'executive');
      CREATE TYPE remote_policy AS ENUM ('onsite', 'hybrid', 'remote', 'flexible');
      CREATE TYPE job_status AS ENUM ('draft', 'published', 'closed', 'filled', 'expired', 'cancelled');
      CREATE TYPE application_status AS ENUM ('submitted', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected', 'withdrawn');
    `);

    // Create job_listings table
    await queryRunner.query(`
      CREATE TABLE job_listings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL,
        location_id UUID REFERENCES company_locations(id) ON DELETE SET NULL,
        posted_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        short_description VARCHAR(255),
        employment_type employment_type NOT NULL,
        experience_level experience_level NOT NULL,
        remote_policy remote_policy NOT NULL DEFAULT 'onsite',
        min_salary INTEGER,
        max_salary INTEGER,
        salary_currency VARCHAR(3) DEFAULT 'USD',
        salary_period VARCHAR(20) DEFAULT 'yearly',
        show_salary BOOLEAN NOT NULL DEFAULT FALSE,
        application_url VARCHAR(1024),
        application_instructions TEXT,
        application_deadline TIMESTAMP WITH TIME ZONE,
        status job_status NOT NULL DEFAULT 'draft',
        published_at TIMESTAMP WITH TIME ZONE,
        expired_at TIMESTAMP WITH TIME ZONE,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        views_count INTEGER NOT NULL DEFAULT 0,
        applications_count INTEGER NOT NULL DEFAULT 0,
        metadata JSONB,
        
        UNIQUE(company_id, slug)
      );

      CREATE INDEX idx_job_listings_company_id ON job_listings(company_id);
      CREATE INDEX idx_job_listings_status ON job_listings(status);
      CREATE INDEX idx_job_listings_employment_type ON job_listings(employment_type);
      CREATE INDEX idx_job_listings_experience_level ON job_listings(experience_level);
      CREATE INDEX idx_job_listings_remote_policy ON job_listings(remote_policy);
      CREATE INDEX idx_job_listings_published_at ON job_listings(published_at);
    `);

    // Create job_skills table
    await queryRunner.query(`
      CREATE TABLE job_skills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
        skill_name VARCHAR(100) NOT NULL,
        years_required SMALLINT,
        is_required BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);
      CREATE INDEX idx_job_skills_skill_name ON job_skills(skill_name);
    `);

    // Create job_applications table
    await queryRunner.query(`
      CREATE TABLE job_applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resume_url VARCHAR(1024),
        cover_letter TEXT,
        status application_status NOT NULL DEFAULT 'submitted',
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status_updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        salary_expectation INTEGER,
        salary_currency VARCHAR(3) DEFAULT 'USD',
        salary_period VARCHAR(20) DEFAULT 'yearly',
        available_start_date DATE,
        source VARCHAR(100),
        answers JSONB,
        metadata JSONB,
        
        UNIQUE(job_id, user_id)
      );

      CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
      CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
      CREATE INDEX idx_job_applications_status ON job_applications(status);
      CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at);
    `);

    // Create job_application_stages table
    await queryRunner.query(`
      CREATE TABLE job_application_stages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
        stage_name VARCHAR(100) NOT NULL,
        stage_order SMALLINT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        scheduled_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        feedback TEXT,
        rating SMALLINT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_job_application_stages_application_id ON job_application_stages(application_id);
    `);

    // Create job_saved table (for saved/bookmarked jobs)
    await queryRunner.query(`
      CREATE TABLE job_saved (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(job_id, user_id)
      );

      CREATE INDEX idx_job_saved_job_id ON job_saved(job_id);
      CREATE INDEX idx_job_saved_user_id ON job_saved(user_id);
    `);

    // Create job_alerts table
    await queryRunner.query(`
      CREATE TABLE job_alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        keywords VARCHAR(255),
        location VARCHAR(255),
        employment_types TEXT[],
        experience_levels TEXT[],
        remote_policies TEXT[],
        min_salary INTEGER,
        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_job_alerts_user_id ON job_alerts(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS job_alerts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS job_saved;`);
    await queryRunner.query(`DROP TABLE IF EXISTS job_application_stages;`);
    await queryRunner.query(`DROP TABLE IF EXISTS job_applications;`);
    await queryRunner.query(`DROP TABLE IF EXISTS job_skills;`);
    await queryRunner.query(`DROP TABLE IF EXISTS job_listings;`);

    await queryRunner.query(`DROP TYPE IF EXISTS application_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS job_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS remote_policy;`);
    await queryRunner.query(`DROP TYPE IF EXISTS experience_level;`);
    await queryRunner.query(`DROP TYPE IF EXISTS employment_type;`);
  }
}