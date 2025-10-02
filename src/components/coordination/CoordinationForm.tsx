"use client";

import { useState } from "react";
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

export default function CoordinationForm({ 
  events, 
  coordination, 
  onSuccess 
}: CoordinationFormProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [createdCoordinationId, setCreatedCoordinationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    eventId: coordination?.eventId || "",
    title: coordination?.title || "",
    description: coordination?.description || "",
    notes: coordination?.notes || "",
    specialMessage: coordination?.specialMessage || "",
    pointOfContacts: coordination?.pointOfContacts || [],
  });
  const toast = useToast();

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
          contact.name.trim() || contact.number.trim() || contact.email.trim()
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
        // For editing, close modal and refresh
        onClose();
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

  return (
    <>
      <Button 
        onClick={onOpen}
        colorScheme="blue"
        size="lg"
        _hover={{
          transform: "translateY(-1px)",
          shadow: "lg"
        }}
        transition="all 0.2s"
      >
        {coordination ? "Edit Coordination" : "Create Coordination Set"}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="'SUSE Mono', monospace" fontWeight="600">
            {coordination ? "Edit Coordination Set" : "Create Coordination Set"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
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
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
