import { identifyResponsibleWard } from '@/services/ward.service';

export interface GeocodeResult {
  formattedAddress: string;
  street: string;
  neighborhood: string;
  city: string;
  wardName: string;
  wardId: string | null;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  streetViewUrl: string;
  directionsUrl: string;
  source: 'google' | 'nominatim' | 'municipal_grid';
}

/**
 * Reverse geocodes coordinates to the nearest street address, neighborhood,
 * and municipal ward using Google Maps / OpenStreetMap APIs.
 */
export async function reverseGeocodeNearest(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  // 1. Identify Ward using PostGIS / in-memory municipal polygon engine
  const wardMatch = identifyResponsibleWard(lat, lng);
  const wardName = wardMatch.ward ? wardMatch.ward.name : 'Unassigned (Outside Wards)';
  const wardId = wardMatch.ward ? wardMatch.ward.id : null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // 2. Check for Google Maps Geocoding API Key
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleApiKey) {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
          const first = gData.results[0];
          let street = '';
          let neighborhood = '';
          let city = '';

          for (const comp of first.address_components) {
            if (comp.types.includes('route')) street = comp.long_name;
            if (comp.types.includes('neighborhood') || comp.types.includes('sublocality')) {
              neighborhood = comp.long_name;
            }
            if (comp.types.includes('locality')) city = comp.long_name;
          }

          return {
            formattedAddress: first.formatted_address,
            street: street || first.formatted_address.split(',')[0] || '',
            neighborhood: neighborhood || wardName,
            city: city || 'Central City',
            wardName,
            wardId,
            latitude: lat,
            longitude: lng,
            googleMapsUrl,
            streetViewUrl,
            directionsUrl,
            source: 'google',
          };
        }
      }
    } catch {
      // Fall through to Nominatim
    }
  }

  // 3. High-precision Nominatim Reverse Geocoding
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Civoara-GovTech-Civic-Platform/1.0',
          Accept: 'application/json',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.street || '';
        const houseNumber = data.address.house_number ? `${data.address.house_number} ` : '';
        const street = road ? `${houseNumber}${road}` : data.display_name.split(',')[0];
        const neighborhood =
          data.address.neighbourhood ||
          data.address.suburb ||
          data.address.quarter ||
          wardName;
        const city = data.address.city || data.address.town || data.address.municipality || 'Central City';

        const cleanParts = [
          street,
          neighborhood,
          wardName !== 'Unassigned (Outside Wards)' ? wardName : null,
          city,
        ].filter(Boolean);

        return {
          formattedAddress: cleanParts.join(', ') || data.display_name,
          street: street || data.display_name.split(',')[0] || '',
          neighborhood,
          city,
          wardName,
          wardId,
          latitude: lat,
          longitude: lng,
          googleMapsUrl,
          streetViewUrl,
          directionsUrl,
          source: 'nominatim',
        };
      }
    }
  } catch {
    // Fall back to municipal grid estimate
  }

  // 4. Municipal Polygon Grid Fallback
  return {
    formattedAddress: `${wardName} Sector (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    street: `Municipal Grid Sector (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    neighborhood: wardName,
    city: 'Central City',
    wardName,
    wardId,
    latitude: lat,
    longitude: lng,
    googleMapsUrl,
    streetViewUrl,
    directionsUrl,
    source: 'municipal_grid',
  };
}

/**
 * Forward geocoding: search an address or landmark and return coordinates.
 */
export async function forwardGeocodeSearch(
  query: string
): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
  if (!query || query.trim().length < 3) return null;

  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      {
        headers: {
          'User-Agent': 'Civoara-GovTech-Civic-Platform/1.0',
          Accept: 'application/json',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        return {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          displayName: item.display_name,
        };
      }
    }
  } catch {
    // Return null if search fails
  }

  return null;
}
