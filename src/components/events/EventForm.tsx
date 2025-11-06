"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema } from "@/lib/validation";
import { Box, Button, FormControl, FormLabel, Input, Textarea, HStack, Switch, VStack, useToast, SimpleGrid, Stack } from "@chakra-ui/react";
import HeroImageUploader from "./HeroImageUploader";
import DetailImagesUploader from "./DetailImagesUploader";
import { useState } from "react";
import type { z } from "zod";

type FormVals = z.infer<typeof createEventSchema>;

export default function EventForm({ initial, mode = "create", eventId, existingImages }: { 
  initial?: Partial<FormVals>; 
  mode?: "create" | "edit";
  eventId?: string;
  existingImages?: Array<{id: string, variants: any, fileName: string}>;
}) {
  const [heroImageId, setHeroImageId] = useState<string | undefined>(initial?.heroImageId);
  const [detailImages, setDetailImages] = useState<Array<{id: string, variants: any, fileName: string}>>(existingImages || []);
  const toast = useToast();
  
  const { register, handleSubmit, formState: { isSubmitting, errors }, watch, setValue } = useForm<FormVals>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      ticketUrl: "",
      buttonType: "RSVP",
      locationName: "",
      city: "",
      state: "",
      startAt: "",
      endAt: "",
      status: "DRAFT" as const,
      timezone: "America/Los_Angeles",
      ...initial
    }
  });

  const onSubmit = async (vals: FormVals) => {
    console.log("Form submitted with values:", vals);
    console.log("Hero image ID:", heroImageId);
    
    // Basic validation
    if (!vals.title || vals.title.length < 3) {
      toast({
        title: "Validation Error",
        description: "Title must be at least 3 characters long",
        status: "error",
        duration: 3000,
      });
      return;
    }
    
    if (!vals.startAt) {
      toast({
        title: "Validation Error",
        description: "Start date is required",
        status: "error",
        duration: 3000,
      });
      return;
    }
    
    try {
      const url = mode === "edit" ? `/api/events/${eventId}` : "/api/events";
      const method = mode === "edit" ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...vals, 
          heroImageId,
          detailImageIds: detailImages.map(img => img.id)
        })
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error ? JSON.stringify(json.error) : `Failed to ${mode} event`);
      }
      
      toast({
        title: `Event ${mode === "edit" ? "updated" : "created"} successfully`,
        status: "success",
        duration: 3000,
      });
      
      // Redirect to dashboard
      window.location.href = "/dashboard/events";
    } catch (error) {
      toast({
        title: `Error ${mode === "edit" ? "updating" : "creating"} event`,
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" boxShadow="sm">
      <VStack spacing={6} align="stretch">
        {/* Basic Information Section */}
        <Box>
          <FormControl isInvalid={!!errors.title} mb={4}>
            <FormLabel fontSize="sm" fontWeight="semibold">Title *</FormLabel>
            <Input {...register("title")} size="md" />
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel fontSize="sm" fontWeight="semibold">Description</FormLabel>
            <Textarea rows={3} {...register("description")} resize="vertical" />
          </FormControl>
        </Box>

        {/* Ticket Information Section */}
        <Box>
          <FormControl mb={4}>
            <FormLabel fontSize="sm" fontWeight="semibold">Ticket URL</FormLabel>
            <Input type="url" {...register("ticketUrl")} placeholder="https://..." />
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="semibold">Button Type</FormLabel>
            <HStack spacing={3} mt={2}>
              <Button
                type="button"
                variant={watch("buttonType") === "RSVP" ? "solid" : "outline"}
                colorScheme="teal"
                size="sm"
                onClick={() => setValue("buttonType", "RSVP")}
              >
                RSVP
              </Button>
              <Button
                type="button"
                variant={watch("buttonType") === "BUY_TICKETS" ? "solid" : "outline"}
                colorScheme="teal"
                size="sm"
                onClick={() => setValue("buttonType", "BUY_TICKETS")}
              >
                Buy Tickets
              </Button>
            </HStack>
          </FormControl>
        </Box>
        
        {/* Date & Time Section */}
        <Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.startAt}>
              <FormLabel fontSize="sm" fontWeight="semibold">Start Date & Time *</FormLabel>
              <Input type="datetime-local" {...register("startAt")} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">End Date & Time</FormLabel>
              <Input type="datetime-local" {...register("endAt")} />
            </FormControl>
          </SimpleGrid>
        </Box>
        
        {/* Location Section */}
        <Box>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">Location Name</FormLabel>
              <Input {...register("locationName")} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">City</FormLabel>
              <Input {...register("city")} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">State</FormLabel>
              <Input {...register("state")} />
            </FormControl>
          </SimpleGrid>
        </Box>
        
        {/* Hero Image Section */}
        <Box>
          <FormLabel fontSize="sm" fontWeight="semibold">Hero Image (Main Flyer)</FormLabel>
          <HeroImageUploader 
            onUploaded={(id) => setHeroImageId(id)} 
            initialImageId={heroImageId}
            eventId={eventId}
          />
        </Box>
        
        {/* Detail Images Section */}
        <Box>
          <FormLabel fontSize="sm" fontWeight="semibold">Additional Detail Images (Optional)</FormLabel>
          <DetailImagesUploader 
            onImagesUploaded={(images) => setDetailImages(images)}
            eventId={eventId}
            initialImages={existingImages}
          />
        </Box>
        
        {/* Publish Settings */}
        <Box>
          <FormControl display="flex" alignItems="center" justifyContent="space-between" p={3} bg="gray.50" borderRadius="md">
            <FormLabel mb="0" fontSize="sm" fontWeight="semibold">Publish immediately</FormLabel>
            <Switch 
              defaultChecked={initial?.status === "PUBLISHED"}
              onChange={(e) => setValue("status", e.target.checked ? "PUBLISHED" : "DRAFT")}
            />
          </FormControl>
        </Box>
        
        {/* Action Buttons */}
        <Stack direction={{ base: "column", sm: "row" }} spacing={3} pt={2}>
          <Button 
            type="submit" 
            isLoading={isSubmitting} 
            size={{ base: "lg", md: "md" }}
            flex={1}
            bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
            color="white"
            shadow={{ base: "xl", md: "lg" }}
            fontWeight="600"
            minH={{ base: "48px", md: "40px" }}
            fontSize={{ base: "md", md: "sm" }}
            _hover={{
              bg: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
              transform: "translateY(-2px)",
              shadow: "xl"
            }}
            _active={{
              transform: "translateY(0px)",
              shadow: "lg"
            }}
            transition="all 0.3s ease-in-out"
          >
            {mode === "edit" ? "Update Event" : "Save Event"}
          </Button>
          
          {/* Debug button removed */}
        </Stack>
      </VStack>
    </Box>
  );
}
