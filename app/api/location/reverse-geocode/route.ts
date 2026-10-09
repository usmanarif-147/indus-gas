import { NextRequest, NextResponse } from "next/server";

type GoogleComponent = { long_name: string; types: string[] };
type GoogleResult = { formatted_address: string; address_components: GoogleComponent[] };

function component(components: GoogleComponent[], types: string[]) {
  return components.find((item) => types.some((type) => item.types.includes(type)))?.long_name ?? "Not found";
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lng"));
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "A valid location is required." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "Google Geocoding is not configured." }, { status: 503 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${latitude},${longitude}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "en");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json({ error: "Google could not look up this location." }, { status: 502 });
  }

  const payload = await response.json() as { status: string; results?: GoogleResult[]; error_message?: string };
  if (payload.status !== "OK" || !payload.results?.length) {
    return NextResponse.json({ error: payload.error_message || "No address was found for this location." }, { status: 422 });
  }

  const result = payload.results[0];
  const components = result.address_components;
  const area = component(components, ["route", "neighborhood", "sublocality_level_1", "locality"]);
  const sector = component(components, ["neighborhood", "sublocality_level_2", "sublocality_level_1", "locality"]);

  return NextResponse.json({
    area,
    sector,
    address: result.formatted_address,
    latitude,
    longitude,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });
}
