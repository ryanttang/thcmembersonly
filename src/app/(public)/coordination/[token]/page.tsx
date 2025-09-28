"use client";

import { 
  Container, 
  VStack, 
  Heading, 
  Text, 
  Card, 
  CardBody, 
  CardHeader, 
  HStack, 
  Box, 
  Badge, 
  Button, 
  SimpleGrid,
  Divider,
  Link,
  Icon,
  Flex,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";

interface CoordinationPageProps {
  params: {
    token: string;
  };
}

const getDocumentTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    MAP: "🗺️",
    RUN_OF_SHOW: "📋",
    ITINERARY: "📅",
    SCHEDULE: "⏰",
    DIAGRAM: "📊",
    RIDER: "📄",
    NOTES: "📝",
    OTHER: "📎",
  };
  return icons[type] || "📎";
};

const getDocumentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    MAP: "Map",
    RUN_OF_SHOW: "Run of Show",
    ITINERARY: "Itinerary",
    SCHEDULE: "Schedule",
    DIAGRAM: "Diagram",
    RIDER: "Rider",
    NOTES: "Notes",
    OTHER: "Other",
  };
  return labels[type] || "Other";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

function DocumentPreview({ document }: { document: any }) {
  if (!document) {
    return null;
  }

  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';
  
  return (
    <Box mt={4} p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Preview: {document.title}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="gray"
            onClick={() => window.open(document.fileUrl, '_blank')}
          >
            Open in New Tab
          </Button>
        </HStack>
        
        {isImage ? (
          <Box textAlign="center">
            <Image
              src={document.fileUrl}
              alt={document.title}
              maxW="100%"
              maxH="400px"
              objectFit="contain"
              borderRadius="md"
              fallbackSrc="/placeholder-image.svg"
            />
          </Box>
        ) : isPdf ? (
          <Box h="400px" borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.300">
            <iframe
              src={document.fileUrl}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title={document.title}
            />
          </Box>
        ) : (
          <VStack spacing={3} py={6}>
            <Text fontSize="md" color="gray.600">
              Preview not available for this file type
            </Text>
            <Text fontSize="sm" color="gray.500">
              {document.mimeType}
            </Text>
            <Button
              as={Link}
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="blue"
              leftIcon={<span>⬇️</span>}
            >
              Download to View
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}

export default function CoordinationPage({ params }: CoordinationPageProps) {
  const [coordination, setCoordination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoordination = async () => {
      try {
        const response = await fetch(`/api/coordination/share/${params.token}`);
        if (response.ok) {
          const data = await response.json();
          setCoordination(data);
        } else {
          // Handle not found
          setCoordination(null);
        }
      } catch (error) {
        console.error('Error fetching coordination:', error);
        setCoordination(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCoordination();
  }, [params.token]);


  if (loading) {
    return (
      <Container maxW="4xl" py={12}>
        <VStack spacing={8} align="center">
          <Text>Loading coordination documents...</Text>
        </VStack>
      </Container>
    );
  }

  if (!coordination) {
    return (
      <Container maxW="4xl" py={12}>
        <VStack spacing={8} align="center">
          <Heading size="lg" color="red.500">Coordination not found</Heading>
          <Text>The coordination link you're looking for doesn't exist or has been deactivated.</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="4xl" py={12}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading 
            size="2xl" 
            mb={4} 
            color="gray.800"
            fontWeight="700"
            lineHeight="1.2"
          >
            {coordination.title}
          </Heading>
          <Text 
            color="gray.600" 
            fontSize="lg" 
            fontWeight="500"
            mb={6}
          >
            Event Coordination Documents
          </Text>
          
          {coordination.description && (
            <Text 
              color="gray.600" 
              fontSize="md"
              maxW="2xl"
              mx="auto"
              mb={6}
            >
              {coordination.description}
            </Text>
          )}
        </Box>

        {/* Event Information */}
        <Card shadow="lg" borderRadius="xl">
          <CardHeader>
            <HStack justify="space-between" align="flex-start">
              <VStack align="flex-start" spacing={2}>
                <Heading size="lg" color="gray.800">
                  {coordination.event.title}
                </Heading>
                <HStack spacing={4} flexWrap="wrap">
                  <HStack spacing={1}>
                    <Text fontSize="sm" color="gray.600">📅</Text>
                    <Text fontSize="sm" color="gray.600">
                      {formatDate(coordination.event.startAt)}
                    </Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Text fontSize="sm" color="gray.600">⏰</Text>
                    <Text fontSize="sm" color="gray.600">
                      {formatTime(coordination.event.startAt)}
                      {coordination.event.endAt && ` - ${formatTime(coordination.event.endAt)}`}
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
              <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
                {coordination.documents.length} Document{coordination.documents.length !== 1 ? 's' : ''}
              </Badge>
            </HStack>
          </CardHeader>
          
          {(coordination.event.locationName || coordination.event.address) && (
            <CardBody pt={0}>
              <HStack spacing={1} mb={2}>
                <Text fontSize="sm" color="gray.600">📍</Text>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  {coordination.event.locationName || "Location"}
                </Text>
              </HStack>
              {coordination.event.address && (
                <Text fontSize="sm" color="gray.600" ml={4}>
                  {coordination.event.address}
                  {coordination.event.city && `, ${coordination.event.city}`}
                  {coordination.event.state && `, ${coordination.event.state}`}
                </Text>
              )}
            </CardBody>
          )}
        </Card>

        {/* Notes */}
        {coordination.notes && (
          <Card shadow="md" borderRadius="xl">
            <CardHeader>
              <Heading size="md" color="gray.800">
                📝 Notes
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Text color="gray.600" whiteSpace="pre-wrap">
                {coordination.notes}
              </Text>
            </CardBody>
          </Card>
        )}

        {/* Documents */}
        <Card shadow="lg" borderRadius="xl">
          <CardHeader>
            <Heading size="lg" color="gray.800">
              📋 Coordination Documents
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Download and review all coordination materials for this event
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            {coordination.documents.length === 0 ? (
              <Box textAlign="center" py={12}>
                <Text color="gray.500" fontSize="lg" mb={4}>
                  No documents available yet
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Documents will appear here once they are uploaded by the event organizers
                </Text>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {coordination.documents.map((doc: any) => (
                  <Box key={doc.id}>
                  <Card shadow="sm" borderRadius="lg" border="1px solid" borderColor="gray.100">
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between" align="flex-start">
                          <VStack align="flex-start" spacing={1} flex={1}>
                            <HStack spacing={2}>
                              <Text fontSize="lg">{getDocumentTypeIcon(doc.type)}</Text>
                              <Text fontSize="sm" color="gray.500" fontWeight="medium">
                                {getDocumentTypeLabel(doc.type)}
                              </Text>
                            </HStack>
                            <Text fontSize="md" fontWeight="medium" color="gray.800" noOfLines={2}>
                              {doc.title}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        {doc.description && (
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {doc.description}
                          </Text>
                        )}
                        
                        <HStack justify="space-between" align="center">
                          <Text fontSize="xs" color="gray.500">
                            {formatFileSize(doc.fileSize)}
                          </Text>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            leftIcon={<span>⬇️</span>}
                            as={Link}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  {/* Document Preview */}
                  <DocumentPreview document={doc} />
                </Box>
              ))}
              </VStack>
            )}
          </CardBody>
        </Card>

        {/* Footer */}
        <Box textAlign="center" pt={8}>
          <Text color="gray.400" fontSize="sm">
            This coordination page is shared by the event organizers
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
