import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, LessThan, MoreThan, Between, Not, IsNull } from 'typeorm';
import * as slugify from 'slugify';
import { FreelanceProject, ProjectStatus, ProjectDuration, ProjectComplexity, BudgetType } from '../entities/freelance-project.entity';
import { ProjectProposal, ProposalStatus } from '../entities/project-proposal.entity';
import { FreelancerProfile } from '../entities/freelancer-profile.entity';
import { User } from '../../users/entities/user.entity';
import { CompanyProfile } from '../../companies/entities/company-profile.entity';
import { CompanyAdmin } from '../../companies/entities/company-admin.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { UpdateProposalDto } from '../dto/update-proposal.dto';
import { ProjectSearchParams } from '../dto/project-search-params.dto';
import { PaginationParams } from '../../../common/dto/pagination-params.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { ContractsService } from '../contracts/contracts.service';

@Injectable()
export class FreelanceProjectsService {
  constructor(
    @InjectRepository(FreelanceProject)
    private projectRepository: Repository<FreelanceProject>,
    @InjectRepository(ProjectProposal)
    private proposalRepository: Repository<ProjectProposal>,
    @InjectRepository(FreelancerProfile)
    private freelancerRepository: Repository<FreelancerProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CompanyProfile)
    private companyRepository: Repository<CompanyProfile>,
    @InjectRepository(CompanyAdmin)
    private companyAdminRepository: Repository<CompanyAdmin>,
    private notificationsService: NotificationsService,
    private contractsService: ContractsService,
  ) { }

  async findAll(params: ProjectSearchParams & PaginationParams, currentUserId?: string): Promise<{
    items: FreelanceProject[];
    totalCount: number;
    facets: {
      categories: { [key: string]: number };
      durations: { [key: string]: number };
      complexities: { [key: string]: number };
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      skills,
      budgetMin,
      budgetMax,
      duration,
      complexity,
      companyId,
      clientId,
      recent,
      featuredOnly
    } = params;

    const skip = (page - 1) * limit;

    const queryBuilder = this.projectRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.client', 'client')
      .leftJoinAndSelect('client.profiles', 'clientProfiles')
      .leftJoinAndSelect('project.company', 'company')
      .where('project.status = :status', { status: ProjectStatus.OPEN });

    // Apply search filters
    if (search) {
      queryBuilder.andWhere(
        '(project.title ILIKE :search OR project.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('project.category = :category', { category });
    }

    if (skills && skills.length > 0) {
      queryBuilder.andWhere(':skill = ANY(project.skills)', { skill: skills });
    }

    if (budgetMin) {
      queryBuilder.andWhere('(project.budgetType = :fixedType AND project.budgetAmount >= :budgetMin) OR (project.budgetType = :hourlyType AND project.budgetMinHourly >= :budgetMin)', {
        fixedType: BudgetType.FIXED,
        hourlyType: BudgetType.HOURLY,
        budgetMin
      });
    }

    if (budgetMax) {
      queryBuilder.andWhere('(project.budgetType = :fixedType AND project.budgetAmount <= :budgetMax) OR (project.budgetType = :hourlyType AND project.budgetMaxHourly <= :budgetMax)', {
        fixedType: BudgetType.FIXED,
        hourlyType: BudgetType.HOURLY,
        budgetMax
      });
    }

    if (duration) {
      queryBuilder.andWhere('project.duration = :duration', { duration });
    }

    if (complexity) {
      queryBuilder.andWhere('project.complexity = :complexity', { complexity });
    }

    if (companyId) {
      queryBuilder.andWhere('project.companyId = :companyId', { companyId });
    }

    if (clientId) {
      queryBuilder.andWhere('project.clientId = :clientId', { clientId });
    }

    if (featuredOnly === 'true') {
      queryBuilder.andWhere('project.isFeatured = TRUE');
    }

    if (recent === 'true') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      queryBuilder.andWhere('project.publishedAt >= :sevenDaysAgo', { sevenDaysAgo });
    }

    // First get facets for filters
    const facetQueryBuilder = queryBuilder.clone();
    const facetResults = await facetQueryBuilder.getMany();

    // Build facets
    const categories = {};
    const durations = {};
    const complexities = {};

    facetResults.forEach(project => {
      // Count categories
      if (project.category) {
        categories[project.category] = (categories[project.category] || 0) + 1;
      }

      // Count durations
      if (project.duration) {
        durations[project.duration] = (durations[project.duration] || 0) + 1;
      }

      // Count complexities
      if (project.complexity) {
        complexities[project.complexity] = (complexities[project.complexity] || 0) + 1;
      }
    });

    // Add sorting
    queryBuilder.orderBy('project.isFeatured', 'DESC')
      .addOrderBy('project.publishedAt', 'DESC');

    const [items, totalCount] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add virtual fields for each project
    const enhancedItems = await Promise.all(
      items.map(async project => {
        // Calculate days since posted
        project.daysSincePosted = Math.floor(
          (new Date().getTime() - new Date(project.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Format budget
        const currency = project.budgetCurrency || 'USD';
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        });

        if (project.budgetType === BudgetType.FIXED && project.budgetAmount) {
          project.formattedBudget = formatter.format(project.budgetAmount);
        } else if (project.budgetType === BudgetType.HOURLY && (project.budgetMinHourly || project.budgetMaxHourly)) {
          if (project.budgetMinHourly && project.budgetMaxHourly) {
            project.formattedBudget = `${formatter.format(project.budgetMinHourly)} - ${formatter.format(project.budgetMaxHourly)}/hr`;
          } else if (project.budgetMinHourly) {
            project.formattedBudget = `From ${formatter.format(project.budgetMinHourly)}/hr`;
          } else if (project.budgetMaxHourly) {
            project.formattedBudget = `Up to ${formatter.format(project.budgetMaxHourly)}/hr`;
          }
        } else {
          project.formattedBudget = 'Budget to be discussed';
        }

        // Check if current user has proposed to this project
        if (currentUserId) {
          project.hasProposed = await this.hasUserProposed(project.id, currentUserId);
        } else {
          project.hasProposed = false;
        }

        return project;
      })
    );

    return {
      items: enhancedItems,
      totalCount,
      facets: {
        categories,
        durations,
        complexities,
      },
    };
  }

  async findOne(idOrSlug: string, currentUserId?: string): Promise<FreelanceProject> {
    const project = await this.projectRepository.findOne({
      where: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ],
      relations: [
        'client',
        'client.profiles',
        'company',
      ],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only the client or company admins can view draft projects
    if (project.status === ProjectStatus.DRAFT) {
      const isOwner = project.clientId === currentUserId;
      const isCompanyAdmin = project.companyId &&
        await this.companyAdminRepository.findOne({
          where: { companyId: project.companyId, userId: currentUserId }
        });

      if (!isOwner && !isCompanyAdmin) {
        throw new ForbiddenException('You do not have permission to view this project');
      }
    }

    // Increment view count
    project.viewsCount += 1;
    await this.projectRepository.save(project);

    // Calculate days since posted
    project.daysSincePosted = project.publishedAt ?
      Math.floor((new Date().getTime() - new Date(project.publishedAt).getTime()) / (1000 * 60 * 60 * 24)) :
      0;

    // Format budget
    const currency = project.budgetCurrency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });

    if (project.budgetType === BudgetType.FIXED && project.budgetAmount) {
      project.formattedBudget = formatter.format(project.budgetAmount);
    } else if (project.budgetType === BudgetType.HOURLY && (project.budgetMinHourly || project.budgetMaxHourly)) {
      if (project.budgetMinHourly && project.budgetMaxHourly) {
        project.formattedBudget = `${formatter.format(project.budgetMinHourly)} - ${formatter.format(project.budgetMaxHourly)}/hr`;
      } else if (project.budgetMinHourly) {
        project.formattedBudget = `From ${formatter.format(project.budgetMinHourly)}/hr`;
      } else if (project.budgetMaxHourly) {
        project.formattedBudget = `Up to ${formatter.format(project.budgetMaxHourly)}/hr`;
      }
    } else {
      project.formattedBudget = 'Budget to be discussed';
    }

    // Check if current user has proposed to this project
    if (currentUserId) {
      project.hasProposed = await this.hasUserProposed(project.id, currentUserId);
    } else {
      project.hasProposed = false;
    }

    return project;
  }

  async create(createProjectDto: CreateProjectDto): Promise<FreelanceProject> {
    const {
      title,
      description,
      skills,
      category,
      subcategory,
      clientId,
      companyId,
      budgetType,
      budgetAmount,
      budgetMinHourly,
      budgetMaxHourly,
      duration,
      complexity,
      status,
      attachmentUrls,
      ...rest
    } = createProjectDto;

    // Generate slug
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 0;

    // Check if slug already exists and generate a unique one
    while (await this.projectRepository.findOne({ where: { slug } })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    // Create project
    const project = this.projectRepository.create({
      title,
      slug,
      description,
      skills,
      category,
      subcategory,
      clientId,
      companyId,
      budgetType,
      budgetAmount,
      budgetMinHourly,
      budgetMaxHourly,
      duration,
      complexity,
      status,
      attachmentUrls,
      ...rest,
    });

    // If project is open, set publishedAt date
    if (project.status === ProjectStatus.OPEN) {
      project.publishedAt = new Date();
    }

    return this.projectRepository.save(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<FreelanceProject> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has permission to update this project
    const canEdit = await this.canEditProject(userId, project);
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to update this project');
    }

    // Handle status transitions
    if (updateProjectDto.status) {
      const oldStatus = project.status;
      const newStatus = updateProjectDto.status;

      // If changing from draft to open, set publishedAt
      if (oldStatus === ProjectStatus.DRAFT && newStatus === ProjectStatus.OPEN) {
        project.publishedAt = new Date();
      }
    }

    // Update project
    Object.assign(project, updateProjectDto);

    return this.projectRepository.save(project);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['proposals'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has permission to delete this project
    const canEdit = await this.canEditProject(userId, project);
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to delete this project');
    }

    // Check if project has active proposals or contracts
    if (project.proposals?.length > 0) {
      throw new BadRequestException('Cannot delete a project with active proposals. Close the project instead.');
    }

    await this.projectRepository.remove(project);
    return true;
  }

  async getClientProjects(clientId: string, params: PaginationParams & { status?: ProjectStatus }): Promise<{
    items: FreelanceProject[];
    totalCount: number;
  }> {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.projectRepository.createQueryBuilder('project')
      .where('project.clientId = :clientId', { clientId });

    if (status) {
      queryBuilder.andWhere('project.status = :status', { status });
    }

    const [items, totalCount] = await queryBuilder
      .orderBy('project.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add formatted budgets to each project
    const enhancedItems = items.map(project => {
      const currency = project.budgetCurrency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });

      if (project.budgetType === BudgetType.FIXED && project.budgetAmount) {
        project.formattedBudget = formatter.format(project.budgetAmount);
      } else if (project.budgetType === BudgetType.HOURLY && (project.budgetMinHourly || project.budgetMaxHourly)) {
        if (project.budgetMinHourly && project.budgetMaxHourly) {
          project.formattedBudget = `${formatter.format(project.budgetMinHourly)} - ${formatter.format(project.budgetMaxHourly)}/hr`;
        } else if (project.budgetMinHourly) {
          project.formattedBudget = `From ${formatter.format(project.budgetMinHourly)}/hr`;
        } else if (project.budgetMaxHourly) {
          project.formattedBudget = `Up to ${formatter.format(project.budgetMaxHourly)}/hr`;
        }
      } else {
        project.formattedBudget = 'Budget to be discussed';
      }

      return project;
    });

    return { items: enhancedItems, totalCount };
  }

  async getCompanyProjects(companyId: string, params: PaginationParams & { status?: ProjectStatus }): Promise<{
    items: FreelanceProject[];
    totalCount: number;
  }> {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.projectRepository.createQueryBuilder('project')
      .where('project.companyId = :companyId', { companyId });

    if (status) {
      queryBuilder.andWhere('project.status = :status', { status });
    }

    const [items, totalCount] = await queryBuilder
      .orderBy('project.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add formatted budgets to each project
    const enhancedItems = items.map(project => {
      const currency = project.budgetCurrency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });

      if (project.budgetType === BudgetType.FIXED && project.budgetAmount) {
        project.formattedBudget = formatter.format(project.budgetAmount);
      } else if (project.budgetType === BudgetType.HOURLY && (project.budgetMinHourly || project.budgetMaxHourly)) {
        if (project.budgetMinHourly && project.budgetMaxHourly) {
          project.formattedBudget = `${formatter.format(project.budgetMinHourly)} - ${formatter.format(project.budgetMaxHourly)}/hr`;
        } else if (project.budgetMinHourly) {
          project.formattedBudget = `From ${formatter.format(project.budgetMinHourly)}/hr`;
        } else if (project.budgetMaxHourly) {
          project.formattedBudget = `Up to ${formatter.format(project.budgetMaxHourly)}/hr`;
        }
      } else {
        project.formattedBudget = 'Budget to be discussed';
      }

      return project;
    });

    return { items: enhancedItems, totalCount };
  }

  // PROPOSALS

  async createProposal(createProposalDto: CreateProposalDto): Promise<ProjectProposal> {
    const {
      projectId,
      freelancerId,
      coverLetter,
      paymentAmount,
      paymentType,
      estimatedDuration,
      durationUnit,
      attachmentUrls,
    } = createProposalDto;

    // Check if project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if project is open for proposals
    if (project.status !== ProjectStatus.OPEN) {
      throw new BadRequestException('Project is not open for proposals');
    }

    // Check if freelancer already submitted a proposal
    const existingProposal = await this.proposalRepository.findOne({
      where: { projectId, freelancerId }
    });

    if (existingProposal) {
      throw new ConflictException('You have already submitted a proposal for this project');
    }

    // Check if freelancer is the project client
    if (freelancerId === project.clientId) {
      throw new BadRequestException('You cannot submit a proposal to your own project');
    }

    // Create proposal
    const proposal = this.proposalRepository.create({
      projectId,
      freelancerId,
      coverLetter,
      paymentAmount,
      paymentCurrency: project.budgetCurrency || 'USD',
      paymentType: paymentType || (project.budgetType === BudgetType.HOURLY ? 'hourly' : 'fixed'),
      estimatedDuration,
      durationUnit: durationUnit || 'days',
      status: ProposalStatus.PENDING,
      attachmentUrls,
    });

    const savedProposal = await this.proposalRepository.save(proposal);

    // Update project proposal count
    project.proposalCount += 1;
    await this.projectRepository.save(project);

    // Send notification to client
    await this.notifyClientOfProposal(savedProposal);

    return this.getProposal(savedProposal.id, freelancerId);
  }

  async getProposal(id: string, userId: string): Promise<ProjectProposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: [
        'project',
        'project.client',
        'freelancer',
        'freelancer.profiles',
      ]
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Check if user is either the freelancer or client
    const isFreelancer = proposal.freelancerId === userId;
    const isClient = proposal.project.clientId === userId;
    const isCompanyAdmin = proposal.project.companyId &&
      await this.companyAdminRepository.findOne({
        where: { companyId: proposal.project.companyId, userId }
      });

    if (!isFreelancer && !isClient && !isCompanyAdmin) {
      throw new ForbiddenException('You do not have permission to view this proposal');
    }

    // Format payment
    const currency = proposal.paymentCurrency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });

    if (proposal.paymentType === 'hourly') {
      proposal.formattedPayment = `${formatter.format(proposal.paymentAmount)}/hr`;
    } else {
      proposal.formattedPayment = formatter.format(proposal.paymentAmount);
    }

    // Calculate days since submitted
    proposal.daysSinceSubmitted = Math.floor(
      (new Date().getTime() - new Date(proposal.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return proposal;
  }

  async getProjectProposals(
    projectId: string,
    params: PaginationParams & { status?: ProposalStatus },
    userId: string
  ): Promise<{ items: ProjectProposal[]; totalCount: number }> {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    // Check if project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has permission to view proposals
    const isClient = project.clientId === userId;
    const isCompanyAdmin = project.companyId &&
      await this.companyAdminRepository.findOne({
        where: { companyId: project.companyId, userId }
      });

    if (!isClient && !isCompanyAdmin) {
      throw new ForbiddenException('You do not have permission to view proposals for this project');
    }

    const queryBuilder = this.proposalRepository.createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.freelancer', 'freelancer')
      .leftJoinAndSelect('freelancer.profiles', 'profiles')
      .where('proposal.projectId = :projectId', { projectId });

    if (status) {
      queryBuilder.andWhere('proposal.status = :status', { status });
    }

    const [proposals, totalCount] = await queryBuilder
      .orderBy('proposal.submittedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add formatted payment and days since submitted to each proposal
    const enhancedProposals = proposals.map(proposal => {
      const currency = proposal.paymentCurrency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });

      if (proposal.paymentType === 'hourly') {
        proposal.formattedPayment = `${formatter.format(proposal.paymentAmount)}/hr`;
      } else {
        proposal.formattedPayment = formatter.format(proposal.paymentAmount);
      }

      proposal.daysSinceSubmitted = Math.floor(
        (new Date().getTime() - new Date(proposal.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return proposal;
    });

    return { items: enhancedProposals, totalCount };
  }

  async getFreelancerProposals(
    freelancerId: string,
    params: PaginationParams & { status?: ProposalStatus }
  ): Promise<{ items: ProjectProposal[]; totalCount: number }> {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.proposalRepository.createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.project', 'project')
      .leftJoinAndSelect('project.client', 'client')
      .leftJoinAndSelect('project.company', 'company')
      .where('proposal.freelancerId = :freelancerId', { freelancerId });

    if (status) {
      queryBuilder.andWhere('proposal.status = :status', { status });
    }

    const [proposals, totalCount] = await queryBuilder
      .orderBy('proposal.submittedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add formatted payment and days since submitted to each proposal
    const enhancedProposals = proposals.map(proposal => {
      const currency = proposal.paymentCurrency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });

      if (proposal.paymentType === 'hourly') {
        proposal.formattedPayment = `${formatter.format(proposal.paymentAmount)}/hr`;
      } else {
        proposal.formattedPayment = formatter.format(proposal.paymentAmount);
      }

      proposal.daysSinceSubmitted = Math.floor(
        (new Date().getTime() - new Date(proposal.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return proposal;
    });

    return { items: enhancedProposals, totalCount };
  }

  async updateProposalStatus(
    id: string,
    status: ProposalStatus,
    userId: string
  ): Promise<ProjectProposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['project']
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Determine who can make the status change
    const isFreelancer = proposal.freelancerId === userId;
    const isClient = proposal.project.clientId === userId;
    const isCompanyAdmin = proposal.project.companyId &&
      await this.companyAdminRepository.findOne({
        where: { companyId: proposal.project.companyId, userId }
      });

    // Freelancers can only withdraw their own proposals
    if (isFreelancer && status !== ProposalStatus.WITHDRAWN) {
      throw new ForbiddenException('Freelancers can only withdraw their proposals');
    }

    // Clients/Company admins can shortlist, accept, or reject
    if (!isFreelancer && !isClient && !isCompanyAdmin) {
      throw new ForbiddenException('You do not have permission to update this proposal');
    }

    // If accepting a proposal, check if there's already an accepted proposal
    if (status === ProposalStatus.ACCEPTED) {
      const existingAccepted = await this.proposalRepository.findOne({
        where: {
          projectId: proposal.projectId,
          status: ProposalStatus.ACCEPTED
        }
      });

      if (existingAccepted && existingAccepted.id !== proposal.id) {
        throw new BadRequestException('Another proposal has already been accepted for this project');
      }

      // Update project status to in progress
      const project = proposal.project;
      project.status = ProjectStatus.IN_PROGRESS;
      await this.projectRepository.save(project);
    }

    // Update proposal status
    proposal.status = status;
    const updatedProposal = await this.proposalRepository.save(proposal);

    // Send notification
    await this.notifyProposalStatusChange(updatedProposal, userId);

    return this.getProposal(updatedProposal.id, userId);
  }

  async acceptAndCreateContract(
    proposalId: string,
    userId: string
  ): Promise<any> {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
      relations: ['project', 'freelancer', 'project.client']
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Check permissions
    const isClient = proposal.project.clientId === userId;
    const isCompanyAdmin = proposal.project.companyId &&
      await this.companyAdminRepository.findOne({
        where: { companyId: proposal.project.companyId, userId }
      });

    if (!isClient && !isCompanyAdmin) {
      throw new ForbiddenException('You do not have permission to accept this proposal');
    }

    // First update proposal status
    await this.updateProposalStatus(proposalId, ProposalStatus.ACCEPTED, userId);

    // Create a contract
    const contract = await this.contractsService.createFromProposal(proposal, userId);

    return contract;
  }

  // FREELANCER PROFILES

  async getFreelancerProfile(userId: string): Promise<FreelancerProfile> {
    const profile = await this.freelancerRepository.findOne({
      where: { userId },
      relations: ['portfolioItems', 'services']
    });

    if (!profile) {
      throw new NotFoundException('Freelancer profile not found');
    }

    // Format hourly rate
    const currency = profile.currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });

    profile.formattedHourlyRate = profile.hourlyRate ?
      `${formatter.format(profile.hourlyRate)}/hr` :
      'Rate not specified';

    // Add placeholder rating and completed projects
    profile.rating = 4.8; // This would come from actual reviews in a real implementation
    profile.completedProjects = 12; // This would be calculated in a real implementation

    return profile;
  }

  // Helper methods
  private async canEditProject(userId: string, project: FreelanceProject): Promise<boolean> {
    // Project client can always edit
    if (project.clientId === userId) {
      return true;
    }

    // Company admins can edit if project belongs to company
    if (project.companyId) {
      const companyAdmin = await this.companyAdminRepository.findOne({
        where: { companyId: project.companyId, userId }
      });

      if (companyAdmin) {
        return true;
      }
    }

    // Platform admins can edit any project
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    return user?.role === 'admin';
  }

  private async hasUserProposed(projectId: string, userId: string): Promise<boolean> {
    // Get freelancer profile
    const freelancerProfile = await this.freelancerRepository.findOne({
      where: { userId }
    });

    if (!freelancerProfile) {
      return false;
    }

    // Check for proposal
    const proposal = await this.proposalRepository.findOne({
      where: {
        projectId,
        freelancerId: userId
      }
    });

    return !!proposal;
  }

  private async notifyClientOfProposal(proposal: ProjectProposal): Promise<void> {
    try {
      // Get project and freelancer details
      const project = await this.projectRepository.findOne({
        where: { id: proposal.projectId },
        relations: ['client'],
      });

      if (!project) return;

      const freelancer = await this.userRepository.findOne({
        where: { id: proposal.freelancerId },
      });

      if (!freelancer) return;

      // Notify project client
      await this.notificationsService.createNotification({
        userId: project.clientId,
        title: 'New Project Proposal',
        message: `${freelancer.firstName} ${freelancer.lastName} submitted a proposal for your project "${project.title}"`,
        type: 'project_proposal',
        linkUrl: `/freelance/proposals/${proposal.id}`,
        data: {
          projectId: project.id,
          proposalId: proposal.id,
          freelancerId: freelancer.id
        }
      });
    } catch (error) {
      // Log error but don't break the application flow
      console.error('Error sending proposal notification:', error);
    }
  }

  private async notifyProposalStatusChange(proposal: ProjectProposal, updatedById: string): Promise<void> {
    try {
      // Get project and user details
      const project = await this.projectRepository.findOne({
        where: { id: proposal.projectId },
      });

      if (!project) return;

      const freelancer = await this.userRepository.findOne({
        where: { id: proposal.freelancerId },
      });

      const client = await this.userRepository.findOne({
        where: { id: project.clientId },
      });

      if (!freelancer || !client) return;

      // Different notification based on status and recipient
      if (proposal.status === ProposalStatus.WITHDRAWN) {
        // Notify client that freelancer withdrew
        await this.notificationsService.createNotification({
          userId: project.clientId,
          title: 'Proposal Withdrawn',
          message: `${freelancer.firstName} ${freelancer.lastName} has withdrawn their proposal for "${project.title}"`,
          type: 'proposal_status',
          linkUrl: `/freelance/projects/${project.id}`,
          data: {
            projectId: project.id,
            proposalId: proposal.id,
            status: proposal.status
          }
        });
      } else if (proposal.status === ProposalStatus.SHORTLISTED) {
        // Notify freelancer that proposal was shortlisted
        await this.notificationsService.createNotification({
          userId: freelancer.id,
          title: 'Proposal Shortlisted',
          message: `Your proposal for "${project.title}" has been shortlisted`,
          type: 'proposal_status',
          linkUrl: `/freelance/proposals/${proposal.id}`,
          data: {
            projectId: project.id,
            proposalId: proposal.id,
            status: proposal.status
          }
        });
      } else if (proposal.status === ProposalStatus.ACCEPTED) {
        // Notify freelancer that proposal was accepted
        await this.notificationsService.createNotification({
          userId: freelancer.id,
          title: 'Proposal Accepted',
          message: `Your proposal for "${project.title}" has been accepted! Check the contract details.`,
          type: 'proposal_status',
          linkUrl: `/freelance/proposals/${proposal.id}`,
          data: {
            projectId: project.id,
            proposalId: proposal.id,
            status: proposal.status
          }
        });
      } else if (private async notifyProposalStatusChange(proposal: ProjectProposal, updatedById: string): Promise < void> {
        try {
          // Get project and user details
          const project = await this.projectRepository.findOne({
            where: { id: proposal.projectId },
          });

          if(!project) return;

          const freelancer = await this.userRepository.findOne({
            where: { id: proposal.freelancerId },
          });

          const client = await this.userRepository.findOne({
            where: { id: project.clientId },
          });

          if(!freelancer || !client) return;

        // Different notification based on status and recipient
        if(proposal.status === ProposalStatus.WITHDRAWN) {
        // Notify client that freelancer withdrew
        await this.notificationsService.createNotification({
          userId: project.clientId,
          title: 'Proposal Withdrawn',
          message: `${freelancer.firstName} ${freelancer.lastName} has withdrawn their proposal for "${project.title}"`,
          type: 'proposal_status',
          linkUrl: `/freelance/projects/${project.id}`,
          data: {
            projectId: project.id,
            proposalId: proposal.id,
            status: proposal.status
          }
        });
      } else if (proposal.status === ProposalStatus.SHORTLISTED) {
        // Notify freelancer that proposal was shortlisted
        await this.notificationsService.createNotification({
          userId: freelancer.id,
          title: 'Proposal Shortlisted',
          message: `Your proposal for "${project.title}" has been shortlisted`,
          type: 'proposal_status',
          linkUrl: `/freelance/proposals/${proposal.id}`,
          data: {
            projectId: project.id,
            proposalId: proposal.id,
            status: proposal.status
          }
        });
      } else if (proposal.status === ProposalStatus.ACCEPTED) {
        // Notify freelancer that proposal was accepted
        await this.notificationsService.createNotification({
          userId: freelancer.id,
          title: 'Proposal Accepted',
          message: `Your proposal for "${project.title}" has been accepted! Check the contract details.`,
          type: 'proposal_status',
          linkUrl: `/freelance/proposals/${proposal.id}`,
          data: {
            projectId: project.id,
            proposalId: proposal.id,
            status: proposal.status
          }
        });
      } else if (proposal.status === ProposalStatus.REJECTED) {
        // Notify freelancer that proposal was rejected
        await this.notificationsService.createNotification({
          userId: freelancer.id,
          title: 'Proposal Not Selected',
          message: `Your proposal for "${project.title}" was not selected at this time.`,
          type: 'proposal_status',
          linkUrl: `/freelance/proposals/${proposal.id}`,
          data: {
            projectId: project.id,
            proposalId: proposal.id,
            status: proposal.status
          }
        });
      }
    } catch (error) {
      // Log error but don't break the application flow
      console.error('Error sending proposal status change notification:', error);
    }
  }
}