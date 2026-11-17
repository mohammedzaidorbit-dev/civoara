'use server';

import {
  reverseGeocodeNearest,
  forwardGeocodeSearch,
  GeocodeResult,
} from '@/lib/maps/geocoding';

export async function fetchNearestGoogleMapAddress(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  return await reverseGeocodeNearest(lat, lng);
}

export async function searchAddressAction(
  query: string
): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
  return await forwardGeocodeSearch(query);
}
