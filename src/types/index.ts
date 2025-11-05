export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'ORGANIZER' | 'VIEWER';
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  ticketUrl?: string | null;
  buttonType: 'RSVP' | 'BUY_TICKETS';
  locationName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startAt: Date;
  endAt?: Date | null;
  timezone: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  heroImageId?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  heroImage?: Image | null;
  images?: Image[];
  owner?: User;
}

export interface Image {
  id: string;
  eventId?: string | null;
  uploaderId: string;
  originalKey: string;
  format: string;
  width: number;
  height: number;
  variants: ImageVariants;
  createdAt: Date;
  updatedAt: Date;
  event?: Event | null;
  uploader?: User;
}

export interface ImageVariants {
  tiny: ImageVariant;
  thumb: ImageVariant;
  card: ImageVariant;
  hero: ImageVariant;
  original: ImageVariant;
}

export interface ImageVariant {
  width: number;
  height: number;
  webpKey: string;
  jpgKey: string;
  webpUrl: string;
  jpgUrl: string;
}

export interface Session {
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
  role?: string;
  userId?: string;
}

export interface Gallery {
  id: string;
  name: string;
  description?: string | null;
  eventId?: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  images?: GalleryImage[];
  event?: Event | null;
}

export interface GalleryImage {
  id: string;
  galleryId: string;
  imageId: string;
  title?: string | null;
  caption?: string | null;
  tags: string[];
  sortOrder: number;
  createdAt: Date;
  image?: Image | null;
  gallery?: Gallery | null;
}

export interface RecentEventVideo {
  id: string;
  title: string;
  caption?: string | null;
  videoUrl: string;
  videoType: 'UPLOADED' | 'EXTERNAL';
  thumbnailUrl?: string | null;
  duration?: number | null;
  sortOrder: number;
  isPublished: boolean;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
