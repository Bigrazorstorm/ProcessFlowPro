import { RolesGuard } from './roles.guard';
import { TenantGuard } from './tenant.guard';
import { UserRole } from '../../database/entities/user.entity';

// Helper to build a minimal ExecutionContext mock
const makeExecutionContext = (user: any) => {
  const request = { user };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as any;
};

// ─── RolesGuard ───────────────────────────────────────────────────────────────

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as any);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeExecutionContext({ roles: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when required roles array is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = makeExecutionContext({ roles: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user is not present', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    const ctx = makeExecutionContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should deny access when user has no roles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    const ctx = makeExecutionContext({ roles: undefined });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should allow access when user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    const ctx = makeExecutionContext({ roles: [UserRole.OWNER] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER, UserRole.SENIOR]);
    const ctx = makeExecutionContext({ roles: [UserRole.SENIOR] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user does not have any required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    const ctx = makeExecutionContext({ roles: [UserRole.TRAINEE] });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});

// ─── TenantGuard ──────────────────────────────────────────────────────────────

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should deny access when user is not present', () => {
    const ctx = makeExecutionContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should allow access when user has a tenantId', () => {
    const ctx = makeExecutionContext({ tenantId: 'tenant-1', roles: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access for SUPER_ADMIN without tenantId', () => {
    const ctx = makeExecutionContext({ tenantId: null, roles: [UserRole.SUPER_ADMIN] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access for non-admin without tenantId', () => {
    const ctx = makeExecutionContext({ tenantId: null, roles: [UserRole.ACCOUNTANT] });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
