import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const tokens = this.issueTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserProfile(user),
    };
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.usersRepository.findOne({ where: { id: payload.userId } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = this.issueTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserProfile(user),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserProfile(user);
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);

    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private issueTokens(user: User) {
    const payload = this.buildPayload(user);
    const accessSecret = this.configService.get<string>('JWT_SECRET') || 'change-me';
    const accessExpiresIn = this.resolveExpiresIn(this.configService.get<string>('JWT_EXPIRATION'), 3600);
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'change-me-refresh';
    const refreshExpiresIn = this.resolveExpiresIn(this.configService.get<string>('JWT_REFRESH_EXPIRATION'), 604800);

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private resolveExpiresIn(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private verifyRefreshToken(refreshToken: string): JwtPayload {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'change-me-refresh';
      return this.jwtService.verify<JwtPayload>(refreshToken, { secret: refreshSecret });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private buildPayload(user: User): JwtPayload {
    return {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: [user.role],
    };
  }

  private toUserProfile(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
    };
  }
}
