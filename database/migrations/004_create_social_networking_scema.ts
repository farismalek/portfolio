import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialNetworkingSchema1656864400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create connections table for user relationships
    await queryRunner.query(`
      CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');
      CREATE TYPE connection_type AS ENUM ('follow', 'connection');
      
      CREATE TABLE connections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status connection_status NOT NULL DEFAULT 'pending',
        type connection_type NOT NULL DEFAULT 'follow',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(follower_id, following_id)
      );
      
      CREATE INDEX idx_connections_follower ON connections(follower_id);
      CREATE INDEX idx_connections_following ON connections(following_id);
      CREATE INDEX idx_connections_status ON connections(status);
    `);

    // Create posts table for content creation
    await queryRunner.query(`
      CREATE TYPE post_type AS ENUM ('text', 'image', 'gallery', 'video', 'article', 'portfolio', 'project', 'job');
      CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
      CREATE TYPE post_visibility AS ENUM ('public', 'connections', 'private');
      
      CREATE TABLE posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type post_type NOT NULL DEFAULT 'text',
        title VARCHAR(255),
        content TEXT,
        media JSONB,
        metadata JSONB,
        status post_status NOT NULL DEFAULT 'published',
        visibility post_visibility NOT NULL DEFAULT 'public',
        portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
        parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        published_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE INDEX idx_posts_user_id ON posts(user_id);
      CREATE INDEX idx_posts_type ON posts(type);
      CREATE INDEX idx_posts_status ON posts(status);
      CREATE INDEX idx_posts_parent_id ON posts(parent_id) WHERE parent_id IS NOT NULL;
      CREATE INDEX idx_posts_portfolio_id ON posts(portfolio_id) WHERE portfolio_id IS NOT NULL;
      CREATE INDEX idx_posts_created_at ON posts(created_at);
    `);

    // Create reactions table for engagement features
    await queryRunner.query(`
      CREATE TABLE reactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL DEFAULT 'like',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(user_id, post_id, type)
      );
      
      CREATE INDEX idx_reactions_post_id ON reactions(post_id);
      CREATE INDEX idx_reactions_user_id ON reactions(user_id);
      CREATE INDEX idx_reactions_type ON reactions(type);
    `);

    // Create comments table
    await queryRunner.query(`
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content TEXT NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_comments_post_id ON comments(post_id);
      CREATE INDEX idx_comments_user_id ON comments(user_id);
      CREATE INDEX idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;
    `);

    // Create shares table
    await queryRunner.query(`
      CREATE TABLE shares (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        caption TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_shares_post_id ON shares(post_id);
      CREATE INDEX idx_shares_user_id ON shares(user_id);
    `);

    // Create hashtags and post_hashtags tables
    await queryRunner.query(`
      CREATE TABLE hashtags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) UNIQUE NOT NULL,
        post_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE post_hashtags (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        PRIMARY KEY (post_id, hashtag_id)
      );
      
      CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TYPE notification_type AS ENUM (
        'new_follower', 'connection_request', 'connection_accepted', 
        'post_like', 'post_comment', 'comment_reply', 'post_share',
        'mention', 'portfolio_view', 'job_application'
      );
      
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
        comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
        portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
        message TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at);
    `);

    // Create groups and communities tables
    await queryRunner.query(`
      CREATE TYPE group_type AS ENUM ('interest', 'profession', 'company', 'educational', 'regional');
      CREATE TYPE group_visibility AS ENUM ('public', 'private', 'secret');
      CREATE TYPE membership_role AS ENUM ('member', 'moderator', 'admin');
      CREATE TYPE membership_status AS ENUM ('pending', 'active', 'rejected', 'banned');
      
      CREATE TABLE groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type group_type NOT NULL DEFAULT 'interest',
        visibility group_visibility NOT NULL DEFAULT 'public',
        slug VARCHAR(255) NOT NULL UNIQUE,
        avatar_url TEXT,
        cover_url TEXT,
        member_count INTEGER NOT NULL DEFAULT 0,
        post_count INTEGER NOT NULL DEFAULT 0,
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_groups_type ON groups(type);
      CREATE INDEX idx_groups_visibility ON groups(visibility);
      CREATE INDEX idx_groups_slug ON groups(slug);
      
      CREATE TABLE group_memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        role membership_role NOT NULL DEFAULT 'member',
        status membership_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(user_id, group_id)
      );
      
      CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
      CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
      CREATE INDEX idx_group_memberships_status ON group_memberships(status);
      
      CREATE TABLE group_posts (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        PRIMARY KEY (post_id, group_id)
      );
      
      CREATE INDEX idx_group_posts_group_id ON group_posts(group_id);
    `);

    // Create user bookmarks
    await queryRunner.query(`
      CREATE TABLE bookmarks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CHECK (
          (post_id IS NOT NULL AND portfolio_id IS NULL) OR
          (post_id IS NULL AND portfolio_id IS NOT NULL)
        )
      );
      
      CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
      CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id) WHERE post_id IS NOT NULL;
      CREATE INDEX idx_bookmarks_portfolio_id ON bookmarks(portfolio_id) WHERE portfolio_id IS NOT NULL;
    `);

    // Add user social stats to profile table
    await queryRunner.query(`
      ALTER TABLE profiles
        ADD COLUMN follower_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN following_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN connection_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN post_count INTEGER NOT NULL DEFAULT 0;
    `);

    // Add user feed preferences
    await queryRunner.query(`
      CREATE TABLE feed_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        preferred_content_types TEXT[] DEFAULT '{text,image,gallery,video,article,portfolio,project,job}',
        hidden_users UUID[],
        prioritized_users UUID[],
        hidden_tags UUID[],
        prioritized_tags UUID[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_feed_preferences_user_id ON feed_preferences(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS feed_preferences;`);
    await queryRunner.query(`DROP TABLE IF EXISTS bookmarks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS group_posts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS group_memberships;`);
    await queryRunner.query(`DROP TABLE IF EXISTS groups;`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications;`);
    await queryRunner.query(`DROP TABLE IF EXISTS post_hashtags;`);
    await queryRunner.query(`DROP TABLE IF EXISTS hashtags;`);
    await queryRunner.query(`DROP TABLE IF EXISTS shares;`);
    await queryRunner.query(`DROP TABLE IF EXISTS comments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS reactions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS posts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS connections;`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS membership_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS membership_role;`);
    await queryRunner.query(`DROP TYPE IF EXISTS group_visibility;`);
    await queryRunner.query(`DROP TYPE IF EXISTS group_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS post_visibility;`);
    await queryRunner.query(`DROP TYPE IF EXISTS post_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS post_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS connection_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS connection_status;`);

    // Remove columns from profiles table
    await queryRunner.query(`
      ALTER TABLE profiles
        DROP COLUMN IF EXISTS follower_count,
        DROP COLUMN IF EXISTS following_count,
        DROP COLUMN IF EXISTS connection_count,
        DROP COLUMN IF EXISTS post_count;
    `);
  }
}