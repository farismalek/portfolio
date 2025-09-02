import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { PostType } from '../../posts/entities/post.entity';

@ObjectType()
export class FeedItemDto {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => String)
  type: PostType;

  @Field(() => String, { nullable: true })
  media?: Record<string, any>;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Int)
  reactionCount: number;

  @Field(() => Int)
  commentCount: number;

  @Field(() => Boolean)
  hasReacted: boolean;
}