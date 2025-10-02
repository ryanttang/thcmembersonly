import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoordinationPageClient from "./CoordinationPageClient";

export default async function CoordinationPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.email) redirect("/signin");
  
  const user = await prisma.user.findUnique({ where: { email: session.user.email }});
  if (!user) redirect("/signin");
  
  // Admins and Organizers can see all coordinations, others only see their own
  const canManageAllEvents = user.role === "ADMIN" || user.role === "ORGANIZER";
  
  const coordinations = await prisma.coordination.findMany({ 
    where: { 
      ...(canManageAllEvents ? {} : { event: { ownerId: user.id } }),
      isArchived: false // By default, exclude archived coordinations
    }, 
    include: { 
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startAt: true,
          owner: { select: { name: true, email: true } }
        }
      },
      documents: true,
      _count: {
        select: { documents: true }
      }
    }, 
    orderBy: { createdAt: "desc" }
  });

  const events = await prisma.event.findMany({
    where: {
      ...(canManageAllEvents ? {} : { ownerId: user.id }),
      status: { not: "ARCHIVED" }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      startAt: true,
      owner: { select: { name: true, email: true } }
    },
    orderBy: { startAt: "desc" }
  });

  return (
    <CoordinationPageClient 
      coordinations={coordinations}
      events={events}
      canManageAllEvents={canManageAllEvents}
    />
  );
}
