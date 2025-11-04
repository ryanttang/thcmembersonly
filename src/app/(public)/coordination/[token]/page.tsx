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
  IconButton,
  useBreakpointValue,
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

const getImageUrl = (image: any) => {
  if (!image?.variants) {
    return null;
  }
  
  // Use direct S3 URLs first
  if (image.variants?.card?.webpUrl) {
    return image.variants.card.webpUrl;
  }
  if (image.variants?.card?.jpgUrl) {
    return image.variants.card.jpgUrl;
  }
  if (image.variants?.thumb?.webpUrl) {
    return image.variants.thumb.webpUrl;
  }
  if (image.variants?.thumb?.jpgUrl) {
    return image.variants.thumb.jpgUrl;
  }
  if (image.variants?.hero?.webpUrl) {
    return image.variants.hero.webpUrl;
  }
  if (image.variants?.hero?.jpgUrl) {
    return image.variants.hero.jpgUrl;
  }
  
  // Fallback to API route if no direct URLs
  if (image.variants?.card?.webpKey) {
    return `/api/images/${encodeURIComponent(image.variants.card.webpKey)}`;
  }
  if (image.variants?.card?.jpgKey) {
    return `/api/images/${encodeURIComponent(image.variants.card.jpgKey)}`;
  }
  if (image.variants?.thumb?.webpKey) {
    return `/api/images/${encodeURIComponent(image.variants.thumb.webpKey)}`;
  }
  if (image.variants?.thumb?.jpgKey) {
    return `/api/images/${encodeURIComponent(image.variants.thumb.jpgKey)}`;
  }
  
  return null;
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

const getGoogleMapsThumbnailUrl = (address: string): string | null => {
  // Google Maps Static API - requires API key for production
  // For now, we'll use a placeholder approach that still works
  // Users can add GOOGLE_MAPS_API_KEY to their env if they want to use Static Maps API
  const encodedAddress = encodeURIComponent(address);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  // Debug logging (remove in production if needed)
  if (typeof window !== 'undefined') {
    console.log('Google Maps API Key available:', !!apiKey);
  }
  
  if (apiKey) {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=600x400&markers=color:red%7C${encodedAddress}&key=${apiKey}`;
    return url;
  }
  
  // Fallback: return null to use placeholder or alternative
  return null;
};

const getGoogleMapsLink = (address: string): string => {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
};

function DocumentPreview({ document }: { document: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const modalSize = useBreakpointValue({ base: "full", md: "6xl", lg: "7xl" });
  
  if (!document) {
    return null;
  }

  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';
  
  return (
    <>
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
            <Box 
              textAlign="center" 
              position="relative" 
              cursor="pointer"
              onClick={onOpen}
              _hover={{
                transform: "scale(1.02)",
                transition: "all 0.2s ease",
                "& .hover-overlay": {
                  opacity: 1
                }
              }}
              transition="all 0.2s ease"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen();
                }
              }}
              aria-label={`Click to enlarge ${document.title}`}
            >
              <Image
                src={document.fileUrl}
                alt={document.title}
                maxW="100%"
                maxH="400px"
                objectFit="contain"
                borderRadius="md"
                fallbackSrc="/placeholder-image.svg"
              />
              <Box
                className="hover-overlay"
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                bg="blackAlpha.700"
                color="white"
                px={3}
                py={1}
                borderRadius="md"
                fontSize="xs"
                fontWeight="medium"
                pointerEvents="none"
                opacity={0}
                transition="opacity 0.2s ease"
              >
                🔍 Click to enlarge
              </Box>
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

      {/* Image Preview Modal */}
      {isImage && (
        <Modal isOpen={isOpen} onClose={onClose} size={modalSize} isCentered>
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent 
            maxW="95vw" 
            maxH="95vh" 
            bg="transparent" 
            boxShadow="none"
            mx={{ base: 2, md: 4 }}
          >
            <ModalCloseButton 
              color="white" 
              bg="blackAlpha.600" 
              borderRadius="full"
              size="lg"
              _hover={{ bg: "blackAlpha.700" }}
              zIndex={10}
            />
            <ModalBody p={0} display="flex" alignItems="center" justifyContent="center">
              <Box
                position="relative"
                maxW="100%"
                maxH="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Image
                  src={document.fileUrl}
                  alt={document.title}
                  maxW="100%"
                  maxH="100%"
                  objectFit="contain"
                  borderRadius="md"
                  fallbackSrc="/placeholder-image.svg"
                />
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default function CoordinationPage({ params }: CoordinationPageProps) {
  const [coordination, setCoordination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoordination = async () => {
      try {
        // Try slug first, then fall back to shareToken
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
          <Text>The coordination link you&apos;re looking for doesn&apos;t exist or has been deactivated.</Text>
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
            fontFamily="'SUSE Mono', monospace"
          >
            {coordination.title}
          </Heading>
          
          {/* Mini Navigation */}
          <Box 
            as="nav" 
            display="flex" 
            flexWrap="wrap" 
            gap={2} 
            justifyContent="center"
            mb={6}
            px={4}
          >
            {[
              { label: "Events", id: "section-events", show: true },
              { label: "Special Messages", id: "section-special-messages", show: !!coordination.specialMessage },
              { label: "Location", id: "section-location", show: !!coordination.location },
              { label: "Notes", id: "section-notes", show: !!coordination.notes },
              { label: "Contacts", id: "section-contacts", show: !!(coordination.pointOfContacts && coordination.pointOfContacts.length > 0) },
              { label: "Documents", id: "section-documents", show: true },
            ]
            .filter(item => item.show)
            .map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant="outline"
                colorScheme="gray"
                onClick={() => {
                  const element = document.getElementById(item.id);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                _hover={{
                  bg: "gray.100",
                  transform: "translateY(-1px)",
                }}
                transition="all 0.2s"
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Event Flyer */}
        {coordination.event.heroImage && (
          <Card shadow="lg" borderRadius="xl" overflow="hidden">
            <Box>
              <Image
                src={getImageUrl(coordination.event.heroImage)}
                alt={`${coordination.event.title} flyer`}
                w="100%"
                h="auto"
                objectFit="cover"
                fallbackSrc="/placeholder-image.svg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-image.svg";
                }}
              />
            </Box>
          </Card>
        )}

        {/* Event Information */}
        <Card id="section-events" shadow="lg" borderRadius="xl" sx={{ scrollMarginTop: "100px" }}>
          <CardHeader>
            <HStack justify="space-between" align="flex-start">
              <VStack align="flex-start" spacing={2}>
                <Heading size="lg" color="gray.800" fontFamily="'SUSE Mono', monospace" fontWeight="600">
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

        {/* Special Messages & Important Notes */}
        {coordination.specialMessage && (
          <Card id="section-special-messages" shadow="lg" borderRadius="xl" bg="orange.50" border="2px solid" borderColor="orange.200" sx={{ scrollMarginTop: "100px" }}>
            <CardHeader>
              <Heading size="md" color="orange.800" fontFamily="'SUSE Mono', monospace" fontWeight="600">
                ⚠️ Special Messages & Important Notes
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Text color="orange.700" whiteSpace="pre-wrap" fontWeight="500">
                {coordination.specialMessage}
              </Text>
            </CardBody>
          </Card>
        )}

        {/* Location */}
        {coordination.location && (
          <Card id="section-location" shadow="md" borderRadius="xl" sx={{ scrollMarginTop: "100px" }}>
            <CardHeader>
              <Heading size="md" color="gray.800" fontFamily="'SUSE Mono', monospace" fontWeight="600">
                📍 Location
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack align="flex-start" spacing={4}>
                <Text color="gray.700" fontWeight="500">
                  {coordination.location}
                </Text>
                
                {/* Google Maps Thumbnail */}
                {(() => {
                  const mapThumbnailUrl = getGoogleMapsThumbnailUrl(coordination.location);
                  const mapsLink = getGoogleMapsLink(coordination.location);
                  return (
                    <Box
                      as={Link}
                      href={mapsLink}
                      isExternal
                      w="100%"
                      borderRadius="lg"
                      overflow="hidden"
                      border="2px solid"
                      borderColor="gray.200"
                      _hover={{
                        borderColor: "blue.400",
                        transform: "scale(1.01)",
                        shadow: "lg",
                      }}
                      transition="all 0.2s"
                      cursor="pointer"
                    >
                      {mapThumbnailUrl ? (
                        <Image
                          src={mapThumbnailUrl}
                          alt={`Map of ${coordination.location}`}
                          w="100%"
                          h="300px"
                          objectFit="cover"
                          fallbackSrc="/placeholder-image.svg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error('Google Maps image failed to load:', {
                              url: mapThumbnailUrl,
                              error: target.src,
                            });
                            target.src = "/placeholder-image.svg";
                          }}
                          onLoad={() => {
                            console.log('Google Maps image loaded successfully');
                          }}
                        />
                      ) : (
                        <Box
                          bg="gray.100"
                          h="300px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          position="relative"
                        >
                          <VStack spacing={2}>
                            <Text fontSize="4xl">🗺️</Text>
                            <Text color="gray.600" fontWeight="medium">
                              Click to view on Google Maps
                            </Text>
                          </VStack>
                        </Box>
                      )}
                    </Box>
                  );
                })()}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Notes */}
        {coordination.notes && (
          <Card id="section-notes" shadow="md" borderRadius="xl" sx={{ scrollMarginTop: "100px" }}>
            <CardHeader>
              <Heading size="md" color="gray.800" fontFamily="'SUSE Mono', monospace" fontWeight="600">
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

        {/* Run of Show */}
        {coordination.description && (
          <Card shadow="lg" borderRadius="xl" bg="blue.50" border="2px solid" borderColor="blue.200">
            <CardHeader>
              <Heading size="md" color="blue.800" fontFamily="'SUSE Mono', monospace" fontWeight="600">
                📋 Run of Show
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Text color="blue.700" whiteSpace="pre-wrap" fontWeight="500">
                {coordination.description}
              </Text>
            </CardBody>
          </Card>
        )}

        {/* Point of Contacts */}
        {coordination.pointOfContacts && coordination.pointOfContacts.length > 0 && (
          <Card id="section-contacts" shadow="md" borderRadius="xl" sx={{ scrollMarginTop: "100px" }}>
            <CardHeader>
              <Heading size="md" color="gray.800" fontFamily="'SUSE Mono', monospace" fontWeight="600">
                📞 Point of Contacts
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={4} align="stretch">
                {coordination.pointOfContacts.map((contact: any, index: number) => (
                  <Box key={index} p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                    <VStack spacing={2} align="stretch">
                      {contact.name && (
                        <HStack spacing={2}>
                          <Text fontSize="sm" color="gray.600" fontWeight="medium" minW="60px">Name:</Text>
                          <Text fontSize="sm" color="gray.800">{contact.name}</Text>
                        </HStack>
                      )}
                      {contact.number && (
                        <HStack spacing={2}>
                          <Text fontSize="sm" color="gray.600" fontWeight="medium" minW="60px">Phone:</Text>
                          <Text fontSize="sm" color="gray.800">{contact.number}</Text>
                        </HStack>
                      )}
                      {contact.email && (
                        <HStack spacing={2}>
                          <Text fontSize="sm" color="gray.600" fontWeight="medium" minW="60px">Email:</Text>
                          <Text fontSize="sm" color="gray.800">{contact.email}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Documents */}
        <Card id="section-documents" shadow="lg" borderRadius="xl" sx={{ scrollMarginTop: "100px" }}>
          <CardHeader>
            <Heading size="lg" color="gray.800" fontFamily="'SUSE Mono', monospace" fontWeight="600">
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
            This page is intended for internal staff only. Do not share or distribute. Thank you!
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
