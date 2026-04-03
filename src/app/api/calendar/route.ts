import { NextRequest, NextResponse } from "next/server";
import { fetchCalendarEvents } from "@/lib/google-calendar";
import { parseEventsWithAI, DayData } from "@/lib/ai-parse-events";

export const dynamic = "force-dynamic";

// In-memory cache to avoid calling AI on every request
const cache = new Map<string, { data: DayData[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearStr = searchParams.get("year");
  const monthStr = searchParams.get("month");

  const now = new Date();
  const year = yearStr ? parseInt(yearStr) : now.getFullYear();
  const month = monthStr ? parseInt(monthStr) : now.getMonth() + 1;
  const cacheKey = `${year}-${month}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(
      { year, month, days: cached.data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }

  // Fetch events for the entire month
  const timeMin = new Date(year, month - 1, 1, 0, 0, 0).toISOString();
  const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString();

  try {
    const rawEvents = await fetchCalendarEvents(timeMin, timeMax);
    const days = await parseEventsWithAI(rawEvents, year, month);

    // Update cache
    cache.set(cacheKey, { data: days, timestamp: Date.now() });

    return NextResponse.json(
      { year, month, days },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Calendar API error:", error);

    // If AI fails but we have stale cache, use it
    if (cached) {
      return NextResponse.json({ year, month, days: cached.data });
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data", detail: errMsg },
      { status: 500 }
    );
  }
}
