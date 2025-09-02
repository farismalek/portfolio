import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

export enum ComponentCategory {
  HEADER = 'header',
  HERO = 'hero',
  ABOUT = 'about',
  PROJECTS = 'projects',
  SKILLS = 'skills',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  TESTIMONIALS = 'testimonials',
  CONTACT = 'contact',
  GALLERY = 'gallery',
  FOOTER = 'footer',
  CUSTOM = 'custom',
}

@ObjectType()
@Entity('components')
export class Component {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: ComponentCategory,
  })
  category: ComponentCategory;

  @Field()
  @Column()
  type: string;

  @Field(() => String)
  @Column({ type: 'jsonb' })
  schema: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  defaultData: Record<string, any>;

  @Field()
  @Column()
  thumbnailUrl: string;

  @Field(() => Boolean)
  @Column({ default: false })
  isPremium: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}