import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as slugify from 'slugify';
import { CompanyProfile, VerificationStatus } from './entities/company-profile.entity';
import { CompanyAdmin } from './entities/company-admin.entity';
import { CompanyLocation } from './entities/company-location.entity';
import { CompanyDepartment } from './entities/company-department.entity';
import { CompanyVerificationDocument } from './entities/company-verification-document.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AddCompanyAdminDto } from './dto/add-company-admin.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UploadVerificationDocumentDto } from './dto/upload-verification-document.dto';
import { ReviewVerificationDocumentDto } from './dto/review-verification-document.dto';
import { PaginationParams } from '../../common/dto/pagination-params.dto';
import { FilesService } from '../files/files.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyProfile)
    private companyProfileRepository: Repository<CompanyProfile>,
    @InjectRepository(CompanyAdmin)
    private companyAdminRepository: Repository<CompanyAdmin>,
    @InjectRepository(CompanyLocation)
    private companyLocationRepository: Repository<CompanyLocation>,
    @InjectRepository(CompanyDepartment)
    private companyDepartmentRepository: Repository<CompanyDepartment>,
    @InjectRepository(CompanyVerificationDocument)
    private verificationDocRepository: Repository<CompanyVerificationDocument>,
    private filesService: FilesService,
  ) { }

  async findAll(params: PaginationParams & {
    search?: string;
    industry?: string;
    verificationStatus?: VerificationStatus;
    isFeatured?: boolean;
  }): Promise<{ items: CompanyProfile[]; totalCount: number }> {
    const { page = 1, limit = 10, search, industry, verificationStatus, isFeatured } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.companyProfileRepository.createQueryBuilder('company')
      .leftJoinAndSelect('company.admins', 'admins')
      .leftJoinAndSelect('admins.user', 'users')
      .where('company.is_active = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere('(company.name ILIKE :search OR company.description ILIKE :search)', {
        search: `%${search}%`
      });
    }

    if (industry) {
      queryBuilder.andWhere('company.industry = :industry', { industry });
    }

    if (verificationStatus) {
      queryBuilder.andWhere('company.verification_status = :verificationStatus', { verificationStatus });
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('company.is_featured = :isFeatured', { isFeatured });
    }

    const [items, totalCount] = await queryBuilder
      .orderBy('company.is_featured', 'DESC')
      .addOrderBy('company.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Get job counts and extract primary admin
    const enhancedItems = await Promise.all(items.map(async (company) => {
      const jobCount = await this.getCompanyJobCount(company.id);
      const primaryAdmin = company.admins?.find(admin => admin.isPrimary)?.user;

      return {
        ...company,
        jobCount,
        primaryAdmin,
      };
    }));

    return {
      items: enhancedItems,
      totalCount
    };
  }

  async findOne(idOrSlug: string, userId?: string): Promise<CompanyProfile> {
    const company = await this.companyProfileRepository.findOne({
      where: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ],
      relations: [
        'admins',
        'admins.user',
        'locations',
        'departments',
        'verificationDocuments',
        'verificationDocuments.submittedBy'
      ],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Add job count
    const jobCount = await this.getCompanyJobCount(company.id);

    // Add primary admin user
    const primaryAdmin = company.admins?.find(admin => admin.isPrimary)?.user;

    // Add department job counts
    if (company.departments?.length) {
      await Promise.all(company.departments.map(async (department) => {
        department.jobCount = await this.getDepartmentJobCount(department.id);
      }));
    }

    // Check edit permissions
    let canEdit = false;
    if (userId) {
      canEdit = await this.canUserEditCompany(userId, company.id);
    }

    return {
      ...company,
      jobCount,
      primaryAdmin,
      canEdit,
    };
  }

  async create(createCompanyDto: CreateCompanyDto, userId: string): Promise<CompanyProfile> {
    const { name, description, industry, website, foundedYear, size, locations, ...rest } = createCompanyDto;

    // Generate slug
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 0;

    // Check if slug already exists and generate a unique one
    while (await this.companyProfileRepository.findOne({ where: { slug } })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    const company = this.companyProfileRepository.create({
      name,
      slug,
      description,
      industry,
      websiteUrl: website,
      foundedYear,
      size,
      ...rest
    });

    const savedCompany = await this.companyProfileRepository.save(company);

    // Create company admin record for creator (as primary admin)
    const admin = this.companyAdminRepository.create({
      companyId: savedCompany.id,
      userId,
      role: 'owner',
      isPrimary: true
    });

    await this.companyAdminRepository.save(admin);

    // Add headquarters location if provided
    if (locations?.length > 0) {
      const headquarters = locations[0];
      await this.createLocation({
        ...headquarters,
        isHeadquarters: true
      }, savedCompany.id);
    }

    return this.findOne(savedCompany.id, userId);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, userId: string): Promise<CompanyProfile> {
    // Check user permissions
    const canEdit = await this.canUserEditCompany(userId, id);
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit this company');
    }

    const company = await this.companyProfileRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Update company profile
    Object.assign(company, {
      ...updateCompanyDto,
      // Don't allow updating certain fields
      slug: undefined,
      verificationStatus: undefined,
      verifiedAt: undefined,
      isFeatured: undefined
    });

    const updatedCompany = await this.companyProfileRepository.save(company);
    return this.findOne(updatedCompany.id, userId);
  }

  async addAdmin(companyId: string, addAdminDto: AddCompanyAdminDto, currentUserId: string): Promise<CompanyAdmin> {
    // Check user permissions
    const canEdit = await this.canUserEditCompany(currentUserId, companyId);
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to add admins to this company');
    }

    const { userId, role, isPrimary } = addAdminDto;

    // Check if user is already an admin
    const existingAdmin = await this.companyAdminRepository.findOne({
      where: { companyId, userId }
    });

    if (existingAdmin) {
      throw new ConflictException('User is already an admin for this company');
    }

    const newAdmin = this.companyAdminRepository.create({
      companyId,
      userId,
      role,
      isPrimary: !!isPrimary
    });

    // If this is a primary admin, update other admins to non-primary
    if (isPrimary) {
      await this.companyAdminRepository.update(
        { companyId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const savedAdmin = await this.companyAdminRepository.save(newAdmin);

    return this.companyAdminRepository.findOne({
      where: { id: savedAdmin.id },
      relations: ['user', 'company']
    });
  }

  async removeAdmin(companyId: string, adminId: string, currentUserId: string): Promise<boolean> {
    // Check user permissions
    const canEdit = await this.canUserEditCompany(currentUserId, companyId);
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to remove admins from this company');
    }

    const admin = await this.companyAdminRepository.findOne({
      where: { id: adminId, companyId }
    });

    if (!admin) {
      throw new NotFoundException('Company admin not found');
    }

    // Prevent removing the primary admin
    if (admin.isPrimary) {
      throw new BadRequestException('Cannot remove the primary admin. Transfer primary admin role first.');
    }

    // Remove the admin
    await this.companyAdminRepository.remove(admin);

    return true;
  }

  async createLocation(location
    async createLocation(locationDto: CreateLocationDto, companyId: string): Promise<CompanyLocation> {
  const company = await this.companyProfileRepository.findOne({ where: { id: companyId } });
  if (!company) {
    throw new NotFoundException('Company not found');
  }

  const location = this.companyLocationRepository.create({
    ...locationDto,
    companyId
  });

  // If this is marked as headquarters and there's an existing HQ, update the old one
  if (location.isHeadquarters) {
    await this.companyLocationRepository.update(
      { companyId, isHeadquarters: true },
      { isHeadquarters: false }
    );
  }

  return this.companyLocationRepository.save(location);
}

  async updateLocation(id: string, locationDto: Partial<CreateLocationDto>, userId: string): Promise < CompanyLocation > {
  const location = await this.companyLocationRepository.findOne({
    where: { id },
    relations: ['company']
  });

  if(!location) {
    throw new NotFoundException('Location not found');
  }

    // Check user permissions
    const canEdit = await this.canUserEditCompany(userId, location.companyId);
  if(!canEdit) {
    throw new ForbiddenException('You do not have permission to edit this company location');
  }

    // Update location
    Object.assign(location, locationDto);

  // If this is marked as headquarters and there's an existing HQ, update the old one
  if(locationDto.isHeadquarters) {
  await this.companyLocationRepository.update(
    { companyId: location.companyId, isHeadquarters: true, id: Not(id) },
    { isHeadquarters: false }
  );
}

return this.companyLocationRepository.save(location);
  }

  async deleteLocation(id: string, userId: string): Promise < boolean > {
  const location = await this.companyLocationRepository.findOne({
    where: { id },
    relations: ['company']
  });

  if(!location) {
    throw new NotFoundException('Location not found');
  }

    // Check user permissions
    const canEdit = await this.canUserEditCompany(userId, location.companyId);
  if(!canEdit) {
    throw new ForbiddenException('You do not have permission to delete this company location');
  }
    
    await this.companyLocationRepository.remove(location);
  return true;
}

  async createDepartment(departmentDto: CreateDepartmentDto, companyId: string, userId: string): Promise < CompanyDepartment > {
  // Check user permissions
  const canEdit = await this.canUserEditCompany(userId, companyId);
  if(!canEdit) {
    throw new ForbiddenException('You do not have permission to edit this company');
  }

    // Check if department with same name already exists
    const existingDepartment = await this.companyDepartmentRepository.findOne({
    where: {
      companyId,
      name: departmentDto.name
    }
  });

  if(existingDepartment) {
    throw new ConflictException(`Department '${departmentDto.name}' already exists`);
  }
    
    const department = this.companyDepartmentRepository.create({
    ...departmentDto,
    companyId
  });

  return this.companyDepartmentRepository.save(department);
}

  async updateDepartment(id: string, departmentDto: Partial<CreateDepartmentDto>, userId: string): Promise < CompanyDepartment > {
  const department = await this.companyDepartmentRepository.findOne({
    where: { id },
    relations: ['company']
  });

  if(!department) {
    throw new NotFoundException('Department not found');
  }

    // Check user permissions
    const canEdit = await this.canUserEditCompany(userId, department.companyId);
  if(!canEdit) {
    throw new ForbiddenException('You do not have permission to edit this company department');
  }

    // Check if name change would result in duplicate
    if(departmentDto.name && departmentDto.name !== department.name) {
  const existingDepartment = await this.companyDepartmentRepository.findOne({
    where: {
      companyId: department.companyId,
      name: departmentDto.name
    }
  });

  if (existingDepartment) {
    throw new ConflictException(`Department '${departmentDto.name}' already exists`);
  }
}

// Update department
Object.assign(department, departmentDto);

return this.companyDepartmentRepository.save(department);
  }

  async deleteDepartment(id: string, userId: string): Promise < boolean > {
  const department = await this.companyDepartmentRepository.findOne({
    where: { id },
    relations: ['company']
  });

  if(!department) {
    throw new NotFoundException('Department not found');
  }

    // Check user permissions
    const canEdit = await this.canUserEditCompany(userId, department.companyId);
  if(!canEdit) {
    throw new ForbiddenException('You do not have permission to delete this company department');
  }
    
    await this.companyDepartmentRepository.remove(department);
  return true;
}

  async uploadVerificationDocument(
  companyId: string,
  document: UploadVerificationDocumentDto,
  userId: string
): Promise < CompanyVerificationDocument > {
  // Check user permissions
  const canEdit = await this.canUserEditCompany(userId, companyId);
  if(!canEdit) {
    throw new ForbiddenException('You do not have permission to upload verification documents for this company');
  }
    
    const company = await this.companyProfileRepository.findOne({ where: { id: companyId } });
  if(!company) {
    throw new NotFoundException('Company not found');
  }

    // Create document record
    const verificationDoc = this.verificationDocRepository.create({
    companyId,
    documentType: document.documentType,
    documentUrl: document.documentUrl,
    submittedById: userId,
    status: VerificationStatus.PENDING,
    notes: document.notes
  });

  // Update company verification status if it's unverified
  if(company.verificationStatus === VerificationStatus.UNVERIFIED) {
  company.verificationStatus = VerificationStatus.PENDING;
  await this.companyProfileRepository.save(company);
}

return this.verificationDocRepository.save(verificationDoc);
  }

  async reviewVerificationDocument(
  documentId: string,
  reviewData: ReviewVerificationDocumentDto,
  userId: string
): Promise < CompanyVerificationDocument > {
  // Only admins can review documents
  // This would typically use a guard or decorator in the controller

  const document = await this.verificationDocRepository.findOne({
    where: { id: documentId },
    relations: ['company']
  });

  if(!document) {
    throw new NotFoundException('Verification document not found');
  }

    // Update document status
    document.status = reviewData.status;
  document.reviewedById = userId;
  document.reviewedAt = new Date();
  document.notes = reviewData.notes || document.notes;

  const savedDocument = await this.verificationDocRepository.save(document);

  // Update company verification status
  if(reviewData.updateCompanyStatus) {
  const company = document.company;
  company.verificationStatus = reviewData.status;

  if (reviewData.status === VerificationStatus.VERIFIED) {
    company.verifiedAt = new Date();
  }

  await this.companyProfileRepository.save(company);
}

return savedDocument;
  }

  // Helper methods
  private async canUserEditCompany(userId: string, companyId: string): Promise < boolean > {
  // Check if user is a company admin
  const admin = await this.companyAdminRepository.findOne({
    where: { userId, companyId }
  });

  return !!admin;
}

  private async getCompanyJobCount(companyId: string): Promise < number > {
  // This would use the JobsService in a real implementation
  // For now, we'll return a placeholder
  return 0;
}

  private async getDepartmentJobCount(departmentId: string): Promise < number > {
  // This would use the JobsService in a real implementation
  // For now, we'll return a placeholder
  return 0;
}
}