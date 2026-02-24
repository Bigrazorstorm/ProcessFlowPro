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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: { user: JwtPayload },
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, req.user.tenantId!);
  }

  @Get()
  async findAll(@Request() req: { user: JwtPayload }): Promise<UserResponseDto[]> {
    return this.usersService.findAll(req.user.tenantId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }): Promise<UserResponseDto> {
    return this.usersService.findOne(id, req.user.tenantId!);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: { user: JwtPayload },
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, req.user.tenantId!);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  async delete(@Param('id') id: string, @Request() req: { user: JwtPayload }): Promise<void> {
    return this.usersService.delete(id, req.user.tenantId!);
  }
}
