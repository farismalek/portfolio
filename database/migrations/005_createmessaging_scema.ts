import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagingSchema1657123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.query(`
      CREATE TYPE conversation_type AS ENUM ('direct', 'group');

      CREATE TABLE conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type conversation_type NOT NULL,
        title VARCHAR(255),
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );

      CREATE INDEX idx_conversations_created_by ON conversations(created_by);
      CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);
    `);

    // Create conversation participants table
    await queryRunner.query(`
      CREATE TYPE participant_role AS ENUM ('member', 'admin');

      CREATE TABLE conversation_participants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role participant_role NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_muted BOOLEAN NOT NULL DEFAULT FALSE,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,

        UNIQUE(conversation_id, user_id)
      );

      CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
      CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TYPE message_status AS ENUM ('sending', 'sent', 'delivered', 'read', 'failed');
      CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'audio', 'video', 'system', 'task');

      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        parent_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        content TEXT,
        type message_type NOT NULL DEFAULT 'text',
        media JSONB,
        status message_status NOT NULL DEFAULT 'sent',
        is_edited BOOLEAN NOT NULL DEFAULT FALSE,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );

      CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX idx_messages_parent_id ON messages(parent_id) WHERE parent_id IS NOT NULL;
      CREATE INDEX idx_messages_created_at ON messages(created_at);
    `);

    // Create message reactions table
    await queryRunner.query(`
      CREATE TABLE message_reactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reaction VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(message_id, user_id, reaction)
      );

      CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
      CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
    `);

    // Create message read receipts
    await queryRunner.query(`
      CREATE TABLE message_read_receipts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(message_id, user_id)
      );

      CREATE INDEX idx_message_read_receipts_message_id ON message_read_receipts(message_id);
      CREATE INDEX idx_message_read_receipts_user_id ON message_read_receipts(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS message_read_receipts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS message_reactions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS messages;`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversation_participants;`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversations;`);

    await queryRunner.query(`DROP TYPE IF EXISTS message_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS message_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS participant_role;`);
    await queryRunner.query(`DROP TYPE IF EXISTS conversation_type;`);
  }
}