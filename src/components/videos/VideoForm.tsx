"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  HStack,
  Text,
  Box,
  useToast,
  Spinner,
  Progress,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import type { RecentEventVideo } from "@/types";

// Upload configuration constants
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // MOV
  "video/x-msvideo", // AVI
  "video/x-matroska", // MKV
];

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

interface VideoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  video?: RecentEventVideo | null;
}

export default function VideoForm({ isOpen, onClose, onSubmit, video }: VideoFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    videoUrl: "",
    videoType: "UPLOADED" as "UPLOADED" | "EXTERNAL",
    thumbnailUrl: "",
    duration: "",
    sortOrder: 0,
    isPublished: true,
    autoplay: true,
    loop: true,
    muted: true,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        caption: video.caption || "",
        videoUrl: video.videoUrl,
        videoType: video.videoType,
        thumbnailUrl: video.thumbnailUrl || "",
        duration: video.duration?.toString() || "",
        sortOrder: video.sortOrder,
        isPublished: video.isPublished,
        autoplay: video.autoplay,
        loop: video.loop,
        muted: video.muted,
      });
    } else {
      setFormData({
        title: "",
        caption: "",
        videoUrl: "",
        videoType: "UPLOADED",
        thumbnailUrl: "",
        duration: "",
        sortOrder: 0,
        isPublished: true,
        autoplay: true,
        loop: true,
        muted: true,
      });
    }
  }, [video, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Client-side validation
  const validateFile = (file: File, type: "video" | "thumbnail"): string | null => {
    const maxSize = type === "video" ? MAX_VIDEO_SIZE : MAX_THUMBNAIL_SIZE;
    const allowedTypes = type === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    const maxSizeMB = type === "video" ? "200MB" : "10MB";

    // Check file size
    if (file.size > maxSize) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${maxSizeMB}`;
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return `File type "${file.type}" is not supported. Allowed types: ${allowedTypes.join(", ")}`;
    }

    return null;
  };

  const handleFileUpload = async (file: File, type: "video" | "thumbnail") => {
    const setUploadingState = type === "video" ? setUploading : setUploadingThumbnail;
    const setProgress = type === "video" ? setUploadProgress : setThumbnailProgress;
    const setError = type === "video" ? setUploadError : setThumbnailError;
    
    // Clear previous errors
    setError(null);
    setProgress(0);

    // Client-side validation
    const validationError = validateFile(file, type);
    if (validationError) {
      setError(validationError);
      toast({
        title: "Validation Error",
        description: validationError,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setUploadingState(true);
      setProgress(10); // Start progress

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", type);

      setProgress(30);

      // Upload to new endpoint
      const response = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
        
        let errorMessage = errorData.message || errorData.error || "Upload failed";
        
        // Handle specific error cases
        if (response.status === 413) {
          errorMessage = `File too large: ${errorData.message || "Maximum size exceeded"}`;
        } else if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const retryMinutes = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 15;
          errorMessage = `Rate limit exceeded. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}.`;
        } else if (response.status === 400) {
          errorMessage = errorData.message || "Invalid file type or format";
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = "You don't have permission to upload files";
        }

        setError(errorMessage);
        toast({
          title: "Upload Failed",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setProgress(90);

      const result = await response.json();
      
      if (type === "video") {
        handleInputChange("videoUrl", result.url);
        handleInputChange("videoType", "UPLOADED");
      } else {
        handleInputChange("thumbnailUrl", result.url);
      }

      setProgress(100);

      toast({
        title: "Success",
        description: `${type === "video" ? "Video" : "Thumbnail"} uploaded successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset progress after a short delay
      setTimeout(() => {
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setProgress(0);
    } finally {
      setUploadingState(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      duration: formData.duration && formData.duration.trim() !== "" 
        ? parseInt(formData.duration) 
        : undefined,
      thumbnailUrl: formData.thumbnailUrl && formData.thumbnailUrl.trim() !== "" 
        ? formData.thumbnailUrl 
        : undefined,
      caption: formData.caption && formData.caption.trim() !== "" 
        ? formData.caption 
        : undefined,
    };
    
    console.log("Form submit data:", submitData);
    onSubmit(submitData);
  };

  const isExternalVideo = formData.videoType === "EXTERNAL";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {video ? "Edit Video" : "Add New Video"}
        </ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter video title"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Caption</FormLabel>
                <Textarea
                  value={formData.caption}
                  onChange={(e) => handleInputChange("caption", e.target.value)}
                  placeholder="Enter video caption (optional)"
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Video Type</FormLabel>
                <Select
                  value={formData.videoType}
                  onChange={(e) => handleInputChange("videoType", e.target.value)}
                >
                  <option value="UPLOADED">Upload Video File</option>
                  <option value="EXTERNAL">External Video Link</option>
                </Select>
              </FormControl>

              {isExternalVideo ? (
                <FormControl isRequired>
                  <FormLabel>Video URL</FormLabel>
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                    type="url"
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Enter a direct link to the video file (MP4, WebM, etc.) or YouTube URL
                  </Text>
                </FormControl>
              ) : (
                <FormControl isRequired>
                  <FormLabel>Video File</FormLabel>
                  <Input
                    type="file"
                    accept={ALLOWED_VIDEO_TYPES.join(",")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, "video");
                      }
                    }}
                    disabled={uploading}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Maximum file size: 200MB. Supported formats: MP4, WebM, MOV, AVI, MKV
                  </Text>
                  {uploadError && (
                    <Alert status="error" mt={2} borderRadius="md">
                      <AlertIcon />
                      {uploadError}
                    </Alert>
                  )}
                  {uploading && (
                    <Box mt={2}>
                      <HStack mb={2}>
                        <Spinner size="sm" />
                        <Text fontSize="sm" color="gray.500">
                          Uploading video... {uploadProgress > 0 && `${uploadProgress}%`}
                        </Text>
                      </HStack>
                      <Progress value={uploadProgress} colorScheme="blue" size="sm" borderRadius="md" />
                    </Box>
                  )}
                  {formData.videoUrl && !uploading && (
                    <Text fontSize="sm" color="green.500" mt={2}>
                      ✓ Video uploaded: {formData.videoUrl.split('/').pop()}
                    </Text>
                  )}
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Thumbnail Image (Optional)</FormLabel>
                <Input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, "thumbnail");
                    }
                  }}
                  disabled={uploadingThumbnail}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Maximum file size: 10MB. Supported formats: JPEG, PNG, WebP, GIF
                </Text>
                {thumbnailError && (
                  <Alert status="error" mt={2} borderRadius="md">
                    <AlertIcon />
                    {thumbnailError}
                  </Alert>
                )}
                {uploadingThumbnail && (
                  <Box mt={2}>
                    <HStack mb={2}>
                      <Spinner size="sm" />
                      <Text fontSize="sm" color="gray.500">
                        Uploading thumbnail... {thumbnailProgress > 0 && `${thumbnailProgress}%`}
                      </Text>
                    </HStack>
                    <Progress value={thumbnailProgress} colorScheme="blue" size="sm" borderRadius="md" />
                  </Box>
                )}
                {formData.thumbnailUrl && !uploadingThumbnail && (
                  <Text fontSize="sm" color="green.500" mt={2}>
                    ✓ Thumbnail uploaded: {formData.thumbnailUrl.split('/').pop()}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Duration (seconds)</FormLabel>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="120"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Optional: Duration in seconds for display purposes
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Sort Order</FormLabel>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange("sortOrder", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Lower numbers appear first in the slider
                </Text>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={formData.isPublished}
                    onChange={(e) => handleInputChange("isPublished", e.target.checked)}
                  />
                  <Text>Published (visible on homepage)</Text>
                </HStack>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={formData.autoplay}
                    onChange={(e) => handleInputChange("autoplay", e.target.checked)}
                  />
                  <Text>Autoplay (start playing automatically)</Text>
                </HStack>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={formData.loop}
                    onChange={(e) => handleInputChange("loop", e.target.checked)}
                  />
                  <Text>Loop (repeat video continuously)</Text>
                </HStack>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={formData.muted}
                    onChange={(e) => handleInputChange("muted", e.target.checked)}
                  />
                  <Text>Muted (start without sound)</Text>
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
              color="white"
              shadow="md"
              fontWeight="600"
              _hover={{
                bg: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                transform: "translateY(-1px)",
                shadow: "lg"
              }}
              transition="all 0.3s ease-in-out"
            >
              {video ? "Update Video" : "Create Video"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
