import EventGrid from "@/components/events/EventGrid";
import VideoSlider from "@/components/videos/VideoSlider";
import GalleryPreview from "@/components/gallery/GalleryPreview";
import SubscribeForm from "@/components/SubscribeForm";
import { EventGridSkeleton, VideoSliderSkeleton, GalleryPreviewSkeleton, SubscribeFormSkeleton } from "@/components/ui/SkeletonLoader";
import BackToTopButton from "@/components/ui/BackToTopButton";
import { Box, Heading, Container, VStack, Text, Button, HStack, Image } from "@chakra-ui/react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import type { RecentEventVideo } from "@prisma/client";

export const metadata: Metadata = {
  title: "THC Members Only Club - Premiere Cannabis Social Club",
  description: "Join the premiere cannabis social club in Southern California. Discover exclusive events, connect with like-minded members, and experience the finest cannabis culture. Upcoming events, member benefits, and community coordination.",
  keywords: [
    "cannabis social club",
    "THC members only",
    "cannabis events",
    "marijuana social club",
    "cannabis community",
    "Southern California cannabis",
    "cannabis events calendar",
    "marijuana events",
    "cannabis networking",
    "weed social club"
  ],
  openGraph: {
    title: "THC Members Only Club - Premiere Cannabis Social Club",
    description: "Join the premiere cannabis social club in Southern California. Discover exclusive events, connect with like-minded members, and experience the finest cannabis culture.",
    url: 'https://thcmembersonlyclub.com',
    images: [
      {
        url: '/thcmembers-banner.png',
        width: 1200,
        height: 630,
        alt: 'THC Members Only Club - Premiere Cannabis Social Club',
      },
    ],
  },
  twitter: {
    title: "THC Members Only Club - Premiere Cannabis Social Club",
    description: "Join the premiere cannabis social club in Southern California. Discover exclusive events, connect with like-minded members, and experience the finest cannabis culture.",
  },
  alternates: {
    canonical: '/',
  },
};

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Query database directly for better performance and reliability
  let eventsData = { items: [] };
  let videosData = { videos: [] };
  let galleryData = { allImages: [] };
  
  try {
    // Fetch events with hero images directly from database
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      include: { heroImage: true },
      orderBy: { startAt: 'asc' },
      take: 30,
    });
    
    eventsData = { items: events };
    
    // Fetch videos
    const videos = await prisma.recentEventVideo.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc', createdAt: 'desc' },
      take: 10,
    });
    
    // Filter out videos with invalid URLs (allow any non-empty URL)
    const validVideos = videos.filter((video: RecentEventVideo) => 
      video.videoUrl && 
      typeof video.videoUrl === 'string' &&
      video.videoUrl.trim() !== ''
    );
    
    // Log for debugging
    console.log('[HomePage] Fetched videos:', videos.length);
    console.log('[HomePage] Valid videos:', validVideos.length);
    if (validVideos.length > 0) {
      console.log('[HomePage] Video titles:', validVideos.map(v => v.title));
      console.log('[HomePage] Video URLs:', validVideos.map(v => v.videoUrl));
    }
    
    videosData = { videos: validVideos };
    
    // Fetch gallery images
    const galleries = await prisma.gallery.findMany({
      where: { isPublic: true },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        images: {
          include: {
            image: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Flatten gallery images into a single array with required fields
    const allImages = galleries.flatMap((gallery: typeof galleries[0]) =>
      gallery.images.map((galleryImage: typeof gallery.images[0]) => ({
        ...galleryImage,
        galleryName: gallery.name,
        galleryId: gallery.id,
        eventTitle: gallery.event?.title || null,
        image: galleryImage.image,
        createdAt: galleryImage.createdAt.toISOString(),
      }))
    );
    
    galleryData = { allImages };
  } catch (error) {
    console.error('Error fetching data:', error);
    // Continue with empty data if there's an error
  }
  
  return (
    <VStack spacing={0} align="stretch">
      {/* Instagram Follow Button */}
      <Box 
        bg="white"
        py={{ base: 6, md: 8 }}
        textAlign="center"
      >
        <Container maxW="7xl">
          <Button
            as="a"
            href="https://instagram.com/thcmembersonlyclub"
            target="_blank"
            rel="noopener noreferrer"
            size={{ base: "md", md: "lg" }}
            bgGradient="linear(135deg, #833AB4, #C13584, #E1306C, #F56040, #F77737, #FCAF45, #FFDC80)"
            color="white"
            px={{ base: 6, md: 8 }}
            py={{ base: 4, md: 6 }}
            borderRadius="xl"
            fontSize={{ base: "sm", md: "md" }}
            fontWeight="600"
            shadow="lg"
            _hover={{
              bgGradient: "linear(135deg, #6A2C93, #A02A6B, #C13584, #E1306C, #F56040, #F77737, #FCAF45)",
              transform: "translateY(-2px)",
              shadow: "xl"
            }}
            _active={{
              transform: "translateY(0px)"
            }}
            transition="all 0.3s ease"
            maxW={{ base: "320px", md: "450px" }}
            mx="auto"
            leftIcon={
              <Image
                src="/Instagram_icon.png"
                alt="Instagram"
                w="20px"
                h="20px"
                objectFit="contain"
              />
            }
          >
            Follow @THCMEMBERSONLYCLUB
          </Button>
        </Container>
      </Box>

      {/* Upcoming Events Section */}
      <Box 
        bg="white"
        py={{ base: 8, md: 12 }}
        position="relative"
      >
        <Container maxW="7xl" position="relative" zIndex={1}>
          <Box mb={{ base: 8, md: 12 }} display="flex" justifyContent="space-between" alignItems="center">
            <Heading 
              size={{ base: "md", md: "xl" }} 
              color="black"
              fontWeight="600"
              letterSpacing="tight"
              fontFamily="'SUSE Mono', monospace"
            >
              Events Calendar
            </Heading>
            <Box
              position="relative"
              display="inline-block"
              px={5}
              py={2}
              borderRadius="xl"
              border="2px solid"
              borderColor="black"
              bg="white"
            >
              <Heading 
                size={{ base: "md", md: "xl" }} 
                color="black"
                fontWeight="600"
                letterSpacing="tight"
                fontFamily="'SUSE Mono', monospace"
              >
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Heading>
            </Box>
          </Box>
          <Suspense fallback={<EventGridSkeleton />}>
            <EventGrid items={eventsData.items || []} />
          </Suspense>
          <Box textAlign="center" mt={8}>
            <Link href="/events">
              <Box
                as="button"
                bgGradient="linear(135deg, green.500, green.600)"
                color="white"
                px={{ base: 6, md: 8 }}
                py={{ base: 3, md: 4 }}
                borderRadius="xl"
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="semibold"
                shadow="lg"
                _hover={{
                  bgGradient: "linear(135deg, green.600, green.700)",
                  transform: "translateY(-2px)",
                  shadow: "xl"
                }}
                transition="all 0.3s ease"
              >
                View All Events
              </Box>
            </Link>
          </Box>
        </Container>
      </Box>

      {/* Recent Events Video Section */}
      <Box 
        bg="gray.50" 
        py={{ base: 8, md: 12 }}
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 51, 234, 0.03) 100%)",
          zIndex: 0
        }}
      >
        <Suspense fallback={<VideoSliderSkeleton />}>
          {videosData.videos && videosData.videos.length > 0 ? (
            <VideoSlider videos={videosData.videos} />
          ) : (
            <VideoSliderSkeleton />
          )}
        </Suspense>
      </Box>

      {/* Gallery Section */}
      <Box 
        bgGradient="linear(135deg, purple.50, pink.50, white)"
        py={{ base: 8, md: 12 }}
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)",
          zIndex: 0
        }}
      >
        <Suspense fallback={<GalleryPreviewSkeleton />}>
          <GalleryPreview images={galleryData.allImages || []} />
        </Suspense>
      </Box>

      {/* Subscribe Section */}
      <Box 
        bg="white"
        py={{ base: 4, md: 6 }}
      >
        <Suspense fallback={<SubscribeFormSkeleton />}>
          <SubscribeForm />
        </Suspense>
      </Box>

      {/* Back to Top Button */}
      <BackToTopButton />
    </VStack>
  );
}
