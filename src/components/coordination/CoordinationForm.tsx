"use client";

// VERSION: 2024-12-19-01 - Force cache bust
// This constant ensures the component updates when deployed
const COMPONENT_VERSION = "2024-12-19-01";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Badge,
  IconButton,
  Link,
  Spinner,
  Center,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Image,
} from "@chakra-ui/react";
import DocumentUploader from "./DocumentUploader";
import { CoordinationDocumentType } from "@prisma/client";
import DOMPurify from "dompurify";

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

// Google Maps helper functions
const getGoogleMapsThumbnailUrl = (address: string): string | null => {
  if (!address || address.trim() === "") return null;
  const encodedAddress = encodeURIComponent(address.trim());
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (apiKey) {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=600x300&markers=color:red%7C${encodedAddress}&key=${apiKey}`;
    return url;
  }
  
  return null;
};

const getGoogleMapsLink = (address: string): string => {
  const encodedAddress = encodeURIComponent(address.trim());
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
};

// DOMPurify configuration - allow only safe HTML tags
const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'span', 'ul', 'li'],
  ALLOWED_ATTR: ['style'],
};

// Sanitize HTML helper function
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html; // Server-side: return as-is
  return DOMPurify.sanitize(html, sanitizeConfig);
};

// Notes formatting toolbar component
interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

function NotesField({ value, onChange, placeholder = "Additional notes for team members", rows = 7 }: NotesFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    // Sanitize before updating
    const sanitized = sanitizeHtml(newText);
    onChange(sanitized);

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    }, 0);
  };

  const applyFormat = (format: string) => {
    switch (format) {
      case 'bold':
        insertText('<b>', '</b>');
        break;
      case 'italic':
        insertText('<i>', '</i>');
        break;
      case 'underline':
        insertText('<u>', '</u>');
        break;
      case 'small':
        insertText('<span style="font-size: small;">', '</span>');
        break;
      case 'medium':
        insertText('<span style="font-size: medium;">', '</span>');
        break;
      case 'large':
        insertText('<span style="font-size: large;">', '</span>');
        break;
      case 'bullet':
        // For bullet points, wrap selected text in <li> tags
        // If no selection, insert a bullet point
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const beforeText = value.substring(0, start);
        const afterText = value.substring(end);
        
        let newText: string;
        if (selectedText.trim()) {
          // Wrap selected text in <li> tags
          newText = beforeText + '<li>' + selectedText + '</li>' + afterText;
        } else {
          // Insert a new bullet point
          // Check if we need to wrap in <ul> tags (simplified logic)
          const lastUlIndex = beforeText.lastIndexOf('<ul>');
          const lastUlCloseIndex = beforeText.lastIndexOf('</ul>');
          const needsUl = lastUlIndex === -1 || lastUlCloseIndex > lastUlIndex;
          
          if (needsUl) {
            newText = beforeText + '<ul><li></li></ul>' + afterText;
          } else {
            newText = beforeText + '<li></li>' + afterText;
          }
        }
        
        const sanitized = sanitizeHtml(newText);
        onChange(sanitized);
        
        // Restore cursor position
        setTimeout(() => {
          if (textarea) {
            const newCursorPos = start + (selectedText ? '<li>'.length + selectedText.length + '</li>'.length : '<li></li>'.length);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }
        }, 0);
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Sanitize on change as well
    const sanitized = sanitizeHtml(e.target.value);
    onChange(sanitized);
  };

  return (
    <VStack spacing={2} align="stretch">
      {/* Formatting Toolbar */}
      <HStack spacing={2} flexWrap="wrap" p={2} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text fontSize="xs" color="gray.600" fontWeight="medium" mr={2}>
          Format:
        </Text>
        <Button
          size="xs"
          variant="outline"
          onClick={() => applyFormat('bold')}
          fontWeight="bold"
          fontSize="xs"
        >
          B
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => applyFormat('italic')}
          fontStyle="italic"
          fontSize="xs"
        >
          I
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => applyFormat('underline')}
          textDecoration="underline"
          fontSize="xs"
        >
          U
        </Button>
        <Box mx={1} h="16px" borderLeft="1px solid" borderColor="gray.300" />
        <Button
          size="xs"
          variant="outline"
          onClick={() => applyFormat('bullet')}
          fontSize="xs"
        >
          •
        </Button>
        <Box mx={1} h="16px" borderLeft="1px solid" borderColor="gray.300" />
        <Menu>
          <MenuButton as={Button} size="xs" variant="outline" fontSize="xs">
            Size
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => applyFormat('small')}>Small</MenuItem>
            <MenuItem onClick={() => applyFormat('medium')}>Medium</MenuItem>
            <MenuItem onClick={() => applyFormat('large')}>Large</MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        fontSize="0.95em"
      />
    </VStack>
  );
}

export default function CoordinationForm({ 
  events, 
  coordination, 
  onSuccess 
}: CoordinationFormProps) {
  // VERSION CHECK: Log to verify new code is running
  console.log('🔵 CoordinationForm v' + COMPONENT_VERSION, {
    hasCoordination: !!coordination,
    coordinationId: coordination?.id,
    coordinationType: typeof coordination,
  });
  
  // CRITICAL CHECK: If coordination exists, MUST render form, not button
  if (coordination?.id) {
    console.log('✅ EDIT MODE DETECTED - rendering form directly');
  } else {
    console.log('❌ CREATE MODE - coordination missing or no id');
  }

  // Check if we're in edit mode - must be done before hooks but hooks must always run
  const isEditMode = !!(coordination && coordination.id);
  
  // All hooks must be called before conditional returns
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [createdCoordinationId, setCreatedCoordinationId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  const [formData, setFormData] = useState({
    eventId: coordination?.eventId || "",
    title: coordination?.title || "",
    description: coordination?.description || "",
    notes: coordination?.notes || "",
    specialMessage: coordination?.specialMessage || "",
    location: coordination?.location || "",
    pointOfContacts: parsePointOfContacts(coordination?.pointOfContacts),
  });
  const toast = useToast();

  // Fetch documents when in edit mode
  const fetchDocuments = useCallback(async (coordinationId: string) => {
    setIsLoadingDocuments(true);
    try {
      const response = await fetch(`/api/coordination/${coordinationId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

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
        location: coordination.location || "",
        pointOfContacts: parsedContacts,
      });
      // Fetch documents for edit mode
      fetchDocuments(coordination.id);
    } else if (!coordination) {
      // Reset form when coordination is cleared
      setFormData({
        eventId: "",
        title: "",
        description: "",
        notes: "",
        specialMessage: "",
        location: "",
        pointOfContacts: [],
      });
      setDocuments([]);
    }
  }, [coordination, isEditMode, fetchDocuments]);

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
          location: "",
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
    // Refresh documents list after upload
    if (coordination?.id) {
      fetchDocuments(coordination.id);
    }
    // For create mode, close modal
    if (createdCoordinationId) {
      onClose();
      if (onSuccess) onSuccess();
      setCreatedCoordinationId(null);
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    if (!coordination?.id) return;
    
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(`/api/coordination/${coordination.id}/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast({
        title: "Document deleted",
        status: "success",
        duration: 3000,
      });

      // Refresh documents list
      fetchDocuments(coordination.id);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleSkipDocumentUpload = () => {
    // Close modal and refresh page without uploading documents
    onClose();
    if (onSuccess) onSuccess();
    setCreatedCoordinationId(null);
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

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MAP: "Map",
      RUN_OF_SHOW: "Run of Show",
      ITINERARY: "Itinerary",
      SCHEDULE: "Schedule",
      DIAGRAM: "Diagram",
      RIDER: "Rider",
      NOTES: "Notes",
      OTHER: "Other",
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render documents list component
  const renderDocumentsList = () => (
    <VStack spacing={4} align="stretch">
      {isLoadingDocuments ? (
        <Center py={8}>
          <Spinner size="lg" />
        </Center>
      ) : documents.length === 0 ? (
        <Box p={6} textAlign="center" bg="gray.50" borderRadius="md">
          <Text color="gray.500">No documents uploaded yet</Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {documents.map((doc: any) => (
            <Box
              key={doc.id}
              p={4}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              _hover={{ borderColor: "gray.300", shadow: "sm" }}
              transition="all 0.2s"
            >
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between" align="flex-start">
                  <HStack spacing={3} flex={1} minW={0}>
                    <Text fontSize="xl">{getDocumentTypeIcon(doc.type)}</Text>
                    <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">
                          {doc.title}
                        </Text>
                        <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                          {getDocumentTypeLabel(doc.type)}
                        </Badge>
                      </HStack>
                      {doc.description && (
                        <Text fontSize="xs" color="gray.600" noOfLines={1}>
                          {doc.description}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.500">
                        {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack spacing={2}>
                    <Link href={doc.fileUrl} isExternal>
                      <IconButton
                        aria-label="Download document"
                        icon={<span>⬇️</span>}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                      />
                    </Link>
                    <IconButton
                      aria-label="Delete document"
                      icon={<span>🗑️</span>}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDocumentDelete(doc.id)}
                    />
                  </HStack>
                </HStack>
              </VStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );

  // Render form content (used when embedded in another modal like CoordinationCard)
  const renderFormContent = () => {
    // In edit mode, show tabs with Settings, Documents, and Upload
    if (coordination?.id) {
      return (
        <Tabs>
          <TabList>
            <Tab>Settings</Tab>
            <Tab>Documents ({documents.length})</Tab>
            <Tab>Upload</Tab>
          </TabList>
          <TabPanels>
            {/* Settings Tab */}
            <TabPanel px={0}>
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
                      fontSize="0.95em"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Special Messages & Important Notes</FormLabel>
                    <Textarea
                      value={formData.specialMessage}
                      onChange={(e) => handleInputChange("specialMessage", e.target.value)}
                      placeholder="Enter special messages and important notes..."
                      rows={6}
                      fontSize="0.95em"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Location</FormLabel>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Enter address or location..."
                      fontSize="0.95em"
                    />
                    {formData.location && formData.location.trim() && (
                      <Box mt={3}>
                        {(() => {
                          const mapThumbnailUrl = getGoogleMapsThumbnailUrl(formData.location);
                          const mapsLink = getGoogleMapsLink(formData.location);
                          return (
                            <Box
                              as={Link}
                              href={mapsLink}
                              isExternal
                              w="100%"
                              borderRadius="md"
                              overflow="hidden"
                              border="1px solid"
                              borderColor="gray.200"
                              _hover={{
                                borderColor: "blue.400",
                                shadow: "md",
                              }}
                              transition="all 0.2s"
                              display="block"
                            >
                              {mapThumbnailUrl ? (
                                <Image
                                  src={mapThumbnailUrl}
                                  alt={`Map preview of ${formData.location}`}
                                  w="100%"
                                  h="200px"
                                  objectFit="cover"
                                  fallbackSrc="/placeholder-image.svg"
                                />
                              ) : (
                                <Box
                                  bg="gray.100"
                                  h="200px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  flexDirection="column"
                                  gap={2}
                                >
                                  <Text fontSize="2xl">🗺️</Text>
                                  <Text color="gray.600" fontSize="sm" fontWeight="medium">
                                    Click to view on Google Maps
                                  </Text>
                                  <Text color="gray.500" fontSize="xs">
                                    {formData.location}
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          );
                        })()}
                      </Box>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <NotesField
                      value={formData.notes}
                      onChange={(value) => handleInputChange("notes", value)}
                      placeholder="Additional notes for team members"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Run of Show</FormLabel>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter the run of show details..."
                      rows={4}
                      fontSize="0.95em"
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
                              fontSize="0.95em"
                            />
                            <Input
                              value={contact.number}
                              onChange={(e) => updateContact(index, "number", e.target.value)}
                              placeholder="Phone Number"
                              fontSize="0.95em"
                            />
                            <Input
                              value={contact.email}
                              onChange={(e) => updateContact(index, "email", e.target.value)}
                              placeholder="Email Address"
                              type="email"
                              fontSize="0.95em"
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
                    loadingText="Updating..."
                    w="full"
                    size="lg"
                  >
                    Update Coordination
                  </Button>
                </VStack>
              </form>
            </TabPanel>

            {/* Documents Tab */}
            <TabPanel px={0}>
              {renderDocumentsList()}
            </TabPanel>

            {/* Upload Tab */}
            <TabPanel px={0}>
              <DocumentUploader 
                coordinationId={coordination.id}
                onSuccess={handleDocumentUploadSuccess}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      );
    }

    // Create mode - show form or document upload after creation
    return (
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
                      fontSize="0.95em"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Special Messages & Important Notes</FormLabel>
                    <Textarea
                      value={formData.specialMessage}
                      onChange={(e) => handleInputChange("specialMessage", e.target.value)}
                      placeholder="Enter special messages and important notes..."
                      rows={6}
                      fontSize="0.95em"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Location</FormLabel>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Enter address or location..."
                      fontSize="0.95em"
                    />
                    {formData.location && formData.location.trim() && (
                      <Box mt={3}>
                        {(() => {
                          const mapThumbnailUrl = getGoogleMapsThumbnailUrl(formData.location);
                          const mapsLink = getGoogleMapsLink(formData.location);
                          return (
                            <Box
                              as={Link}
                              href={mapsLink}
                              isExternal
                              w="100%"
                              borderRadius="md"
                              overflow="hidden"
                              border="1px solid"
                              borderColor="gray.200"
                              _hover={{
                                borderColor: "blue.400",
                                shadow: "md",
                              }}
                              transition="all 0.2s"
                              display="block"
                            >
                              {mapThumbnailUrl ? (
                                <Image
                                  src={mapThumbnailUrl}
                                  alt={`Map preview of ${formData.location}`}
                                  w="100%"
                                  h="200px"
                                  objectFit="cover"
                                  fallbackSrc="/placeholder-image.svg"
                                />
                              ) : (
                                <Box
                                  bg="gray.100"
                                  h="200px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  flexDirection="column"
                                  gap={2}
                                >
                                  <Text fontSize="2xl">🗺️</Text>
                                  <Text color="gray.600" fontSize="sm" fontWeight="medium">
                                    Click to view on Google Maps
                                  </Text>
                                  <Text color="gray.500" fontSize="xs">
                                    {formData.location}
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          );
                        })()}
                      </Box>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <NotesField
                      value={formData.notes}
                      onChange={(value) => handleInputChange("notes", value)}
                      placeholder="Additional notes for team members"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Run of Show</FormLabel>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter the run of show details..."
                      rows={4}
                      fontSize="0.95em"
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
                              fontSize="0.95em"
                            />
                            <Input
                              value={contact.number}
                              onChange={(e) => updateContact(index, "number", e.target.value)}
                              placeholder="Phone Number"
                              fontSize="0.95em"
                            />
                            <Input
                              value={contact.email}
                              onChange={(e) => updateContact(index, "email", e.target.value)}
                              placeholder="Email Address"
                              type="email"
                              fontSize="0.95em"
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
  };

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
