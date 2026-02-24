import { NextResponse } from "next/server";
import { City, State } from "country-state-city";

// Cache built location list (City, State format) for US + Canada
let cachedLocations: { display: string; city: string; state: string; provinceCode: string; country: string }[] | null = null;

function buildLocationsList() {
  if (cachedLocations) return cachedLocations;
  const results: { display: string; city: string; state: string; provinceCode: string; country: string }[] = [];
  const countryCodes = ["US", "CA"];

  for (const countryCode of countryCodes) {
    const states = State.getStatesOfCountry(countryCode);
    for (const state of states) {
      const cities = City.getCitiesOfState(countryCode, state.isoCode);
      for (const city of cities) {
        const display = `${city.name}, ${state.name}`;
        results.push({
          display,
          city: city.name,
          state: state.name,
          provinceCode: state.isoCode,
          country: countryCode,
        });
      }
    }
  }

  cachedLocations = results;
  return results;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit")) || 15, 50);

    const all = buildLocationsList();

    if (!q) {
      return NextResponse.json(all.slice(0, limit));
    }

    const terms = q.split(/\s+/).filter(Boolean);
    const filtered = all.filter((loc) =>
      terms.every(
        (term) =>
          loc.city.toLowerCase().includes(term) ||
          loc.state.toLowerCase().includes(term) ||
          loc.display.toLowerCase().includes(term)
      )
    );

    return NextResponse.json(filtered.slice(0, limit));
  } catch (err) {
    console.error("Location search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Location search failed" },
      { status: 500 }
    );
  }
}
