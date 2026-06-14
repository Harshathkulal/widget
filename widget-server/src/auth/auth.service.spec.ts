import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { AuthUser, UserRole } from './entities/auth.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const mockAuthUser: AuthUser = {
  id: 'auth-user-1',
  tenantId: '00000000-0000-0000-0000-000000000001',
  email: 'admin@test.com',
  passwordHash: 'hashed-password',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<Repository<AuthUser>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(AuthUser), useValue: mockRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get(getRepositoryToken(AuthUser));
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('should register a new user with hashed password', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockAuthUser);
      mockRepository.save.mockResolvedValue(mockAuthUser);
      jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

      const result = await service.register({
        email: 'admin@test.com',
        password: 'password123',
        role: UserRole.ADMIN,
      });

      expect(result).toEqual(mockAuthUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockAuthUser);

      await expect(
        service.register({
          email: 'admin@test.com',
          password: 'password123',
          role: UserRole.VIEWER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login()', () => {
    it('should return access token for valid credentials', async () => {
      mockRepository.findOne.mockResolvedValue(mockAuthUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({
        email: 'admin@test.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockAuthUser.id,
          email: mockAuthUser.email,
          role: mockAuthUser.role,
        }),
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockRepository.findOne.mockResolvedValue(mockAuthUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
