import { Metadata } from "next";
import { Box, Button, Text, Container } from "@chakra-ui/react";
import { format } from "date-fns";
import Link from "next/link";
import { Event } from "@/types";
import EventDetailClient from "@/components/events/EventDetailClient";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic';

async function getEvent(id: string): Promise<Event | null> {
  try {
    // Check if it's a UUID (ID) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      // Look up by ID (for authenticated users, can access any status)
      const event = await prisma.event.findUnique({
        where: { id: id },
        include: { heroImage: true, images: true, owner: true }
      });
      return event as Event | null;
    } else {
      // Look up by slug (for public access, published events only)
      const event = await prisma.event.findFirst({
        where: { 
          slug: id,
          status: "PUBLISHED"
        },
        include: { heroImage: true, images: true }
      });
      return event as Event | null;
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await getEvent(params.id);
  
  if (!event) {
    return {
      title: "Event Not Found",
      description: "The requested event could not be found.",
    };
  }

  const eventDate = format(new Date(event.startAt), "EEEE, MMMM d, yyyy 'at' p");
  const location = event.locationName ? 
    `${event.locationName}${event.city ? `, ${event.city}` : ''}${event.state ? `, ${event.state}` : ''}` : 
    'Location TBD';

  return {
    title: `${event.title} - Cannabis Event`,
    description: `${event.description || `Join us for ${event.title} on ${eventDate} at ${location}.`} Don't miss this exclusive cannabis event.`,
    keywords: [
      "cannabis event",
      "marijuana event",
      "cannabis social gathering",
      "weed event",
      "cannabis meetup",
      event.title.toLowerCase(),
      event.city?.toLowerCase() || "",
      event.state?.toLowerCase() || "",
    ].filter(Boolean),
    openGraph: {
      title: `${event.title} - Cannabis Event | THC Members Only Club`,
      description: `${event.description || `Join us for ${event.title} on ${eventDate} at ${location}.`} Don't miss this exclusive cannabis event.`,
      url: `https://thcmembersonlyclub.com/events/${event.slug}`,
      type: 'website',
      images: event.heroImage?.variants?.hero?.webpUrl ? [
        {
          url: event.heroImage.variants.hero.webpUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ] : [
        {
          url: '/thcmembers-banner.png',
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      title: `${event.title} - Cannabis Event | THC Members Only Club`,
      description: `${event.description || `Join us for ${event.title} on ${eventDate} at ${location}.`} Don't miss this exclusive cannabis event.`,
      images: event.heroImage?.variants?.hero?.webpUrl ? [event.heroImage.variants.hero.webpUrl] : ['/thcmembers-banner.png'],
    },
    alternates: {
      canonical: `/events/${event.slug}`,
    },
  };
}

export default async function EventDetail({ params }: { params: { id: string }}) {
  const event = await getEvent(params.id);

  if (!event) {
    return (
      <Container maxW="4xl" py={8}>
        <Box textAlign="center" py={20}>
          <Text fontSize="xl" color="red.500" mb={4}>Event not found</Text>
          <Button as={Link} href="/" colorScheme="blue" variant="outline">
            Back to Home
          </Button>
        </Box>
      </Container>
    );
  }

  return <EventDetailClient event={event} />;
}
