import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

import { Application } from '../../applications/entities/application.entity';
import { encryptSecret } from '../../common/utils/crypto';
import { Tenant } from '../../tenants/entities/tenant.entity';

function requiredEnv(name: string, fallback?: string) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function createDataSource() {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'widget_db',
    entities: [Tenant, Application],
    synchronize: false,
  });
}

async function main() {
  const tenantName = requiredEnv('TENANT_NAME', 'Demo Tenant');
  const tenantEmail = requiredEnv('TENANT_EMAIL', 'admin@example.com');
  const appName = requiredEnv('APP_NAME', `${tenantName} Website`);
  const allowedOrigins = requiredEnv('ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS must include at least one URL');
  }

  const dataSource = createDataSource();
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const appRepo = dataSource.getRepository(Application);

  let tenant = await tenantRepo.findOneBy({ name: tenantName });
  if (!tenant) {
    tenant = await tenantRepo.save(
      tenantRepo.create({
        name: tenantName,
        contactEmail: tenantEmail,
        plan: 'pro',
        status: 'ACTIVE',
      }),
    );
  }

  const clientId = `wgt_${crypto.randomBytes(8).toString('hex')}`;
  const clientSecret = `sec_${crypto.randomBytes(24).toString('hex')}`;

  const app = await appRepo.save(
    appRepo.create({
      tenantId: tenant.id,
      appName,
      clientId,
      clientSecretHash: encryptSecret(clientSecret),
      allowedDomains: allowedOrigins,
      status: 'ACTIVE',
    }),
  );

  await dataSource.destroy();

  console.log('Application created.');
  console.log(`Tenant: ${tenant.name}`);
  console.log(`App ID: ${app.id}`);
  console.log(`Client ID: ${app.clientId}`);
  console.log(`Client Secret: ${clientSecret}`);
  console.log(`Allowed Origins: ${app.allowedDomains.join(', ')}`);
  console.log('');
  console.log('Embed snippet:');
  console.log(`<user-management-widget`);
  console.log(`  app-id="${app.id}"`);
  console.log(`  client-id="${app.clientId}"`);
  console.log(`  api-url="http://localhost:3000/api"`);
  console.log(`  theme="light"`);
  console.log(`  page-size="10">`);
  console.log(`</user-management-widget>`);
}

main().catch((error) => {
  console.error('Could not create application:', error.message);
  process.exit(1);
});
