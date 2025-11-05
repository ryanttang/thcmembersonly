"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Container,
  VStack,
  HStack,
  IconButton,
  useBreakpointValue,
  AspectRatio,
  Flex,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import type { RecentEventVideo } from "@/types";

interface VideoSliderProps {
  videos: RecentEventVideo[];
}

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string => {
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
  const [currentIndex, setCurrentIndex] = useState(0);

  const [slidesToShow, setSlidesToShow] = useState(1);
  
  useEffect(() => {
    const checkSlidesToShow = () => {
      const width = window.innerWidth;
      if (width >= 1024) setSlidesToShow(3); // lg
      else if (width >= 768) setSlidesToShow(2); // md
      else setSlidesToShow(1); // base
    };
    
    checkSlidesToShow();
    window.addEventListener('resize', checkSlidesToShow);
    return () => window.removeEventListener('resize', checkSlidesToShow);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + slidesToShow >= videos.length ? 0 : prev + slidesToShow
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev - slidesToShow < 0 
        ? Math.max(0, videos.length - slidesToShow)
        : prev - slidesToShow
    );
  };

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

        <Box position="relative">
          <HStack spacing={4} align="stretch" overflow="hidden">
            {videos
              .slice(currentIndex, currentIndex + slidesToShow)
              .map((video) => (
                <Box
                  key={video.id}
                  flex="1"
                  minW="0"
                  bg="white"
                  borderRadius="lg"
                  boxShadow="md"
                  overflow="hidden"
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
                    borderRadius: "lg",
                    bgGradient: "linear(135deg, blue.300, purple.300, blue.200)",
                    zIndex: -1
                  }}
                  _after={{
                    content: '""',
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    right: "0px",
                    bottom: "0px",
                    borderRadius: "lg",
                    bgGradient: "linear(135deg, blue.50, purple.50, white)",
                    zIndex: -1
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{ 
                    transform: "translateY(-4px)",
                    _before: {
                      bgGradient: "linear(135deg, blue.400, purple.400, blue.300)"
                    },
                    _after: {
                      bgGradient: "linear(135deg, blue.100, purple.100, white)"
                    }
                  }}
                >
                  <VStack spacing={0} align="stretch">
                    <Box position="relative">
                      <AspectRatio ratio={16 / 9}>
                        {(video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be')) && getYouTubeVideoId(video.videoUrl) ? (
                          <Box
                            as="iframe"
                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(video.videoUrl)}?autoplay=${video.autoplay ? 1 : 0}&loop=${video.loop ? 1 : 0}&playlist=${video.loop ? getYouTubeVideoId(video.videoUrl) : ''}&mute=${video.muted ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                            w="100%"
                            h="100%"
                            borderRadius="lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : video.videoUrl && video.videoUrl.trim() !== '' ? (
                          <Box
                            as="video"
                            src={video.videoUrl}
                            controls
                            poster={video.thumbnailUrl || undefined}
                            autoPlay={video.autoplay}
                            loop={video.loop}
                            muted={video.muted}
                            playsInline
                            w="100%"
                            h="100%"
                            objectFit="cover"
                            borderRadius="lg"
                          />
                        ) : (
                          <Box
                            w="100%"
                            h="100%"
                            bg="gray.200"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="lg"
                          >
                            <Text color="gray.500" fontSize="sm">Invalid video URL</Text>
                          </Box>
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
                          fontSize="sm"
                        >
                          {formatDuration(video.duration)}
                        </Box>
                      )}
                    </Box>

                    <VStack spacing={2} p={4} align="stretch">
                      <Heading 
                        size="md" 
                        noOfLines={2}
                        fontFamily="'SUSE Mono', monospace"
                        fontWeight="600"
                      >
                        {video.title}
                      </Heading>
                      {video.caption && (
                        <Text color="gray.600" fontSize="sm" noOfLines={3}>
                          {video.caption}
                        </Text>
                      )}
                    </VStack>
                  </VStack>
                </Box>
              ))}
          </HStack>

          {videos.length > 1 && (
            <>
              <IconButton
                aria-label="Previous videos"
                icon={<ChevronLeftIcon />}
                position="absolute"
                left={-6}
                top="50%"
                transform="translateY(-50%)"
                bg="white"
                color="gray.700"
                boxShadow="xl"
                borderRadius="full"
                size="lg"
                onClick={prevSlide}
                zIndex={10}
                _hover={{ 
                  bg: "gray.50",
                  transform: "translateY(-50%) scale(1.1)",
                  boxShadow: "2xl"
                }}
                _active={{
                  transform: "translateY(-50%) scale(0.95)"
                }}
                transition="all 0.2s"
              />
              <IconButton
                aria-label="Next videos"
                icon={<ChevronRightIcon />}
                position="absolute"
                right={-6}
                top="50%"
                transform="translateY(-50%)"
                bg="white"
                color="gray.700"
                boxShadow="xl"
                borderRadius="full"
                size="lg"
                onClick={nextSlide}
                zIndex={10}
                _hover={{ 
                  bg: "gray.50",
                  transform: "translateY(-50%) scale(1.1)",
                  boxShadow: "2xl"
                }}
                _active={{
                  transform: "translateY(-50%) scale(0.95)"
                }}
                transition="all 0.2s"
              />
            </>
          )}
        </Box>

        {videos.length > 1 && (
          <Flex justify="center" gap={2}>
            {Array.from({ length: Math.ceil(videos.length / slidesToShow) }).map(
              (_, index) => (
                <Box
                  key={index}
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={index === Math.floor(currentIndex / slidesToShow) ? "blue.500" : "gray.300"}
                  cursor="pointer"
                  onClick={() => setCurrentIndex(index * slidesToShow)}
                />
              )
            )}
          </Flex>
        )}
      </VStack>
    </Container>
  );
}
