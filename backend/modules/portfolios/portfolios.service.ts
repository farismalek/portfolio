import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio, PortfolioStatus, PortfolioVisibility } from './entities/portfolio.entity';
import { PortfolioPage } from './entities/portfolio-page.entity';
import { Template } from './entities/template.entity';
import { Component } from './entities/component.entity';
import { User } from '../users/entities/user.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { CreatePortfolioPageDto } from './dto/create-portfolio-page.dto';
import { UpdatePortfolioPageDto } from './dto/update-portfolio-page.dto';
import { slugify } from '../../common/utils/slugify.util';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioPage)
    private pageRepository: Repository<PortfolioPage>,
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
  ) { }

  async create(createPortfolioDto: CreatePortfolioDto, user: User): Promise<Portfolio> {
    const { title, templateId } = createPortfolioDto;

    // Check if the template exists
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Generate a slug based on title
    let slug = slugify(title);
    let isSlugUnique = false;
    let counter = 0;

    // Ensure the slug is unique
    while (!isSlugUnique) {
      const slugToCheck = counter === 0 ? slug : `${slug}-${counter}`;
      const existingPortfolio = await this.portfolioRepository.findOne({
        where: { slug: slugToCheck, userId: user.id },
      });
      if (!existingPortfolio) {
        isSlugUnique = true;
        slug = slugToCheck;
      } else {
        counter++;
      }
    }

    // Create portfolio with default settings from template
    const portfolio = this.portfolioRepository.create({
      ...createPortfolioDto,
      slug,
      userId: user.id,
      user,
      customizations: template.typography || {},
      settings: {
        typography: template.typography || {},
        colors: template.colors || {},
        layout: {},
      },
    });

    const savedPortfolio = await this.portfolioRepository.save(portfolio);

    // Create default pages based on the template
    if (template.defaultPages && Array.isArray(template.defaultPages)) {
      const pages = template.defaultPages.map((page, index) => {
        return this.pageRepository.create({
          title: page.title,
          slug: slugify(page.title),
          order: index,
          content: page.content || {},
          isHomePage: index === 0, // First page is the home page
          portfolioId: savedPortfolio.id,
          portfolio: savedPortfolio,
        });
      });

      await this.pageRepository.save(pages);
      savedPortfolio.pages = pages;
    }

    return savedPortfolio;
  }

  async findAll(userId?: string): Promise<Portfolio[]> {
    const queryBuilder = this.portfolioRepository.createQueryBuilder('portfolio')
      .leftJoinAndSelect('portfolio.user', 'user')
      .leftJoinAndSelect('portfolio.pages', 'pages')
      .orderBy('portfolio.createdAt', 'DESC');

    if (userId) {
      queryBuilder.where('portfolio.userId = :userId', { userId });
    } else {
      // If no userId provided, only return public portfolios
      queryBuilder.where('portfolio.visibility = :visibility', {
        visibility: PortfolioVisibility.PUBLIC
      });
      queryBuilder.andWhere('portfolio.status = :status', {
        status: PortfolioStatus.PUBLISHED
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: ['user', 'pages'],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }

    return portfolio;
  }

  async findBySlug(slug: string, userId?: string): Promise<Portfolio> {
    const queryBuilder = this.portfolioRepository.createQueryBuilder('portfolio')
      .leftJoinAndSelect('portfolio.user', 'user')
      .leftJoinAndSelect('portfolio.pages', 'pages')
      .where('portfolio.slug = :slug', { slug });

    if (userId) {
      // If userId provided, return the portfolio if it belongs to the user
      queryBuilder.andWhere('portfolio.userId = :userId', { userId });
    } else {
      // If no userId, only return if it's public and published
      queryBuilder.andWhere('portfolio.visibility = :visibility', {
        visibility: PortfolioVisibility.PUBLIC
      });
      queryBuilder.andWhere('portfolio.status = :status', {
        status: PortfolioStatus.PUBLISHED
      });
    }

    const portfolio = await queryBuilder.getOne();

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with slug ${slug} not found`);
    }

    return portfolio;
  }

  async update(id: string, updatePortfolioDto: UpdatePortfolioDto): Promise<Portfolio> {
    const portfolio = await this.findOne(id);

    // If title is changed, update the slug
    if (updatePortfolioDto.title && updatePortfolioDto.title !== portfolio.title) {
      const newSlug = slugify(updatePortfolioDto.title);

      // Check if the new slug is already taken
      const existingWithSlug = await this.portfolioRepository.findOne({
        where: { slug: newSlug, userId: portfolio.userId },
      });

      if (existingWithSlug && existingWithSlug.id !== id) {
        // If taken, append a counter
        let counter = 1;
        let uniqueSlug = `${newSlug}-${counter}`;

        while (await this.portfolioRepository.findOne({
          where: { slug: uniqueSlug, userId: portfolio.userId },
        })) {
          counter++;
          uniqueSlug = `${newSlug}-${counter}`;
        }

        updatePortfolioDto.slug = uniqueSlug;
      } else {
        updatePortfolioDto.slug = newSlug;
      }
    }

    // Handle status changes
    if (updatePortfolioDto.status === PortfolioStatus.PUBLISHED &&
      portfolio.status !== PortfolioStatus.PUBLISHED) {
      updatePortfolioDto.publishedAt = new Date();
    }

    // Update the portfolio
    Object.assign(portfolio, updatePortfolioDto);
    return this.portfolioRepository.save(portfolio);
  }

  async remove(id: string): Promise<boolean> {
    const portfolio = await this.findOne(id);
    await this.portfolioRepository.remove(portfolio);
    return true;
  }

  // Page management
  async createPage(portfolioId: string, createPageDto: CreatePortfolioPageDto): Promise<PortfolioPage> {
    const portfolio = await this.findOne(portfolioId);

    // Generate slug
    const slug = slugify(createPageDto.title);

    // Get max order to add page to the end
    const maxOrderPage = await this.pageRepository.findOne({
      where: { portfolioId },
      order: { order: 'DESC' },
    });

    const order = maxOrderPage ? maxOrderPage.order + 1 : 0;

    const page = this.pageRepository.create({
      ...createPageDto,
      slug,
      order,
      portfolioId,
      portfolio,
    });

    return this.pageRepository.save(page);
  }

  async updatePage(id: string, updatePageDto: UpdatePortfolioPageDto): Promise<PortfolioPage> {
    const page = await this.pageRepository.findOne({
      where: { id },
      relations: ['portfolio'],
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    // If title is changed, update slug
    if (updatePageDto.title && updatePageDto.title !== page.title) {
      updatePageDto.slug = slugify(updatePageDto.title);
    }

    Object.assign(page, updatePageDto);
    return this.pageRepository.save(page);
  }

  async removePage(id: string): Promise<boolean> {
    const page = await this.pageRepository.findOne({
      where: { id },
      relations: ['portfolio'],
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    // Prevent removing the last page
    const pageCount = await this.pageRepository.count({
      where: { portfolioId: page.portfolioId },
    });

    if (pageCount <= 1) {
      throw new ConflictException('Cannot remove the last page of a portfolio');
    }

    // If removing home page, set another page as home
    if (page.isHomePage) {
      const newHomePage = await this.pageRepository.findOne({
        where: {
          portfolioId: page.portfolioId,
          id: id !== id // Any page other than the current one
        },
      });

      if (newHomePage) {
        newHomePage.isHomePage = true;
        await this.pageRepository.save(newHomePage);
      }
    }

    await this.pageRepository.remove(page);

    // Reorder pages to maintain consecutive order
    const remainingPages = await this.pageRepository.find({
      where: { portfolioId: page.portfolioId },
      order: { order: 'ASC' },
    });

    for (let i = 0; i < remainingPages.length; i++) {
      remainingPages[i].order = i;
      await this.pageRepository.save(remainingPages[i]);
    }

    return true;
  }

  async reorderPages(portfolioId: string, pageIds: string[]): Promise<PortfolioPage[]> {
    const portfolio = await this.findOne(portfolioId);

    // Verify all pages exist and belong to the portfolio
    const pages = await this.pageRepository.findBy({ portfolioId });

    if (pages.length !== pageIds.length) {
      throw new ConflictException('Page IDs do not match portfolio pages');
    }

    // Update order of each page
    const updatedPages: PortfolioPage[] = [];

    for (let i = 0; i < pageIds.length; i++) {
      const page = pages.find(p => p.id === pageIds[i]);
      if (!page) {
        throw new NotFoundException(`Page with ID ${pageIds[i]} not found in portfolio`);
      }

      page.order = i;
      updatedPages.push(await this.pageRepository.save(page));
    }

    return updatedPages;
  }

  async getComponents(): Promise<Component[]> {
    return this.componentRepository.find();
  }

  async getTemplates(): Promise<Template[]> {
    return this.templateRepository.find();
  }

  async getTemplate(id: string): Promise<Template> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async incrementViewCount(id: string): Promise<Portfolio> {
    const portfolio = await this.findOne(id);
    portfolio.viewCount += 1;
    portfolio.lastViewedAt = new Date();
    return this.portfolioRepository.save(portfolio);
  }
}