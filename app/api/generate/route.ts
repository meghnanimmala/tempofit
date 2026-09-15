import { NextRequest, NextResponse } from "next/server";
import {
  generatePlaylist,
  Track,
} from "@/lib/playlistEngine";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const candidates: Track[] = body.tracks || [];
  const duration = body.duration;

  if (!duration || candidates.length === 0) {
    return NextResponse.json(
      { error: "Tracks and duration are required" },
      { status: 400 }
    );
  }

  const playlist = generatePlaylist(
    candidates,
    duration,
    body.warmup_minutes,
    body.main_minutes,
    body.cooldown_minutes
);

  return NextResponse.json(playlist);
}