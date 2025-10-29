const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('=== Finding all coordinations ===\n');
  
  const allCoords = await prisma.coordination.findMany({
    include: {
      event: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          owner: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${allCoords.length} coordinations:\n`);

  for (const coord of allCoords) {
    console.log(`--- ${coord.title} (${coord.id}) ---`);
    console.log(`  Event ID: ${coord.eventId || 'NULL'}`);
    console.log(`  Event exists: ${coord.event ? 'YES' : 'NO'}`);
    if (coord.event) {
      console.log(`  Event title: ${coord.event.title}`);
      console.log(`  Event owner ID: ${coord.event.ownerId}`);
      console.log(`  Event owner email: ${coord.event.owner?.email || 'NULL'}`);
      console.log(`  Event owner role: ${coord.event.owner?.role || 'NULL'}`);
    }
    console.log(`  Is archived: ${coord.isArchived}`);
    console.log(`  Created: ${coord.createdAt}`);
    console.log('');
  }

  // Test specific IDs mentioned
  const testIds = [
    'cmgskko9w000410ue6og0t0oq', // HTGV Exhibitor Load In
    'cmhbntcjx0002791vrjxfspiw', // Newly created one
  ];

  console.log('\n=== Testing specific coordination lookups ===\n');
  
  for (const id of testIds) {
    console.log(`Testing ID: ${id}`);
    
    // Direct lookup
    const direct = await prisma.coordination.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!direct) {
      console.log(`  ❌ NOT FOUND in database`);
      console.log('');
      continue;
    }

    console.log(`  ✅ Found: ${direct.title}`);
    console.log(`  Event ID: ${direct.eventId || 'NULL'}`);
    console.log(`  Event exists: ${direct.event ? 'YES' : 'NO'}`);
    
    if (direct.event) {
      console.log(`  Event owner ID: ${direct.event.ownerId}`);
      console.log(`  Event owner email: ${direct.event.owner?.email || 'NULL'}`);
      console.log(`  Event owner role: ${direct.event.owner?.role || 'NULL'}`);
      
      // Test if ADMIN can find it
      const asAdmin = await prisma.coordination.findUnique({
        where: { id },
        include: { event: true }
      });
      console.log(`  ✅ Admin lookup: ${asAdmin ? 'SUCCESS' : 'FAILED'}`);
    } else {
      console.log(`  ⚠️  WARNING: Coordination has eventId=${direct.eventId} but event doesn't exist!`);
    }
    console.log('');
  }

  process.exit(0);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

