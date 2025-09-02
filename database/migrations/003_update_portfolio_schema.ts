import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePortfolioSchema1656864300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to portfolios table for additional features
    await queryRunner.query(`
      ALTER TABLE portfolios
        ADD COLUMN seo_title VARCHAR(255),
        ADD COLUMN seo_description TEXT,
        ADD COLUMN seo_keywords VARCHAR(255)[],
        ADD COLUMN custom_css TEXT,
        ADD COLUMN custom_js TEXT,
        ADD COLUMN advanced_analytics BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN allow_downloads BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN showcase_featured BOOLEAN NOT NULL DEFAULT FALSE;
        
      -- Create an index for showcasing featured portfolios
      CREATE INDEX idx_portfolios_showcase_featured ON portfolios(showcase_featured) WHERE showcase_featured = TRUE;
    `);

    // Add analytics table for portfolio views
    await queryRunner.query(`
      CREATE TABLE portfolio_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        visitor_id VARCHAR(255),
        visitor_ip VARCHAR(45),
        referer TEXT,
        user_agent TEXT,
        device_type VARCHAR(50),
        country_code VARCHAR(2),
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_portfolio_views_portfolio_id ON portfolio_views(portfolio_id);
      CREATE INDEX idx_portfolio_views_viewed_at ON portfolio_views(viewed_at);
    `);

    // Add portfolio feedback and comments table
    await queryRunner.query(`
      CREATE TABLE portfolio_feedback (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        content TEXT NOT NULL,
        rating INTEGER,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        is_approved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_portfolio_feedback_portfolio_id ON portfolio_feedback(portfolio_id);
      CREATE INDEX idx_portfolio_feedback_is_public ON portfolio_feedback(is_public) WHERE is_public = TRUE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE portfolio_feedback;`);
    await queryRunner.query(`DROP TABLE portfolio_views;`);

    // Drop columns from portfolios table
    await queryRunner.query(`
      ALTER TABLE portfolios
        DROP COLUMN IF EXISTS seo_title,
        DROP COLUMN IF EXISTS seo_description,
        DROP COLUMN IF EXISTS seo_keywords,
        DROP COLUMN IF EXISTS custom_css,
        DROP COLUMN IF EXISTS custom_js,
        DROP COLUMN IF EXISTS advanced_analytics,
        DROP COLUMN IF EXISTS allow_comments,
        DROP COLUMN IF EXISTS allow_downloads,
        DROP COLUMN IF EXISTS showcase_featured;
    `);
  }
}