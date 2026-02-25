import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../database/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Manually mock bcrypt to avoid actual hashing in unit tests
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const makeUserRepo = () => ({
  findOne: jest.fn(),
});

const makeJwtService = () => ({
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn(),
});

const makeConfigService = () => ({
  get: jest.fn().mockReturnValue(undefined),
});

const makeUser = (partial: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    tenantId: 'tenant-1',
    name: 'Test User',
    email: 'user@example.com',
    passwordHash: '$2b$10$hashedpassword',
    role: UserRole.ACCOUNTANT,
    capacityPointsLimit: 100,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  } as User);

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof makeUserRepo>;
  let jwtService: ReturnType<typeof makeJwtService>;
  let configService: ReturnType<typeof makeConfigService>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    jwtService = makeJwtService();
    configService = makeConfigService();
    service = new AuthService(userRepo as any, jwtService as any, configService as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens and user profile on valid credentials', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'user@example.com', password: 'correct' });

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(result.user.email).toBe('user@example.com');
      expect(result.user.id).toBe('user-1');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login({ email: 'missing@example.com', password: 'any' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ isActive: false }));

      await expect(service.login({ email: 'user@example.com', password: 'any' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const user = makeUser();
      jwtService.verify.mockReturnValue({ userId: 'user-1', tenantId: 'tenant-1', email: 'user@example.com', roles: [UserRole.ACCOUNTANT] });
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBeDefined();
      expect(result.user.id).toBe('user-1');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      jwtService.verify.mockReturnValue({ userId: 'user-1', tenantId: 'tenant-1', email: 'user@example.com', roles: [] });
      userRepo.findOne.mockResolvedValue(makeUser({ isActive: false }));

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user no longer exists', async () => {
      jwtService.verify.mockReturnValue({ userId: 'ghost', tenantId: 'tenant-1', email: 'ghost@example.com', roles: [] });
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('user@example.com');
      expect(result.role).toBe(UserRole.ACCOUNTANT);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile('no-such-id')).rejects.toThrow(NotFoundException);
    });
  });
});
