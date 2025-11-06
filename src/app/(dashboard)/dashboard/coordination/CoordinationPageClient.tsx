"use client";

import { 
  VStack, 
  Heading, 
  Text, 
  SimpleGrid, 
  Card, 
  CardBody, 
  HStack, 
  Box,
  Switch,
  FormControl,
  FormLabel,
  useToast
} from "@chakra-ui/react";
import { useMemo, useState, useEffect, useCallback } from "react";
import CoordinationForm from "@/components/coordination/CoordinationForm";
import CoordinationCard from "@/components/coordination/CoordinationCard";

interface Event {
  id: string;
  title: string;
  slug: string;
  startAt: Date;
}

interface Coordination {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  specialMessage?: string | null;
  location?: string | null;
  importantTimes?: any[] | null;
  staffParkingAddress?: string | null;
  staffParkingNotes?: string | null;
  pointOfContacts?: any[] | null;
  shareToken: string;
  slug?: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  event: {
    id: string;
    title: string;
    slug: string;
    startAt: Date;
  };
  documents: any[];
  _count: {
    documents: number;
  };
}

interface CoordinationPageClientProps {
  coordinations: Coordination[];
  events: Event[];
  canManageAllEvents: boolean;
}

export default function CoordinationPageClient({ 
  coordinations, 
  events, 
  canManageAllEvents 
}: CoordinationPageClientProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [allCoordinations, setAllCoordinations] = useState(coordinations);
  const [filteredCoordinations, setFilteredCoordinations] = useState(coordinations);
  const toast = useToast();

  const fetchCoordinations = useCallback(async (includeArchived: boolean) => {
    try {
      const response = await fetch(`/api/coordination?includeArchived=${includeArchived}`);
      if (response.ok) {
        const data = await response.json();
        setAllCoordinations(data);
        setFilteredCoordinations(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch coordinations",
        status: "error",
        duration: 3000,
      });
    }
  }, [toast]);

  useEffect(() => {
    if (showArchived) {
      // Fetch all coordinations including archived ones
      fetchCoordinations(true);
    } else {
      setFilteredCoordinations(coordinations);
    }
  }, [showArchived, coordinations, fetchCoordinations]);

  const handleRefresh = () => {
    // Refresh list without full page reload to preserve UI state
    fetchCoordinations(showArchived);
  };

  return (
    <Box maxW="6xl" mx="auto">
      <VStack align="stretch" spacing={6} py={4}>
        {/* Header */}
        <Box textAlign="center" px={{ base: 4, md: 0 }}>
          <Heading 
            size={{ base: "xl", md: "2xl" }} 
            mb={3} 
            color="gray.800"
            fontWeight="700"
            lineHeight="1.2"
            fontFamily="'SUSE Mono', monospace"
          >
            Event Coordination
          </Heading>
          <Text 
            color="gray.600" 
            fontSize={{ base: "md", md: "lg" }} 
            fontWeight="500"
            maxW="2xl"
            lineHeight="1.6"
            mx="auto"
          >
            {canManageAllEvents 
              ? "Manage coordination documents, maps, schedules, and shareable links for all events" 
              : "Manage coordination documents, maps, schedules, and shareable links for your events"
            }
          </Text>
        </Box>

        {/* Quick Stats */}
        <SimpleGrid columns={{ base: 3, md: 3 }} spacing={{ base: 2, md: 4 }} px={{ base: 4, md: 0 }}>
          <Card shadow="sm" borderRadius="lg">
            <CardBody textAlign="center" py={{ base: 3, md: 6 }}>
              <Text fontSize={{ base: "lg", md: "3xl" }} fontWeight="bold" color="blue.600" mb={{ base: 1, md: 2 }}>
                {filteredCoordinations.length}
              </Text>
              <Text color="gray.600" fontWeight="medium" fontSize={{ base: "xs", md: "sm" }}>
                Coordination Sets
              </Text>
            </CardBody>
          </Card>
          
          <Card shadow="sm" borderRadius="lg">
            <CardBody textAlign="center" py={{ base: 3, md: 6 }}>
              <Text fontSize={{ base: "lg", md: "3xl" }} fontWeight="bold" color="green.600" mb={{ base: 1, md: 2 }}>
                {filteredCoordinations.reduce((sum: number, c: any) => sum + c._count.documents, 0)}
              </Text>
              <Text color="gray.600" fontWeight="medium" fontSize={{ base: "xs", md: "sm" }}>
                Total Documents
              </Text>
            </CardBody>
          </Card>
          
          <Card shadow="sm" borderRadius="lg">
            <CardBody textAlign="center" py={{ base: 3, md: 6 }}>
              <Text fontSize={{ base: "lg", md: "3xl" }} fontWeight="bold" color="purple.600" mb={{ base: 1, md: 2 }}>
                {events.length}
              </Text>
              <Text color="gray.600" fontWeight="medium" fontSize={{ base: "xs", md: "sm" }}>
                Available Events
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Coordination List */}
        <Box px={{ base: 4, md: 0 }}>
          <VStack spacing={4} align="stretch" mb={6}>
            <HStack justify={{ base: "flex-start", md: "space-between" }} align={{ base: "flex-start", md: "center" }} flexWrap="wrap" gap={4}>
              <Box>
                <Heading 
                  size={{ base: "md", md: "lg" }} 
                  color="gray.800"
                  fontFamily="'SUSE Mono', monospace"
                  fontWeight="600"
                >
                  Coordination Sets
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  Manage documents and shareable links for event coordination
                </Text>
              </Box>
              <HStack spacing={4}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="show-archived" mb="0" fontSize="sm" color="gray.600">
                    Show Archived
                  </FormLabel>
                  <Switch
                    id="show-archived"
                    isChecked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    colorScheme="orange"
                  />
                </FormControl>
                <CoordinationForm events={events} onSuccess={handleRefresh} />
              </HStack>
            </HStack>
          </VStack>

          {filteredCoordinations.length === 0 ? (
            <Card shadow="md" borderRadius="xl">
              <CardBody textAlign="center" py={12}>
                <Text fontSize={{ base: "lg", md: "xl" }} color="gray.500" mb={6} fontWeight="500">
                  {showArchived ? "No archived coordination sets" : "No coordination sets created yet"}
                </Text>
                <Text color="gray.400" mb={6} fontSize="sm">
                  {showArchived 
                    ? "Archived coordination sets will appear here when you archive them"
                    : "Create your first coordination set to start organizing event documents"
                  }
                </Text>
                {!showArchived && <CoordinationForm events={events} onSuccess={handleRefresh} />}
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {filteredCoordinations.map((coordination: any) => (
                <CoordinationCard 
                  key={coordination.id} 
                  coordination={coordination}
                  events={events}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
