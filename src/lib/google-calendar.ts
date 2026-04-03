import { google } from "googleapis";

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return auth;
}

export interface RawCalendarEvent {
  id: string;
  summary: string;
  location?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  eventType?: string;
  transparency?: string;
  colorId?: string;
}

export async function fetchCalendarEvents(
  timeMin: string,
  timeMax: string
): Promise<RawCalendarEvent[]> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const allEvents: RawCalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const res = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      timeMin,
      timeMax,
      timeZone: "Asia/Tokyo",
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
      pageToken,
    });

    const items = res.data.items || [];
    for (const item of items) {
      allEvents.push({
        id: item.id || "",
        summary: item.summary || "",
        location: item.location || undefined,
        description: item.description || undefined,
        start: {
          dateTime: item.start?.dateTime || undefined,
          date: item.start?.date || undefined,
        },
        end: {
          dateTime: item.end?.dateTime || undefined,
          date: item.end?.date || undefined,
        },
        eventType: item.eventType || undefined,
        transparency: item.transparency || undefined,
        colorId: item.colorId || undefined,
      });
    }

    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return allEvents;
}
