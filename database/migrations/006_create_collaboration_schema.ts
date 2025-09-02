import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCollaborationSchema1657123500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create workspaces table
    await queryRunner.query(`
      CREATE TABLE workspaces (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        settings JSONB
      );

      CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
    `);

    // Create workspace members table
    await queryRunner.query(`
      CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

      CREATE TABLE workspace_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role workspace_role NOT NULL DEFAULT 'editor',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        
        UNIQUE(workspace_id, user_id)
      );

      CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
      CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
    `);

    // Create projects table
    await queryRunner.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        start_date TIMESTAMP WITH TIME ZONE,
        due_date TIMESTAMP WITH TIME ZONE,
        settings JSONB
      );

      CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
      CREATE INDEX idx_projects_created_by ON projects(created_by);
      CREATE INDEX idx_projects_status ON projects(status);
    `);

    // Create tasks table
    await queryRunner.query(`
      CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
      CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');

      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status task_status NOT NULL DEFAULT 'todo',
        priority task_priority NOT NULL DEFAULT 'medium',
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        order_index FLOAT NOT NULL DEFAULT 0,
        parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
        metadata JSONB,
        
        CHECK (project_id IS NOT NULL OR parent_id IS NOT NULL)
      );

      CREATE INDEX idx_tasks_project_id ON tasks(project_id) WHERE project_id IS NOT NULL;
      CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
      CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
      CREATE INDEX idx_tasks_status ON tasks(status);
      CREATE INDEX idx_tasks_parent_id ON tasks(parent_id) WHERE parent_id IS NOT NULL;
    `);

    // Create task comments table
    await queryRunner.query(`
      CREATE TABLE task_comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_edited BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
      CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
    `);

    // Create file sharing table
    await queryRunner.query(`
      CREATE TABLE shared_files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(1024) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,
        
        CHECK (
          (workspace_id IS NOT NULL) OR
          (project_id IS NOT NULL) OR
          (task_id IS NOT NULL) OR
          (conversation_id IS NOT NULL AND message_id IS NOT NULL)
        )
      );

      CREATE INDEX idx_shared_files_workspace_id ON shared_files(workspace_id) WHERE workspace_id IS NOT NULL;
      CREATE INDEX idx_shared_files_project_id ON shared_files(project_id) WHERE project_id IS NOT NULL;
      CREATE INDEX idx_shared_files_task_id ON shared_files(task_id) WHERE task_id IS NOT NULL;
      CREATE INDEX idx_shared_files_conversation_id ON shared_files(conversation_id) WHERE conversation_id IS NOT NULL;
      CREATE INDEX idx_shared_files_uploaded_by ON shared_files(uploaded_by);
    `);

    // Create file versions table for version tracking
    await queryRunner.query(`
      CREATE TABLE file_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        file_id UUID NOT NULL REFERENCES shared_files(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        file_path VARCHAR(1024) NOT NULL,
        file_size BIGINT NOT NULL,
        uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        
        UNIQUE(file_id, version_number)
      );

      CREATE INDEX idx_file_versions_file_id ON file_versions(file_id);
    `);

    // Create shared boards table for collaboration
    await queryRunner.query(`
      CREATE TYPE board_type AS ENUM ('kanban', 'whiteboard', 'document');
      
      CREATE TABLE collaborative_boards (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type board_type NOT NULL DEFAULT 'kanban',
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        content JSONB,
        settings JSONB,
        
        CHECK (workspace_id IS NOT NULL OR project_id IS NOT NULL)
      );

      CREATE INDEX idx_collaborative_boards_workspace_id ON collaborative_boards(workspace_id) WHERE workspace_id IS NOT NULL;
      CREATE INDEX idx_collaborative_boards_project_id ON collaborative_boards(project_id) WHERE project_id IS NOT NULL;
      CREATE INDEX idx_collaborative_boards_created_by ON collaborative_boards(created_by);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS collaborative_boards;`);
    await queryRunner.query(`DROP TABLE IF EXISTS file_versions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS shared_files;`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_comments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tasks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects;`);
    await queryRunner.query(`DROP TABLE IF EXISTS workspace_members;`);
    await queryRunner.query(`DROP TABLE IF EXISTS workspaces;`);

    await queryRunner.query(`DROP TYPE IF EXISTS board_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS task_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS task_priority;`);
    await queryRunner.query(`DROP TYPE IF EXISTS workspace_role;`);
  }
}