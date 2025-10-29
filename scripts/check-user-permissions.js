const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== Checking User Permissions ===\n');
  
  // Find admin@example
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
    select: { id: true, email: true, name: true, role: true }
  });
  
  // Find Wayne
  const wayne = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: 'wayne', mode: 'insensitive' } },
        { name: { contains: 'wayne', mode: 'insensitive' } }
      ]
    },
    select: { id: true, email: true, name: true, role: true }
  });
  
  console.log('Admin user:');
  if (admin) {
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  ID: ${admin.id}`);
  } else {
    console.log('  ❌ Not found');
  }
  
  console.log('\nWayne user:');
  if (wayne) {
    console.log(`  Email: ${wayne.email}`);
    console.log(`  Name: ${wayne.name}`);
    console.log(`  Role: ${wayne.role}`);
    console.log(`  ID: ${wayne.id}`);
  } else {
    console.log('  ❌ Not found');
  }
  
  // List all users to find Wayne
  if (!wayne) {
    console.log('\n=== All Users ===');
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      orderBy: { email: 'asc' }
    });
    allUsers.forEach(u => {
      console.log(`  ${u.email} (${u.name}) - ${u.role}`);
    });
  }
  
  process.exit(0);
}

check().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

