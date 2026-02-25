import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ChatService } from './chat.service';
import { CreateChatRoomDto, SendMessageDto } from './dto/chat.dto';
import { EventsGateway } from '../websockets/events.gateway';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ─── Rooms ────────────────────────────────────────────────────────────────

  @Post('rooms')
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  createRoom(@Request() req: any, @Body() dto: CreateChatRoomDto) {
    return this.chatService.createRoom(req.user.tenantId!, req.user.id, req.user.name || req.user.email, dto);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List all chat rooms for the current tenant' })
  findAllRooms(@Request() req: any) {
    return this.chatService.findAllRooms(req.user.tenantId!);
  }

  @Delete('rooms/:roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat room' })
  removeRoom(@Request() req: any, @Param('roomId') roomId: string) {
    this.chatService.removeRoom(req.user.tenantId!, roomId);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Send a message to a chat room' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  sendMessage(@Request() req: any, @Param('roomId') roomId: string, @Body() dto: SendMessageDto) {
    const msg = this.chatService.sendMessage(
      req.user.tenantId!,
      roomId,
      req.user.id,
      req.user.name || req.user.email,
      dto,
    );

    // Broadcast to all tenant members via WebSocket
    this.eventsGateway.broadcastToTenant(req.user.tenantId!, 'chat:message', {
      roomId,
      message: msg,
    });

    return msg;
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get messages from a chat room' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recent messages (default: 50)' })
  findMessages(@Request() req: any, @Param('roomId') roomId: string, @Query('limit') limit?: string) {
    return this.chatService.findMessages(req.user.tenantId!, roomId, limit ? parseInt(limit, 10) : 50);
  }

  @Delete('rooms/:roomId/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own message' })
  deleteMessage(@Request() req: any, @Param('roomId') roomId: string, @Param('messageId') messageId: string) {
    this.chatService.deleteMessage(req.user.tenantId!, roomId, messageId, req.user.id);
    this.eventsGateway.broadcastToTenant(req.user.tenantId!, 'chat:message_deleted', {
      roomId,
      messageId,
    });
  }
}
