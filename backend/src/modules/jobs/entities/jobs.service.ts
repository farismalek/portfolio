import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, LessThan, MoreThan, Between, Not, IsNull } from 'typeorm';
import * as slugify from 'slugify';
import { JobListing, JobStatus, EmploymentType, ExperienceLevel, RemotePolicy } from './entities/job-listing.entity';
import { JobSkill } from './entities/job-skill.entity';
import { JobApplication, ApplicationStatus } from './entities/job-application.entity';
import { JobApplicationStage } from './entities/job-application-stage.entity';
import { JobSaved } from './entities/job-saved.entity';
import { JobAlert } from './entities/job-alert.entity';
import { CompanyProfile } from '../companies/entities/company-profile.entity';
import { CompanyAdmin } from '../companies/entities/company-admin.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateApplicationStageDto } from './dto/create-application-stage.dto';
import { CreateJobAlertDto } from './dto/create-job-alert.dto';
import { JobSearchParams } from './dto/job-search-params.dto';
import { PaginationParams } from '../../common/dto/pagination-params.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobListing)
    private jobRepository: Repository<JobListing>,
    @InjectRepository(JobSkill)
    private skillRepository: Repository<JobSkill>,
    @InjectRepository(JobApplication)
    private applicationRepository: Repository<JobApplication>,
    @InjectRepository(JobApplicationStage)
    private stageRepository: Repository<JobApplicationStage>,
    @InjectRepository(JobSaved)
    private savedRepository: Repository<JobSaved>,
    @InjectRepository(JobAlert)
    private alertRepository: Repository<JobAlert>,
    @InjectRepository(CompanyProfile)
    private companyRepository: Repository<CompanyProfile>,
    @InjectRepository(CompanyAdmin)
    private companyAdminRepository: Repository<CompanyAdmin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) { }

  // Find all jobs with search and filters
  async findAll(params: JobSearchParams & PaginationParams, currentUserId?: string): Promise<{
    items: JobListing[];
    totalCount: number;
    facets: {
      employmentTypes: { [key: string]: number };
      experienceLevels: { [key: string]: number };
      remotePolicies: { [key: string]: number };
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      companyId,
      location,
      remote,
      employmentType,
      experienceLevel,
      minSalary,
      maxSalary,
      skillsRequired,
      recent,
      featuredOnly
    } = params;

    const skip = (page - 1) * limit;

    const queryBuilder = this.jobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.department', 'department')
      .leftJoinAndSelect('job.skills', 'skills')
      .where('job.status = :status', { status: JobStatus.PUBLISHED })
      .andWhere('job.expired_at IS NULL OR job.expired_at > :now', { now: new Date() });

    // Add search filter
    if (search) {
      queryBuilder.andWhere(
        '(job.title ILIKE :search OR job.description ILIKE :search OR company.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Add company filter
    if (companyId) {
      queryBuilder.andWhere('job.companyId = :companyId', { companyId });
    }

    // Add location filter
    if (location) {
      queryBuilder.andWhere(
        '(location.city ILIKE :location OR location.state ILIKE :location OR location.country ILIKE :location)',
        { location: `%${location}%` }
      );
    }

    // Add remote filter
    if (remote === 'true') {
      queryBuilder.andWhere('job.remotePolicy IN (:...remotePolicies)', {
        remotePolicies: [RemotePolicy.REMOTE, RemotePolicy.HYBRID]
      });
    }

    // Add employment type filter
    if (employmentType && employmentType.length > 0) {
      queryBuilder.andWhere('job.employmentType IN (:...employmentTypes)', {
        employmentTypes: employmentType
      });
    }

    // Add experience level filter
    if (experienceLevel && experienceLevel.length > 0) {
      queryBuilder.andWhere('job.experienceLevel IN (:...experienceLevels)', {
        experienceLevels: experienceLevel
      });
    }

    // Add salary filters
    if (minSalary) {
      queryBuilder.andWhere('job.minSalary >= :minSalary OR job.maxSalary >= :minSalary', { minSalary });
    }

    if (maxSalary) {
      queryBuilder.andWhere('job.minSalary <= :maxSalary', { maxSalary });
    }

    // Add skills filter
    if (skillsRequired && skillsRequired.length > 0) {
      queryBuilder
        .andWhere('EXISTS (SELECT 1 FROM job_skills s WHERE s.job_id = job.id AND s.skill_name IN (:...skills))', {
          skills: skillsRequired
        });
    }

    // Featured jobs filter
    if (featuredOnly === 'true') {
      queryBuilder.andWhere('job.isFeatured = TRUE');
    }

    // Recent jobs filter (posted within last 7 days)
    if (recent === 'true') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      queryBuilder.andWhere('job.publishedAt >= :sevenDaysAgo', { sevenDaysAgo });
    }

    // First get facets for filters
    const facetQueryBuilder = queryBuilder.clone();
    const facetResults = await facetQueryBuilder.getMany();

    // Build facets
    const facets = {
      employmentTypes: Object.values(EmploymentType).reduce((acc, type) => {
        acc[type] = facetResults.filter(job => job.employmentType === type).length;
        return acc;
      }, {}),

      experienceLevels: Object.values(ExperienceLevel).reduce((acc, level) => {
        acc[level] = facetResults.filter(job => job.experienceLevel === level).length;
        return acc;
      }, {}),

      remotePolicies: Object.values(RemotePolicy).reduce((acc, policy) => {
        acc[policy] = facetResults.filter(job => job.remotePolicy === policy).length;
        return acc;
      }, {})
    };

    // Add sorting
    queryBuilder.orderBy('job.isFeatured', 'DESC')
      .addOrderBy('job.publishedAt', 'DESC');

    const [items, totalCount] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add virtual fields for each job
    const enhancedItems = await Promise.all(
      items.map(async job => {
        // Calculate days since posted
        job.daysSincePosted = Math.floor(
          (new Date().getTime() - new Date(job.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Format salary range
        if (job.showSalary && (job.minSalary || job.maxSalary)) {
          const currency = job.salaryCurrency || 'USD';
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
          });

          if (job.minSalary && job.maxSalary) {
            job.formattedSalary = `${formatter.format(job.minSalary)} - ${formatter.format(job.maxSalary)} ${job.salaryPeriod}`;
          } else if (job.minSalary) {
            job.formattedSalary = `From ${formatter.format(job.minSalary)} ${job.salaryPeriod}`;
          } else if (job.maxSalary) {
            job.formattedSalary = `Up to ${formatter.format(job.maxSalary)} ${job.salaryPeriod}`;
          }
        }

        // Check if current user has applied or saved
        if (currentUserId) {
          job.hasApplied = await this.hasUserApplied(job.id, currentUserId);
          job.hasSaved = await this.hasUserSavedJob(job.id, currentUserId);
        } else {
          job.hasApplied = false;
          job.hasSaved = false;
        }

        return job;
      })
    );

    return {
      items: enhancedItems,
      totalCount,
      facets,
    };
  }

  // Find job by ID or slug
  async findOne(idOrSlug: string, currentUserId?: string): Promise<JobListing> {
    const job = await this.jobRepository.findOne({
      where: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ],
      relations: [
        'company',
        'department',
        'location',
        'postedBy',
        'skills'
      ],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Increment view count
    job.viewsCount += 1;
    await this.jobRepository.save(job);

    // Calculate days since posted
    job.daysSincePosted = Math.floor(
      (new Date().getTime() - new Date(job.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Format salary range
    if (job.showSalary && (job.minSalary || job.maxSalary)) {
      const currency = job.salaryCurrency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });

      if (job.minSalary && job.maxSalary) {
        job.formattedSalary = `${formatter.format(job.minSalary)} - ${formatter.format(job.maxSalary)} ${job.salaryPeriod}`;
      } else if (job.minSalary) {
        job.formattedSalary = `From ${formatter.format(job.minSalary)} ${job.salaryPeriod}`;
      } else if (job.maxSalary) {
        job.formattedSalary = `Up to ${formatter.format(job.maxSalary)} ${job.salaryPeriod}`;
      }
    }

    // Check if current user has applied or saved
    if (currentUserId) {
      job.hasApplied = await this.hasUserApplied(job.id, currentUserId);
      job.hasSaved = await this.hasUserSavedJob(job.id, currentUserId);
    } else {
      job.hasApplied = false;
      job.hasSaved = false;
    }

    return job;
  }

  // Create a new job listing
  async create(createJobDto: CreateJobDto, userId: string): Promise<JobListing> {
    const {
      companyId,
      departmentId,
      locationId,
      title,
      description,
      skills,
      ...rest
    } = createJobDto;

    // Check if user can post jobs for this company
    const canPostJobs = await this.canUserManageCompanyJobs(userId, companyId);
    if (!canPostJobs) {
      throw new ForbiddenException('You do not have permission to post jobs for this company');
    }

    // Generate slug
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 0;

    // Check if slug already exists and generate a unique one
    while (await this.jobRepository.findOne({ where: { slug, companyId } })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    // Create job listing
    const job = this.jobRepository.create({
      companyId,
      departmentId,
      locationId,
      postedById: userId,
      title,
      slug,
      description,
      ...rest
    });

    // If job is published, set publishedAt date
    if (job.status === JobStatus.PUBLISHED) {
      job.publishedAt = new Date();
    }

    const savedJob = await this.jobRepository.save(job);

    // Save skills if provided
    if (skills && skills.length > 0) {
      const skillEntities = skills.map(skill => this.skillRepository.create({
        jobId: savedJob.id,
        skillName: skill.name,
        yearsRequired: skill.yearsRequired,
        isRequired: skill.isRequired !== false,
      }));

      await this.skillRepository.save(skillEntities);
    }

    return this.findOne(savedJob.id);
  }

  // Update a job listing
  async update(id: string, updateJobDto: UpdateJobDto, userId: string): Promise<JobListing> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if user can edit this job
    const canEditJob = await this.canUserManageCompanyJobs(userId, job.companyId);
    if (!canEditJob) {
      throw new ForbiddenException('You do not have permission to edit this job listing');
    }

    const { skills, ...jobData } = updateJobDto;

    // Handle status transitions
    if (jobData.status) {
      const oldStatus = job.status;
      const newStatus = jobData.status;

      // If changing from draft to published, set publishedAt
      if (oldStatus === JobStatus.DRAFT && newStatus === JobStatus.PUBLISHED) {
        job.publishedAt = new Date();
      }

      // If changing to closed or filled, set expiredAt
      if ([JobStatus.CLOSED, JobStatus.FILLED].includes(newStatus)) {
        job.expiredAt = new Date();
      }
    }

    // Update job data
    Object.assign(job, jobData);

    const updatedJob = await this.jobRepository.save(job);

    // Update skills if provided
    if (skills && skills.length > 0) {
      // Delete existing skills
      await this.skillRepository.delete({ jobId: job.id });

      // Create new skill records
      const skillEntities = skills.map(skill => this.skillRepository.create({
        jobId: job.id,
        skillName: skill.name,
        yearsRequired: skill.yearsRequired,
        isRequired: skill.isRequired !== false,
      }));

      await this.skillRepository.save(skillEntities);
    }

    return this.findOne(updatedJob.id);
  }

  // Delete a job listing
  async remove(id: string, userId: string): Promise<boolean> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if user can delete this job
    const canManageJobs = await this.canUserManageCompanyJobs(userId, job.companyId);
    if (!canManageJobs) {
      throw new ForbiddenException('You do not have permission to delete this job listing');
    }

    await this.jobRepository.remove(job);

    return true;
  }

  // Find jobs for a specific company
  async findJobsByCompany(
    companyId: string,
    params: { status?: JobStatus } & PaginationParams,
    userId: string
  ): Promise<{ items: JobListing[]; totalCount: number }> {
    const { status, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    // Check if user has access to company jobs
    const canViewCompanyJobs = await this.canUserViewCompanyJobs(userId, companyId);
    if (!canViewCompanyJobs) {
      throw new ForbiddenException('You do not have permission to view this company\'s jobs');
    }

    const queryBuilder = this.jobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.skills', 'skills')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.department', 'department')
      .where('job.companyId = :companyId', { companyId });

    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }

    const [items, totalCount] = await queryBuilder
      .orderBy('job.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { items, totalCount };
  }

  // Apply to a job
  async applyToJob(createApplicationDto: CreateApplicationDto, userId: string): Promise<JobApplication> {
    const { jobId, resumeUrl, coverLetter, answers, availableStartDate, salaryExpectation } = createApplicationDto;

    // Check if job exists and is accepting applications
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.PUBLISHED) {
      throw new BadRequestException('This job is not accepting applications');
    }

    // Check if user already applied
    const existingApplication = await this.applicationRepository.findOne({
      where: { jobId, userId }
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied to this job');
    }

    // Create application
    const application = this.applicationRepository.create({
      jobId,
      userId,
      resumeUrl,
      coverLetter,
      answers,
      availableStartDate,
      salaryExpectation,
      status: ApplicationStatus.SUBMITTED,
    });

    const savedApplication = await this.applicationRepository.save(application);

    // Update job applications count
    job.applicationsCount += 1;
    await this.jobRepository.save(job);

    // Notify employer
    await this.notifyEmployerOfNewApplication(savedApplication);

    return this.getApplication(savedApplication.id, userId);
  }

  // Get application by ID
  async getApplication(id: string, userId: string): Promise<JobApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['job', 'job.company', 'job.location', 'user', 'stages'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if user is the applicant or employer
    const isApplicant = application.userId === userId;
    const isEmployer = await this.canUserManageCompanyJobs(userId, application.job.companyId);

    if (!isApplicant && !isEmployer) {
      throw new ForbiddenException('You do not have permission to view this application');
    }

    // Calculate days since applied
    application.daysSinceApplied = Math.floor(
      (new Date().getTime() - new Date(application.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return application;
  }

  // Get applications for a job
  async getApplicationsForJob(
    jobId: string,
    params: { status?: ApplicationStatus } & PaginationParams,
    userId: string
  ): Promise<{ items: JobApplication[]; totalCount: number }> {
    const { status, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      select: ['id', 'companyId']
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if user can view applications
    const canManageJobs = await this.canUserManageCompanyJobs(userId, job.companyId);
    if (!canManageJobs) {
      throw new ForbiddenException('You do not have permission to view applications for this job');
    }

    const queryBuilder = this.applicationRepository.createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profiles')
      .leftJoinAndSelect('application.stages', 'stages')
      .where('application.jobId = :jobId', { jobId });

    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    const [items, totalCount] = await queryBuilder
      .orderBy('application.appliedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Calculate days since applied for each application
    items.forEach(application => {
      application.daysSinceApplied = Math.floor(
        (new Date().getTime() - new Date(application.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
    });

    return { items, totalCount };
  }

  // Get applications for a user
  async getUserApplications(
    params: { status?: ApplicationStatus } & PaginationParams,
    userId: string
  ): Promise<{ items: JobApplication[]; totalCount: number }> {
    const { status, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.applicationRepository.createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.location', 'location')
      .where('application.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    const [items, totalCount] = await queryBuilder
      .orderBy('application.appliedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Calculate days since applied for each application
    items.forEach(application => {
      application.daysSinceApplied = Math.floor(
        (new Date().getTime() - new Date(application.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
    });

    return { items, totalCount };
  }

  // Update application status
  async updateApplicationStatus(
    id: string,
    updateDto: UpdateApplicationDto,
    userId: string
  ): Promise<JobApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['job'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    const canManageApplications = await this.canUserManageCompanyJobs(userId, application.job.companyId);
    const isOwnApplication = application.userId === userId;

    if (!canManageApplications && !isOwnApplication) {
      throw new ForbiddenException('You do not have permission to update this application');
    }

    // Some status changes can only be done by the company
    if (updateDto.status) {
      const restrictedStatusChanges = [
        ApplicationStatus.SCREENING,
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.ASSESSMENT,
        ApplicationStatus.OFFER,
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED
      ];

      if (restrictedStatusChanges.includes(updateDto.status) && !canManageApplications) {
        throw new ForbiddenException('Only the employer can set this status');
      }

      // Applicant can only withdraw their own application
      if (updateDto.status === ApplicationStatus.WITHDRAWN && !isOwnApplication) {
        throw new ForbiddenException('Only the applicant can withdraw an application');
      }
    }

    // Update application
    if (updateDto.status) {
      application.status = updateDto.status;
      application.statusUpdatedAt = new Date();
      application.statusUpdatedById = userId;
    }

    if (canManageApplications && updateDto.notes !== undefined) {
      application.notes = updateDto.notes;
    }

    const updatedApplication = await this.applicationRepository.save(application);

    // Send notification based on status change
    if (updateDto.status) {
      await this.notifyApplicationStatusChange(updatedApplication, userId);
    }

    return this.getApplication(updatedApplication.id, userId);
  }

  // Add an application stage
  async addApplicationStage(
    applicationId: string,
    stageDto: CreateApplicationStageDto,
    userId: string
  ): Promise<JobApplicationStage> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    const canManageApplications = await this.canUserManageCompanyJobs(userId, application.job.companyId);

    if (!canManageApplications) {
      throw new ForbiddenException('You do not have permission to add stages to this application');
    }

    // Get the highest existing stage order
    const highestStage = await this.stageRepository.findOne({
      where: { applicationId },
      order: { stageOrder: 'DESC' },
    });

    const nextOrder = highestStage ? highestStage.stageOrder + 1 : 0;

    // Create stage
    const stage = this.stageRepository.create({
      ...stageDto,
      applicationId,
      stageOrder: nextOrder,
      createdById: userId,
      updatedById: userId,
    });

    // If the stage has a scheduled date, update application status
    if (stage.scheduledAt && application.status === ApplicationStatus.SUBMITTED) {
      application.status = ApplicationStatus.SCREENING;
      application.statusUpdatedAt = new Date();
      application.statusUpdatedById = userId;
      await this.applicationRepository.save(application);
    }

    return this.stageRepository.save(stage);
  }

  // Save/bookmark a job
  async saveJob(jobId: string, userId: string): Promise<boolean> {
    // Check if job exists
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if already saved
    const existing = await this.savedRepository.findOne({
      where: { jobId, userId }
    });

    if (existing) {
      return true; // Already saved
    }

    // Create saved record
    const savedJob = this.savedRepository.create({
      jobId,
      userId,
    });

    await this.savedRepository.save(savedJob);

    return true;
  }

  // Unsave/unbookmark a job
  async unsaveJob(jobId: string, userId: string): Promise<boolean> {
    const saved = await this.savedRepository.findOne({
      where: { jobId, userId }
    });

    if (!saved) {
      return true; // Already not saved
    }

    await this.savedRepository.remove(saved);

    return true;
  }

  // Get a user's saved jobs
  async getSavedJobs(
    userId: string,
    params: PaginationParams
  ): Promise<{ items: JobListing[]; totalCount: number }> {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.jobRepository.createQueryBuilder('job')
      .innerJoin('job_saved', 'saved', 'saved.job_id = job.id')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.skills', 'skills')
      .where('saved.user_id = :userId', { userId })
      .andWhere('job.status = :status', { status: JobStatus.PUBLISHED });

    const [items, totalCount] = await queryBuilder
      .orderBy('saved.saved_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Add virtual fields
    const enhancedItems = items.map(job => {
      // Calculate days since posted
      job.daysSincePosted = Math.floor(
        (new Date().getTime() - new Date(job.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // All of these are saved jobs
      job.hasSaved = true;

      return job;
    });

    return { items: enhancedItems, totalCount };
  }

  // Create a job alert
  async createJobAlert(createJobAlertDto: CreateJobAlertDto, userId: string): Promise<JobAlert> {
    const jobAlert = this.alertRepository.create({
      ...createJobAlertDto,
      userId,
    });

    return this.alertRepository.save(jobAlert);
  }

  // Get job alerts for a user
  async getUserJobAlerts(userId: string): Promise<JobAlert[]> {
    return this.alertRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Update a job alert
  async updateJobAlert(id: string, updateData: Partial<CreateJobAlertDto>, userId: string): Promise<JobAlert> {
    const jobAlert = await this.alertRepository.findOne({
      where: { id, userId }
    });

    if (!jobAlert) {
      throw new NotFoundException('Job alert not found');
    }

    Object.assign(jobAlert, updateData);

    return this.alertRepository.save(jobAlert);
  }

  // Delete a job alert
  async deleteJobAlert(id: string, userId: string): Promise<boolean> {
    const jobAlert = await this.alertRepository.findOne({
      where: { id, userId }
    });

    if (!jobAlert) {
      throw new NotFoundException('Job alert not found');
    }

    await this.alertRepository.remove(jobAlert);

    return true;
  }

  // Helper methods
  private async hasUserApplied(jobId: string, userId: string): Promise<boolean> {
    const application = await this.applicationRepository.findOne({
      where: { jobId, userId }
    });

    return !!application;
  }

  private async hasUserSavedJob(jobId: string, userId: string): Promise<boolean> {
    const saved = await this.savedRepository.findOne({
      where: { jobId, userId }
    });

    return !!saved;
  }

  private async canUserManageCompanyJobs(userId: string, companyId: string): Promise<boolean> {
    // Check if user is company admin
    const companyAdmin = await this.companyAdminRepository.findOne({
      where: { userId, companyId }
    });

    if (companyAdmin) {
      return true;
    }

    // Check if user is platform admin
    const user = await this.userRepository.findOne({
      // Continued from the previous implementation...

      private async canUserManageCompanyJobs(userId: string, companyId: string): Promise<boolean> {
        // Check if user is company admin
        const companyAdmin = await this.companyAdminRepository.findOne({
          where: { userId, companyId }
        });

        if (companyAdmin) {
          return true;
        }

        // Check if user is platform admin
        const user = await this.userRepository.findOne({
          where: { id: userId }
        });

        return user?.role === UserRole.ADMIN;
      }
  
  private async canUserViewCompanyJobs(userId: string, companyId: string): Promise<boolean> {
        // Anyone can view published jobs
        // Only company admins can view draft/unpublished jobs
        return this.canUserManageCompanyJobs(userId, companyId);
      }
  
  private async notifyEmployerOfNewApplication(application: JobApplication): Promise<void> {
        try {
          // Get job details
          const job = await this.jobRepository.findOne({
            where: { id: application.jobId },
            relations: ['company', 'postedBy'],
          });

          if (!job) return;

          // Get applicant details
          const applicant = await this.userRepository.findOne({
            where: { id: application.userId },
          });

          if (!applicant) return;

          // Notify job poster
          await this.notificationsService.createNotification({
            userId: job.postedById,
            title: 'New Job Application',
            message: `${applicant.firstName} ${applicant.lastName} applied for "${job.title}"`,
            type: 'job_application',
            linkUrl: `/jobs/applications/${application.id}`,
            data: {
              jobId: job.id,
              applicationId: application.id,
              applicantId: applicant.id
            }
          });

          // Find company admins to notify
          const companyAdmins = await this.companyAdminRepository.find({
            where: { companyId: job.companyId },
          });

          // Notify all company admins (except the job poster who was already notified)
          for (const admin of companyAdmins) {
            if (admin.userId !== job.postedById) {
              await this.notificationsService.createNotification({
                userId: admin.userId,
                title: 'New Job Application',
                message: `${applicant.firstName} ${applicant.lastName} applied for "${job.title}"`,
                type: 'job_application',
                linkUrl: `/jobs/applications/${application.id}`,
                data: {
                  jobId: job.id,
                  applicationId: application.id,
                  applicantId: applicant.id
                }
              });
            }
          }
        } catch (error) {
          // Log error but don't break the application flow
          console.error('Error sending application notification:', error);
        }
      }
  
  private async notifyApplicationStatusChange(application: JobApplication, updatedById: string): Promise<void> {
        try {
          // Get job details
          const job = await this.jobRepository.findOne({
            where: { id: application.jobId },
            relations: ['company'],
          });

          if (!job) return;

          // Different messages based on status
          let title = 'Application Status Updated';
          let message = `Your application for "${job.title}" has been updated to ${application.status}`;

          switch (application.status) {
            case ApplicationStatus.SCREENING:
              title = 'Application Being Reviewed';
              message = `Your application for "${job.title}" at ${job.company.name} is now being reviewed`;
              break;
            case ApplicationStatus.INTERVIEW:
              title = 'Interview Request';
              message = `You've been selected for an interview for "${job.title}" at ${job.company.name}`;
              break;
            case ApplicationStatus.ASSESSMENT:
              title = 'Assessment Requested';
              message = `${job.company.name} has requested an assessment for your application to "${job.title}"`;
              break;
            case ApplicationStatus.OFFER:
              title = 'Job Offer Received';
              message = `Congratulations! You've received a job offer for "${job.title}" at ${job.company.name}`;
              break;
            case ApplicationStatus.HIRED:
              title = 'Application Successful';
              message = `Congratulations! You've been hired for "${job.title}" at ${job.company.name}`;
              break;
            case ApplicationStatus.REJECTED:
              title = 'Application Status Updated';
              message = `We're sorry, but your application for "${job.title}" at ${job.company.name} was not successful at this time`;
              break;
          }

          // Notify the applicant about status change
          if (application.userId !== updatedById) {
            await this.notificationsService.createNotification({
              userId: application.userId,
              title,
              message,
              type: 'application_update',
              linkUrl: `/jobs/applications/${application.id}`,
              data: {
                jobId: job.id,
                applicationId: application.id,
                status: application.status
              }
            });
          }

          // If applicant withdrew, notify company
          if (application.status === ApplicationStatus.WITHDRAWN && updatedById === application.userId) {
            await this.notificationsService.createNotification({
              userId: job.postedById,
              title: 'Application Withdrawn',
              message: `An applicant has withdrawn their application for "${job.title}"`,
              type: 'application_update',
              linkUrl: `/jobs/applications/${application.id}`,
              data: {
                jobId: job.id,
                applicationId: application.id,
                status: application.status
              }
            });
          }
        } catch (error) {
          // Log error but don't break the application flow
          console.error('Error sending status change notification:', error);
        }
      }
    }