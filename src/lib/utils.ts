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
 * 
 * This detects when we're in a build environment where:
 * - DATABASE_URL contains 'build' (CI/CD build-time marker)
 * - DATABASE_URL contains 'dummy' (legacy fallback)
 * - DATABASE_URL is missing (shouldn't happen)
 */
function isBuildTime(): boolean {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // If DATABASE_URL is missing entirely, we're definitely in build mode
  if (!dbUrl) {
    return process.env.NODE_ENV === 'production';
  }
  
  // Check if DATABASE_URL is a build-time marker value
  const isBuildDb = dbUrl.includes('build') ||
                    dbUrl.includes('dummy') || 
                    dbUrl.includes('localhost:5432/dummy') ||
                    dbUrl.includes('localhost:5432/build');
  
  return process.env.NODE_ENV === 'production' && isBuildDb;
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
    // Set to start of today in UTC to archive events that have already passed
    // Database dates are stored in UTC, so we need to compare in UTC
    const startOfTodayUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));
    
    const result = await prisma.event.updateMany({
      where: {
        status: 'PUBLISHED',
        startAt: {
          lt: startOfTodayUTC
        }
      },
      data: {
        status: 'ARCHIVED'
      }
    });
    
    if (result.count > 0) {
      console.log(`[autoArchivePastEvents] Archived ${result.count} past event(s) (before ${startOfTodayUTC.toISOString()})`);
    }
    
    return result.count;
  } catch (error) {
    console.error('[autoArchivePastEvents] Error archiving past events:', error);
    return 0;
  }
}
