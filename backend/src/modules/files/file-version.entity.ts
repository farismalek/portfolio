import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { SharedFile } from './shared-file.entity';

@ObjectType()
@Entity('file_versions')
export class FileVersion {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => SharedFile)
  @ManyToOne(() => SharedFile, file => file.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: SharedFile;

  @Field()
  @Column({ name: 'file_id' })
  fileId: string;

  @Field(() => Int)
  @Column({ name: 'version_number' })
  versionNumber: number;

  @Field()
  @Column({ name: 'file_path' })
  filePath: string;

  @Field()
  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Field()
  @Column({ name: 'uploaded_by' })
  uploadedById: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  notes: string;

  // Virtual field
  @Field()
  url: string;
}