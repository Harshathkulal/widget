import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    tenantId: string,
    applicationId: string,
    createUserDto: CreateUserDto,
    performedBy = 'system',
    ipAddress?: string,
  ) {
    const existingUser = await this.userRepository.findOne({
      where: {
        tenantId,
        applicationId,
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists in this application');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      tenantId,
      applicationId,
    });

    const savedUser = await this.userRepository.save(user);

    await this.auditService.log({
      tenantId,
      applicationId,
      entityType: 'user',
      entityId: savedUser.id,
      action: 'CREATE',
      newValue: savedUser,
      performedBy,
      ipAddress,
    });

    return savedUser;
  }

  async findAll(tenantId: string, applicationId: string, query: GetUsersDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 10), 100);
    const search = (query.search ?? '').trim();
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = (query.sortOrder ?? 'DESC').toUpperCase() as
      | 'ASC'
      | 'DESC';

    const baseWhere = { tenantId, applicationId };
    const whereConditions = search
      ? [
          { ...baseWhere, firstName: ILike(`%${search}%`) },
          { ...baseWhere, lastName: ILike(`%${search}%`) },
          { ...baseWhere, email: ILike(`%${search}%`) },
        ]
      : [baseWhere];

    const allowedSortFields = [
      'firstName',
      'lastName',
      'email',
      'status',
      'createdAt',
      'updatedAt',
    ];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const order = { [orderField]: sortOrder };

    const [users, total] = await this.userRepository.findAndCount({
      where: whereConditions,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, applicationId: string, id: string) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, applicationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    tenantId: string,
    applicationId: string,
    id: string,
    updateUserDto: UpdateUserDto,
    performedBy = 'system',
    ipAddress?: string,
  ) {
    const user = await this.findOne(tenantId, applicationId, id);
    const oldValue = { ...user };

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: {
          tenantId,
          applicationId,
          email: updateUserDto.email,
        },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists in this application');
      }
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    await this.auditService.log({
      tenantId,
      applicationId,
      entityType: 'user',
      entityId: updatedUser.id,
      action: 'UPDATE',
      oldValue,
      newValue: updatedUser,
      performedBy,
      ipAddress,
    });

    return updatedUser;
  }

  async remove(
    tenantId: string,
    applicationId: string,
    id: string,
    performedBy = 'system',
    ipAddress?: string,
  ) {
    const user = await this.findOne(tenantId, applicationId, id);
    const oldValue = { ...user };

    await this.userRepository.softDelete({ id, tenantId, applicationId });

    await this.auditService.log({
      tenantId,
      applicationId,
      entityType: 'user',
      entityId: id,
      action: 'DELETE',
      oldValue,
      performedBy,
      ipAddress,
    });

    return {
      message: 'User deleted successfully',
    };
  }

  async removeBulk(
    tenantId: string,
    applicationId: string,
    ids: string[],
    performedBy = 'system',
    ipAddress?: string,
  ) {
    const users = await this.userRepository.find({
      where: { id: In(ids), tenantId, applicationId },
    });

    if (users.length === 0) {
      throw new BadRequestException('No valid users found for deletion');
    }

    const deleteIds = users.map((u) => u.id);
    await this.userRepository.softDelete({
      id: In(deleteIds),
      tenantId,
      applicationId,
    });

    for (const user of users) {
      await this.auditService.log({
        tenantId,
        applicationId,
        entityType: 'user',
        entityId: user.id,
        action: 'DELETE',
        oldValue: user,
        performedBy,
        ipAddress,
      });
    }

    return {
      message: `${users.length} users deleted successfully`,
    };
  }

  async updateStatusBulk(
    tenantId: string,
    applicationId: string,
    ids: string[],
    status: string,
    performedBy = 'system',
    ipAddress?: string,
  ) {
    const users = await this.userRepository.find({
      where: { id: In(ids), tenantId, applicationId },
    });

    if (users.length === 0) {
      throw new BadRequestException('No valid users found for status update');
    }

    for (const user of users) {
      const oldValue = { ...user };
      user.status = status;
      const updatedUser = await this.userRepository.save(user);

      await this.auditService.log({
        tenantId,
        applicationId,
        entityType: 'user',
        entityId: user.id,
        action: 'UPDATE',
        oldValue,
        newValue: updatedUser,
        performedBy,
        ipAddress,
      });
    }

    return {
      message: `${users.length} users status updated to ${status} successfully`,
    };
  }
}
