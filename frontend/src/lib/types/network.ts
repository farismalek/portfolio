import type { User } from './user';

export enum ConnectionType {
  FOLLOW = 'follow',
  CONNECTION = 'connection'
}

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked'
}

export interface Connection {
  id: string;
  followerId: string;
  followingId: string;
  follower?: User;
  following?: User;
  type: ConnectionType;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FollowStatus {
  isFollowing: boolean;
  isPending: boolean;
  isBlocked: boolean;
  connectionId: string | null;
}

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  GALLERY = 'gallery',
  VIDEO = 'video',
  ARTICLE = 'article',
  PORTFOLIO = 'portfolio',
  PROJECT = 'project',
  JOB = 'job'
}

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum PostVisibility {
  PUBLIC = 'public',
  CONNECTIONS = 'connections',
  PRIVATE = 'private'
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  type: PostType;
  title?: string;
  content?: string;
  media?: any;
  metadata?: any;
  status: PostStatus;
  visibility: PostVisibility;
  portfolioId?: string;
  parentId?: string;
  viewCount: number;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  hasUserReacted: boolean;
  reactions?: Reaction[];
  comments?: Comment[] | Post[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Reaction {
  id: string;
  userId: string;
  user?: User;
  postId: string;
  post?: Post;
  type: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: User;
  postId: string;
  post?: Post;
  parentId?: string;
  parent?: Comment;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  NEW_FOLLOWER = 'new_follower',
  CONNECTION_REQUEST = 'connection_request',
  CONNECTION_ACCEPTED = 'connection_accepted',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  COMMENT_REPLY = 'comment_reply',
  POST_SHARE = 'post_share',
  MENTION = 'mention',
  PORTFOLIO_VIEW = 'portfolio_view',
  JOB_APPLICATION = 'job_application'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  senderId?: string;
  sender?: User;
  postId?: string;
  post?: Post;
  commentId?: string;
  comment?: Comment;
  portfolioId?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}