"use client";

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Divider,
  Tooltip,
} from "@chakra-ui/react";
import Link from "next/link";
import CoordinationForm from "./CoordinationForm";
import DocumentUploader from "./DocumentUploader";
import { createSlug } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  slug: string;
  startAt: Date;
}

interface CoordinationCardProps {
  coordination: {
    id: string;
    eventId: string;
    title: string;
    description?: string | null;
    notes?: string | null;
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
  };
  events: Event[];
}

export default function CoordinationCard({ coordination, events }: CoordinationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const toast = useToast();

  // Generate URL token prioritizing slug, with fallback
  const getUrlToken = () => {
    let urlToken = coordination.slug;
    
    if (!urlToken && coordination.event?.title && coordination.title) {
      // Generate slug from event title and coordination title if missing
      urlToken = createSlug(coordination.event.title, coordination.title);
    }
    
    // Fall back to shareToken only if no slug can be generated
    return urlToken || coordination.shareToken;
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this coordination set? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/coordination/${coordination.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete coordination");
      }

      toast({
        title: "Coordination deleted",
        description: "The coordination set has been deleted successfully",
        status: "success",
        duration: 3000,
      });

      // Trigger parent component refresh
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    const action = coordination.isArchived ? "unarchive" : "archive";
    const confirmMessage = coordination.isArchived 
      ? "Are you sure you want to unarchive this coordination set? The share link will become active again."
      : "Are you sure you want to archive this coordination set? The share link will become inactive.";
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsArchiving(true);
    try {
      const response = await fetch(`/api/coordination/id/${coordination.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isArchived: !coordination.isArchived,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} coordination`);
      }

      toast({
        title: `Coordination ${action}d`,
        description: `The coordination set has been ${action}d successfully`,
        status: "success",
        duration: 3000,
      });

      // Trigger parent component refresh
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const copyShareLink = async () => {
    const urlToken = getUrlToken();
    const shareUrl = `${window.location.origin}/coordination/${urlToken}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: `Share link copied to clipboard`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        status: "error",
        duration: 3000,
      });
    }
  };

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

  return (
    <>
      <Card 
        shadow="md" 
        borderRadius="xl" 
        overflow="hidden"
        border="1px solid"
        borderColor="gray.100"
        _hover={{
          shadow: "lg",
          transform: "translateY(-1px)",
          transition: "all 0.3s ease"
        }}
        transition="all 0.3s ease"
      >
        <CardHeader pb={3} px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }}>
          <VStack align="flex-start" spacing={3}>
            <HStack justify="space-between" w="full" align="flex-start">
              <VStack align="flex-start" spacing={1} flex={1} minW={0}>
                <Heading 
                  size={{ base: "sm", md: "md" }} 
                  color="gray.800" 
                  noOfLines={2}
                  fontFamily="'SUSE Mono', monospace"
                  fontWeight="600"
                >
                  {coordination.title}
                </Heading>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {coordination.event.title}
                </Text>
              </VStack>
              <VStack spacing={1} align="flex-end">
                <Badge 
                  colorScheme={coordination.isActive ? "green" : "gray"} 
                  variant="subtle" 
                  px={2} 
                  py={1} 
                  borderRadius="full"
                  fontSize="xs"
                  flexShrink={0}
                >
                  {coordination.isActive ? "Active" : "Inactive"}
                </Badge>
                {coordination.isArchived && (
                  <Badge 
                    colorScheme="orange" 
                    variant="subtle" 
                    px={2} 
                    py={1} 
                    borderRadius="full"
                    fontSize="xs"
                    flexShrink={0}
                  >
                    Archived
                  </Badge>
                )}
              </VStack>
            </HStack>
            
            {coordination.description && (
              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                {coordination.description}
              </Text>
            )}
          </VStack>
        </CardHeader>

        <CardBody pt={0} px={{ base: 4, md: 6 }} pb={{ base: 4, md: 6 }}>
          <VStack align="stretch" spacing={3}>
            {/* Document Count */}
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Text fontSize="xs" color="gray.600">
                Documents: {coordination._count.documents}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {new Date(coordination.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </HStack>

            {/* Recent Documents */}
            {coordination.documents.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={2} fontWeight="medium">
                  Recent Documents:
                </Text>
                <VStack spacing={1} align="stretch">
                  {coordination.documents.slice(0, 3).map((doc: any) => (
                    <HStack key={doc.id} spacing={2}>
                      <Text fontSize="xs">{getDocumentTypeIcon(doc.type)}</Text>
                      <Text fontSize="xs" color="gray.600" noOfLines={1} flex={1}>
                        {doc.title}
                      </Text>
                    </HStack>
                  ))}
                  {coordination.documents.length > 3 && (
                    <Text fontSize="xs" color="gray.400">
                      +{coordination.documents.length - 3} more
                    </Text>
                  )}
                </VStack>
              </Box>
            )}

            <Divider />

            {/* Action Buttons */}
            <VStack spacing={2} w="full">
              <HStack spacing={2} w="full">
                <Button 
                  size={{ base: "xs", md: "sm" }} 
                  variant="outline" 
                  colorScheme="blue"
                  flex={1}
                  onClick={onUploadOpen}
                  fontSize="xs"
                >
                  Upload
                </Button>
                <Tooltip label="Copy share link">
                  <IconButton
                    aria-label="Copy share link"
                    icon={<span>🔗</span>}
                    size={{ base: "xs", md: "sm" }}
                    variant="outline"
                    colorScheme="green"
                    onClick={copyShareLink}
                  />
                </Tooltip>
              </HStack>
              
              <HStack spacing={2} w="full">
                <Button 
                  size={{ base: "xs", md: "sm" }} 
                  variant="outline" 
                  colorScheme="gray"
                  flex={1}
                  onClick={onOpen}
                  fontSize="xs"
                >
                  Edit
                </Button>
                <Button 
                  as={Link}
                  href={`/coordination/${getUrlToken()}`}
                  size={{ base: "xs", md: "sm" }} 
                  colorScheme="blue"
                  flex={1}
                  target="_blank"
                  fontSize="xs"
                  leftIcon={<span>👁️</span>}
                >
                  View
                </Button>
                <Tooltip label={coordination.isArchived ? "Unarchive coordination" : "Archive coordination"}>
                  <IconButton
                    aria-label={coordination.isArchived ? "Unarchive coordination" : "Archive coordination"}
                    icon={<span>{coordination.isArchived ? "📦" : "📁"}</span>}
                    size={{ base: "xs", md: "sm" }}
                    variant="outline"
                    colorScheme={coordination.isArchived ? "green" : "orange"}
                    onClick={handleArchive}
                    isLoading={isArchiving}
                  />
                </Tooltip>
                <Tooltip label="Delete coordination">
                  <IconButton
                    aria-label="Delete coordination"
                    icon={<span>🗑️</span>}
                    size={{ base: "xs", md: "sm" }}
                    variant="outline"
                    colorScheme="red"
                    onClick={handleDelete}
                    isLoading={isDeleting}
                  />
                </Tooltip>
              </HStack>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="'SUSE Mono', monospace" fontWeight="600">Edit Coordination Set</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <CoordinationForm 
              coordination={coordination}
              events={events}
              onSuccess={() => {
                onClose();
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Document Upload Modal */}
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="'SUSE Mono', monospace" fontWeight="600">Upload Documents</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <DocumentUploader 
              coordinationId={coordination.id}
              onSuccess={() => {
                onUploadClose();
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
