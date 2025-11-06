import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EventGrid from "@/components/events/EventGrid";
import { Button, HStack, Heading, Box, Text, VStack, SimpleGrid, Card, CardBody, CardHeader, Container, Badge } from "@chakra-ui/react";
import Link from "next/link";

export default async function DashboardPage() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.email) redirect("/signin");
    
    const me = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!me) redirect("/signin");
    
    // Admins and Organizers can see all events, others only see their own
    const canManageAllEvents = me.role === "ADMIN" || me.role === "ORGANIZER";
    
    // Show all non-archived events for management (including DRAFT)
    const items = await prisma.event.findMany({ 
      where: { 
        ...(canManageAllEvents ? {} : { ownerId: me.id }),
        status: { not: "ARCHIVED" }
      }, 
      include: { heroImage: true, owner: { select: { name: true, email: true } } }, 
      orderBy: { startAt: "desc" }
    });


    // Get coordinations - admins and organizers can see all, others only their own
    const coordinations = await prisma.coordination.findMany({
      where: { 
        ...(canManageAllEvents ? {} : { event: { ownerId: me.id } })
      },
      include: { 
        _count: { select: { documents: true } },
        event: { select: { ownerId: true, title: true } }
      },
      orderBy: { createdAt: "desc" }
    });

  return (
    <Container maxW="full" px={0}>
      <VStack align="stretch" spacing={{ base: 8, md: 12, lg: 16 }} py={{ base: 4, md: 6, lg: 8 }}>
        {/* Welcome Section */}
        <Box textAlign="center" px={{ base: 2, sm: 4, md: 0 }}>
          <Heading 
            size={{ base: "xl", md: "2xl" }} 
            mb={{ base: 4, md: 6 }} 
            fontWeight="700"
            lineHeight="1.2"
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            backgroundClip="text"
            css={{ WebkitTextFillColor: 'transparent' }}
          >
            Welcome back, {me.name || 'Event Organizer'}!
          </Heading>
          <Text 
            color="gray.600" 
            fontSize={{ base: "md", md: "lg", lg: "xl" }} 
            fontWeight="500"
            maxW="2xl"
            lineHeight="1.6"
            mx="auto"
            px={{ base: 2, md: 0 }}
          >
            Manage your events and galleries from your dashboard
          </Text>
        </Box>

        {/* Quick Actions */}
        <Box px={{ base: 2, sm: 4, md: 0 }} display="flex" justifyContent="center">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6, lg: 8 }} w="full" maxW="4xl">
            {/* Events Card */}
            <Card 
              shadow="lg" 
              borderRadius="2xl" 
              overflow="hidden"
              border="1px solid"
              borderColor="gray.100"
              bg="linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))"
              backdropFilter="blur(10px)"
              _hover={{
                shadow: "xl",
                transform: "translateY(-8px) scale(1.02)",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                bg: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))"
              }}
              transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '2xl 2xl 0 0'
              }}
            >
              <CardHeader pb={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }} pt={{ base: 6, md: 8 }}>
                <VStack align="flex-start" spacing={4}>
                  <HStack spacing={4}>
                    <Box 
                      p={4} 
                      bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" 
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      shadow="md"
                      _hover={{
                        transform: "scale(1.1) rotate(5deg)",
                        transition: "all 0.3s ease-in-out"
                      }}
                    >
                      <Text fontSize="2xl" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))">📅</Text>
                    </Box>
                    <VStack align="flex-start" spacing={1}>
                      <Heading 
                        size="lg" 
                        color="gray.800"
                        fontFamily="'SUSE Mono', monospace"
                        fontWeight="600"
                      >
                        Events
                      </Heading>
                      <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
                        {items.length} {items.length === 1 ? 'Event' : 'Events'}
                      </Badge>
                    </VStack>
                  </HStack>
                </VStack>
              </CardHeader>
              <CardBody pt={0} px={{ base: 4, md: 6, lg: 8 }} pb={{ base: 6, md: 8 }}>
                <VStack align="stretch" spacing={{ base: 6, md: 8 }}>
                  <Text color="gray.600" fontSize="md" lineHeight="1.6">
                    You have {items.length} event{items.length !== 1 ? 's' : ''} in your portfolio
                  </Text>
                  <VStack spacing={{ base: 3, md: 4 }} w="full">
                    <Button 
                      as={Link} 
                      href="/dashboard/events" 
                      variant="outline" 
                      size={{ base: "md", md: "lg" }} 
                      w="full"
                      colorScheme="black"
                      bg="rgba(255, 255, 255, 0.8)"
                      backdropFilter="blur(8px)"
                      borderWidth="2px"
                      _hover={{
                        bg: "blue.50",
                        borderColor: "blue.400",
                        transform: "translateY(-2px)",
                        shadow: "xl",
                        color: "blue.700"
                      }}
                      transition="all 0.3s ease-in-out"
                    >
                      View All Events
                    </Button>
                    <Button 
                      as={Link} 
                      href="/dashboard/events/new" 
                      size={{ base: "md", md: "lg" }} 
                      w="full"
                      bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                      color="white"
                      shadow="lg"
                      fontWeight="600"
                      _hover={{
                        transform: "translateY(-2px)",
                        shadow: "xl",
                        bg: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
                      }}
                      transition="all 0.3s ease-in-out"
                    >
                      Create Event
                    </Button>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>


            {/* Coordination Card */}
            <Card 
              shadow="lg" 
              borderRadius="2xl" 
              overflow="hidden"
              border="1px solid"
              borderColor="gray.100"
              bg="linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))"
              backdropFilter="blur(10px)"
              _hover={{
                shadow: "xl",
                transform: "translateY(-8px) scale(1.02)",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                bg: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))"
              }}
              transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '2xl 2xl 0 0'
              }}
            >
              <CardHeader pb={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }} pt={{ base: 6, md: 8 }}>
                <VStack align="flex-start" spacing={4}>
                  <HStack spacing={4}>
                    <Box 
                      p={4} 
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      shadow="md"
                      _hover={{
                        transform: "scale(1.1) rotate(3deg)",
                        transition: "all 0.3s ease-in-out"
                      }}
                    >
                      <Text fontSize="2xl" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))">📋</Text>
                    </Box>
                    <VStack align="flex-start" spacing={1}>
                      <Heading 
                        size="lg" 
                        color="gray.800"
                        fontFamily="'SUSE Mono', monospace"
                        fontWeight="600"
                      >
                        Coordination
                      </Heading>
                      <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="full">
                        {coordinations.length} {coordinations.length === 1 ? 'Set' : 'Sets'}
                      </Badge>
                    </VStack>
                  </HStack>
                </VStack>
              </CardHeader>
              <CardBody pt={0} px={{ base: 4, md: 6, lg: 8 }} pb={{ base: 6, md: 8 }}>
                <VStack align="stretch" spacing={{ base: 6, md: 8 }}>
                  <Text color="gray.600" fontSize="md" lineHeight="1.6">
                    You have {coordinations.length} coordination set{coordinations.length !== 1 ? 's' : ''} for event planning
                  </Text>
                  <VStack spacing={{ base: 3, md: 4 }} w="full">
                    <Button 
                      as={Link} 
                      href="/dashboard/coordination" 
                      variant="outline" 
                      size={{ base: "md", md: "lg" }} 
                      w="full"
                      colorScheme="black"
                      bg="rgba(255, 255, 255, 0.8)"
                      backdropFilter="blur(8px)"
                      borderWidth="2px"
                      _hover={{
                        bg: "purple.50",
                        borderColor: "purple.400",
                        transform: "translateY(-2px)",
                        shadow: "xl",
                        color: "purple.700"
                      }}
                      transition="all 0.3s ease-in-out"
                    >
                      Manage Coordination
                    </Button>
                    <Button 
                      as={Link} 
                      href="/dashboard/coordination" 
                      size={{ base: "md", md: "lg" }} 
                      w="full"
                      px={{ base: 6, md: 8 }}
                      py={{ base: 4, md: 5 }}
                      bg="linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)"
                      color="white"
                      shadow="lg"
                      fontWeight="600"
                      _hover={{
                        transform: "translateY(-2px)",
                        shadow: "xl",
                        bg: "linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)"
                      }}
                      transition="all 0.3s ease-in-out"
                    >
                      Create Coordination Set
                    </Button>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Recent Events */}
        <Box w="full" px={{ base: 2, sm: 4, md: 0 }}>
          <Box 
            bg="linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))"
            p={{ base: 4, md: 6, lg: 8 }} 
            borderRadius="2xl" 
            shadow="lg"
            border="1px solid"
            borderColor="gray.100"
            backdropFilter="blur(10px)"
            _hover={{
              shadow: "xl",
              transform: "translateY(-2px)",
              transition: "all 0.3s ease-in-out"
            }}
          >
            <HStack 
              justify="space-between" 
              align="center" 
              mb={{ base: 6, md: 8, lg: 10 }} 
              flexWrap="wrap" 
              gap={{ base: 4, md: 6 }}
              pb={{ base: 4, md: 6 }}
              borderBottom="1px solid"
              borderColor="gray.100"
            >
              <Box>
                <Heading 
                  size={{ base: "md", md: "lg" }} 
                  mb={{ base: 2, md: 3 }} 
                  color="gray.800"
                  fontFamily="'SUSE Mono', monospace"
                  fontWeight="600"
                >
                  Recent Events
                </Heading>
                <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>Your latest event creations</Text>
              </Box>
              <Button 
                as={Link} 
                href="/dashboard/events/new" 
                size={{ base: "md", md: "lg" }} 
                px={{ base: 4, md: 6, lg: 8 }}
                bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                color="white"
                shadow="lg"
                fontWeight="600"
                _hover={{
                  transform: "translateY(-2px)",
                  shadow: "xl",
                  bg: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
                }}
                transition="all 0.3s ease-in-out"
              >
                Create New Event
              </Button>
            </HStack>

            {items.length === 0 ? (
              <Box textAlign="center" py={{ base: 12, md: 16, lg: 20 }} px={{ base: 4, md: 6, lg: 8 }}>
                <Text fontSize={{ base: "lg", md: "xl" }} color="gray.500" mb={{ base: 6, md: 8 }} fontWeight="500">
                  You haven&apos;t created any events yet
                </Text>
                <Button 
                  as={Link} 
                  href="/dashboard/events/new" 
                  size={{ base: "md", md: "lg" }} 
                  px={{ base: 6, md: 8, lg: 10 }}
                  py={{ base: 4, md: 5, lg: 6 }}
                  bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                  color="white"
                  shadow="xl"
                  fontWeight="600"
                  _hover={{
                    transform: "translateY(-3px) scale(1.05)",
                    shadow: "2xl",
                    bg: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
                  }}
                  transition="all 0.3s ease-in-out"
                >
                  Create Your First Event
                </Button>
              </Box>
            ) : (
              <Box>
                <EventGrid items={items.slice(0, 6)} isAdminView={true} />
              </Box>
            )}
          </Box>
        </Box>
      </VStack>
    </Container>
  );
  } catch (error) {
    console.error("Dashboard error:", error);
    throw error;
  }
}
