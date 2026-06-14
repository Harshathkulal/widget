import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Application } from '../../applications/entities/application.entity';
import { AuthUser, UserRole } from '../../auth/entities/auth.entity';
import { encryptSecret } from '../../common/utils/crypto';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_APP_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_CLIENT_ID = 'wgt_demo_client_01';
const DEMO_CLIENT_SECRET = 'wgt_secret_k8s9m2n4p6q1r3t5';

const sampleUsers = [
  ['Ada', 'Lovelace', 'ada.lovelace@demo.com', 'ACTIVE'],
  ['Grace', 'Hopper', 'grace.hopper@demo.com', 'ACTIVE'],
  ['Linus', 'Torvalds', 'linus.torvalds@demo.com', 'ACTIVE'],
  ['Margaret', 'Hamilton', 'margaret.hamilton@demo.com', 'ACTIVE'],
  ['Alan', 'Turing', 'alan.turing@demo.com', 'INACTIVE'],
  ['Katherine', 'Johnson', 'katherine.johnson@demo.com', 'ACTIVE'],
  ['Tim', 'Berners-Lee', 'tim.bernerslee@demo.com', 'ACTIVE'],
  ['Barbara', 'Liskov', 'barbara.liskov@demo.com', 'ACTIVE'],
  ['Donald', 'Knuth', 'donald.knuth@demo.com', 'INACTIVE'],
  ['Radia', 'Perlman', 'radia.perlman@demo.com', 'ACTIVE'],
] as const;

function createDataSource() {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'widget_db',
    entities: [Tenant, Application, AuthUser, User],
    synchronize: false,
  });
}

async function seed() {
  const dataSource = createDataSource();
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const appRepo = dataSource.getRepository(Application);
  const authUserRepo = dataSource.getRepository(AuthUser);
  const userRepo = dataSource.getRepository(User);

  const existingTenant = await tenantRepo.findOneBy({ id: DEMO_TENANT_ID });
  if (existingTenant) {
    console.log('Demo data already exists. Nothing to seed.');
    await dataSource.destroy();
    return;
  }

  await tenantRepo.save(
    tenantRepo.create({
      id: DEMO_TENANT_ID,
      name: 'Demo Tenant',
      contactEmail: 'admin@demo.com',
      plan: 'pro',
      status: 'ACTIVE',
    }),
  );

  await appRepo.save(
    appRepo.create({
      id: DEMO_APP_ID,
      tenantId: DEMO_TENANT_ID,
      appName: 'Demo Widget App',
      clientId: DEMO_CLIENT_ID,
      clientSecretHash: encryptSecret(DEMO_CLIENT_SECRET),
      allowedDomains: [
        'http://localhost:4200',
        'http://localhost:5500',
        'http://localhost:8080',
        'http://127.0.0.1:5500',
      ],
      status: 'ACTIVE',
    }),
  );

  await authUserRepo.save(
    authUserRepo.create({
      tenantId: DEMO_TENANT_ID,
      applicationId: DEMO_APP_ID,
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash('admin123456', 10),
      role: UserRole.ADMIN,
      isActive: true,
    }),
  );

  await userRepo.save(
    sampleUsers.map(([firstName, lastName, email, status]) =>
      userRepo.create({
        tenantId: DEMO_TENANT_ID,
        applicationId: DEMO_APP_ID,
        firstName,
        lastName,
        email,
        status,
      }),
    ),
  );

  await dataSource.destroy();

  console.log('Seed completed.');
  console.log(`App ID: ${DEMO_APP_ID}`);
  console.log(`Client ID: ${DEMO_CLIENT_ID}`);
  console.log(`Client Secret: ${DEMO_CLIENT_SECRET}`);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
