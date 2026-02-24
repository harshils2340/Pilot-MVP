import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot from '@/app/lib/biSnapshot/schema';
import { Types } from 'mongoose';

/**
 * GET /api/ai-insights/menus?clientId=xxx
 *
 * Returns all uploaded menu items grouped by competitor.
 */
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
    }

    await connectToDB();

    const resolvedId = await resolveClientId(clientId);
    if (!resolvedId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const snapshot = await BiSnapshot.findOne({
      clientId: new Types.ObjectId(resolvedId),
    })
      .sort({ version: -1 })
      .lean();

    if (!snapshot) {
      return NextResponse.json({ competitors: [], totalItems: 0 });
    }

    const competitors = (snapshot.competitors ?? [])
      .filter((c: { menuItems?: unknown[] }) => c.menuItems && c.menuItems.length > 0)
      .map((c: {
        name: string;
        menuCoverage: string;
        menuLastUpdated?: Date;
        menuItems: { name: string; price: number | null; category: string; subcategory?: string; description?: string }[];
      }) => ({
        name: c.name,
        menuCoverage: c.menuCoverage,
        menuLastUpdated: c.menuLastUpdated ?? null,
        itemCount: c.menuItems.length,
        items: c.menuItems.map((item) => ({
          name: item.name,
          price: item.price,
          category: item.category,
          subcategory: item.subcategory ?? null,
          description: item.description ?? null,
        })),
      }));

    const totalItems = competitors.reduce(
      (sum: number, c: { itemCount: number }) => sum + c.itemCount,
      0,
    );

    return NextResponse.json({ competitors, totalItems });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GET /api/ai-insights/menus error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 },
    );
  }
}
