"use client";

import { Box, Skeleton, SkeletonText, VStack, HStack, SimpleGrid, Container } from "@chakra-ui/react";

export function EventCardSkeleton() {
  return (
    <Box 
      bg="white" 
      borderRadius="2xl" 
      overflow="hidden" 
      boxShadow="lg" 
      border="1px solid"
      borderColor="gray.100"
      h="full"
      display="flex"
      flexDirection="column"
    >
      <Skeleton height="220px" />
      <VStack p={6} spacing={4} flex={1} align="stretch">
        <VStack spacing={2} align="stretch">
          <Skeleton height="24px" />
          <Skeleton height="16px" width="60%" />
          <Skeleton height="16px" width="40%" />
        </VStack>
        <HStack spacing={3} pt={2}>
          <Skeleton height="40px" flex={1} />
          <Skeleton height="40px" flex={1} />
        </HStack>
      </VStack>
    </Box>
  );
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SimpleGrid 
      columns={{ base: 1, sm: 2, md: 3 }} 
      gap={8}
      spacing={0}
    >
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </SimpleGrid>
  );
}

export function VideoCardSkeleton() {
  return (
    <Box
      flex="1"
      minW="0"
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      overflow="hidden"
    >
      <VStack spacing={0} align="stretch">
        <Skeleton height="200px" />
        <VStack spacing={2} p={4} align="stretch">
          <Skeleton height="20px" />
          <Skeleton height="16px" width="80%" />
          <Skeleton height="16px" width="60%" />
        </VStack>
      </VStack>
    </Box>
  );
}

export function VideoSliderSkeleton() {
  return (
    <Container maxW="7xl" py={8} position="relative" zIndex={1}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="left">
          <Skeleton height="40px" width="300px" mb={4} />
        </Box>
        <Box position="relative">
          <HStack spacing={4} align="stretch" overflow="hidden">
            <VideoCardSkeleton />
            <VideoCardSkeleton />
            <VideoCardSkeleton />
          </HStack>
        </Box>
      </VStack>
    </Container>
  );
}

export function GalleryImageSkeleton() {
  return (
    <Box
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg="white"
    >
      <Skeleton height="200px" />
      <VStack p={3} spacing={2} align="stretch">
        <Skeleton height="16px" />
        <Skeleton height="12px" width="80%" />
        <HStack spacing={1}>
          <Skeleton height="20px" width="60px" borderRadius="full" />
          <Skeleton height="20px" width="80px" borderRadius="full" />
        </HStack>
      </VStack>
    </Box>
  );
}

export function GalleryPreviewSkeleton() {
  return (
    <VStack spacing={8} align="stretch">
      <Box textAlign="center">
        <Skeleton height="40px" width="200px" mx="auto" mb={4} />
        <Skeleton height="20px" width="400px" mx="auto" />
      </Box>
      <Box>
        <div className="masonry-grid-preview">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="masonry-item-preview"
              style={{
                breakInside: "avoid",
                marginBottom: "16px",
              }}
            >
              <GalleryImageSkeleton />
            </div>
          ))}
        </div>
      </Box>
      <Box textAlign="center">
        <Skeleton height="48px" width="200px" mx="auto" borderRadius="xl" />
      </Box>
    </VStack>
  );
}

export function SubscribeFormSkeleton() {
  return (
    <VStack spacing={8} textAlign="center">
      <Box>
        <Skeleton height="40px" width="300px" mx="auto" mb={4} />
        <Skeleton height="20px" width="600px" mx="auto" />
      </Box>
      <Box w="full" maxW="md" mx="auto">
        <HStack spacing={3}>
          <Skeleton height="56px" flex={1} borderRadius="xl" />
          <Skeleton height="56px" width="150px" borderRadius="xl" />
        </HStack>
      </Box>
      <Skeleton height="16px" width="400px" mx="auto" />
    </VStack>
  );
}
