import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Application } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { encryptSecret } from '../common/utils/crypto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
  ): Promise<Application & { clientSecret: string }> {
    const clientId = `wgt_app_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `wgt_sec_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecretHash = encryptSecret(clientSecret);

    const app = this.applicationRepository.create({
      ...createApplicationDto,
      clientId,
      clientSecretHash,
    });

    const savedApp = await this.applicationRepository.save(app);
    return {
      ...savedApp,
      clientSecret,
    };
  }

  async findAll(): Promise<Application[]> {
    return this.applicationRepository.find();
  }

  async findOne(id: string): Promise<Application> {
    const app = await this.applicationRepository.findOne({ where: { id } });
    if (!app) {
      throw new NotFoundException(`Application with ID "${id}" not found`);
    }
    return app;
  }

  async findByClientId(clientId: string): Promise<Application> {
    const app = await this.applicationRepository.findOne({
      where: { clientId },
    });
    if (!app) {
      throw new NotFoundException(
        `Application with Client ID "${clientId}" not found`,
      );
    }
    return app;
  }

  async findByClientIdAndAppId(
    clientId: string,
    id: string,
  ): Promise<Application> {
    const app = await this.applicationRepository.findOne({
      where: { clientId, id },
    });
    if (!app) {
      throw new NotFoundException(
        `Application with Client ID "${clientId}" and App ID "${id}" not found`,
      );
    }
    return app;
  }

  async update(
    id: string,
    updateApplicationDto: UpdateApplicationDto,
  ): Promise<Application> {
    const app = await this.findOne(id);
    Object.assign(app, updateApplicationDto);
    return this.applicationRepository.save(app);
  }

  async remove(id: string): Promise<void> {
    const app = await this.findOne(id);
    await this.applicationRepository.softRemove(app);
  }
}
