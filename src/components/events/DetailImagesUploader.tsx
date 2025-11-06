"use client";
import { useState, useRef, useEffect } from "react";
import { 
  Box, 
  Button, 
  Input, 
  Text, 
  VStack, 
  useToast, 
  HStack, 
  IconButton,
  SimpleGrid,
  Badge,
  Image as ChakraImage
} from "@chakra-ui/react";

export default function DetailImagesUploader({ 
  eventId, 
  onImagesUploaded,
  initialImages = []
}: { 
  eventId?: string; 
  onImagesUploaded: (images: Array<{id: string, variants: any, fileName: string}>) => void;
  initialImages?: Array<{id: string, variants: any, fileName: string}>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string, variants: any, fileName: string}>>(initialImages);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  // Update parent when images change
  useEffect(() => {
    onImagesUploaded(uploadedImages);
  }, [uploadedImages, onImagesUploaded]);

  // Sync uploadedImages when initialImages prop changes (only on mount or when new images are added externally)
  useEffect(() => {
    if (isInitialMount.current) {
      // On initial mount, sync with initialImages
      setUploadedImages(initialImages);
      isInitialMount.current = false;
    } else {
      // After initial mount, only sync if initialImages has new images that aren't in uploadedImages
      const currentIds = new Set(uploadedImages.map(img => img.id));
      const initialIds = new Set(initialImages.map(img => img.id));
      const hasNewImages = initialImages.some(img => !currentIds.has(img.id));
      
      if (hasNewImages) {
        // Merge current images with new images from initialImages
        const merged = [...uploadedImages];
        initialImages.forEach(img => {
          if (!currentIds.has(img.id)) {
            merged.push(img);
          }
        });
        setUploadedImages(merged);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages]);

  const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB limit

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (file.size > FILE_SIZE_LIMIT) {
        toast({
          title: `File too large: ${file.name}`,
          description: `Please reduce file size to under ${formatFileSize(FILE_SIZE_LIMIT)}. Current size: ${formatFileSize(file.size)}`,
          status: "warning",
          duration: 5000,
        });
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Add files to state for display
    setFiles(prev => [...prev, ...validFiles]);
    
    // Automatically start upload for each valid file
    setBusy(true);
    
    try {
      const results = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        try {
          const result = await uploadFile(file);
          const newImage = { 
            id: result.imageId, 
            variants: result.variants, 
            fileName: file.name 
          };
          setUploadedImages(prev => [...prev, newImage]);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          results.push(result);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: `Failed to upload ${file.name}`,
            description: error instanceof Error ? error.message : "Unknown error",
            status: "error",
            duration: 5000,
          });
        }
      }
      
      if (results.length > 0) {
        toast({
          title: "Detail images uploaded successfully",
          description: `Successfully uploaded ${results.length} image${results.length !== 1 ? 's' : ''} for event details`,
          status: "success",
          duration: 3000,
        });
        // Clear files after successful upload
        setFiles([]);
        setUploadProgress({});
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setBusy(false);
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    // Filter for image files only and check size limits
    const imageFiles = selectedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > FILE_SIZE_LIMIT) {
        toast({
          title: `File too large: ${file.name}`,
          description: `Please reduce file size to under ${formatFileSize(FILE_SIZE_LIMIT)}. Current size: ${formatFileSize(file.size)}`,
          status: "warning",
          duration: 5000,
        });
        return false;
      }
      return true;
    });
    
    if (imageFiles.length === 0) return;
    
    // Add files to state for display
    setFiles(prev => [...prev, ...imageFiles]);
    
    // Automatically start upload for each valid file
    setBusy(true);
    
    try {
      const results = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        try {
          const result = await uploadFile(file);
          const newImage = { 
            id: result.imageId, 
            variants: result.variants, 
            fileName: file.name 
          };
          setUploadedImages(prev => [...prev, newImage]);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          results.push(result);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: `Failed to upload ${file.name}`,
            description: error instanceof Error ? error.message : "Unknown error",
            status: "error",
            duration: 5000,
          });
        }
      }
      
      if (results.length > 0) {
        toast({
          title: "Detail images uploaded successfully",
          description: `Successfully uploaded ${results.length} image${results.length !== 1 ? 's' : ''} for event details`,
          status: "success",
          duration: 3000,
        });
        // Clear files after successful upload
        setFiles([]);
        setUploadProgress({});
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setBusy(false);
      // Clear the input so the same folder can be selected again
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setUploadProgress({});
  };

  const uploadFile = async (file: File): Promise<{imageId: string, variants: any}> => {
    const fd = new FormData();
    fd.append("file", file);
    if (eventId) fd.append("eventId", eventId);
    
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    
    if (!res.ok) {
      let errorMessage = "Upload failed";
      
      if (res.status === 413) {
        errorMessage = `File "${file.name}" is too large (${formatFileSize(file.size)}). Please reduce the file size to under ${formatFileSize(FILE_SIZE_LIMIT)}.`;
      } else if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const retrySeconds = retryAfter ? parseInt(retryAfter) : 900;
        const retryMinutes = Math.ceil(retrySeconds / 60);
        errorMessage = `Upload limit exceeded. Please wait ${retryMinutes} minute${retryMinutes !== 1 ? 's' : ''} before uploading again.`;
      } else {
        try {
          const json = await res.json();
          errorMessage = json.error || json.details || "Upload failed";
        } catch (e) {
          errorMessage = res.statusText || "Upload failed";
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const json = await res.json();
    return { imageId: json.imageId, variants: json.variants };
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const getImageUrl = (image: any) => {
    // Use direct S3 URLs instead of going through our API
    if (image.variants?.thumb?.webpUrl) {
      return image.variants.thumb.webpUrl;
    }
    if (image.variants?.thumb?.jpgUrl) {
      return image.variants.thumb.jpgUrl;
    }
    if (image.variants?.card?.webpUrl) {
      return image.variants.card.webpUrl;
    }
    if (image.variants?.card?.jpgUrl) {
      return image.variants.card.jpgUrl;
    }
    if (image.variants?.hero?.webpUrl) {
      return image.variants.hero.webpUrl;
    }
    if (image.variants?.hero?.jpgUrl) {
      return image.variants.hero.jpgUrl;
    }
    // Fallback to our API route if no direct URLs
    if (image.variants?.thumb?.webpKey) {
      return `/api/images/${encodeURIComponent(image.variants.thumb.webpKey)}`;
    }
    if (image.variants?.thumb?.jpgKey) {
      return `/api/images/${encodeURIComponent(image.variants.thumb.jpgKey)}`;
    }
    return "/placeholder-image.svg";
  };

  const getTotalSize = () => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* File Selection */}
      <VStack spacing={3} align="stretch">
        <HStack spacing={3}>
          <Input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            multiple
            onChange={handleFileSelect}
            p={1}
            flex={1}
            disabled={busy}
          />
          <Input 
            ref={folderInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleFolderSelect}
            p={1}
            flex={1}
            placeholder="Select folder"
            disabled={busy}
            // @ts-ignore - webkitdirectory is a valid HTML attribute for folder selection
            webkitdirectory=""
          />
        </HStack>
        
        {busy && (
          <HStack spacing={3}>
            <Text fontSize="sm" color="blue.600">
              Uploading detail images...
            </Text>
            <Button 
              onClick={clearAllFiles} 
              variant="outline" 
              size="sm"
              disabled={busy}
            >
              Cancel
            </Button>
          </HStack>
        )}
      </VStack>
      
      {/* File Info */}
      {files.length > 0 && (
        <Box p={3} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Selected Files ({files.length}) - Total: {formatFileSize(getTotalSize())}
          </Text>
          <VStack spacing={2} align="stretch" maxH="32" overflowY="auto">
            {files.map((file, index) => (
              <HStack key={`${file.name}-${index}`} p={2} bg="white" borderRadius="md" shadow="sm">
                <Text fontSize="sm" flex={1} noOfLines={1}>
                  {file.name}
                </Text>
                <Badge colorScheme="blue" variant="subtle">
                  {formatFileSize(file.size)}
                </Badge>
                <IconButton
                  aria-label="Remove file"
                  icon={<span>✕</span>}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => removeFile(index)}
                />
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
      
      {files.length === 0 && !busy && (
        <VStack spacing={2} align="stretch">
          <Text color="gray.500" fontSize="sm">
            Upload additional images for the event details page (JPG, PNG, WebP, HEIC supported)
          </Text>
          <Text color="gray.400" fontSize="xs">
            Maximum file size: {formatFileSize(FILE_SIZE_LIMIT)} per file
          </Text>
        </VStack>
      )}

      {/* Uploaded Detail Images */}
      {uploadedImages.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Detail Images ({uploadedImages.length}):
          </Text>
          <SimpleGrid columns={3} spacing={3}>
            {uploadedImages.map((img) => (
              <Box key={img.id} p={2} bg="gray.50" borderRadius="md" position="relative">
                <Box w="full" h="24" borderRadius="md" overflow="hidden" mb={2} bg="gray.200">
                  <ChakraImage 
                    src={getImageUrl(img)} 
                    alt={img.fileName || "Detail image"}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    fallbackSrc="/placeholder-image.svg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-image.svg";
                    }}
                  />
                </Box>
                <Text fontSize="xs" color="gray.600" noOfLines={1} mb={1}>
                  {img.fileName || "Image"}
                </Text>
                <IconButton
                  aria-label="Remove detail image"
                  icon={<span>✕</span>}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  position="absolute"
                  top={1}
                  right={1}
                  onClick={() => removeImage(img.id)}
                />
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </VStack>
  );
}
