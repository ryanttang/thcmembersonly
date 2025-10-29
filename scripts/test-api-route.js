const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulatePut(id, userRole) {
  console.log(`\n=== Simulating PUT for ${id} as ${userRole} ===\n`);
  
  // Simulate user lookup
  const adminUser = await prisma.user.findFirst({
    where: { role: userRole },
    select: { id: true, email: true, role: true }
  });

  if (!adminUser) {
    console.log(`❌ No user found with role ${userRole}`);
    return;
  }

  console.log(`User: ${adminUser.email} (${adminUser.role})`);

  const canManageAllEvents = ["ADMIN", "ORGANIZER", "STAFF"].includes(adminUser.role);

  console.log(`Can manage all: ${canManageAllEvents}`);

  // Simulate the lookup
  let existingCoordination = null;
  
  if (canManageAllEvents) {
    console.log('\nTrying admin lookup...');
    existingCoordination = await prisma.coordination.findUnique({
      where: { id: id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            ownerId: true,
          },
        },
      },
    });
    console.log(`Result: ${existingCoordination ? 'FOUND' : 'NOT FOUND'}`);
  }

  if (!existingCoordination && canManageAllEvents) {
    console.log('\nFallback: Direct check...');
    const directCheck = await prisma.coordination.findUnique({
      where: { id: id },
      select: { id: true, title: true, eventId: true },
    });
    console.log(`Direct check: ${directCheck ? 'EXISTS' : 'NOT EXISTS'}`);
    
    if (directCheck) {
      console.log('Trying simpler query...');
      existingCoordination = await prisma.coordination.findUnique({
        where: { id: id },
      });
      console.log(`Simpler query: ${existingCoordination ? 'FOUND' : 'NOT FOUND'}`);
    }
  }

  console.log(`\nFinal result: ${existingCoordination ? '✅ FOUND' : '❌ NOT FOUND'}`);
}

async function test() {
  const testId = 'cmgskko9w000410ue6og0t0oq';
  await simulatePut(testId, 'ADMIN');
  process.exit(0);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

