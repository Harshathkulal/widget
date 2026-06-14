import { Injectable } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { ApplicationsService } from '../applications/applications.service';
import { RegisterAppDto } from './dto/register-app.dto';

@Injectable()
export class SetupService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async registerApp(registerAppDto: RegisterAppDto) {
    const { email, companyName, appName, allowedDomains } = registerAppDto;

    // Step 1: Create tenant
    const tenant = await this.tenantsService.create({
      name: companyName,
      contactEmail: email,
    });

    // Step 2: Create application
    const application = await this.applicationsService.create({
      tenantId: tenant.id,
      appName,
      allowedDomains,
    });

    // Step 3 & 4: Return embed info with all necessary IDs
    return {
      clientId: application.clientId,
      clientSecret: application.clientSecret,
      appId: application.id,
      tenantId: tenant.id,
      embedCode: this.generateEmbedCode(application.clientId),
    };
  }

  private generateEmbedCode(clientId: string): string {
    return `<script src="http://localhost:4200/main.js" client-id="${clientId}"></script>`;
  }
}
