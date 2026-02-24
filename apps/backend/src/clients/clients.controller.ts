import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async create(
    @Body() createClientDto: CreateClientDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ClientResponseDto> {
    return this.clientsService.create(createClientDto, req.user.tenantId!);
  }

  @Get()
  async findAll(@Request() req: { user: JwtPayload }): Promise<ClientResponseDto[]> {
    return this.clientsService.findAll(req.user.tenantId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }): Promise<ClientResponseDto> {
    return this.clientsService.findOne(id, req.user.tenantId!);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ClientResponseDto> {
    return this.clientsService.update(id, updateClientDto, req.user.tenantId!);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  async delete(@Param('id') id: string, @Request() req: { user: JwtPayload }): Promise<void> {
    return this.clientsService.delete(id, req.user.tenantId!);
  }
}
