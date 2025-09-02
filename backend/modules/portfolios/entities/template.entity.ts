import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

export enum TemplateCategory {
  CREATIVE = 'creative',
  PROFESSIONAL = 'professional',
  MINIMAL = 'minimal',
  TECH = 'tech',
  DESIGN = 'design',
  PHOTOGRAPHY = 'photography',
  BUSINESS = 'business',
  CUSTOM = 'custom',
}

@ObjectType()
@Entity('templates')
export class Template {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.PROFESSIONAL,
  })
  category: TemplateCategory;

  @Field()
  @Column()
  thumbnailUrl: string;

  @Field(() => String)
  @Column({ type: 'jsonb' })
  structure: Record<string, any>;

  @Field(() => String)
  @Column({ type: 'jsonb' })
  defaultPages: Record<string, any>[];

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  typography: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  colors: Record<string, any>;

  @Field(() => Boolean)
  @Column({ default: false })
  isPremium: boolean;

  @Field(() => Boolean)
  @Column({ default: false })
  featured: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}