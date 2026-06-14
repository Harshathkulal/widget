import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit.entity';

const mockAuditLog: AuditLog = {
  id: 'audit-1',
  tenantId: 'tenant-1',
  applicationId: 'app-1',
  entityType: 'user',
  entityId: 'user-1',
  action: 'CREATE',
  performedBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
};

describe('AuditService', () => {
  let service: AuditService;
  let repo: jest.Mocked<Repository<AuditLog>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get(getRepositoryToken(AuditLog));
    jest.clearAllMocks();
  });

  describe('log()', () => {
    it('should create and save an audit log entry', async () => {
      const params = {
        tenantId: 'tenant-1',
        applicationId: 'app-1',
        entityType: 'user',
        entityId: 'user-1',
        action: 'CREATE',
        newValue: { email: 'test@test.com' },
        performedBy: 'admin',
      };

      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(params);

      expect(result).toEqual(mockAuditLog);
      expect(mockRepository.create).toHaveBeenCalledWith(params);
      expect(mockRepository.save).toHaveBeenCalledWith(mockAuditLog);
    });
  });

  describe('findByEntity()', () => {
    it('should return audit logs for a specific entity', async () => {
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findByEntity(
        'tenant-1',
        'app-1',
        'user',
        'user-1',
      );

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          applicationId: 'app-1',
          entityType: 'user',
          entityId: 'user-1',
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findAll()', () => {
    it('should return paginated audit logs', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockAuditLog], 1]);

      const result = await service.findAll('tenant-1', 'app-1', 1, 10);

      expect(result).toEqual({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });
});
