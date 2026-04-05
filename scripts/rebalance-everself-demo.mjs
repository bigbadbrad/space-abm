/**
 * One-off: rebalance public/demo/everself/*.json so tier-1 cities (LA, SF) have
 * more clicks/leads/bookings than smaller metros (Denver), while keeping referential integrity.
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.join(__dirname, '..', 'public', 'demo', 'everself');

/** Order: largest commercial potential → smaller */
const CITIES = ['Los Angeles', 'San Francisco', 'San Diego', 'Austin', 'Denver'];
/** 300 leads / spend rows */
const ROW_COUNTS = [84, 78, 60, 48, 30];
/** 100 appointments */
const APPT_COUNTS = [28, 26, 20, 16, 10];

function leadId(n) {
  return `lead_${String(n).padStart(3, '0')}`;
}

function campaignForCityChannel(city, channel) {
  const id =
    {
      'Los Angeles': { google: 'g_Lo_0', meta: 'm_Lo_0' },
      'San Francisco': { google: 'g_SFr_0', meta: 'm_SFr_0' },
      'San Diego': { google: 'g_SDi_0', meta: 'm_SDi_0' },
      Austin: { google: 'g_Au_0', meta: 'm_Au_0' },
      Denver: { google: 'g_De_0', meta: 'm_De_0' },
    }[city];
  const ch = channel === 'google' ? 'google' : 'meta';
  const campaign_id = id[ch];
  const campaign_name = `${city} | Demo | ${ch}`;
  return { campaign_id, campaign_name };
}

async function main() {
  const [spendRaw, leadsRaw, apptsRaw] = await Promise.all([
    readFile(path.join(DEMO, 'spend_daily.json'), 'utf8'),
    readFile(path.join(DEMO, 'leads.json'), 'utf8'),
    readFile(path.join(DEMO, 'appointments.json'), 'utf8'),
  ]);

  let spend = JSON.parse(spendRaw);
  let leads = JSON.parse(leadsRaw);
  let appts = JSON.parse(apptsRaw);

  leads.sort((a, b) => a.lead_id.localeCompare(b.lead_id));
  spend.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    const c = a.channel.localeCompare(b.channel);
    if (c !== 0) return c;
    return a.city.localeCompare(b.city);
  });

  let li = 0;
  for (let ci = 0; ci < CITIES.length; ci++) {
    const city = CITIES[ci];
    const n = ROW_COUNTS[ci];
    const utm = `${city}_Search`;
    for (let k = 0; k < n; k++) {
      const lead = leads[li];
      lead.city = city;
      lead.utm_campaign = utm;
      li++;
    }
  }

  let si = 0;
  for (let ci = 0; ci < CITIES.length; ci++) {
    const city = CITIES[ci];
    const n = ROW_COUNTS[ci];
    for (let k = 0; k < n; k++) {
      const row = spend[si];
      row.city = city;
      const { campaign_id, campaign_name } = campaignForCityChannel(city, row.channel);
      row.campaign_id = campaign_id;
      row.campaign_name = campaign_name;
      si++;
    }
  }

  /** Lead index ranges [start, end] inclusive, 1-based ids */
  const ranges = [];
  let start = 1;
  for (const n of ROW_COUNTS) {
    ranges.push({ start, end: start + n - 1 });
    start += n;
  }

  appts.sort((a, b) => a.appointment_id.localeCompare(b.appointment_id));
  let ai = 0;
  for (let ci = 0; ci < CITIES.length; ci++) {
    const city = CITIES[ci];
    const count = APPT_COUNTS[ci];
    const { start: s } = ranges[ci];
    for (let k = 0; k < count; k++) {
      const leadNum = s + k;
      const id = leadId(leadNum);
      appts[ai].lead_id = id;
      appts[ai].city = city;
      ai++;
    }
  }

  await Promise.all([
    writeFile(path.join(DEMO, 'leads.json'), JSON.stringify(leads)),
    writeFile(path.join(DEMO, 'spend_daily.json'), JSON.stringify(spend)),
    writeFile(path.join(DEMO, 'appointments.json'), JSON.stringify(appts)),
  ]);

  console.log('Wrote rebalanced demo JSON.');
  for (let ci = 0; ci < CITIES.length; ci++) {
    console.log(CITIES[ci], 'leads', ROW_COUNTS[ci], 'appts', APPT_COUNTS[ci]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
