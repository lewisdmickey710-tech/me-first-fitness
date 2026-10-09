// Free, no-API-key weather for the morning digest's weather line.
// Zippopotam.us geocodes a US zip to lat/lng (no key); the National
// Weather Service's public API (api.weather.gov) turns that into a
// forecast (no key, but does require a descriptive User-Agent per their
// usage policy). Both are best-effort -- any failure here should never
// break the rest of the morning digest, so callers get null rather than
// a thrown error.

const USER_AGENT = "MeFirstFitness (hello@mefirstfitness.app)";

interface NotableWeather {
  summary: string;
  isNotable: boolean;
}

async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;
    return { lat: Number(place.latitude), lng: Number(place.longitude) };
  } catch {
    return null;
  }
}

// A plain "72 and sunny" isn't worth a push -- only conditions that'd
// actually change someone's day (rain/snow likely, or extreme temps).
function isNotable(shortForecast: string, precipChance: number | null, tempF: number | null): boolean {
  if (precipChance !== null && precipChance >= 40) return true;
  if (/snow|ice|sleet|storm|severe|hail/i.test(shortForecast)) return true;
  if (tempF !== null && (tempF >= 95 || tempF <= 32)) return true;
  return false;
}

export async function getTodaysNotableWeather(zip: string): Promise<NotableWeather | null> {
  const coords = await geocodeZip(zip);
  if (!coords) return null;

  try {
    const pointsRes = await fetch(`https://api.weather.gov/points/${coords.lat},${coords.lng}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!pointsRes.ok) return null;
    const points = await pointsRes.json();
    const forecastUrl = points?.properties?.forecast;
    if (!forecastUrl) return null;

    const forecastRes = await fetch(forecastUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!forecastRes.ok) return null;
    const forecast = await forecastRes.json();
    const today = forecast?.properties?.periods?.[0];
    if (!today) return null;

    const shortForecast: string = today.shortForecast ?? "";
    const tempF: number | null = typeof today.temperature === "number" ? today.temperature : null;
    const precipChance: number | null = today.probabilityOfPrecipitation?.value ?? null;

    const notable = isNotable(shortForecast, precipChance, tempF);
    if (!notable) return { summary: "", isNotable: false };

    const parts = [shortForecast];
    if (tempF !== null) parts.push(`${tempF}°F`);
    if (precipChance !== null && precipChance > 0) parts.push(`${precipChance}% precip`);

    return { summary: parts.join(", "), isNotable: true };
  } catch {
    return null;
  }
}
