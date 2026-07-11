import { API_BASE_URL } from "@/config/api";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";
import {
  INDIA_COUNTRY_ID,
  type ApiCity,
  type ApiState,
  type CitiesPageResult,
  type CityListParams,
  type ResolvedGeoLocation,
  type StateListParams,
  type StatesPageResult,
} from "@/types/location";
import { matchNearestIndiaLocation } from "@/utils/indiaNearestLocation";

function buildLocationParams(params?: StateListParams | CityListParams) {
  const query: Record<string, string | number | boolean> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    sort_by: params?.sort_by ?? "name",
    sort_order: params?.sort_order ?? "asc",
    is_active: params?.is_active ?? true,
  };
  if (params?.search?.trim()) query.search = params.search.trim();
  return query;
}

export async function fetchStates(params?: StateListParams): Promise<StatesPageResult> {
  const response = await apiClient.get(API_ENDPOINTS.LOCATIONS_STATES, {
    params: {
      ...buildLocationParams(params),
      country_id: params?.country_id ?? INDIA_COUNTRY_ID,
      ...(params?.code?.trim() ? { code: params.code.trim() } : {}),
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiState>(data);
}

export async function fetchCities(params: CityListParams): Promise<CitiesPageResult> {
  const response = await apiClient.get(API_ENDPOINTS.LOCATIONS_CITIES, {
    params: {
      ...buildLocationParams(params),
      state_id: params.state_id,
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiCity>(data);
}

interface PlaceNames {
  /** Preferred display/search name */
  cityName: string;
  /** Try these in order against /locations/cities?search= */
  cityCandidates: string[];
  stateName: string;
  stateCode?: string;
}

function pickBestNamedMatch<T extends { name: string }>(
  items: T[],
  needle: string
): T | null {
  if (!items.length) return null;
  const q = needle.trim().toLowerCase();
  if (!q) return items[0] ?? null;

  return (
    items.find((item) => item.name.toLowerCase() === q) ??
    items.find((item) => item.name.toLowerCase().startsWith(q)) ??
    items.find((item) => item.name.toLowerCase().includes(q)) ??
    items.find((item) => q.includes(item.name.toLowerCase())) ??
    items[0] ??
    null
  );
}

function cleanPlaceToken(value: string): string {
  return value
    .replace(/\b(district|taluka|tehsil|division|municipality|city|town)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueNames(...values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const cleaned = cleanPlaceToken(value ?? "");
    if (cleaned.length < 2) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}

/** Pull "Ahmedabad" from admin entries like "Ahmedabad district". */
function districtCityFromAdmin(
  administrative?: Array<{ name?: string; description?: string; adminLevel?: number }>
): string | null {
  if (!administrative?.length) return null;

  for (const entry of administrative) {
    const name = entry.name?.trim() || "";
    const description = (entry.description ?? "").toLowerCase();
    // Prefer explicit "... district" labels from reverse-geocode admin hierarchy.
    if (/district$/i.test(name) || /\bdistrict\b/i.test(description)) {
      const city = cleanPlaceToken(name);
      if (city.length >= 2) return city;
    }
  }
  return null;
}

/** Public fetch — avoids apiClient interceptors during geo bootstrap. */
async function publicLocationGet<T>(path: string, query: Record<string, string | number | boolean>) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Location API ${path} failed (${response.status})`);
  }
  const json = (await response.json()) as unknown;
  const data = unwrapApiPayload<unknown>(json);
  return unwrapPaginatedResult<T>(data);
}

async function resolvePlaceNamesFromCoordinates(
  lat: number,
  lng: number
): Promise<PlaceNames | null> {
  const offline = matchNearestIndiaLocation(lat, lng);

  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("localityLanguage", "en");

    const response = await fetch(url.toString(), { method: "GET" });
    if (response.ok) {
      const data = (await response.json()) as {
        countryCode?: string;
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        principalSubdivisionCode?: string;
        localityInfo?: {
          administrative?: Array<{
            name?: string;
            description?: string;
            adminLevel?: number;
          }>;
        };
      };

      const country = (data.countryCode ?? "").toUpperCase();
      const stateName = cleanPlaceToken(data.principalSubdivision?.trim() || "");
      // Use district as city (e.g. "Ahmedabad district" → "Ahmedabad"), not taluka like Daskroi.
      const districtCity = districtCityFromAdmin(data.localityInfo?.administrative);

      const codeRaw = data.principalSubdivisionCode?.trim() || "";
      const stateCode = codeRaw.includes("-")
        ? codeRaw.split("-").pop()?.toUpperCase()
        : codeRaw.toUpperCase() || undefined;

      if (country === "IN" && stateName) {
        const cityName =
          districtCity ||
          offline?.cityName ||
          cleanPlaceToken(data.city?.trim() || "") ||
          cleanPlaceToken(data.locality?.trim() || "") ||
          stateName;

        // District first; offline major city only as fallback if district isn't in cities API.
        const cityCandidates = uniqueNames(districtCity, offline?.cityName, cityName);

        return {
          cityName,
          cityCandidates: cityCandidates.length ? cityCandidates : [cityName],
          stateName,
          stateCode: stateCode || offline?.stateCode,
        };
      }
    }
  } catch {
    /* offline fallback */
  }

  if (!offline) return null;
  return {
    cityName: offline.cityName,
    cityCandidates: [offline.cityName],
    stateName: offline.stateName,
    stateCode: offline.stateCode,
  };
}

async function findStateId(place: PlaceNames): Promise<ApiState | null> {
  const byName = await publicLocationGet<ApiState>("/locations/states", {
    country_id: INDIA_COUNTRY_ID,
    page: 1,
    limit: 10,
    search: place.stateName,
    is_active: true,
    sort_by: "name",
    sort_order: "asc",
  });
  let state = pickBestNamedMatch(byName.results, place.stateName);

  if (!state && place.stateCode) {
    const byCode = await publicLocationGet<ApiState>("/locations/states", {
      country_id: INDIA_COUNTRY_ID,
      page: 1,
      limit: 5,
      code: place.stateCode,
      is_active: true,
      sort_by: "name",
      sort_order: "asc",
    });
    state =
      byCode.results.find(
        (item) => (item.code ?? "").toUpperCase() === place.stateCode!.toUpperCase()
      ) ??
      byCode.results[0] ??
      null;
  }

  return state;
}

async function findCityId(stateId: number, candidates: string[]): Promise<ApiCity | null> {
  const queries = uniqueNames(...candidates.flatMap((name) => [name, name.split(/\s+/)[0] ?? ""]));

  for (const query of queries) {
    const result = await publicLocationGet<ApiCity>("/locations/cities", {
      state_id: stateId,
      page: 1,
      limit: 20,
      search: query,
      is_active: true,
      sort_by: "name",
      sort_order: "asc",
    });
    const match = pickBestNamedMatch(result.results, query);
    if (match) return match;
  }

  return null;
}

/**
 * Resolve browser lat/lng → state_id/city_id via:
 * place names → GET /locations/states?search= → GET /locations/cities?search=
 */
export async function resolveLocationFromCoordinates(
  lat: number,
  lng: number
): Promise<ResolvedGeoLocation | null> {
  const place = await resolvePlaceNamesFromCoordinates(lat, lng);
  if (!place?.stateName) return null;

  const state = await findStateId(place);
  if (!state) return null;

  const city = await findCityId(state.id, place.cityCandidates);
  if (!city) return null;

  return {
    state_id: state.id,
    city_id: city.id,
    state_name: state.name,
    city_name: city.name,
    lat,
    lng,
  };
}
