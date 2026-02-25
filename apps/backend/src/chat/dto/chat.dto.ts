import { IsString, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChatRoomType {
  GENERAL = 'general',
  TEAM = 'team',
  CLIENT = 'client',
}

export class CreateChatRoomDto {
  @ApiProperty({ description: 'Name of the chat room' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ChatRoomType, default: ChatRoomType.GENERAL })
  @IsEnum(ChatRoomType)
  @IsOptional()
  type?: ChatRoomType;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

export interface ChatRoom {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ChatRoomType;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  tenantId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
