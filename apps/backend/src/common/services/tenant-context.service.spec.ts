import { TenantContextService } from './tenant-context.service';

const makeRequest = (user?: any) => ({ user }) as any;

describe('TenantContextService', () => {
  it('should be defined', () => {
    const service = new TenantContextService(makeRequest({ tenantId: 't1', userId: 'u1', roles: ['owner'] }));
    expect(service).toBeDefined();
  });

  describe('with valid user context', () => {
    let service: TenantContextService;

    beforeEach(() => {
      service = new TenantContextService(
        makeRequest({ tenantId: 'tenant-1', userId: 'user-1', roles: ['owner', 'senior'] }),
      );
    });

    it('should return tenantId', () => {
      expect(service.getTenantId()).toBe('tenant-1');
    });

    it('should return userId', () => {
      expect(service.getUserId()).toBe('user-1');
    });

    it('should return roles', () => {
      expect(service.getRoles()).toEqual(['owner', 'senior']);
    });

    it('should return true for hasRole when role exists', () => {
      expect(service.hasRole('owner')).toBe(true);
    });

    it('should return false for hasRole when role does not exist', () => {
      expect(service.hasRole('trainee')).toBe(false);
    });

    it('should return true for isAvailable', () => {
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('without user in request', () => {
    let service: TenantContextService;

    beforeEach(() => {
      service = new TenantContextService(makeRequest(undefined));
    });

    it('should throw when getTenantId is called', () => {
      expect(() => service.getTenantId()).toThrow('No tenant context available');
    });

    it('should throw when getUserId is called', () => {
      expect(() => service.getUserId()).toThrow('No user context available');
    });

    it('should return empty roles array', () => {
      expect(service.getRoles()).toEqual([]);
    });

    it('should return false for hasRole', () => {
      expect(service.hasRole('owner')).toBe(false);
    });

    it('should return false for isAvailable', () => {
      expect(service.isAvailable()).toBe(false);
    });
  });
});
