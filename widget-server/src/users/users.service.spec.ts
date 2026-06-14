import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AuditService } from '../audit/audit.service';

const mockUser: User = {
  id: 'user-uuid-1',
  tenantId: 'tenant-1',
  applicationId: 'app-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.com',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  find: jest.fn(),
};

const mockAuditService = {
  log: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should create a user and log audit', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.create('tenant-1', 'app-1', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        status: 'ACTIVE',
      });

      expect(result).toEqual(mockUser);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'user' }),
      );
    });

    it('should throw ConflictException if email exists in same tenant+app', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create('tenant-1', 'app-1', {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'john@test.com',
          status: 'ACTIVE',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow same email across different applications', async () => {
      mockRepository.findOne.mockResolvedValue(null); // no conflict in app-2
      mockRepository.create.mockReturnValue({
        ...mockUser,
        applicationId: 'app-2',
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        applicationId: 'app-2',
      });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.create('tenant-1', 'app-2', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        status: 'ACTIVE',
      });

      expect(result.applicationId).toBe('app-2');
    });
  });

  describe('findAll()', () => {
    it('should return paginated users scoped to tenant+app', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll('tenant-1', 'app-1', {
        page: '1',
        limit: '10',
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should apply sorting when sortBy is provided', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll('tenant-1', 'app-1', {
        page: '1',
        limit: '10',
        sortBy: 'email',
        sortOrder: 'ASC',
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { email: 'ASC' } }),
      );
    });
  });

  describe('findOne()', () => {
    it('should return a user when found in same tenant+app', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('tenant-1', 'app-1', 'user-uuid-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('tenant-1', 'app-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should update user and log audit', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.update('tenant-1', 'app-1', 'user-uuid-1', {
        firstName: 'Jane',
      });

      expect(result.firstName).toBe('Jane');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', entityType: 'user' }),
      );
    });

    it('should throw ConflictException when updating to existing email', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' });

      await expect(
        service.update('tenant-1', 'app-1', 'user-uuid-1', {
          email: 'taken@test.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove()', () => {
    it('should soft delete user and log audit', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockAuditService.log.mockResolvedValue({});

      await service.remove('tenant-1', 'app-1', 'user-uuid-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith({
        id: 'user-uuid-1',
        tenantId: 'tenant-1',
        applicationId: 'app-1',
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', entityType: 'user' }),
      );
    });
  });

  describe('removeBulk()', () => {
    it('should soft delete multiple users and log audit for each', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.removeBulk('tenant-1', 'app-1', [
        'user-uuid-1',
      ]);

      expect(result.message).toBe('1 users deleted successfully');
      expect(mockAuditService.log).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when no valid users found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(
        service.removeBulk('tenant-1', 'app-1', ['nonexistent']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatusBulk()', () => {
    it('should update status for multiple users', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.updateStatusBulk(
        'tenant-1',
        'app-1',
        ['user-uuid-1'],
        'INACTIVE',
      );

      expect(result.message).toBe(
        '1 users status updated to INACTIVE successfully',
      );
    });

    it('should throw BadRequestException when no valid users found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(
        service.updateStatusBulk(
          'tenant-1',
          'app-1',
          ['nonexistent'],
          'ACTIVE',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
