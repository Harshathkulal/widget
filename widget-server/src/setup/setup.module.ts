import { Module } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [TenantsModule, ApplicationsModule],
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule {}
