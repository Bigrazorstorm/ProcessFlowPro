import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

const makeRepository = (overrides: Partial<Record<string, jest.Mock>> = {}) => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  ...overrides,
});

const makeUser = (partial: Partial<User> = {}): User => ({
  id: 'user-id-1',
  tenantId: 'tenant-1',
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  role: UserRole.ACCOUNTANT,
  capacityPointsLimit: 100,
  isActive: true,
  primarySubstituteId: undefined,
  secondarySubstituteId: undefined,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...partial,
} as User);

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof makeRepository>;

  beforeEach(() => {
    repo = makeRepository();
    service = new UsersService(repo as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Secure123!',
      role: UserRole.ACCOUNTANT,
    };

    it('should create and return a user', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = makeUser({ name: 'Alice', email: 'alice@example.com' });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(createDto, 'tenant-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: createDto.email } });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result.email).toBe('alice@example.com');
    });

    it('should throw ConflictException when email already exists', async () => {
      repo.findOne.mockResolvedValue(makeUser());

      await expect(service.create(createDto, 'tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should hash the password before saving', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = makeUser();
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      await service.create(createDto, 'tenant-1');

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.passwordHash).toBeDefined();
      expect(createArg.passwordHash).not.toBe(createDto.password);
    });
  });

  describe('findAll', () => {
    it('should return all users for a tenant', async () => {
      const users = [makeUser({ id: '1' }), makeUser({ id: '2' })];
      repo.find.mockResolvedValue(users);

      const result = await service.findAll('tenant-1');

      expect(repo.find).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' }, order: { createdAt: 'DESC' } });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no users exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll('tenant-1');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);

      const result = await service.findOne('user-id-1', 'tenant-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'user-id-1', tenantId: 'tenant-1' } });
      expect(result.id).toBe('user-id-1');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('no-such-id', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, name: 'Updated Name' });

      const result = await service.update('user-id-1', { name: 'Updated Name' }, 'tenant-1');

      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('no-such-id', { name: 'X' }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should remove an existing user', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      repo.remove.mockResolvedValue(user);

      await expect(service.delete('user-id-1', 'tenant-1')).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.delete('no-such-id', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
