import { readFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

import { computeMarketingRoi } from '@/lib/everself/compute-rollups';
import type {
  AppointmentRow,
  BookingGroupMode,
  Channel,
  CreativeAssetRow,
  EverselfConfig,
  LeadRow,
  SpendRow,
} from '@/lib/everself/types';

export const dynamic = 'force-dynamic';

const JSON_TTL_MS = 60_000;
const RESULT_TTL_MS = 30_000;

type RawBundle = {
  at: number;
  spend: SpendRow[];
  leads: LeadRow[];
  appointments: AppointmentRow[];
  creative: CreativeAssetRow[];
  config: EverselfConfig;
};

let rawCache: RawBundle | null = null;
const resultCache = new Map<string, { at: number; body: string }>();

async function loadRaw(): Promise<Omit<RawBundle, 'at'>> {
  const now = Date.now();
  if (rawCache && now - rawCache.at < JSON_TTL_MS) {
    const { spend, leads, appointments, creative, config } = rawCache;
    return { spend, leads, appointments, creative, config };
  }
  const base = path.join(process.cwd(), 'public', 'demo', 'everself');
  const [spend, leads, appointments, creative, config] = await Promise.all([
    readFile(path.join(base, 'spend_daily.json'), 'utf8'),
    readFile(path.join(base, 'leads.json'), 'utf8'),
    readFile(path.join(base, 'appointments.json'), 'utf8'),
    readFile(path.join(base, 'creative_assets.json'), 'utf8'),
    readFile(path.join(base, 'config.json'), 'utf8'),
  ]);
  const parsed: Omit<RawBundle, 'at'> = {
    spend: JSON.parse(spend) as SpendRow[],
    leads: JSON.parse(leads) as LeadRow[],
    appointments: JSON.parse(appointments) as AppointmentRow[],
    creative: JSON.parse(creative) as CreativeAssetRow[],
    config: JSON.parse(config) as EverselfConfig,
  };
  rawCache = { at: now, ...parsed };
  return parsed;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start') ?? '2026-03-06';
    const end = searchParams.get('end') ?? '2026-04-04';
    const cities = searchParams.get('cities')?.split(',').filter(Boolean) ?? [];
    const chRaw = searchParams.get('channels')?.split(',').filter(Boolean) ?? [];
    const channels = chRaw.filter((c): c is Channel => c === 'google' || c === 'meta');
    const bookingGroup = (searchParams.get('bookingGroup') === 'lead' ? 'lead' : 'booked') as BookingGroupMode;
    const campaign = searchParams.get('campaign') ?? '';

    const cacheKey = `${start}|${end}|${cities.join(',')}|${channels.join(',')}|${bookingGroup}|${campaign}|kpis-clicks-v3`;
    const now = Date.now();
    const hit = resultCache.get(cacheKey);
    if (hit && now - hit.at < RESULT_TTL_MS) {
      return new NextResponse(hit.body, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=30' },
      });
    }

    const raw = await loadRaw();
    const result = computeMarketingRoi({
      spend: raw.spend,
      leads: raw.leads,
      appointments: raw.appointments,
      creativeAssets: raw.creative,
      config: raw.config,
      start,
      end,
      cities,
      channels,
      bookingGroup,
      campaignSearch: campaign,
    });

    const body = JSON.stringify(result);
    resultCache.set(cacheKey, { at: now, body });
    return new NextResponse(body, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=30' },
    });
  } catch (err) {
    console.error('GET /api/demo/everself/marketing-roi', err);
    return NextResponse.json({ message: 'Failed to compute marketing ROI' }, { status: 500 });
  }
}
