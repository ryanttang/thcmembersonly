"use client";
import { Box, Button, Heading, HStack, Stack, Text, Image as CImage, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure, Badge } from "@chakra-ui/react";
import NextLink from "next/link";
import { format } from "date-fns";
import { useRef } from "react";

type Props = {
  id: string;
  slug: string;
  title: string;
  startAt: string | Date;
  locationName?: string | null;
  city?: string | null;
  state?: string | null;
  hero?: any | null; // image.variants
  buttonType?: 'RSVP' | 'BUY_TICKETS';
  ticketUrl?: string | null;
  status?: string;
  onDelete?: () => void;
  onStatusChange?: (eventId: string, newStatus: string) => void;
  showArchiveActions?: boolean;
  isAdminView?: boolean; // New prop to determine if this is admin view
};

export default function EventCard({ 
  id, 
  slug, 
  title, 
  startAt, 
  locationName, 
  city, 
  state, 
  hero, 
  buttonType = 'RSVP', 
  ticketUrl, 
  status,
  onDelete, 
  onStatusChange,
  showArchiveActions = false,
  isAdminView = false // Default to public view
}: Props) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Format the startAt date for display
  const formatStartAt = (date: string | Date) => {
    if (typeof date === 'string') {
      return format(new Date(date), 'MMM dd, yyyy • h:mm a');
    }
    return format(date, 'MMM dd, yyyy • h:mm a');
  };

  // Get image URL with proper fallback logic
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

  const img = getImageUrl(hero);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete event');
      }

      toast({
        title: "Event deleted successfully",
        status: "success",
        duration: 3000,
      });

      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      toast({
        title: "Error deleting event",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      onClose();
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' })
      });

      if (!res.ok) {
        throw new Error('Failed to archive event');
      }

      toast({
        title: "Event archived successfully",
        status: "success",
        duration: 3000,
      });

      if (onStatusChange) {
        onStatusChange(id, 'ARCHIVED');
      }
      
      // Refresh the page to update the event list
      // Use window.location.reload() instead of router.refresh() to avoid chunk loading errors
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error archiving event",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleUnarchive = async () => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' })
      });

      if (!res.ok) {
        throw new Error('Failed to unarchive event');
      }

      toast({
        title: "Event unarchived successfully",
        status: "success",
        duration: 3000,
      });

      if (onStatusChange) {
        onStatusChange(id, 'DRAFT');
      }
      
      // Refresh the page to update the event list
      // Use window.location.reload() instead of router.refresh() to avoid chunk loading errors
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error unarchiving event",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;
    
    const statusColors = {
      DRAFT: 'gray',
      PUBLISHED: 'green',
      ARCHIVED: 'orange'
    };

    return (
      <Badge colorScheme={statusColors[status as keyof typeof statusColors] || 'gray'} variant="subtle">
        {status}
      </Badge>
    );
  };
  
  return (
    <>
      <Box 
        bg="white" 
        borderRadius="2xl" 
        overflow="hidden" 
        boxShadow="lg" 
        border="2px solid"
        borderColor="transparent"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: "-2px",
          left: "-2px",
          right: "-2px",
          bottom: "-2px",
          borderRadius: "2xl",
          bgGradient: "linear(135deg, green.300, blue.300, green.200)",
          zIndex: -1
        }}
        _after={{
          content: '""',
          position: "absolute",
          top: "0px",
          left: "0px",
          right: "0px",
          bottom: "0px",
          borderRadius: "2xl",
          bgGradient: "linear(135deg, green.50, blue.50, white)",
          zIndex: -1
        }}
        _hover={{ 
          boxShadow: "2xl", 
          transform: "translateY(-4px) scale(1.02)",
          _before: {
            bgGradient: "linear(135deg, green.400, blue.400, green.300)"
          },
          _after: {
            bgGradient: "linear(135deg, green.100, blue.100, white)"
          },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }} 
        _active={{
          transform: "translateY(-2px) scale(1.01)",
          boxShadow: "xl"
        }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        h="full"
        display="flex"
        flexDirection="column"
      >
        {img && (
          <NextLink href={`/events/${slug}`}>
              <CImage
              src={img}
              alt={title}
              w="100%"
              h={{ base: "180px", md: "280px" }}
              objectFit="cover"
              loading="lazy"
              fallbackSrc="/placeholder-image.svg"
              cursor="pointer"
              _hover={{
                transform: "scale(1.05)",
                filter: "brightness(1.1) saturate(1.1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.svg";
              }}
            />
          </NextLink>
        )}
        <Stack p={{ base: 2, sm: 3, md: 4 }} spacing={{ base: 2, md: 3 }} flex={1} display="flex" flexDirection="column" position="relative" zIndex={1}>
          <Box flex={1}>
            <HStack justify="space-between" align="start" mb={{ base: 1, md: 2 }}>
              <Heading 
                size={{ base: "sm", md: "md" }} 
                noOfLines={2} 
                flex={1}
                color="gray.800"
                lineHeight="1.3"
                fontFamily="'SUSE Mono', monospace"
                fontWeight="600"
              >
                {title}
              </Heading>
              {isAdminView && getStatusBadge()}
            </HStack>
            <Text 
              color="gray.600" 
              fontSize={{ base: "2xs", md: "xs" }} 
              fontWeight="500"
              mb={{ base: 0.5, md: 1 }}
            >
              {formatStartAt(startAt)}
            </Text>
            <Text 
              color="gray.600" 
              noOfLines={1}
              fontSize={{ base: "xs", md: "sm" }}
            >
              {(() => {
                // Show locationName first if available, then supplement with city/state info
                if (locationName) {
                  return `${locationName}${city ? ` • ${city}` : ""}${state ? `, ${state}` : ""}`;
                }
                // Fallback to city and state only
                return `${city ?? ""}${state ? `${city ? ", " : ""}${state}` : ""}`;
              })()}
            </Text>
          </Box>
          <HStack pt={{ base: 0.5, md: 1 }} justify="space-between" align="center" spacing={{ base: 1, md: 2 }} flexWrap="wrap">
            {buttonType === 'BUY_TICKETS' && ticketUrl ? (
              <Button 
                as="a"
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                size={{ base: "sm", md: "md" }}
                px={{ base: 3, md: 4 }}
                bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                color="white"
                shadow="md"
                fontWeight="600"
                flex={1}
                _hover={{
                  transform: "translateY(-3px) scale(1.05)",
                  shadow: "xl",
                  bg: "linear-gradient(135deg, #2563eb 0.2%, #1e40af 100%)"
                }}
                _active={{
                  transform: "translateY(-1px) scale(1.02)"
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                Tickets
              </Button>
            ) : buttonType === 'RSVP' && ticketUrl ? (
              <Button 
                as="a"
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                size={{ base: "sm", md: "md" }}
                px={{ base: 3, md: 4 }}
                bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                color="white"
                shadow="md"
                fontWeight="600"
                flex={1}
                _hover={{
                  transform: "translateY(-3px) scale(1.05)",
                  shadow: "xl",
                  bg: "linear-gradient(135deg, #15803d 0%, #166534 100%)"
                }}
                _active={{
                  transform: "translateY(-1px) scale(1.02)"
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                RSVP
              </Button>
            ) : null}
            
            <Button 
              as={NextLink} 
              href={`/events/${slug}`} 
              variant="outline" 
              size={{ base: "sm", md: "md" }}
              px={{ base: 3, md: 4 }}
              colorScheme="black"
              bg="rgba(255, 255, 255, 0.8)"
              backdropFilter="blur(8px)"
              borderWidth="2px"
              fontWeight="500"
              flex={1}
              _hover={{
                bg: "gray.50",
                borderColor: "gray.400",
                transform: "translateY(-3px) scale(1.05)",
                shadow: "lg",
                color: "gray.700"
              }}
              _active={{
                transform: "translateY(-1px) scale(1.02)"
              }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              Details
            </Button>
          </HStack>
          
          {/* Action Buttons */}
          <HStack spacing={{ base: 1, md: 2 }} justify="center">
            {isAdminView && (
              <Button 
                as={NextLink} 
                href={`/dashboard/events/${id}/edit`} 
                variant="outline" 
                size="sm"
                colorScheme="black"
                bg="rgba(255, 255, 255, 0.8)"
                backdropFilter="blur(8px)"
                borderWidth="2px"
                fontWeight="500"
                _hover={{
                  bg: "blue.50",
                  borderColor: "blue.400",
                  transform: "translateY(-1px)",
                  shadow: "sm",
                  color: "blue.700"
                }}
                transition="all 0.3s ease-in-out"
              >
                Edit
              </Button>
            )}
            
            {isAdminView && showArchiveActions ? (
              <Button 
                colorScheme="green" 
                variant="ghost" 
                size="sm"
                onClick={handleUnarchive}
                _hover={{
                  transform: "translateY(-1px)",
                  shadow: "sm"
                }}
                transition="all 0.2s"
              >
                Unarchive
              </Button>
            ) : isAdminView && (
              <Button 
                colorScheme="orange" 
                variant="ghost" 
                size="sm"
                onClick={handleArchive}
                _hover={{
                  transform: "translateY(-1px)",
                  shadow: "sm"
                }}
                transition="all 0.2s"
              >
                Archive
              </Button>
            )}
            
            {isAdminView && (
              <Button 
                colorScheme="red" 
                variant="ghost" 
                size="sm"
                onClick={onOpen}
                _hover={{
                  transform: "translateY(-1px)",
                  shadow: "sm"
                }}
                transition="all 0.2s"
              >
                Delete
              </Button>
            )}
          </HStack>
        </Stack>
      </Box>

      {/* Delete Confirmation Dialog */}
      {isAdminView && (
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Event
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </>
  );
}
