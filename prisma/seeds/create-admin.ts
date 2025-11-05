import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const adminEmail = 'admin@fin2couple.com';
  const adminPassword = 'Admin@123'; // Altere após o primeiro login!

  console.log('🔑 Creating admin user...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   ID: ${existingAdmin.id}`);

    // Update role to ADMIN if not already
    if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' },
      });
      console.log('✅ Updated existing user to ADMIN role');
    }

    return;
  }

  // Hash password
  const password_hash = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Super Admin',
      password_hash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   ID: ${admin.id}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Change the password after first login!');
  console.log('');
}

createAdmin()
  .catch((error) => {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
