import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioPage } from './entities/portfolio-page.entity';
import { Template } from './entities/template.entity';
import { Component } from './entities/component.entity';
import { CreatePortfolioInput } from './dto/create-portfolio.input';
import { UpdatePortfolioInput } from './dto/update-portfolio.input';
import { CreatePortfolioPageInput } from './dto/create-portfolio-page.input';
import { UpdatePortfolioPageInput } from './dto/update-portfolio-page.input';
import { ReorderPagesInput } from './dto/reorder-pages.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Portfolio)
export class PortfoliosResolver {
  constructor(private readonly portfoliosService: PortfoliosService) { }

  @Mutation(() => Portfolio)
  @UseGuards(GqlAuthGuard)
  createPortfolio(
    @Args('input') createPortfolioInput: CreatePortfolioInput,
    @CurrentUser() user: User,
  ) {
    return this.portfoliosService.create(createPortfolioInput, user);
  }

  @Query(() => [Portfolio], { name: 'portfolios' })
  findAll(@Args('userId', { type: () => ID, nullable: true }) userId?: string) {
    return this.portfoliosService.findAll(userId);
  }

  @Query(() => [Portfolio], { name: 'myPortfolios' })
  @UseGuards(GqlAuthGuard)
  findMyPortfolios(@CurrentUser() user: User) {
    return this.portfoliosService.findAll(user.id);
  }

  @Query(() => Portfolio, { name: 'portfolio' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.portfoliosService.findOne(id);
  }

  @Query(() => Portfolio, { name: 'portfolioBySlug' })
  findBySlug(
    @Args('slug') slug: string,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
  ) {
    return this.portfoliosService.findBySlug(slug, userId);
  }

  @Mutation(() => Portfolio)
  @UseGuards(GqlAuthGuard)
  updatePortfolio(@Args('input') updatePortfolioInput: UpdatePortfolioInput) {
    return this.portfoliosService.update(updatePortfolioInput.id, updatePortfolioInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  removePortfolio(@Args('id', { type: () => ID }) id: string) {
    return this.portfoliosService.remove(id);
  }

  @Mutation(() => PortfolioPage)
  @UseGuards(GqlAuthGuard)
  createPortfolioPage(
    @Args('portfolioId', { type: () => ID }) portfolioId: string,
    @Args('input') createPageInput: CreatePortfolioPageInput,
  ) {
    return this.portfoliosService.createPage(portfolioId, createPageInput);
  }

  @Mutation(() => PortfolioPage)
  @UseGuards(GqlAuthGuard)
  updatePortfolioPage(@Args('input') updatePageInput: UpdatePortfolioPageInput) {
    return this.portfoliosService.updatePage(updatePageInput.id, updatePageInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  removePortfolioPage(@Args('id', { type: () => ID }) id: string) {
    return this.portfoliosService.removePage(id);
  }

  @Mutation(() => [PortfolioPage])
  @UseGuards(GqlAuthGuard)
  reorderPortfolioPages(@Args('input') reorderInput: ReorderPagesInput) {
    return this.portfoliosService.reorderPages(reorderInput.portfolioId, reorderInput.pageIds);
  }

  @Query(() => [Template], { name: 'templates' })
  findAllTemplates() {
    return this.portfoliosService.getTemplates();
  }

  @Query(() => Template, { name: 'template' })
  findTemplate(@Args('id', { type: () => ID }) id: string) {
    return this.portfoliosService.getTemplate(id);
  }

  @Query(() => [Component], { name: 'components' })
  findAllComponents() {
    return this.portfoliosService.getComponents();
  }

  @Mutation(() => Portfolio)
  @UseGuards(GqlAuthGuard)
  incrementPortfolioView(@Args('id', { type: () => ID }) id: string) {
    return this.portfoliosService.incrementViewCount(id);
  }
}