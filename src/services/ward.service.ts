export interface WardBoundary {
  id: string;
  name: string;
  code: string;
  population: number;
  supervisorName: string;
  polygon: Array<[number, number]>; // Array of [lat, lng]
  center: { lat: number; lng: number };
  color: string;
}

export interface WardIdentificationResult {
  ward: WardBoundary | null;
  wardId: string | null;
  wardCode: string | null;
  wardName: string | null;
  isUnassigned: boolean;
  requiresAdminReview: boolean;
  reviewReason?: string;
  coordinates: { latitude: number; longitude: number };
}

/**
 * Deterministic Municipal Ward Polygons for CIVOARA City Operations.
 * Georeferenced coordinates in [latitude, longitude] format.
 */
export const CONFIGURED_MUNICIPAL_WARDS: WardBoundary[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Ward 1 - Central Downtown',
    code: 'WARD-01',
    population: 84000,
    supervisorName: 'Marcus Vance',
    center: { lat: 40.7128, lng: -74.006 },
    color: '#4338ca', // Indigo
    polygon: [
      [40.705, -74.015],
      [40.72, -74.015],
      [40.72, -73.995],
      [40.705, -73.995],
      [40.705, -74.015],
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Ward 2 - North Oakridge',
    code: 'WARD-02',
    population: 62000,
    supervisorName: 'Elena Rostova',
    center: { lat: 40.732, lng: -73.992 },
    color: '#0284c7', // Sky
    polygon: [
      [40.72, -74.015],
      [40.745, -74.015],
      [40.745, -73.985],
      [40.72, -73.985],
      [40.72, -74.015],
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Ward 3 - East Riverfront',
    code: 'WARD-03',
    population: 71000,
    supervisorName: 'David Chen',
    center: { lat: 40.708, lng: -73.985 },
    color: '#0d9488', // Teal
    polygon: [
      [40.7, -73.995],
      [40.72, -73.995],
      [40.72, -73.97],
      [40.7, -73.97],
      [40.7, -73.995],
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Ward 4 - West Pine Valley',
    code: 'WARD-04',
    population: 59000,
    supervisorName: 'Sarah Jenkins',
    center: { lat: 40.725, lng: -74.02 },
    color: '#d97706', // Amber
    polygon: [
      [40.705, -74.04],
      [40.735, -74.04],
      [40.735, -74.015],
      [40.705, -74.015],
      [40.705, -74.04],
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    name: 'Ward 5 - South Industrial',
    code: 'WARD-05',
    population: 43000,
    supervisorName: 'Robert Thorne',
    center: { lat: 40.692, lng: -74.005 },
    color: '#64748b', // Slate
    polygon: [
      [40.68, -74.03],
      [40.705, -74.03],
      [40.705, -73.98],
      [40.68, -73.98],
      [40.68, -74.03],
    ],
  },
];

/**
 * Standard Ray-Casting Point-in-Polygon Algorithm.
 * Tests if coordinate point [lat, lng] falls within the polygon boundary.
 */
export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<[number, number]>
): boolean {
  const x = point.lat;
  const y = point.lng;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Determines responsible ward from submitted geographic coordinates.
 * If coordinates fall outside all configured ward polygons, flags for administrative review.
 */
export function identifyResponsibleWard(
  latitude: number,
  longitude: number,
  wards: WardBoundary[] = CONFIGURED_MUNICIPAL_WARDS
): WardIdentificationResult {
  const targetPoint = { lat: latitude, lng: longitude };

  for (const ward of wards) {
    if (isPointInPolygon(targetPoint, ward.polygon)) {
      return {
        ward,
        wardId: ward.id,
        wardCode: ward.code,
        wardName: ward.name,
        isUnassigned: false,
        requiresAdminReview: false,
        coordinates: { latitude, longitude },
      };
    }
  }

  // Location falls outside all configured wards
  return {
    ward: null,
    wardId: null,
    wardCode: null,
    wardName: null,
    isUnassigned: true,
    requiresAdminReview: true,
    reviewReason:
      'Coordinates fall outside all configured municipal ward boundaries. Escalated to administrative review queue.',
    coordinates: { latitude, longitude },
  };
}

/**
 * Sample Test Locations for Demo and Verification
 */
export const DEMO_TEST_LOCATIONS = [
  {
    name: 'City Hall Plaza',
    latitude: 40.7128,
    longitude: -74.006,
    expectedWardCode: 'WARD-01',
    description: 'Inside Central Downtown (Ward 1)',
  },
  {
    name: 'Oakridge Secondary School',
    latitude: 40.732,
    longitude: -73.992,
    expectedWardCode: 'WARD-02',
    description: 'Inside North Oakridge (Ward 2)',
  },
  {
    name: 'East River Promenade Pier',
    latitude: 40.708,
    longitude: -73.985,
    expectedWardCode: 'WARD-03',
    description: 'Inside East Riverfront (Ward 3)',
  },
  {
    name: 'Pine Valley Nature Reserve',
    latitude: 40.725,
    longitude: -74.02,
    expectedWardCode: 'WARD-04',
    description: 'Inside West Pine Valley (Ward 4)',
  },
  {
    name: 'Southern Logistics Hub',
    latitude: 40.692,
    longitude: -74.005,
    expectedWardCode: 'WARD-05',
    description: 'Inside South Industrial (Ward 5)',
  },
  {
    name: 'Metropolitan Airport Outer Beltway',
    latitude: 40.85,
    longitude: -74.15,
    expectedWardCode: null,
    description: 'Outside Municipal Boundaries (Unassigned -> Admin Review)',
  },
];
