const COORDINATE_PATTERNS = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/];

export interface Coordinates {
  lat: number;
  lng: number;
}

export async function resolveMapCoordinates(mapUrl: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(mapUrl, { redirect: 'follow', next: { revalidate: 86_400 } });
    const resolvedUrl = decodeURIComponent(response.url);
    for (const pattern of COORDINATE_PATTERNS) {
      const match = resolvedUrl.match(pattern);
      if (match) {
        return { lat: Number(match[1]), lng: Number(match[2]) };
      }
    }
    return null;
  } catch {
    return null;
  }
}
