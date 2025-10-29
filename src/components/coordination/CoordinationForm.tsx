"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";
import DocumentUploader from "./DocumentUploader";

interface Event {
  id: string;
  title: string;
  slug: string;
  startAt: Date;
}

interface CoordinationFormProps {
  events: Event[];
  coordination?: any;
  onSuccess?: () => void;
}

// Helper function to safely parse pointOfContacts
const parsePointOfContacts = (contacts: any): any[] => {
  if (!contacts) return [];
  if (Array.isArray(contacts)) return contacts;
  if (typeof contacts === 'string') {
    try {
      return JSON.parse(contacts);
    } catch {
      return [];
    }
  }
  return [];
};

export default function CoordinationForm({ 
  events, 
  coordination, 
  onSuccess 
}: CoordinationFormProps) {
  // Debug: Log what we receive
  console.log('CoordinationForm rendered:', {
    hasCoordination: !!coordination,
    coordinationId: coordination?.id,
    coordinationType: typeof coordination,
    coordinationObject: coordination,
  });

  // Check if we're in edit mode - must be done before hooks but hooks must always run
  const isEditMode = !!(coordination && coordination.id);
  
  // All hooks must be called before conditional returns
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [createdCoordinationId, setCreatedCoordinationId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    eventId: coordination?.eventId || "",
    title: coordination?.title || "",
    description: coordination?.description || "",
    notes: coordination?.notes || "",
    specialMessage: coordination?.specialMessage || "",
    pointOfContacts: parsePointOfContacts(coordination?.pointOfContacts),
  });
  const toast = useToast();

  // Sync form state whenever coordination prop changes (works both inline and modal usage)
  useEffect(() => {
    if (coordination && coordination.id) {
      const parsedContacts = parsePointOfContacts(coordination.pointOfContacts);
      console.log('CoordinationForm: useEffect updating form data', {
        id: coordination.id,
        title: coordination.title,
        specialMessage: coordination.specialMessage,
        pointOfContacts: coordination.pointOfContacts,
        parsedContacts,
        isEditMode,
      });
      setFormData({
        eventId: coordination.eventId || "",
        title: coordination.title || "",
        description: coordination.description || "",
        notes: coordination.notes || "",
        specialMessage: coordination.specialMessage || "",
        pointOfContacts: parsedContacts,
      });
    } else if (!coordination) {
      // Reset form when coordination is cleared
      setFormData({
        eventId: "",
        title: "",
        description: "",
        notes: "",
        specialMessage: "",
        pointOfContacts: [],
      });
    }
  }, [coordination, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = coordination 
        ? `/api/coordination/${coordination.id}`
        : "/api/coordination";
      
      const method = coordination ? "PUT" : "POST";

      // Filter out empty contacts before sending
      const submitData = {
        ...formData,
        pointOfContacts: formData.pointOfContacts.filter((contact: any) => 
          (contact.name?.trim() || "") || (contact.number?.trim() || "") || (contact.email?.trim() || "")
        )
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save coordination");
      }

      const result = await response.json();

      toast({
        title: coordination ? "Coordination updated" : "Coordination created",
        description: coordination 
          ? "Your coordination set has been updated successfully"
          : "Your coordination set has been created successfully",
        status: "success",
        duration: 3000,
      });

      // If creating new coordination, store the ID and don't close modal yet
      if (!coordination) {
        setCreatedCoordinationId(result.id);
        // Don't close modal or call onSuccess yet - let user upload documents
      } else {
        // For editing, call onSuccess (parent modal will handle closing)
        if (onSuccess) onSuccess();
      }
      
      // Reset form if creating new (but keep modal open for document upload)
      if (!coordination) {
        setFormData({
          eventId: "",
          title: "",
          description: "",
          notes: "",
          specialMessage: "",
          pointOfContacts: [],
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      pointOfContacts: [...prev.pointOfContacts, { name: "", number: "", email: "" }]
    }));
  };

  const removeContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pointOfContacts: prev.pointOfContacts.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateContact = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      pointOfContacts: prev.pointOfContacts.map((contact: any, i: number) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleDocumentUploadSuccess = () => {
    // Close modal and refresh page after document upload
    onClose();
    if (onSuccess) onSuccess();
    setCreatedCoordinationId(null);
  };

  const handleSkipDocumentUpload = () => {
    // Close modal and refresh page without uploading documents
    onClose();
    if (onSuccess) onSuccess();
    setCreatedCoordinationId(null);
  };

  // Render form content (used when embedded in another modal like CoordinationCard)
  const renderFormContent = () => (
    <>
      {!createdCoordinationId ? (
        // Show form for creating/editing coordination
        <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Event</FormLabel>
                    <Select
                      value={formData.eventId}
                      onChange={(e) => handleInputChange("eventId", e.target.value)}
                      placeholder="Select an event"
                    >
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {new Date(event.startAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Title</FormLabel>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., VIP Event Coordination"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Brief description of this coordination set"
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Special Message (Optional)</FormLabel>
                    <Textarea
                      value={formData.specialMessage}
                      onChange={(e) => handleInputChange("specialMessage", e.target.value)}
                      placeholder="Optional highlighted text for important reminders"
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Additional notes for team members"
                      rows={4}
                    />
                  </FormControl>

                  {/* Point of Contacts */}
                  <FormControl>
                    <FormLabel>Point of Contacts</FormLabel>
                    <VStack spacing={3} align="stretch">
                      {formData.pointOfContacts.map((contact: any, index: number) => (
                        <Box key={index} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                          <HStack justify="space-between" align="center" mb={3}>
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">
                              Contact {index + 1}
                            </Text>
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeContact(index)}
                            >
                              Remove
                            </Button>
                          </HStack>
                          <VStack spacing={3}>
                            <Input
                              value={contact.name}
                              onChange={(e) => updateContact(index, "name", e.target.value)}
                              placeholder="Contact Name"
                            />
                            <Input
                              value={contact.number}
                              onChange={(e) => updateContact(index, "number", e.target.value)}
                              placeholder="Phone Number"
                            />
                            <Input
                              value={contact.email}
                              onChange={(e) => updateContact(index, "email", e.target.value)}
                              placeholder="Email Address"
                              type="email"
                            />
                          </VStack>
                        </Box>
                      ))}
                      <Button
                        variant="outline"
                        colorScheme="blue"
                        onClick={addContact}
                        leftIcon={<span>+</span>}
                      >
                        Add Contact
                      </Button>
                    </VStack>
                  </FormControl>

                  {!coordination && (
                    <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                      <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={1}>
                        📄 Next Step: Document Upload
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        After creating this coordination set, you&apos;ll have the option to upload documents in the next step.
                      </Text>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isLoading}
                    loadingText={coordination ? "Updating..." : "Creating..."}
                    w="full"
                    size="lg"
                  >
                    {coordination ? "Update Coordination" : "Create Coordination"}
                  </Button>
                </VStack>
              </form>
            ) : (
              // Show document upload interface after coordination is created
              <VStack spacing={6} align="stretch">
                <Box textAlign="center" p={4} bg="green.50" borderRadius="md">
                  <Text color="green.700" fontWeight="medium" mb={2}>
                    ✅ Coordination set created successfully!
                  </Text>
                  <Text color="green.600" fontSize="sm">
                    You can now upload documents for this coordination set, or skip to finish.
                  </Text>
                </Box>

                <Tabs>
                  <TabList>
                    <Tab>Upload Documents</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel px={0}>
                      <DocumentUploader 
                        coordinationId={createdCoordinationId}
                        onSuccess={handleDocumentUploadSuccess}
                      />
                    </TabPanel>
                  </TabPanels>
                </Tabs>

                <Box textAlign="center" pt={4}>
                  <Button
                    variant="outline"
                    colorScheme="gray"
                    onClick={handleSkipDocumentUpload}
                    size="sm"
                  >
                    Skip Document Upload
                  </Button>
                </Box>
              </VStack>
            )}
      </>
  );

  // SIMPLIFIED: If coordination exists, ALWAYS render form (edit mode)
  // If no coordination, render button + modal (create mode)
  // NO conditional returns before this - all hooks must run first
  
  // Edit mode: render form directly (used inside CoordinationCard modal)
  if (coordination?.id) {
    // FORCE DISPLAY: Add visible indicator to verify this code path is executing
    return (
      <Box>
        <Alert status="info" mb={4} display="none">
          <AlertIcon />
          <AlertDescription>Edit mode active - form should be visible</AlertDescription>
        </Alert>
        {renderFormContent()}
      </Box>
    );
  }

  // Create mode: render button and modal
  return (
    <>
      <Button 
        onClick={onOpen}
        colorScheme="blue"
        size={{ base: "md", md: "lg" }}
        px={{ base: 4, md: 10 }}
        py={{ base: 3, md: 5 }}
        minW={{ base: "100%", md: "220px" }}
        w={{ base: "100%", md: "auto" }}
        fontSize={{ base: "0.95em", md: "md" }}
        whiteSpace="nowrap"
        _hover={{
          transform: "translateY(-1px)",
          shadow: "lg"
        }}
        transition="all 0.2s"
      >
        Create Coordination Set
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="'SUSE Mono', monospace" fontWeight="600">
            Create Coordination Set
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {renderFormContent()}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
