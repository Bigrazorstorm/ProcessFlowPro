import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, tenantId: string): Promise<UserResponseDto> {
    // Check if user already exists
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      ...createUserDto,
      tenantId,
      passwordHash,
    });

    await this.usersRepository.save(user);

    return this.toResponseDto(user);
  }

  async findAll(tenantId: string): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.toResponseDto(user));
  }

  async findOne(id: string, tenantId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return this.toResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    // Update fields
    Object.assign(user, updateUserDto);

    await this.usersRepository.save(user);

    return this.toResponseDto(user);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.usersRepository.remove(user);
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      capacityPointsLimit: user.capacityPointsLimit,
      isActive: user.isActive,
      primarySubstituteId: user.primarySubstituteId,
      secondarySubstituteId: user.secondarySubstituteId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
