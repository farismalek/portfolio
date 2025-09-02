import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, EntityManager } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Contract, ContractType } from '../contracts/entities/contract.entity';
import { ContractMilestone, MilestoneStatus } from '../contracts/entities/contract-milestone.entity';
import { ContractTimeLog } from '../contracts/entities/contract-time-log.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateManualPaymentDto } from './dto/create-manual-payment.dto';
import { PaginationParams } from '../../../common/dto/pagination-params.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ContractMilestone)
    private milestoneRepository: Repository<ContractMilestone>,
    @InjectRepository(ContractTimeLog)
    private timeLogRepository: Repository<ContractTimeLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private connection: Connection,
    private notificationsService: NotificationsService,
  ) { }

  // Get payments for a user (as payer or payee)
  async getUserPayments(
    userId: string,
    params: {
      role?: 'payer' | 'payee';
      status?: PaymentStatus;
    } & PaginationParams
  ): Promise<{ items: Payment[]; totalCount: number }> {
    const { role, status, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.payer', 'payer')
      .leftJoinAndSelect('payment.payee', 'payee')
      .leftJoinAndSelect('payment.contract', 'contract')
      .leftJoinAndSelect('payment.milestone', 'milestone');

    // Filter by user role
    if (role === 'payer') {
      queryBuilder.where('payment.payerId = :userId', { userId });
    } else if (role === 'payee') {
      queryBuilder.where('payment.payeeId = :userId', { userId });
    } else {
      queryBuilder.where('(payment.payerId = :userId OR payment.payeeId = :userId)', { userId });
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    // Order by most recent first
    queryBuilder.orderBy('payment.initiatedAt', 'DESC');

    const [items, totalCount] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add formatted amounts and labels
    const enhancedItems = items.map(payment => {
      // Format amount
      const currency = payment.currency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });

      payment.formattedAmount = formatter.format(payment.amount);
      payment.formattedFee = formatter.format(payment.feeAmount);

      // Add user-friendly status label
      switch (payment.status) {
        case PaymentStatus.PENDING:
          payment.statusLabel = 'Pending';
          break;
        case PaymentStatus.PROCESSING:
          payment.statusLabel = 'Processing';
          break;
        case PaymentStatus.COMPLETED:
          payment.statusLabel = 'Completed';
          break;
        case PaymentStatus.FAILED:
          payment.statusLabel = 'Failed';
          break;
        case PaymentStatus.REFUNDED:
          payment.statusLabel = 'Refunded';
          break;
        default:
          payment.statusLabel = payment.status;
      }

      return payment;
    });

    return { items: enhancedItems, totalCount };
  }

  // Get payment details by ID
  async getPayment(id: string, userId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: [
        'payer',
        'payee',
        'contract',
        'milestone',
        'transactions'
      ]
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check authorization
    const isParticipant = payment.payerId === userId || payment.payeeId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('You do not have permission to view this payment');
    }

    // Format amount
    const currency = payment.currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });

    payment.formattedAmount = formatter.format(payment.amount);
    payment.formattedFee = formatter.format(payment.feeAmount);

    // Add user-friendly status label
    switch (payment.status) {
      case PaymentStatus.PENDING:
        payment.statusLabel = 'Pending';
        break;
      case PaymentStatus.PROCESSING:
        payment.statusLabel = 'Processing';
        break;
      case PaymentStatus.COMPLETED:
        payment.statusLabel = 'Completed';
        break;
      case PaymentStatus.FAILED:
        payment.statusLabel = 'Failed';
        break;
      case PaymentStatus.REFUNDED:
        payment.statusLabel = 'Refunded';
        break;
      default:
        payment.statusLabel = payment.status;
    }

    return payment;
  }

  // Create milestone escrow payment
  async createMilestoneEscrowPayment(
    milestoneId: string,
    userId: string
  ): Promise<Payment> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id: milestoneId },
      relations: ['contract']
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const contract = milestone.contract;

    // Only the client can fund milestones
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can fund milestones');
    }

    // Contract must be active
    if (contract.status !== 'active') {
      throw new BadRequestException('Milestones can only be funded for active contracts');
    }

    // Check if milestone is already funded
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        milestoneId,
        isEscrow: true,
        status: Not(In([PaymentStatus.FAILED, PaymentStatus.REFUNDED]))
      }
    });

    if (existingPayment) {
      throw new BadRequestException('This milestone is already funded');
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      contractId: contract.id,
      milestoneId: milestone.id,
      payerId: contract.clientId,
      payeeId: contract.freelancerId,
      companyId: contract.companyId,
      amount: milestone.amount,
      currency: milestone.currency || 'USD',
      status: PaymentStatus.PENDING,
      description: `Escrow payment for milestone: ${milestone.title}`,
      isEscrow: true,
      // Calculate platform fee (5%)
      feeAmount: Math.round(milestone.amount * 0.05)
    });

    // Start a transaction since we're creating multiple records
    return this.connection.transaction(async (manager: EntityManager) => {
      // Save payment
      const savedPayment = await manager.save(Payment, payment);

      // Create transaction record
      const transaction = manager.create(Transaction, {
        paymentId: savedPayment.id,
        userId: contract.clientId,
        type: TransactionType.ESCROW_FUNDING,
        amount: milestone.amount,
        currency: milestone.currency || 'USD',
        description: `Escrow funding for milestone: ${milestone.title}`,
        referenceId: uuidv4()
      });

      await manager.save(Transaction, transaction);

      // In a real system, we'd integrate with a payment processor here
      // For this demo, we'll simulate successful payment processing

      // Update payment status
      savedPayment.status = PaymentStatus.COMPLETED;
      savedPayment.processedAt = new Date();
      savedPayment.completedAt = new Date();

      const updatedPayment = await manager.save(Payment, savedPayment);

      // Update milestone status if it's still pending
      if (milestone.status === MilestoneStatus.PENDING) {
        milestone.status = MilestoneStatus.IN_PROGRESS;
        milestone.inProgressAt = new Date();
        await manager.save(ContractMilestone, milestone);
      }

      // Notify the freelancer
      await this.notifyMilestoneFunded(updatedPayment);

      return updatedPayment;
    });
  }

  // Release milestone payment from escrow
  async releaseMilestonePayment(
    milestoneId: string,
    userId: string
  ): Promise<Payment> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id: milestoneId },
      relations: ['contract']
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const contract = milestone.contract;

    // Only the client can release milestone payments
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can release milestone payments');
    }

    // Find the escrow payment
    const escrowPayment = await this.paymentRepository.findOne({
      where: {
        milestoneId,
        isEscrow: true,
        status: PaymentStatus.COMPLETED
      }
    });

    if (!escrowPayment) {
      throw new BadRequestException('No funded escrow payment found for this milestone');
    }

    // Create release payment record
    const payment = this.paymentRepository.create({
      contractId: contract.id,
      milestoneId: milestone.id,
      payerId: contract.clientId,
      payeeId: contract.freelancerId,
      companyId: contract.companyId,
      amount: milestone.amount,
      currency: milestone.currency || 'USD',
      status: PaymentStatus.PENDING,
      description: `Payment release for milestone: ${milestone.title}`,
      isEscrow: false,
      // Fee already deducted from escrow payment
      feeAmount: 0
    });

    // Start a transaction
    return this.connection.transaction(async (manager: EntityManager) => {
      // Save payment
      const savedPayment = await manager.save(Payment, payment);

      // Create transaction record
      const transaction = manager.create(Transaction, {
        paymentId: savedPayment.id,
        userId: contract.freelancerId,
        type: TransactionType.ESCROW_RELEASE,
        amount: milestone.amount,
        currency: milestone.currency || 'USD',
        description: `Payment for milestone: ${milestone.title}`,
        referenceId: uuidv4()
      });

      await manager.save(Transaction, transaction);

      // Update payment status
      savedPayment.status = PaymentStatus.COMPLETED;
      savedPayment.processedAt = new Date();
      savedPayment.completedAt = new Date();

      const updatedPayment = await manager.save(Payment, savedPayment);

      // Notify the freelancer
      await this.notifyPaymentReleased(updatedPayment);

      return updatedPayment;
    });
  }

  // Create payment for time logs
  async createTimeLogPayment(
    timeLogId: string,
    userId: string
  ): Promise<Payment> {
    const timeLog = await this.timeLogRepository.findOne({
      where: { id: timeLogId },
      relations: ['contract']
    });

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    const contract = timeLog.contract;

    // Only the client can pay for time logs
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can pay for time logs');
    }

    // Contract must be active
    if (contract.status !== 'active') {
      throw new BadRequestException('Time logs can only be paid for active contracts');
    }

    // Contract must be hourly
    if (contract.contractType !== ContractType.HOURLY) {
      throw new BadRequestException('Time logs can only be paid for hourly contracts');
    }

    // Check if time log is already paid
    const existingPayment = await this.paymentRepository.find({
      where: {
        contractId: contract.id,
        description: Like(`%${timeLogId}%`),
        status: Not(In([PaymentStatus.FAILED, PaymentStatus.REFUNDED]))
      }
    });

    if (existingPayment.length > 0) {
      throw new BadRequestException('This time log is already paid');
    }

    // Calculate payment amount
    const hourlyRate = contract.hourlyRate;
    const hours = timeLog.duration / 60;
    const amount = Math.round(hourlyRate * hours);

    // Create payment record
    const payment = this.paymentRepository.create({
      contractId: contract.id,
      payerId: contract.clientId,
      payeeId: contract.freelancerId,
      companyId: contract.companyId,
      amount,
      currency: contract.currency || 'USD',
      status: PaymentStatus.PENDING,
      description: `Payment for time log (${timeLogId})`,
      isEscrow: false,
      // Calculate platform fee (5%)
      feeAmount: Math.round(amount * 0.05)
    });

    // Start a transaction
    return this.connection.transaction(async (manager: EntityManager) => {
      // Save payment
      const savedPayment = await manager.save(Payment, payment);

      // Create transaction record
      const transaction = manager.create(Transaction, {
        paymentId: savedPayment.id,
        userId: contract.freelancerId,
        type: TransactionType.PAYMENT,
        amount,
        currency: contract.currency || 'USD',
        description: `Payment for ${hours.toFixed(1)} hours of work`,
        referenceId: uuidv4()
      });

      await manager.save(Transaction, transaction);

      // In a real system, we'd integrate with a payment processor here
      // For this demo, we'll simulate successful payment processing

      // Update payment status
      savedPayment.status = PaymentStatus.COMPLETED;
      savedPayment.processedAt = new Date();
      savedPayment.completedAt = new Date();

      const updatedPayment = await manager.save(Payment, savedPayment);

      // Notify the freelancer
      await this.notifyPaymentReleased(updatedPayment);

      return updatedPayment;
    });
  }

  // Create manual payment
  async createManualPayment(
    createPaymentDto: CreateManualPaymentDto,
    userId: string
  ): Promise<Payment> {
    const { contractId, amount, description, currency = 'USD' } = createPaymentDto;

    const contract = await this.contractRepository.findOne({
      where: { id: contractId }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Only the client can make manual payments
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can make manual payments');
    }

    // Contract must be active
    if (contract.status !== 'active') {
      throw new BadRequestException('Payments can only be made for active contracts');
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      contractId,
      payerId: contract.clientId,
      payeeId: contract.freelancerId,
      companyId: contract.companyId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      description: description || 'Manual payment',
      isEscrow: false,
      // Calculate platform fee (5%)
      feeAmount: Math.round(amount * 0.05)
    });

    // Start a transaction
    return this.connection.transaction(async (manager: EntityManager) => {
      // Save payment
      const savedPayment = await manager.save(Payment, payment);

      // Create transaction record
      const transaction = manager.create(Transaction, {
        paymentId: savedPayment.id,
        userId: contract.freelancerId,
        type: TransactionType.PAYMENT,
        amount,
        currency,
        description: description || 'Manual payment',
        referenceId: uuidv4()
      });

      await manager.save(Transaction, transaction);

      // In a real system, we'd integrate with a payment processor here
      // For this demo, we'll simulate successful payment processing

      // Update payment status
      savedPayment.status = PaymentStatus.COMPLETED;
      savedPayment.processedAt = new Date();
      savedPayment.completedAt = new Date();

      const updatedPayment = await manager.save(Payment, savedPayment);

      // Notify the freelancer
      await this.notifyPaymentReleased(updatedPayment);

      return updatedPayment;
    });
  }

  // Refund a payment
  async refundPayment(paymentId: string, userId: string, reason: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['contract']
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only the payer can refund a payment
    if (payment.payerId !== userId) {
      throw new ForbiddenException('Only the payer can refund a payment');
    }

    // Payment must be completed to be refunded
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    // Escrow payments need special handling
    if (payment.isEscrow) {
      throw new BadRequestException('Escrow payments cannot be directly refunded. Please cancel the milestone instead.');
    }

    // Start a transaction
    return this.connection.transaction(async (manager: EntityManager) => {
      // Create refund transaction
      const transaction = manager.create(Transaction, {
        paymentId: payment.id,
        userId: payment.payerId,
        type: TransactionType.REFUND,
        amount: payment.amount,
        currency: payment.currency,
        description: `Refund: ${reason || 'No reason provided'}`,
        referenceId: uuidv4()
      });

      await manager.save(Transaction, transaction);

      // Update payment status
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();

      const updatedPayment = await manager.save(Payment, payment);

      // Notify the payee
      await this.notifyPaymentRefunded(updatedPayment, reason);

      return updatedPayment;
    });
  }

  // Get transaction history for a user
  async getUserTransactions(
    userId: string,
    params: {
      type?: TransactionType;
    } & PaginationParams
  ): Promise<{ items: Transaction[]; totalCount: number }> {
    const { type, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.payment', 'payment')
      .where('transaction.userId = :userId', { userId });

    // Filter by type
    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    // Order by most recent first
    queryBuilder.orderBy('transaction.createdAt', 'DESC');

    const [items, totalCount] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add formatted amounts
    const enhancedItems = items.map(transaction => {
      // Format amount
      const currency = transaction.currency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });

      transaction.formattedAmount = formatter.format(transaction.amount);

      if (transaction.balanceAfter !== null) {
        transaction.formattedBalanceAfter = formatter.format(transaction.balanceAfter);
      }

      return transaction;
    });

    return { items: enhancedItems, totalCount };
  }

  // Notification methods
  private async notifyMilestoneFunded(payment: Payment): Promise<void> {
    try {
      const milestone = await this.milestoneRepository.findOne({
        where: { id: payment.milestoneId },
        relations: ['contract']
      });

      if (!milestone || !milestone.contract) return;

      // Notify the freelancer
      await this.notificationsService.createNotification({
        userId: payment.payeeId,
        title: 'Milestone Funded',
        message: `The milestone "${milestone.title}" has been funded and is ready to start`,
        type: 'milestone_funded',
        linkUrl: `/contracts/${milestone.contractId}`,
        data: {
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          paymentId: payment.id
        }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  private async notifyPaymentReleased(payment: Payment): Promise<void> {
    try {
      let title = 'Payment Received';
      let message = `You have received a payment of ${payment.formattedAmount}`;

      if (payment.contractId) {
        const contract = await this.contractRepository.findOne({
          where: { id: payment.contractId }
        });

        if (contract) {
          message += ` for "${contract.title}"`;
        }
      }

      if (payment.milestoneId) {
        const milestone = await this.milestoneRepository.findOne({
          where: { id: payment.milestoneId }
        });

        if (milestone) {
          title = 'Milestone Payment Received';
          message = `You have received a payment for the milestone "${milestone.title}"`;
        }
      }

      // Notify the freelancer
      await this.notificationsService.createNotification({
        userId: payment.payeeId,
        title,
        message,
        type: 'payment_received',
        linkUrl: `/payments/${payment.id}`,
        data: {
          paymentId: payment.id,
          contractId: payment.contractId,
          milestoneId: payment.milestoneId,
          amount: payment.amount
        }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  private async notifyPaymentRefunded(payment: Payment, reason: string): Promise<void> {
    try {
      // Notify the payee
      await this.notificationsService.createNotification({
        userId: payment.payeeId,
        title: 'Payment Refunded',
        message: `A payment of ${payment.formattedAmount} has been refunded. Reason: ${reason || 'No reason provided'}`,
        type: 'payment_refunded',
        linkUrl: `/payments/${payment.id}`,
        data: {
          paymentId: payment.id,
          contractId: payment.contractId,
          milestoneId: payment.milestoneId,
          amount: payment.amount,
          reason
        }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }
}