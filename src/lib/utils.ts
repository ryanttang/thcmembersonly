import slugify from "slugify";
import { prisma } from "./prisma";

export const createSlug = (title: string, locationName?: string) => {
  // Combine title and location for more descriptive URLs
  const slugParts = [title];
  if (locationName && locationName.trim()) {
    slugParts.push(locationName.trim());
  }
  
  const combinedText = slugParts.join(' ');
  const slugBase = slugify(combinedText, { lower: true, strict: true });
  
  return slugBase;
};

export const formatDateTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Check if we're in build time (no database connection available)
 */
function isBuildTime(): boolean {
  return process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;
}

/**
 * Automatically archives PUBLISHED events that have passed (startAt < today)
 * This ensures the Events Calendar only shows current and upcoming events
 * @returns The number of events that were archived
 */
export async function autoArchivePastEvents(): Promise<number> {
  // Skip during build time when database is not available
  if (isBuildTime()) {
    return 0;
  }

  try {
    const now = new Date();
    // Set to start of today to archive events that have already passed
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const result = await prisma.event.updateMany({
      where: {
        status: 'PUBLISHED',
        startAt: {
          lt: startOfToday
        }
      },
      data: {
        status: 'ARCHIVED'
      }
    });
    
    if (result.count > 0) {
      console.log(`[autoArchivePastEvents] Archived ${result.count} past event(s)`);
    }
    
    return result.count;
  } catch (error) {
    console.error('[autoArchivePastEvents] Error archiving past events:', error);
    return 0;
  }
}
