import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from '../database/entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

const makeRepository = (overrides: Partial<Record<string, jest.Mock>> = {}) => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  ...overrides,
});

const makeClient = (partial: Partial<Client> = {}): Client =>
  ({
    id: 'client-1',
    tenantId: 'tenant-1',
    name: 'Mustermann GmbH',
    address: 'Musterstraße 1, 12345 Berlin',
    taxNumber: '123/456/78901',
    companyNumber: 'HRB 12345',
    industry: 'Steuerberatung',
    employeeCount: 10,
    reliabilityFactor: 1.0,
    primaryUserId: undefined,
    secondaryUserId: undefined,
    specialties: [],
    contacts: [],
    taxAdvisorContact: undefined,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  }) as Client;

describe('ClientsService', () => {
  let service: ClientsService;
  let repo: ReturnType<typeof makeRepository>;

  beforeEach(() => {
    repo = makeRepository();
    service = new ClientsService(repo as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateClientDto = {
      name: 'Neuer Mandant GmbH',
      industry: 'Logistik',
      employeeCount: 20,
    };

    it('should create and return a client', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = makeClient({ name: 'Neuer Mandant GmbH' });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(createDto, 'tenant-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { name: createDto.name, tenantId: 'tenant-1' } });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result.name).toBe('Neuer Mandant GmbH');
    });

    it('should throw ConflictException when client with same name exists', async () => {
      repo.findOne.mockResolvedValue(makeClient());

      await expect(service.create(createDto, 'tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should include tenantId when creating', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = makeClient();
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      await service.create(createDto, 'tenant-1');

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.tenantId).toBe('tenant-1');
    });
  });

  describe('findAll', () => {
    it('should return all clients for a tenant', async () => {
      const clients = [makeClient({ id: '1' }), makeClient({ id: '2', name: 'Zweiter Mandant' })];
      repo.find.mockResolvedValue(clients);

      const result = await service.findAll('tenant-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['primaryUser', 'secondaryUser'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no clients exist', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([]);
    });

    it('should map reliabilityFactor to number', async () => {
      const client = makeClient({ reliabilityFactor: '1.50' as any });
      repo.find.mockResolvedValue([client]);

      const result = await service.findAll('tenant-1');

      expect(typeof result[0].reliabilityFactor).toBe('number');
      expect(result[0].reliabilityFactor).toBe(1.5);
    });
  });

  describe('findOne', () => {
    it('should return a single client by id and tenantId', async () => {
      const client = makeClient();
      repo.findOne.mockResolvedValue(client);

      const result = await service.findOne('client-1', 'tenant-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'client-1', tenantId: 'tenant-1' },
        relations: ['primaryUser', 'secondaryUser'],
      });
      expect(result.id).toBe('client-1');
    });

    it('should throw NotFoundException when client does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('no-such-id', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the client', async () => {
      const client = makeClient();
      repo.findOne.mockResolvedValue(client);
      repo.save.mockResolvedValue({ ...client, name: 'Umbenannt GmbH' });

      const result = await service.update('client-1', { name: 'Umbenannt GmbH' }, 'tenant-1');

      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('Umbenannt GmbH');
    });

    it('should throw NotFoundException when client does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('no-such-id', { name: 'X' }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should merge update fields onto the existing client', async () => {
      const client = makeClient({ industry: 'Logistik' });
      repo.findOne.mockResolvedValue(client);
      repo.save.mockResolvedValue({ ...client, industry: 'Finanzen' });

      const result = await service.update('client-1', { industry: 'Finanzen' }, 'tenant-1');

      expect(result.industry).toBe('Finanzen');
    });
  });

  describe('delete', () => {
    it('should remove an existing client', async () => {
      const client = makeClient();
      repo.findOne.mockResolvedValue(client);
      repo.remove.mockResolvedValue(client);

      await expect(service.delete('client-1', 'tenant-1')).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(client);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.delete('no-such-id', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
