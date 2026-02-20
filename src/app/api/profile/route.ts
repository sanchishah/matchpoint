import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, strikeCount] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.strike.count({
      where: { userId: session.user.id },
    }),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ ...profile, strikeCount });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = { ...parsed.data };

  // Geocode zip code if provided and lat/lng are not already set
  if (data.zip && !data.lat && !data.lng) {
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${data.zip}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const place = geoData?.places?.[0];
        if (place) {
          data.lat = parseFloat(place.latitude);
          data.lng = parseFloat(place.longitude);
        }
      }
    } catch {
      // Fail silently — profile saves without coordinates
    }
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  return NextResponse.json(profile);
}
