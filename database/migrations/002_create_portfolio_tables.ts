import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePortfolioTables1656864200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create portfolio status and visibility enums
    await queryRunner.query(`
      CREATE TYPE portfolio_status AS ENUM ('draft', 'published', 'archived');
      CREATE TYPE portfolio_visibility AS ENUM ('public', 'private', 'password_protected');
      
      -- Create component category enum
      CREATE TYPE component_category AS ENUM (
        'header', 'hero', 'about', 'projects', 'skills', 'experience', 'education', 
        'testimonials', 'contact', 'gallery', 'footer', 'custom'
      );
      
      -- Create template category enum
      CREATE TYPE template_category AS ENUM (
        'creative', 'professional', 'minimal', 'tech', 'design', 'photography', 'business', 'custom'
      );
    `);

    // Create templates table
    await queryRunner.query(`
      CREATE TABLE templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category template_category NOT NULL DEFAULT 'professional',
        thumbnail_url TEXT NOT NULL,
        structure JSONB NOT NULL,
        default_pages JSONB NOT NULL,
        typography JSONB,
        colors JSONB,
        is_premium BOOLEAN NOT NULL DEFAULT FALSE,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_templates_category ON templates(category);
      CREATE INDEX idx_templates_featured ON templates(featured);
    `);

    // Create components table
    await queryRunner.query(`
      CREATE TABLE components (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        category component_category NOT NULL,
        type VARCHAR(100) NOT NULL,
        schema JSONB NOT NULL,
        default_data JSONB,
        thumbnail_url TEXT NOT NULL,
        is_premium BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_components_category ON components(category);
      CREATE INDEX idx_components_type ON components(type);
    `);

    // Create portfolios table
    await queryRunner.query(`
      CREATE TABLE portfolios (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status portfolio_status NOT NULL DEFAULT 'draft',
        visibility portfolio_visibility NOT NULL DEFAULT 'public',
        password VARCHAR(255),
        slug VARCHAR(255) NOT NULL,
        custom_domain VARCHAR(255),
        thumbnail_url TEXT,
        template_id UUID NOT NULL REFERENCES templates(id),
        customizations JSONB,
        settings JSONB,
        analytics JSONB,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        published_at TIMESTAMP WITH TIME ZONE,
        last_viewed_at TIMESTAMP WITH TIME ZONE,
        view_count INTEGER NOT NULL DEFAULT 0
      );
      
      CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
      CREATE INDEX idx_portfolios_slug ON portfolios(slug);
      CREATE INDEX idx_portfolios_custom_domain ON portfolios(custom_domain);
      CREATE INDEX idx_portfolios_status ON portfolios(status);
      CREATE INDEX idx_portfolios_featured ON portfolios(featured);
      CREATE UNIQUE INDEX idx_portfolios_slug_user_id ON portfolios(slug, user_id);
    `);

    // Create portfolio pages table
    await queryRunner.query(`
      CREATE TABLE portfolio_pages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        order INTEGER NOT NULL,
        content JSONB NOT NULL,
        metadata JSONB,
        is_home_page BOOLEAN NOT NULL DEFAULT FALSE,
        portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_portfolio_pages_portfolio_id ON portfolio_pages(portfolio_id);
      CREATE INDEX idx_portfolio_pages_is_home_page ON portfolio_pages(is_home_page);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to respect foreign key constraints
    await queryRunner.query(`DROP TABLE portfolio_pages;`);
    await queryRunner.query(`DROP TABLE portfolios;`);
    await queryRunner.query(`DROP TABLE components;`);
    await queryRunner.query(`DROP TABLE templates;`);

    // Drop custom types
    await queryRunner.query(`
      DROP TYPE portfolio_status;
      DROP TYPE portfolio_visibility;
      DROP TYPE component_category;
      DROP TYPE template_category;
    `);
  }
}