import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().max(4000).optional().or(z.literal("")),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  buttonType: z.enum(["RSVP", "BUY_TICKETS"]),
  locationName: z.string().max(200).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startAt: z.string().min(1, "Start date is required"),
  endAt: z.string().optional().or(z.literal("")),
  timezone: z.string(),
  status: z.enum(["DRAFT","PUBLISHED","ARCHIVED"]),
  heroImageId: z.string().optional().or(z.literal("")),
  detailImageIds: z.array(z.string()).optional(),
  slug: z.string().optional()
});

export const updateEventSchema = createEventSchema.partial();
