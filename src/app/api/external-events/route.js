import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `https://api.jambase.com/events?zip=10001&radius=50&api_key=${process.env.JAMBASE_KEY}`
    );
    const data = await res.json();

    // Normalize data
    const events = (data.Events || []).map(evt => ({
      id: evt.Id,
      title: evt.Name,
      venue: evt.Venue?.Name,
      start_time: evt.Date,
      link: evt.TicketUrl || evt.Url,
    }));

    return NextResponse.json({ events });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
