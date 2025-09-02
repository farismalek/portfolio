import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { Contract, ContractStatus, ContractType } from './entities/contract.entity';
import { ContractMilestone, MilestoneStatus } from './entities/contract-milestone.entity';
import { ContractTimeLog } from './entities/contract-time-log.entity';
import { FreelanceProject, ProjectStatus } from '../entities/freelance-project.entity';
import { ProjectProposal, ProposalStatus } from '../entities/project-proposal.entity';
import { User } from '../../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { UpdateMilestoneStatusDto } from './dto/update-milestone-status.dto';
import { CreateTimeLogDto } from './dto/create-time-log.dto';
import { PaginationParams } from '../../../common/dto/pagination-params.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ContractMilestone)
    private milestoneRepository: Repository<ContractMilestone>,
    @InjectRepository(ContractTimeLog)
    private timeLogRepository: Repository<ContractTimeLog>,
    @InjectRepository(FreelanceProject)
    private projectRepository: Repository<FreelanceProject>,
    @InjectRepository(ProjectProposal)
    private proposalRepository: Repository<ProjectProposal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private paymentsService: PaymentsService,
    private notificationsService: NotificationsService,
  ) { }

  // Find contracts by client or freelancer
  async findContracts(
    userId: string,
    params: {
      status?: ContractStatus[];
      role?: 'client' | 'freelancer';
      companyId?: string;
    } & PaginationParams
  ): Promise<{ items: Contract[]; totalCount: number }> {
    const { status, role, companyId, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    // Build query based on role
    const queryBuilder = this.contractRepository.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.client', 'client')
      .leftJoinAndSelect('contract.freelancer', 'freelancer')
      .leftJoinAndSelect('contract.company', 'company')
      .leftJoinAndSelect('contract.project', 'project')
      .leftJoinAndSelect('contract.milestones', 'milestones')
      .leftJoinAndSelect('freelancer.profiles', 'freelancerProfiles')
      .leftJoinAndSelect('client.profiles', 'clientProfiles');

    if (role === 'client') {
      queryBuilder.where('contract.clientId = :userId', { userId });
    } else if (role === 'freelancer') {
      queryBuilder.where('contract.freelancerId = :userId', { userId });
    } else {
      queryBuilder.where('(contract.clientId = :userId OR contract.freelancerId = :userId)', { userId });
    }

    // Filter by company if provided
    if (companyId) {
      queryBuilder.andWhere('contract.companyId = :companyId', { companyId });
    }

    // Filter by status if provided
    if (status && status.length > 0) {
      queryBuilder.andWhere('contract.status IN (:...status)', { status });
    }

    // Order by most recent first
    queryBuilder.orderBy('contract.updatedAt', 'DESC');

    const [items, totalCount] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add virtual fields to each contract
    const enhancedItems = await Promise.all(items.map(async (contract) => {
      // Format contract value
      const currency = contract.currency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });

      if (contract.contractType === ContractType.FIXED && contract.totalAmount) {
        contract.formattedValue = formatter.format(contract.totalAmount);
      } else if (contract.contractType === ContractType.HOURLY && contract.hourlyRate) {
        contract.formattedValue = `${formatter.format(contract.hourlyRate)}/hr`;
        if (contract.weeklyLimit) {
          contract.formattedValue += ` (${contract.weeklyLimit} hrs/week)`;
        }
      } else {
        contract.formattedValue = 'Value not specified';
      }

      // Calculate contract metrics
      contract.isActive = [ContractStatus.ACTIVE, ContractStatus.PENDING].includes(contract.status);
      contract.isSigned = !!contract.signedByClientAt && !!contract.signedByFreelancerAt;

      // Calculate completion percentage based on milestones for fixed contracts
      if (contract.contractType === ContractType.FIXED && contract.milestones?.length > 0) {
        const totalMilestones = contract.milestones.length;
        const completedMilestones = contract.milestones.filter(
          m => m.status === MilestoneStatus.APPROVED
        ).length;

        contract.completionPercentage = Math.round((completedMilestones / totalMilestones) * 100);
      } else {
        contract.completionPercentage = contract.status === ContractStatus.COMPLETED ? 100 : 0;
      }

      // Calculate payment amounts
      const payments = await this.paymentRepository.find({
        where: { contractId: contract.id }
      });

      contract.paidAmount = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);

      if (contract.contractType === ContractType.FIXED && contract.totalAmount) {
        contract.remainingAmount = contract.totalAmount - contract.paidAmount;
      } else {
        contract.remainingAmount = 0;
      }

      return contract;
    }));

    return { items: enhancedItems, totalCount };
  }

  // Find a specific contract by ID
  async findOne(id: string, userId: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: [
        'client',
        'freelancer',
        'company',
        'project',
        'proposal',
        'milestones',
        'timeLogs',
        'timeLogs.freelancer',
        'payments',
        'freelancer.profiles',
        'client.profiles'
      ],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check if user is part of this contract
    const isParticipant = contract.clientId === userId || contract.freelancerId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('You do not have permission to view this contract');
    }

    // Format contract value
    const currency = contract.currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });

    if (contract.contractType === ContractType.FIXED && contract.totalAmount) {
      contract.formattedValue = formatter.format(contract.totalAmount);
    } else if (contract.contractType === ContractType.HOURLY && contract.hourlyRate) {
      contract.formattedValue = `${formatter.format(contract.hourlyRate)}/hr`;
      if (contract.weeklyLimit) {
        contract.formattedValue += ` (${contract.weeklyLimit} hrs/week)`;
      }
    } else {
      contract.formattedValue = 'Value not specified';
    }

    // Calculate contract metrics
    contract.isActive = [ContractStatus.ACTIVE, ContractStatus.PENDING].includes(contract.status);
    contract.isSigned = !!contract.signedByClientAt && !!contract.signedByFreelancerAt;

    // Calculate completion percentage based on milestones for fixed contracts
    if (contract.contractType === ContractType.FIXED && contract.milestones?.length > 0) {
      const totalMilestones = contract.milestones.length;
      const completedMilestones = contract.milestones.filter(
        m => m.status === MilestoneStatus.APPROVED
      ).length;

      contract.completionPercentage = Math.round((completedMilestones / totalMilestones) * 100);
    } else {
      contract.completionPercentage = contract.status === ContractStatus.COMPLETED ? 100 : 0;
    }

    // Format milestone amounts
    if (contract.milestones?.length > 0) {
      contract.milestones.forEach(milestone => {
        milestone.formattedAmount = formatter.format(milestone.amount);

        // Calculate if milestone is paid
        milestone.isPaid = contract.payments?.some(
          payment => payment.milestoneId === milestone.id && payment.status === 'completed'
        ) || false;

        // Calculate days until due
        if (milestone.dueDate) {
          const now = new Date();
          const dueDate = new Date(milestone.dueDate);
          const diffTime = dueDate.getTime() - now.getTime();
          milestone.daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          milestone.isOverdue = milestone.daysUntilDue < 0 &&
            milestone.status !== MilestoneStatus.APPROVED;
        } else {
          milestone.daysUntilDue = null;
          milestone.isOverdue = false;
        }
      });

      // Sort milestones by order index
      contract.milestones.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    // Format time logs
    if (contract.timeLogs?.length > 0) {
      contract.timeLogs.forEach(timeLog => {
        // Format duration
        const hours = Math.floor(timeLog.duration / 60);
        const minutes = timeLog.duration % 60;
        timeLog.formattedDuration = `${hours}h ${minutes}m`;

        // Calculate billable amount
        if (contract.hourlyRate && timeLog.isBillable) {
          const hourlyRate = contract.hourlyRate;
          timeLog.billableAmount = Math.round(hourlyRate * (timeLog.duration / 60));
          timeLog.formattedAmount = formatter.format(timeLog.billableAmount);
        } else {
          timeLog.billableAmount = 0;
          timeLog.formattedAmount = formatter.format(0);
        }
      });

      // Sort time logs by date (newest first)
      contract.timeLogs.sort((a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    }

    // Calculate payment amounts
    contract.paidAmount = contract.payments
      ?.filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0) || 0;

    if (contract.contractType === ContractType.FIXED && contract.totalAmount) {
      contract.remainingAmount = contract.totalAmount - contract.paidAmount;
    } else {
      contract.remainingAmount = 0;
    }

    return contract;
  }

  // Create a contract manually
  async create(createContractDto: CreateContractDto, creatorId: string): Promise<Contract> {
    const {
      clientId,
      freelancerId,
      companyId,
      projectId,
      title,
      description,
      contractType,
      startDate,
      endDate,
      totalAmount,
      currency,
      hourlyRate,
      weeklyLimit,
      terms,
      milestones,
    } = createContractDto;

    // Validate that creator is either client or authorized company representative
    if (creatorId !== clientId) {
      throw new ForbiddenException('Only the client can create contracts');
    }

    // Create contract record
    const contract = this.contractRepository.create({
      clientId,
      freelancerId,
      companyId,
      projectId,
      title,
      description,
      contractType,
      startDate,
      endDate,
      totalAmount,
      currency: currency || 'USD',
      hourlyRate,
      weeklyLimit,
      terms,
      status: ContractStatus.DRAFT,
    });

    const savedContract = await this.contractRepository.save(contract);

    // Create milestones if provided
    if (milestones && milestones.length > 0) {
      let orderIndex = 0;
      const milestoneEntities = milestones.map(milestone => {
        return this.milestoneRepository.create({
          ...milestone,
          contractId: savedContract.id,
          currency: currency || 'USD',
          orderIndex: orderIndex++,
        });
      });

      await this.milestoneRepository.save(milestoneEntities);
    } else if (contractType === ContractType.FIXED && totalAmount) {
      // Create a single milestone for the total amount
      const milestone = this.milestoneRepository.create({
        contractId: savedContract.id,
        title: 'Complete Project',
        description: 'Complete all deliverables as specified in the contract',
        amount: totalAmount,
        currency: currency || 'USD',
        orderIndex: 0,
      });

      await this.milestoneRepository.save(milestone);
    }

    // Notify freelancer of new contract
    await this.notifyContractCreation(savedContract);

    return this.findOne(savedContract.id, creatorId);
  }

  // Create a contract from an accepted proposal
  async createFromProposal(proposal: ProjectProposal, userId: string): Promise<Contract> {
    // Get the project
    const project = await this.projectRepository.findOne({
      where: { id: proposal.projectId }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user is authorized to create the contract
    const isClient = project.clientId === userId;
    if (!isClient) {
      throw new ForbiddenException('Only the client can create contracts from proposals');
    }

    // Check if a contract already exists for this proposal
    const existingContract = await this.contractRepository.findOne({
      where: { proposalId: proposal.id }
    });

    if (existingContract) {
      throw new ConflictException('A contract already exists for this proposal');
    }

    // Determine contract type and payment terms from the proposal
    const contractType = proposal.paymentType === 'hourly' ?
      ContractType.HOURLY : ContractType.FIXED;

    // Create contract
    const contract = this.contractRepository.create({
      projectId: project.id,
      proposalId: proposal.id,
      clientId: project.clientId,
      freelancerId: proposal.freelancerId,
      companyId: project.companyId,
      title: `Contract for: ${project.title}`,
      description: project.description,
      contractType,
      status: ContractStatus.DRAFT,
      currency: proposal.paymentCurrency || 'USD',
    });

    // Set payment terms based on contract type
    if (contractType === ContractType.FIXED) {
      contract.totalAmount = proposal.paymentAmount;
    } else {
      contract.hourlyRate = proposal.paymentAmount;
      // Set a reasonable weekly limit (this could be customizable)
      contract.weeklyLimit = 40;
    }

    const savedContract = await this.contractRepository.save(contract);

    // Create milestones for fixed price contracts
    if (contractType === ContractType.FIXED) {
      // For simplicity, create a single milestone for the total amount
      // In a real-world scenario, this could be split into multiple milestones
      const milestone = this.milestoneRepository.create({
        contractId: savedContract.id,
        title: 'Complete Project',
        description: `Complete all deliverables as specified for "${project.title}"`,
        amount: proposal.paymentAmount,
        currency: proposal.paymentCurrency || 'USD',
        orderIndex: 0,
      });

      await this.milestoneRepository.save(milestone);
    }

    // Update project status to in_progress
    project.status = ProjectStatus.IN_PROGRESS;
    await this.projectRepository.save(project);

    // Notify freelancer of new contract
    await this.notifyContractCreation(savedContract);

    return this.findOne(savedContract.id, userId);
  }

  // Update a contract
  async update(id: string, updateContractDto: UpdateContractDto, userId: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['milestones']
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Only client can update contracts in draft status
    if (contract.status !== ContractStatus.DRAFT || contract.clientId !== userId) {
      throw new ForbiddenException('You cannot update this contract');
    }

    // Update contract fields
    Object.assign(contract, updateContractDto);

    const updatedContract = await this.contractRepository.save(contract);

    // If we're changing from draft to pending, notify the freelancer
    if (contract.status === ContractStatus.DRAFT &&
      updateContractDto.status === ContractStatus.PENDING) {
      await this.notifyContractStatusChange(updatedContract);
    }

    return this.findOne(updatedContract.id, userId);
  }

  // Sign a contract
  async signContract(id: string, userId: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check if user is part of this contract
    const isClient = contract.clientId === userId;
    const isFreelancer = contract.freelancerId === userId;

    if (!isClient && !isFreelancer) {
      throw new ForbiddenException('You are not authorized to sign this contract');
    }

    // Contract must be in PENDING status to be signed
    if (contract.status !== ContractStatus.PENDING) {
      throw new BadRequestException('Only contracts in pending status can be signed');
    }

    // Update the appropriate signature field
    if (isClient) {
      contract.signedByClientAt = new Date();
    } else if (isFreelancer) {
      contract.signedByFreelancerAt = new Date();
    }

    // If both parties have signed, change status to ACTIVE
    if (contract.signedByClientAt && contract.signedByFreelancerAt) {
      contract.status = ContractStatus.ACTIVE;
      contract.startDate = contract.startDate || new Date();
    }

    const updatedContract = await this.contractRepository.save(contract);

    // If contract is now active, notify both parties
    if (updatedContract.status === ContractStatus.ACTIVE) {
      await this.notifyContractActivated(updatedContract);

      // For fixed price contracts, automatically fund the first milestone
      if (updatedContract.contractType === ContractType.FIXED) {
        const firstMilestone = await this.milestoneRepository.findOne({
          where: { contractId: updatedContract.id },
          order: { orderIndex: 'ASC' },
        });

        if (firstMilestone) {
          try {
            await this.paymentsService.createMilestoneEscrowPayment(
              firstMilestone.id,
              updatedContract.clientId
            );
          } catch (error) {
            // Log error but don't fail the contract activation
            console.error('Error creating milestone escrow payment:', error);
          }
        }
      }
    } else {
      // Notify the other party that one party has signed
      await this.notifyContractSigned(updatedContract, userId);
    }

    return this.findOne(updatedContract.id, userId);
  }

  // Cancel a contract
  async cancelContract(
    id: string,
    userId: string,
    reason: string
  ): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['milestones']
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check if user is part of this contract
    const isClient = contract.clientId === userId;
    const isFreelancer = contract.freelancerId === userId;

    if (!isClient && !isFreelancer) {
      throw new ForbiddenException('You are not authorized to cancel this contract');
    }

    // Check if contract can be cancelled
    if (contract.status === ContractStatus.COMPLETED ||
      contract.status === ContractStatus.CANCELLED) {
      throw new BadRequestException('This contract cannot be cancelled');
    }

    // Update contract status
    contract.status = ContractStatus.CANCELLED;
    contract.cancelledAt = new Date();
    contract.cancelledById = userId;
    contract.cancellationReason = reason;

    const updatedContract = await this.contractRepository.save(contract);

    // Notify the other party
    await this.notifyContractCancelled(updatedContract);

    return this.findOne(updatedContract.id, userId);
  }

  // Complete a contract
  async completeContract(id: string, userId: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['milestones']
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Only the client can mark a contract as complete
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can mark a contract as complete');
    }

    // Contract must be active
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be completed');
    }

    // For fixed contracts, check that all milestones are completed
    if (contract.contractType === ContractType.FIXED) {
      const incompleteMilestones = contract.milestones.filter(
        m => m.status !== MilestoneStatus.APPROVED
      );

      if (incompleteMilestones.length > 0) {
        throw new BadRequestException('All milestones must be completed before finalizing the contract');
      }
    }

    // Update contract status
    contract.status = ContractStatus.COMPLETED;
    contract.completedAt = new Date();

    const updatedContract = await this.contractRepository.save(contract);

    // Notify the freelancer
    await this.notifyContractCompleted(updatedContract);

    return this.findOne(updatedContract.id, userId);
  }

  // MILESTONES

  // Add a milestone
  async addMilestone(
    contractId: string,
    milestoneDto: CreateMilestoneDto,
    userId: string
  ): Promise<ContractMilestone> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: ['milestones']
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Only the client can add milestones, and only for fixed price contracts
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can add milestones');
    }

    if (contract.contractType !== ContractType.FIXED) {
      throw new BadRequestException('Milestones can only be added to fixed price contracts');
    }

    // Check that the contract is in draft or pending status
    if (contract.status !== ContractStatus.DRAFT && contract.status !== ContractStatus.PENDING) {
      throw new BadRequestException('Milestones can only be added to draft or pending contracts');
    }

    // Get the highest existing milestone order index
    const highestOrderIndex = contract.milestones.length > 0 ?
      Math.max(...contract.milestones.map(m => m.orderIndex)) : -1;

    // Create the milestone
    const milestone = this.milestoneRepository.create({
      ...milestoneDto,
      contractId,
      currency: contract.currency || 'USD',
      orderIndex: highestOrderIndex + 1,
    });

    const savedMilestone = await this.milestoneRepository.save(milestone);

    // Recalculate total contract amount
    const milestones = await this.milestoneRepository.find({
      where: { contractId }
    });

    const totalAmount = milestones.reduce(
      (sum, milestone) => sum + milestone.amount, 0
    );

    contract.totalAmount = totalAmount;
    await this.contractRepository.save(contract);

    return savedMilestone;
  }

  // Update a milestone
  async updateMilestone(
    id: string,
    updateDto: UpdateMilestoneDto,
    userId: string
  ): Promise<ContractMilestone> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id },
      relations: ['contract']
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const contract = milestone.contract;

    // Only the client can update milestones
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can update milestones');
    }

    // Check that the contract is in draft or pending status
    if (contract.status !== ContractStatus.DRAFT && contract.status !== ContractStatus.PENDING) {
      throw new BadRequestException('Milestones can only be updated for draft or pending contracts');
    }

    // Check that the milestone is not already approved or paid
    if (milestone.status === MilestoneStatus.APPROVED) {
      throw new BadRequestException('Approved milestones cannot be updated');
    }

    // Update milestone fields
    Object.assign(milestone, updateDto);

    const updatedMilestone = await this.milestoneRepository.save(milestone);

    // If amount changed, recalculate total contract amount
    if (updateDto.amount !== undefined) {
      const milestones = await this.milestoneRepository.find({
        where: { contractId: contract.id }
      });

      const totalAmount = milestones.reduce(
        (sum, milestone) => sum + milestone.amount, 0
      );

      contract.totalAmount = totalAmount;
      await this.contractRepository.save(contract);
    }

    return updatedMilestone;
  }

  // Delete a milestone
  async deleteMilestone(id: string, userId: string): Promise<boolean> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id },
      relations: ['contract']
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const contract = milestone.contract;

    // Only the client can delete milestones
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can delete milestones');
    }

    // Check that the contract is in draft status
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Milestones can only be deleted for draft contracts');
    }

    // Delete the milestone
    await this.milestoneRepository.remove(milestone);

    // Reorder remaining milestones
    const milestones = await this.milestoneRepository.find({
      where: { contractId: contract.id },
      order: { orderIndex: 'ASC' }
    });

    for (let i = 0; i < milestones.length; i++) {
      milestones[i].orderIndex = i;
    }

    await this.milestoneRepository.save(milestones);

    // Recalculate total contract amount
    const totalAmount = milestones.reduce(
      (sum, milestone) => sum + milestone.amount, 0
    );

    contract.totalAmount = totalAmount;
    await this.contractRepository.save(contract);

    return true;
  }

  // Update milestone status
  async updateMilestoneStatus(
    id: string,
    updateDto: UpdateMilestoneStatusDto,
    userId: string
  ): Promise<ContractMilestone> {
    const { status, rejectionReason, attachmentUrls } = updateDto;

    const milestone = await this.milestoneRepository.findOne({
      where: { id },
      relations: ['contract']
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const contract = milestone.contract;

    // Check contract is active
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Milestone status can only be updated for active contracts');
    }

    // Check permissions based on the requested status change
    if (status === MilestoneStatus.SUBMITTED) {
      // Only freelancer can submit milestones
      if (contract.freelancerId !== userId) {
        throw new ForbiddenException('Only the freelancer can submit milestones');
      }

      // Milestone must be in pending or in_progress status
      if (milestone.status !== MilestoneStatus.PENDING &&
        milestone.status !== MilestoneStatus.IN_PROGRESS) {
        throw new BadRequestException('Only pending or in-progress milestones can be submitted');
      }

      milestone.submittedAt = new Date();
      if (attachmentUrls) {
        milestone.attachmentUrls = attachmentUrls;
      }
    }
    else if (status === MilestoneStatus.APPROVED || status === MilestoneStatus.REJECTED) {
      // Only client can approve/reject milestones
      if (contract.clientId !== userId) {
        throw new ForbiddenException('Only the client can approve or reject milestones');
      }

      // Milestone must be in submitted status
      if (milestone.status !== MilestoneStatus.SUBMITTED) {
        throw new BadRequestException('Only submitted milestones can be approved or rejected');
      }

      if (status === MilestoneStatus.APPROVED) {
        milestone.approvedAt = new Date();
        milestone.approvedById = userId;

        // Process payment
        try {
          await this.paymentsService.releaseMilestonePayment(milestone.id, userId);
        } catch (error) {
          console.error('Failed to release milestone payment:', error);
          throw new BadRequestException('Failed to process payment for this milestone');
        }
      }
      else if (status === MilestoneStatus.REJECTED) {
        if (!rejectionReason) {
          throw new BadRequestException('Rejection reason is required');
        }
        milestone.rejectedAt = new Date();
        milestone.rejectedById = userId;
        milestone.rejectionReason = rejectionReason;
      }
    }
    else if (status === MilestoneStatus.IN_PROGRESS) {
      // Either party can mark milestone as in-progress
      if (contract.clientId !== userId && contract.freelancerId !== userId) {
        throw new ForbiddenException('You are not authorized to update this milestone');
      }

      // Milestone must be in pending status
      if (milestone.status !== MilestoneStatus.PENDING) {
        throw new BadRequestException('Only pending milestones can be marked as in-progress');
      }

      milestone.inProgressAt = new Date();

      // If client is starting the milestone, ensure escrow payment
      if (contract.clientId === userId) {
        try {
          await this.paymentsService.createMilestoneEscrowPayment(milestone.id, userId);
        } catch (error) {
          console.error('Failed to create milestone escrow payment:', error);
          throw new BadRequestException('Failed to process escrow payment for this milestone');
        }
      }
    }
    else {
      throw new BadRequestException('Invalid milestone status');
    }

    // Update milestone status
    milestone.status = status;
    const updatedMilestone = await this.milestoneRepository.save(milestone);

    // Send notifications
    await this.notifyMilestoneStatusChange(updatedMilestone, userId);

    return updatedMilestone;
  }

  // TIME LOGS

  // Create a time log
  async createTimeLog(
    contractId: string,
    timeLogDto: CreateTimeLogDto,
    userId: string
  ): Promise<ContractTimeLog> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Only the freelancer can log time
    if (contract.freelancerId !== userId) {
      throw new ForbiddenException('Only the freelancer can log time');
    }

    // Contract must be active
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Time can only be logged for active contracts');
    }

    // Contract must be hourly
    if (contract.contractType !== ContractType.HOURLY) {
      throw new BadRequestException('Time can only be logged for hourly contracts');
    }

    const { startTime, endTime, description, isBillable = true } = timeLogDto;

    // Validate time log
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    // Calculate duration in minutes
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    // Create time log
    const timeLog = this.timeLogRepository.create({
      contractId,
      freelancerId: userId,
      startTime: start,
      endTime: end,
      duration: durationMinutes,
      description,
      isBillable,
    });

    const savedTimeLog = await this.timeLogRepository.save(timeLog);

    // Notify the client of the new time log
    await this.notifyNewTimeLog(savedTimeLog);

    return savedTimeLog;
  }

  // Get time logs for a contract
  async getTimeLogs(
    contractId: string,
    params: PaginationParams & {
      startDate?: Date;
      endDate?: Date;
      status?: 'approved' | 'pending' | 'rejected';
    },
    userId: string
  ): Promise<{ items: ContractTimeLog[]; totalCount: number; summary: any }> {
    const { page = 1, limit = 10, startDate, endDate, status } = params;
    const skip = (page - 1) * limit;

    const contract = await this.contractRepository.findOne({
      where: { id: contractId }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check if user is part of this contract
    const isParticipant = contract.clientId === userId || contract.freelancerId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('You are not authorized to view these time logs');
    }

    // Build query
    const queryBuilder = this.timeLogRepository.createQueryBuilder('timeLog')
      .leftJoinAndSelect('timeLog.freelancer', 'freelancer')
      .where('timeLog.contractId = :contractId', { contractId });

    if (startDate) {
      queryBuilder.andWhere('timeLog.startTime >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('timeLog.endTime <= :endDate', { endDate });
    }

    if (status === 'approved') {
      queryBuilder.andWhere('timeLog.isApproved = TRUE');
    } else if (status === 'pending') {
      queryBuilder.andWhere('timeLog.isApproved IS NULL');
    } else if (status === 'rejected') {
      queryBuilder.andWhere('timeLog.rejectedAt IS NOT NULL');
    }

    // Get time logs
    const [timeLogs, totalCount] = await queryBuilder
      .orderBy('timeLog.startTime', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Format time logs
    const currency = contract.currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });

    const enhancedTimeLogs = timeLogs.map(timeLog => {
      // Format duration
      const hours = Math.floor(timeLog.duration / 60);
      const minutes = timeLog.duration % 60;
      timeLog.formattedDuration = `${hours}h ${minutes}m`;

      // Calculate billable amount
      if (contract.hourlyRate && timeLog.isBillable) {
        const hourlyRate = contract.hourlyRate;
        timeLog.billableAmount = Math.round(hourlyRate * (timeLog.duration / 60));
        timeLog.formattedAmount = formatter.format(timeLog.billableAmount);
      } else {
        timeLog.billableAmount = 0;
        timeLog.formattedAmount = formatter.format(0);
      }

      return timeLog;
    });

    // Calculate summary statistics
    const allTimeLogs = await this.timeLogRepository.find({
      where: { contractId }
    });

    // Calculate total duration
    const totalDuration = allTimeLogs.reduce((sum, log) => sum + log.duration, 0);
    const totalHours = Math.floor(totalDuration / 60);
    const totalMinutes = totalDuration % 60;

    // Calculate billable hours and amount
    const billableLogs = allTimeLogs.filter(log => log.isBillable);
    const billableDuration = billableLogs.reduce((sum, log) => sum + log.duration, 0);
    const billableHours = billableDuration / 60;
    const billableAmount = Math.round(contract.hourlyRate * billableHours);

    // Calculate approved, pending, and rejected hours
    const approvedLogs = allTimeLogs.filter(log => log.isApproved === true);
    const approvedDuration = approvedLogs.reduce((sum, log) => sum + log.duration, 0);
    const approvedHours = approvedDuration / 60;

    const pendingLogs = allTimeLogs.filter(log => log.isApproved === null && !log.rejectedAt);
    const pendingDuration = pendingLogs.reduce((sum, log) => sum + log.duration, 0);
    const pendingHours = pendingDuration / 60;

    const rejectedLogs = allTimeLogs.filter(log => log.rejectedAt);
    const rejectedDuration = rejectedLogs.reduce((sum, log) => sum + log.duration, 0);
    const rejectedHours = rejectedDuration / 60;

    // Prepare summary
    const summary = {
      totalHours: `${totalHours}h ${totalMinutes}m`,
      totalHoursDecimal: +(totalDuration / 60).toFixed(2),
      billableHours: +billableHours.toFixed(2),
      billableAmount,
      formattedBillableAmount: formatter.format(billableAmount),
      approvedHours: +approvedHours.toFixed(2),
      approvedAmount: Math.round(contract.hourlyRate * approvedHours),
      formattedApprovedAmount: formatter.format(Math.round(contract.hourlyRate * approvedHours)),
      pendingHours: +pendingHours.toFixed(2),
      pendingAmount: Math.round(contract.hourlyRate * pendingHours),
      formattedPendingAmount: formatter.format(Math.round(contract.hourlyRate * pendingHours)),
      rejectedHours: +rejectedHours.toFixed(2)
    };

    return {
      items: enhancedTimeLogs,
      totalCount,
      summary
    };
  }

  // Approve or reject time logs
  async approveTimeLog(
    timeLogId: string,
    isApproved: boolean,
    rejectionReason: string | null,
    userId: string
  ): Promise<ContractTimeLog> {
    const timeLog = await this.timeLogRepository.findOne({
      where: { id: timeLogId },
      relations: ['contract']
    });

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    const contract = timeLog.contract;

    // Only the client can approve/reject time logs
    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can approve or reject time logs');
    }

    // Time logs can only be approved/rejected for active contracts
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Time logs can only be approved or rejected for active contracts');
    }

    if (isApproved) {
      timeLog.isApproved = true;
      timeLog.approvedAt = new Date();
      timeLog.approvedById = userId;
      timeLog.rejectedAt = null;
      timeLog.rejectionReason = null;

      // If this is billable, create a payment
      if (timeLog.isBillable) {
        const hourlyRate = contract.hourlyRate;
        const hours = timeLog.duration / 60;
        const amount = Math.round(hourlyRate * hours);

        // Create payment
        try {
          await this.paymentsService.createTimeLogPayment(timeLog.id, userId);
        } catch (error) {
          console.error('Failed to create time log payment:', error);
          // Don't fail the approval if payment fails - it can be retried
        }
      }
    } else {
      if (!rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }

      timeLog.isApproved = false;
      timeLog.rejectedAt = new Date();
      timeLog.rejectionReason = rejectionReason;
      timeLog.approvedAt = null;
      timeLog.approvedById = null;
    }

    const updatedTimeLog = await this.timeLogRepository.save(timeLog);

    // Notify the freelancer of the approval/rejection
    await this.notifyTimeLogStatusChange(updatedTimeLog);

    return updatedTimeLog;
  }

  // Notification methods
  private async notifyContractCreation(contract: Contract): Promise<void> {
    try {
      // Notify the freelancer
      await this.notificationsService.createNotification({
        userId: contract.freelancerId,
        title: 'New Contract Received',
        message: `You have received a new contract: "${contract.title}"`,
        type: 'contract_created',
        linkUrl: `/contracts/${contract.id}`,
        data: {
          contractId: contract.id,
          contractTitle: contract.title
        }
      });
    } catch (error) {
      console.error('Error sending contract notification:', error);
    }
  }

  private async notifyContractStatusChange(contract: Contract): Promise<void> {
    try {
      if (contract.status === ContractStatus.PENDING) {
        // Notify the freelancer that contract is ready for review
        await this.notificationsService.createNotification({
          userId: contract.freelancerId,
          title: 'Contract Ready for Review',
          message: `The contract "${contract.title}" is ready for your review and signature`,
          type: 'contract_pending',
          linkUrl: `/contracts/${contract.id}`,
          data: {
            contractId: contract.id,
            contractTitle: contract.title
          }
        });
      }
    } catch (error) {
      console.error('Error sending contract notification:', error);
    }
  }

  private async notifyContractSigned(contract: Contract, signedById: string): Promise<void> {
    try {
      // Notify the other party
      const recipientId = signedById === contract.clientId ?
        contract.freelancerId : contract.clientId;

      const signer = await this.userRepository.findOne({
        where: { id: signedById }
      });

      if (!signer) return;

      await this.notificationsService.createNotification({
        userId: recipientId,
        title: 'Contract Signed',
        message: `${signer.firstName} ${signer.lastName} has signed the contract "${contract.title}"`,
        type: 'contract_signed',
        linkUrl: `/contracts/${contract.id}`,
        data: {
          contractId: contract.id,
          contractTitle: contract.title,
          signedBy: signedById
        }
      });
    } catch (error) {
      console.error('Error sending contract notification:', error);
    }
  }

  private async notifyContractActivated(contract: Contract): Promise<void> {
    try {
      // Notify both parties
      const message = `The contract "${contract.title}" is now active and work can begin`;

      // Notify client
      await this.notificationsService.createNotification({
        userId: contract.clientId,
        title: 'Contract Activated',
        message,
        type: 'contract_activated',
        linkUrl: `/contracts/${contract.id}`,
        data: {
          contractId: contract.id,
          contractTitle: contract.title
        }
      });

      // Notify freelancer
      await this.notificationsService.createNotification({
        userId: contract.freelancerId,
        title: 'Contract Activated',
        message,
        type: 'contract_activated',
        linkUrl: `/contracts/${contract.id}`,
        data: {
          contractId: contract.id,
          contractTitle: contract.title
        }
      });
    } catch (error) {
      console.error('Error sending contract notification:', error);
    }
  }

  private async notifyContractCancelled(contract: Contract): Promise<void> {
    try {
      // Notify the party who didn't cancel
      const cancelledBy = await this.userRepository.findOne({
        where: { id: contract.cancelledById }
      });

      if (!cancelledBy) return;

      const recipientId = contract.cancelledById === contract.clientId ?
        contract.freelancerId : contract.clientId;

      await this.notificationsService.createNotification({
        userId: recipientId,
        title: 'Contract Cancelled',
        message: `${cancelledBy.firstName} ${cancelledBy.lastName} has cancelled the contract "${contract.title}"`,
        type: 'contract_cancelled',
        linkUrl: `/contracts/${contract.id}`,
        data: {
          contractId: contract.id,
          contractTitle: contract.title,
          cancelledBy: contract.cancelledById,
          reason: contract.cancellationReason
        }
      });
    } catch (error) {
      console.error('Error sending contract notification:', error);
    }
  }

  private async notifyContractCompleted(contract: Contract): Promise<void> {
    try {
      // Notify the freelancer
      await this.notificationsService.createNotification({
        userId: contract.freelancerId,
        title: 'Contract Completed',
        message: `The contract "${contract.title}" has been marked as completed`,
        type: 'contract_completed',
        linkUrl: `/contracts/${contract.id}`,
        data: {
          contractId: contract.id,
          contractTitle: contract.title
        }
      });
    } catch (error) {
      console.error('Error sending contract notification:', error);
    }
  }

  private async notifyMilestoneStatusChange(milestone: ContractMilestone, userId: string): Promise<void> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id: milestone.contractId },
        relations: ['client', 'freelancer']
      });

      if (!contract) return;

      if (milestone.status === MilestoneStatus.SUBMITTED) {
        // Notify the client that milestone is submitted
        await this.notificationsService.createNotification({
          userId: contract.clientId,
          title: 'Milestone Submitted',
          message: `A milestone for "${contract.title}" has been submitted for review`,
          type: 'milestone_submitted',
          linkUrl: `/contracts/${contract.id}`,
          data: {
            contractId: contract.id,
            milestoneId: milestone.id,
            milestoneTitle: milestone.title
          }
        });
      }
      else if (milestone.status === MilestoneStatus.APPROVED) {
        // Notify the freelancer that milestone is approved
        await this.notificationsService.createNotification({
          userId: contract.freelancerId,
          title: 'Milestone Approved',
          message: `Your milestone "${milestone.title}" for contract "${contract.title}" has been approved`,
          type: 'milestone_approved',
          linkUrl: `/contracts/${contract.id}`,
          data: {
            contractId: contract.id,
            milestoneId: milestone.id,
            milestoneTitle: milestone.title
          }
        });
      }
      else if (milestone.status === MilestoneStatus.REJECTED) {
        // Notify the freelancer that milestone is rejected
        await this.notificationsService.createNotification({
          userId: contract.freelancerId,
          title: 'Milestone Needs Changes',
          message: `Your milestone "${milestone.title}" for contract "${contract.title}" requires changes`,
          type: 'milestone_rejected',
          linkUrl: `/contracts/${contract.id}`,
          data: {
            contractId: contract.id,
            milestoneId: milestone.id,
            milestoneTitle: milestone.title,
            reason: milestone.rejectionReason
          }
        });
      }
      else if (milestone.status === MilestoneStatus.IN_PROGRESS) {
        // Determine who should be notified
        const notifyUserId = userId === contract.clientId ?
          contract.freelancerId : contract.clientId;

        // Notify the other party
        await this.notificationsService.createNotification({
          userId: notifyUserId,
          title: 'Milestone Started',
          message: `Milestone "${milestone.title}" for contract "${contract.title}" has been started`,
          type: 'milestone_started',
          linkUrl: `/contracts/${contract.id}`,
          data: {
            contractId: contract.id,
            milestoneId: milestone.id,
            milestoneTitle: milestone.title
          }
        });
      }
    } catch (error) {
      console.error('Error sending milestone notification:', error);
    }
  }

  private async notifyNewTimeLog(timeLog: ContractTimeLog): Promise<void> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id: timeLog.contractId }
      });

      if (!contract) return;

      const freelancer = await this.userRepository.findOne({
        where: { id: timeLog.freelancerId }
      });

      if (!freelancer) return;

      // Format duration
      const hours = Math.floor(timeLog.duration / 60);
      const minutes = timeLog.duration % 60;
      const formattedDuration = `${hours}h ${minutes}m`;

      // Notify the client
      await this.notificationsService.createNotification({
        userId: contract.clientId,
        title: 'New Time Log Submitted',
        message: `${freelancer.firstName} ${freelancer.lastName} logged ${formattedDuration} of work for "${contract.title}"`,
        type: 'time_log_added',
        linkUrl: `/contracts/${contract.id}?tab=time`,
        data: {
          contractId: contract.id,
          timeLogId: timeLog.id,
          duration: timeLog.duration
        }
      });
    } catch (error) {
      console.error('Error sending time log notification:', error);
    }
  }

  private async notifyTimeLogStatusChange(timeLog: ContractTimeLog): Promise<void> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id: timeLog.contractId }
      });

      if (!contract) return;

      // Format duration
      const hours = Math.floor(timeLog.duration / 60);
      const minutes = timeLog.duration % 60;
      const formattedDuration = `${hours}h ${minutes}m`;

      if (timeLog.isApproved) {
        // Notify freelancer of approval
        await this.notificationsService.createNotification({
          userId: timeLog.freelancerId,
          title: 'Time Log Approved',
          message: `Your time log of ${formattedDuration} for "${contract.title}" has been approved`,
          type: 'time_log_approved',
          linkUrl: `/contracts/${contract.id}?tab=time`,
          data: {
            contractId: contract.id,
            timeLogId: timeLog.id
          }
        });
      } else if (timeLog.rejectedAt) {
        // Notify freelancer of rejection
        await this.notificationsService.createNotification({
          userId: timeLog.freelancerId,
          title: 'Time Log Rejected',
          message: `Your time log of ${formattedDuration} for "${contract.title}" has been rejected`,
          type: 'time_log_rejected',
          linkUrl: `/contracts/${contract.id}?tab=time`,
          data: {
            contractId: contract.id,
            timeLogId: timeLog.id,
            reason: timeLog.rejectionReason
          }
        });
      }
    } catch (error) {
      console.error('Error sending time log notification:', error);
    }
  }
}