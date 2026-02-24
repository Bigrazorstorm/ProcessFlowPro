import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../database/entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto, tenantId: string): Promise<ClientResponseDto> {
    // Check if client with same name already exists in this tenant
    const existing = await this.clientsRepository.findOne({
      where: { name: createClientDto.name, tenantId },
    });

    if (existing) {
      throw new ConflictException(`Client "${createClientDto.name}" already exists in this tenant`);
    }

    // Create client
    const client = this.clientsRepository.create({
      ...createClientDto,
      tenantId,
    });

    await this.clientsRepository.save(client);

    return this.toResponseDto(client);
  }

  async findAll(tenantId: string): Promise<ClientResponseDto[]> {
    const clients = await this.clientsRepository.find({
      where: { tenantId },
      relations: ['primaryUser', 'secondaryUser'],
      order: { createdAt: 'DESC' },
    });

    return clients.map((client) => this.toResponseDto(client));
  }

  async findOne(id: string, tenantId: string): Promise<ClientResponseDto> {
    const client = await this.clientsRepository.findOne({
      where: { id, tenantId },
      relations: ['primaryUser', 'secondaryUser'],
    });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    return this.toResponseDto(client);
  }

  async update(id: string, updateClientDto: UpdateClientDto, tenantId: string): Promise<ClientResponseDto> {
    const client = await this.clientsRepository.findOne({
      where: { id, tenantId },
    });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    // Update fields
    Object.assign(client, updateClientDto);

    await this.clientsRepository.save(client);

    return this.toResponseDto(client);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const client = await this.clientsRepository.findOne({
      where: { id, tenantId },
    });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    await this.clientsRepository.remove(client);
  }

  private toResponseDto(client: Client): ClientResponseDto {
    return {
      id: client.id,
      name: client.name,
      address: client.address,
      taxNumber: client.taxNumber,
      companyNumber: client.companyNumber,
      industry: client.industry,
      employeeCount: client.employeeCount,
      reliabilityFactor: client.reliabilityFactor ? Number(client.reliabilityFactor) : 1.0,
      primaryUserId: client.primaryUserId,
      secondaryUserId: client.secondaryUserId,
      specialties: client.specialties || [],
      contacts: client.contacts || [],
      taxAdvisorContact: client.taxAdvisorContact,
      isActive: client.isActive,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
