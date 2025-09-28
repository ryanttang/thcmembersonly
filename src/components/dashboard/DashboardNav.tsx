"use client";

import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  useBreakpointValue,
  Container,
  IconButton,
  Tooltip,
  Flex,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import { ViewIcon, HamburgerIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  category?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "🏠", category: "main" },
  { label: "Events", href: "/dashboard/events", icon: "📅", category: "content" },
  { label: "Archive", href: "/dashboard/events/archive", icon: "📦", category: "content" },
  { label: "Videos", href: "/dashboard/videos", icon: "🎥", category: "content" },
  { label: "Gallery", href: "/dashboard/gallery", icon: "🖼️", category: "content" },
  { label: "Coordination", href: "/dashboard/coordination", icon: "📋", category: "management" },
  { label: "Contact", href: "/dashboard/contact", icon: "📧", category: "management" },
  { label: "Subscribers", href: "/dashboard/subscribers", icon: "📬", category: "management" },
  { label: "Users", href: "/dashboard/users", icon: "👥", category: "management" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const btnRef = useRef<HTMLButtonElement>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const [buttonSize, setButtonSize] = useState<"sm" | "md">("md");
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024); // lg breakpoint
      setButtonSize(width < 768 ? "sm" : "md"); // md breakpoint
    };
    
    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  const groupedItems = navItems.reduce((acc, item) => {
    const category = item.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const NavButton = ({ item, isCompact = false }: { item: NavItem; isCompact?: boolean }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    
    return (
      <Button
        as={NextLink}
        href={item.href}
        size={isCompact ? "sm" : buttonSize}
        variant={isActive ? "solid" : "ghost"}
        colorScheme={isActive ? "blue" : "gray"}
        leftIcon={<Text fontSize="sm">{item.icon}</Text>}
        px={isCompact ? 3 : 4}
        py={2}
        fontWeight="500"
        fontSize={isCompact ? "sm" : "md"}
        minW={isCompact ? "auto" : "120px"}
        _hover={{
          bg: isActive ? "blue.600" : "gray.100",
          transform: "translateY(-1px)",
        }}
        _active={{
          transform: "translateY(0px)",
        }}
        transition="all 0.2s ease"
      >
        {item.label}
      </Button>
    );
  };

  if (isMobile) {
    return (
      <>
        <Box
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          w="100%"
          py={4}
          position="sticky"
          top={0}
          zIndex={10}
          shadow="sm"
        >
          <Container maxW="7xl" px={4}>
            <Flex justify="space-between" align="center">
              <Text 
                fontSize="xl" 
                fontWeight="700" 
                color="blue.600"
                letterSpacing="tight"
              >
                Admin Panel
              </Text>
              
              <HStack spacing={2}>
                <Tooltip label="Preview Homepage" placement="bottom">
                  <IconButton
                    as={NextLink}
                    href="/"
                    aria-label="Preview homepage"
                    icon={<ViewIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                  />
                </Tooltip>
                <IconButton
                  ref={btnRef}
                  aria-label="Open menu"
                  icon={<HamburgerIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(true)}
                />
              </HStack>
            </Flex>
          </Container>
        </Box>

        <Drawer
          isOpen={isOpen}
          placement="right"
          onClose={() => setIsOpen(false)}
          finalFocusRef={btnRef}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">
              <Text color="blue.600" fontWeight="600">Admin Panel</Text>
            </DrawerHeader>
            <DrawerBody py={6}>
              <VStack spacing={6} align="stretch">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <Box key={category}>
                    <Text 
                      fontSize="xs" 
                      fontWeight="600" 
                      color="gray.500" 
                      textTransform="uppercase" 
                      letterSpacing="wide"
                      mb={3}
                    >
                      {category}
                    </Text>
                    <VStack spacing={2} align="stretch">
                      {items.map((item) => (
                        <NavButton key={item.href} item={item} isCompact />
                      ))}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Box
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      w="100%"
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
      shadow="sm"
    >
      <Container maxW="7xl" px={{ base: 4, md: 6, lg: 8 }}>
        <Flex justify="space-between" align="center" gap={6}>
          {/* Logo/Title */}
          <Text 
            fontSize="xl" 
            fontWeight="700" 
            color="blue.600"
            letterSpacing="tight"
            flexShrink={0}
          >
            Admin Panel
          </Text>

          {/* Navigation Groups */}
          <Flex align="center" gap={6} flex={1} justify="center">
            {/* Main */}
            <HStack spacing={2}>
              {groupedItems.main?.map((item) => (
                <NavButton key={item.href} item={item} />
              ))}
            </HStack>

            <Divider orientation="vertical" height="24px" />

            {/* Content */}
            <HStack spacing={2}>
              {groupedItems.content?.map((item) => (
                <NavButton key={item.href} item={item} />
              ))}
            </HStack>

            <Divider orientation="vertical" height="24px" />

            {/* Management */}
            <HStack spacing={2}>
              {groupedItems.management?.map((item) => (
                <NavButton key={item.href} item={item} />
              ))}
            </HStack>
          </Flex>

          {/* Preview Button */}
          <Tooltip label="Preview Homepage" placement="bottom">
            <IconButton
              as={NextLink}
              href="/"
              aria-label="Preview homepage from user view"
              icon={<ViewIcon />}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              _hover={{
                bg: "blue.50",
                transform: "translateY(-1px)",
              }}
              _active={{
                transform: "translateY(0px)",
              }}
              transition="all 0.2s ease"
              flexShrink={0}
            />
          </Tooltip>
        </Flex>
      </Container>
    </Box>
  );
}
