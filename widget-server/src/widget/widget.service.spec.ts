import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { WidgetSession } from './entities/widget.entity';
import { Application } from '../applications/entities/application.entity';

const mockApp: Application = {
  id: 'app-1',
  tenantId: 'tenant-1',
  appName: 'Test App',
  clientId: 'client-1',
  clientSecretHash: 'encrypted-secret',
  allowedDomains: ['http://localhost:4200'],
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSession: WidgetSession = {
  id: 'session-1',
  tenantId: 'tenant-1',
  applicationId: 'app-1',
  tokenHash: 'TEMP',
  origin: 'http://localhost:4200',
  isRevoked: false,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWidgetSessionRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockApplicationRepo = {
  findOne: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('WidgetService', () => {
  let service: WidgetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetService,
        {
          provide: getRepositoryToken(WidgetSession),
          useValue: mockWidgetSessionRepo,
        },
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepo,
        },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<WidgetService>(WidgetService);
    jest.clearAllMocks();
  });

  const buildValidDto = () => ({
    appId: mockApp.id,
    clientId: mockApp.clientId,
  });

  describe('initSession()', () => {
    it('should create a widget session and return a JWT token', async () => {
      const dto = buildValidDto();

      mockApplicationRepo.findOne.mockResolvedValue(mockApp);
      mockWidgetSessionRepo.create.mockReturnValue(mockSession);
      mockWidgetSessionRepo.save
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ ...mockSession, tokenHash: 'hash' });
      mockJwtService.sign.mockReturnValue('widget-jwt-token');

      const result = await service.initSession(
        dto,
        'http://localhost:4200',
        'TestAgent',
        '127.0.0.1',
      );

      expect(result).toEqual({ token: 'widget-jwt-token' });
      expect(mockWidgetSessionRepo.save).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockSession.id,
          tenantId: mockApp.tenantId,
          applicationId: mockApp.id,
        }),
      );
    });

    it('should throw when application is not found or inactive', async () => {
      mockApplicationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.initSession(buildValidDto(), 'http://localhost:4200'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when origin is not allowed', async () => {
      mockApplicationRepo.findOne.mockResolvedValue({
        ...mockApp,
        allowedDomains: ['https://portal.acme.com'],
      });

      await expect(
        service.initSession(buildValidDto(), 'https://evil.com'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.initSession(
          buildValidDto(),
          'https://portal.acme.com.evil.com',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeSession()', () => {
    it('should revoke an existing session', async () => {
      mockWidgetSessionRepo.findOne.mockResolvedValue(mockSession);
      mockWidgetSessionRepo.save.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      });

      await service.revokeSession('session-1');

      expect(mockWidgetSessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isRevoked: true }),
      );
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockWidgetSessionRepo.findOne.mockResolvedValue(null);

      await expect(service.revokeSession('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
