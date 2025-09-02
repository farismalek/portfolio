import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContractsPaymentsSchema1658123700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create contract_status and related enums
    await queryRunner.query(`
      CREATE TYPE contract_status AS ENUM ('draft', 'pending', 'active', 'completed', 'cancelled', 'disputed');
      CREATE TYPE contract_type AS ENUM ('fixed', 'hourly', 'retainer');
      CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'submitted', 'approved', 'rejected');
      CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
      CREATE TYPE transaction_type AS ENUM ('payment', 'escrow_funding', 'escrow_release', 'refund', 'withdrawal', 'fee', 'bonus');
    `);

    // Create contracts table
    await queryRunner.query(`
      CREATE TABLE contracts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES freelance_projects(id) ON DELETE SET NULL,
        proposal_id UUID REFERENCES project_proposals(id) ON DELETE SET NULL,
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        contract_type contract_type NOT NULL DEFAULT 'fixed',
        status contract_status NOT NULL DEFAULT 'draft',
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        total_amount INTEGER,
        currency VARCHAR(3) DEFAULT 'USD',
        hourly_rate INTEGER,
        weekly_limit INTEGER,
        terms TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        signed_by_client_at TIMESTAMP WITH TIME ZONE,
        signed_by_freelancer_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
        cancellation_reason TEXT,
        attachment_urls TEXT[],
        metadata JSONB
      );

      CREATE INDEX idx_contracts_client_id ON contracts(client_id);
      CREATE INDEX idx_contracts_freelancer_id ON contracts(freelancer_id);
      CREATE INDEX idx_contracts_project_id ON contracts(project_id);
      CREATE INDEX idx_contracts_status ON contracts(status);
    `);

    // Create contract_milestones table
    await queryRunner.query(`
      CREATE TABLE contract_milestones (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP WITH TIME ZONE,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status milestone_status NOT NULL DEFAULT 'pending',
        order_index INTEGER NOT NULL,
        in_progress_at TIMESTAMP WITH TIME ZONE,
        submitted_at TIMESTAMP WITH TIME ZONE,
        approved_at TIMESTAMP WITH TIME ZONE,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        rejected_at TIMESTAMP WITH TIME ZONE,
        rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        attachment_urls TEXT[],
        feedback TEXT
      );

      CREATE INDEX idx_contract_milestones_contract_id ON contract_milestones(contract_id);
      CREATE INDEX idx_contract_milestones_status ON contract_milestones(status);
    `);

    // Create contract_time_logs table for hourly contracts
    await queryRunner.query(`
      CREATE TABLE contract_time_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
        freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        duration INTEGER NOT NULL, -- in minutes
        is_billable BOOLEAN NOT NULL DEFAULT TRUE,
        is_approved BOOLEAN,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP WITH TIME ZONE,
        rejected_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );

      CREATE INDEX idx_contract_time_logs_contract_id ON contract_time_logs(contract_id);
      CREATE INDEX idx_contract_time_logs_freelancer_id ON contract_time_logs(freelancer_id);
      CREATE INDEX idx_contract_time_logs_start_time ON contract_time_logs(start_time);
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
        milestone_id UUID REFERENCES contract_milestones(id) ON DELETE SET NULL,
        payer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        payee_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_method VARCHAR(50),
        payment_reference VARCHAR(255),
        status payment_status NOT NULL DEFAULT 'pending',
        description TEXT,
        fee_amount INTEGER DEFAULT 0,
        initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        failed_at TIMESTAMP WITH TIME ZONE,
        refunded_at TIMESTAMP WITH TIME ZONE,
        failure_reason TEXT,
        is_escrow BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB
      );

      CREATE INDEX idx_payments_contract_id ON payments(contract_id);
      CREATE INDEX idx_payments_milestone_id ON payments(milestone_id);
      CREATE INDEX idx_payments_payer_id ON payments(payer_id);
      CREATE INDEX idx_payments_payee_id ON payments(payee_id);
      CREATE INDEX idx_payments_status ON payments(status);
    `);

    // Create transactions table for detailed transaction history
    await queryRunner.query(`
      CREATE TABLE transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        type transaction_type NOT NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        balance_after INTEGER,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        reference_id VARCHAR(255),
        metadata JSONB
      );

      CREATE INDEX idx_transactions_payment_id ON transactions(payment_id);
      CREATE INDEX idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX idx_transactions_created_at ON transactions(created_at);
      CREATE INDEX idx_transactions_type ON transactions(type);
    `);

    // Create payment_methods table
    await queryRunner.query(`
      CREATE TABLE payment_methods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        provider_payment_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        last_four VARCHAR(4),
        expiry_month VARCHAR(2),
        expiry_year VARCHAR(4),
        billing_name VARCHAR(255),
        billing_address_line1 VARCHAR(255),
        billing_address_line2 VARCHAR(255),
        billing_city VARCHAR(100),
        billing_state VARCHAR(100),
        billing_postal_code VARCHAR(20),
        billing_country VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );

      CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
    `);

    // Create payout_methods table
    await queryRunner.query(`
      CREATE TABLE payout_methods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        account_last_four VARCHAR(4),
        account_name VARCHAR(255),
        account_type VARCHAR(50),
        bank_name VARCHAR(255),
        country VARCHAR(100),
        currency VARCHAR(3) DEFAULT 'USD',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );

      CREATE INDEX idx_payout_methods_user_id ON payout_methods(user_id);
    `);

    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
        payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
        invoice_number VARCHAR(50) NOT NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        due_date TIMESTAMP WITH TIME ZONE,
        issued_date TIMESTAMP WITH TIME ZONE,
        paid_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        items JSONB,
        metadata JSONB
      );

      CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
      CREATE INDEX idx_invoices_client_id ON invoices(client_id);
      CREATE INDEX idx_invoices_freelancer_id ON invoices(freelancer_id);
      CREATE INDEX idx_invoices_status ON invoices(status);
      CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS invoices;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payout_methods;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_methods;`);
    await queryRunner.query(`DROP TABLE IF EXISTS transactions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS contract_time_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS contract_milestones;`);
    await queryRunner.query(`DROP TABLE IF EXISTS contracts;`);

    await queryRunner.query(`DROP TYPE IF EXISTS transaction_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS milestone_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS contract_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS contract_status;`);
  }
}