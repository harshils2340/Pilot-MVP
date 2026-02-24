import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot from '@/app/lib/biSnapshot/schema';
import { geocodeAddress } from '@/app/lib/googleMaps/places';
import { Types } from 'mongoose';

const RequestSchema = z.object({
  clientId: z.string().min(1),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  radiusMeters: z.number().min(100).max(2000).optional().default(500),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDB();

    const resolvedId = await resolveClientId(parsed.data.clientId);
    if (!resolvedId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const geo = await geocodeAddress(parsed.data.address);
    if (!geo) {
      return NextResponse.json(
        { success: false, error: 'Could not geocode address. Please check and try again.' },
        { status: 200 },
      );
    }

    const clientOid = new Types.ObjectId(resolvedId);

    const snapshot = await BiSnapshot.findOneAndUpdate(
      { clientId: clientOid },
      {
        $set: {
          clientId: clientOid,
          location: {
            address: geo.formattedAddress,
            lat: geo.lat,
            lng: geo.lng,
            radiusMeters: parsed.data.radiusMeters,
            neighborhood: geo.neighborhood,
            city: geo.city,
            province: geo.province,
            country: geo.country,
          },
          'collectionStatus.overall': 'initializing',
          'collectionStatus.readinessPercent': 10,
          'collectionStatus.googleMaps.status': 'pending',
          'collectionStatus.googleMaps.placesFound': 0,
          'collectionStatus.bestTime.status': 'pending',
          'collectionStatus.bestTime.venuesProcessed': 0,
          'collectionStatus.bestTime.venuesTotal': 0,
          'collectionStatus.geminiAnalysis.status': 'pending',
        },
        $setOnInsert: {
          version: 1,
          competitors: [],
          versionHistory: [],
          queryCache: [],
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({
      success: true,
      snapshotId: snapshot._id.toString(),
      progress: 10,
      location: {
        address: geo.formattedAddress,
        lat: geo.lat,
        lng: geo.lng,
        city: geo.city,
        neighborhood: geo.neighborhood,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/scan/geocode error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
