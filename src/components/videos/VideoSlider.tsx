"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Container,
  VStack,
  SimpleGrid,
  AspectRatio,
} from "@chakra-ui/react";
import type { RecentEventVideo } from "@/types";

interface VideoSliderProps {
  videos: RecentEventVideo[];
}

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  // Handle YouTube Shorts URLs
  if (url.includes('youtube.com/shorts/')) {
    const match = url.match(/youtube\.com\/shorts\/([^?&]+)/);
    return match ? match[1] : '';
  }
  
  // Handle regular YouTube URLs
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

export default function VideoSlider({ videos }: VideoSliderProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    console.log('[VideoSlider] Mounted. Videos:', videos.length);
    if (videos.length > 0) {
      console.log('[VideoSlider] Video titles:', videos.map(v => v.title));
      console.log('[VideoSlider] Video URLs:', videos.map(v => v.videoUrl));
    }
  }, [videos]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (videos.length === 0) {
    return null;
  }

  return (
    <Container maxW="7xl" py={8} position="relative" zIndex={1}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="left">
          <Heading 
            size={{ base: "md", md: "xl" }} 
            color="black"
            fontWeight="600"
            letterSpacing="tight"
            fontFamily="'SUSE Mono', monospace"
          >
            Recent Events
          </Heading>
        </Box>

        <SimpleGrid 
          columns={{ base: 1, md: 2, lg: 3 }} 
          spacing={6}
          w="100%"
        >
          {videos.map((video) => (
            <Box
              key={video.id}
              bg="white"
              borderRadius="lg"
              boxShadow="md"
              overflow="hidden"
            >
              <VStack spacing={3} align="stretch">
                <Box position="relative">
                  <AspectRatio ratio={16 / 9}>
                    {video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be') ? (
                      <Box
                        as="iframe"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(video.videoUrl)}?autoplay=0&loop=${video.loop ? 1 : 0}&playlist=${video.loop ? getYouTubeVideoId(video.videoUrl) : ''}&mute=${video.muted ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                        w="100%"
                        h="100%"
                        borderRadius="md"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <Box
                        as="video"
                        src={video.videoUrl}
                        poster={video.thumbnailUrl || undefined}
                        controls
                        autoPlay={false}
                        loop={video.loop}
                        muted={video.muted}
                        playsInline
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                  </AspectRatio>
                  {video.duration && (
                    <Box
                      position="absolute"
                      bottom={2}
                      right={2}
                      bg="blackAlpha.700"
                      color="white"
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                    >
                      {formatDuration(video.duration)}
                    </Box>
                  )}
                </Box>
                <VStack spacing={2} px={4} pb={4} align="stretch">
                  <Heading 
                    size="md" 
                    noOfLines={2}
                    fontFamily="'SUSE Mono', monospace"
                    fontWeight="600"
                  >
                    {video.title}
                  </Heading>
                  {video.caption && (
                    <Text fontSize="sm" color="gray.600" noOfLines={3}>
                      {video.caption}
                    </Text>
                  )}
                </VStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
