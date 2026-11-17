'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import type * as LeafletType from 'leaflet';
import {
  Navigation,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Search,
  Sparkles,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CONFIGURED_MUNICIPAL_WARDS } from '@/services/ward.service';
import {
  fetchNearestGoogleMapAddress,
  searchAddressAction,
} from '@/lib/actions/geocoding';

interface LocationPickerProps {
  latitude: number | undefined;
  longitude: number | undefined;
  locationDescription: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onDescriptionChange: (description: string) => void;
  errors?: {
    latitude?: string;
    longitude?: string;
    locationDescription?: string;
  };
}

// Municipal baseline coordinates (Central Downtown)
const DEFAULT_CENTER = {
  lat: 40.7128,
  lng: -74.006,
};

type MapLayerType = 'google_roadmap' | 'google_satellite' | 'google_hybrid' | 'google_terrain' | 'osm';

const MAP_LAYERS: Record<MapLayerType, { name: string; url: string; subdomains?: string[]; maxZoom: number; attribution: string }> = {
  google_roadmap: {
    name: 'Google Roadmap',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
  google_satellite: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps Satellite',
  },
  google_hybrid: {
    name: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps Hybrid Imagery',
  },
  google_terrain: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps Terrain',
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  },
};

export function LocationPicker({
  latitude,
  longitude,
  locationDescription,
  onCoordinatesChange,
  onDescriptionChange,
  errors,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const markerRef = useRef<LeafletType.Marker | null>(null);
  const tileLayerRef = useRef<LeafletType.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('google_roadmap');
  const [geoLoading, setGeoLoading] = useState(false);
  const [fetchingNearest, setFetchingNearest] = useState(false);
  const [nearestResult, setNearestResult] = useState<{
    formattedAddress: string;
    street: string;
    neighborhood: string;
    wardName: string;
    googleMapsUrl: string;
    streetViewUrl: string;
    source: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const currentLat = latitude ?? DEFAULT_CENTER.lat;
  const currentLng = longitude ?? DEFAULT_CENTER.lng;

  // Reverse Geocode: Nearest Google Map Fetch
  const handleFetchNearest = useCallback(
    async (lat: number, lng: number, autoApplyText: boolean = false) => {
      setFetchingNearest(true);
      try {
        const result = await fetchNearestGoogleMapAddress(lat, lng);
        setNearestResult({
          formattedAddress: result.formattedAddress,
          street: result.street,
          neighborhood: result.neighborhood,
          wardName: result.wardName,
          googleMapsUrl: result.googleMapsUrl,
          streetViewUrl: result.streetViewUrl,
          source: result.source,
        });

        if (autoApplyText || !locationDescription.trim()) {
          onDescriptionChange(result.formattedAddress);
        }

        setStatusMessage({
          type: 'success',
          text: `Nearest location identified: ${result.street || result.formattedAddress}`,
        });
      } catch (err) {
        console.error('Reverse geocode error:', err);
      } finally {
        setFetchingNearest(false);
      }
    },
    [locationDescription, onDescriptionChange]
  );

  // Initialize Leaflet Map with Google Maps Tile Engine
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 14,
        zoomControl: true,
      });

      // Tile Layer: Google Maps Roadmap default
      const cfg = MAP_LAYERS.google_roadmap;
      const tileLayer = L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        attribution: cfg.attribution,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Add Municipal Ward Boundaries
      const wardLayer = L.layerGroup().addTo(map);
      CONFIGURED_MUNICIPAL_WARDS.forEach((w) => {
        const poly = L.polygon(w.polygon, {
          color: w.color,
          weight: 2,
          opacity: 0.8,
          fillColor: w.color,
          fillOpacity: 0.08,
          dashArray: '3, 4',
        });
        poly.bindTooltip(
          `<strong>${w.name}</strong><br/>Supervisor: ${w.supervisorName}`,
          { sticky: true }
        );
        wardLayer.addLayer(poly);
      });

      // Create Custom Pin Icon
      const pinIcon = L.divIcon({
        className: 'civoara-picker-pin',
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -100%);
            cursor: grab;
          ">
            <div style="
              width: 32px;
              height: 32px;
              background-color: #0369a1;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              border: 2px solid white;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div style="
              width: 2px;
              height: 6px;
              background-color: #0369a1;
            "></div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [0, 0],
      });

      // Place draggable Marker
      const marker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const lat = parseFloat(pos.lat.toFixed(6));
        const lng = parseFloat(pos.lng.toFixed(6));
        onCoordinatesChange(lat, lng);
        handleFetchNearest(lat, lng, false);
      });

      // Click to relocate pin
      map.on('click', (e: LeafletType.LeafletMouseEvent) => {
        const lat = parseFloat(e.latlng.lat.toFixed(6));
        const lng = parseFloat(e.latlng.lng.toFixed(6));
        marker.setLatLng([lat, lng]);
        onCoordinatesChange(lat, lng);
        handleFetchNearest(lat, lng, false);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Initial reverse geocode fetch
      handleFetchNearest(currentLat, currentLng, false);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position if coordinates change externally
  useEffect(() => {
    if (markerRef.current && latitude !== undefined && longitude !== undefined) {
      const pos = markerRef.current.getLatLng();
      if (pos.lat !== latitude || pos.lng !== longitude) {
        markerRef.current.setLatLng([latitude, longitude]);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([latitude, longitude]);
        }
      }
    }
  }, [latitude, longitude]);

  // Switch Google Maps Layer
  const switchLayer = async (layerKey: MapLayerType) => {
    if (!mapInstanceRef.current || activeLayer === layerKey) return;
    const L = (await import('leaflet')).default;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const cfg = MAP_LAYERS[layerKey];
    const newTileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
      subdomains: cfg.subdomains || ['a', 'b', 'c'],
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
    setActiveLayer(layerKey);
  };

  // Browser Geolocation
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage({
        type: 'error',
        text: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setGeoLoading(true);
    setStatusMessage({
      type: 'info',
      text: 'Acquiring high-precision GPS satellite fix...',
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        onCoordinatesChange(lat, lng);
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16);
        }

        handleFetchNearest(lat, lng, true);
        setGeoLoading(false);
        setStatusMessage({
          type: 'success',
          text: `GPS Location acquired (Accuracy: ±${accuracy}m). Address fetched.`,
        });
      },
      (err) => {
        setGeoLoading(false);
        let errorMsg = 'Could not acquire location.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Click or drag on the Google map to set pin.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'Location unavailable. Click directly on the Google map.';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'Location request timed out. Please click on the Google map.';
        }
        setStatusMessage({ type: 'error', text: errorMsg });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Forward Geocode Search
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const match = await searchAddressAction(searchQuery);
      if (match) {
        onCoordinatesChange(match.latitude, match.longitude);
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([match.latitude, match.longitude]);
          mapInstanceRef.current.setView([match.latitude, match.longitude], 16);
        }
        handleFetchNearest(match.latitude, match.longitude, true);
        setStatusMessage({
          type: 'success',
          text: `Centered map on: ${match.displayName}`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Location not found. Try entering cross-streets or a city landmark.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Address lookup error. Please click on the map directly.',
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            Incident Geospatial Pin & Coordinates <span className="text-rose-600">*</span>
          </label>
          <p className="text-xs text-slate-500">
            Click anywhere on the Google Map or drag the pin. The nearest verified municipal address is captured automatically.
          </p>
        </div>

        {/* GPS Consent Trigger */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRequestGeolocation}
            isLoading={geoLoading}
            leftIcon={<Navigation className="w-3.5 h-3.5 text-sky-700" />}
            className="bg-white border-slate-300"
          >
            Locate with GPS
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleFetchNearest(currentLat, currentLng, true)}
            isLoading={fetchingNearest}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-sky-700" />}
            title="Fetch nearest address from Google Maps"
          >
            Fetch Nearest Address
          </Button>
        </div>
      </div>

      {/* Address Search Bar */}
      <form onSubmit={handleSearchAddress} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search any street, intersection, or civic landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          size="md"
          isLoading={searching}
          disabled={!searchQuery.trim()}
        >
          Jump to Address
        </Button>
      </form>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-sky-50 border-sky-200 text-sky-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <Compass className="w-4 h-4 shrink-0 text-sky-600 animate-spin" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Interactive Google Map Container */}
      <div className="relative rounded-xl border border-slate-300 overflow-hidden shadow-xs bg-slate-900">
        {/* Layer Switcher Pill in Top-Right */}
        <div className="absolute top-3 right-3 z-20 flex items-center bg-white/95 backdrop-blur-none p-1 rounded-lg border border-slate-300 shadow-md text-xs">
          <div className="flex items-center gap-1 px-2 py-0.5 text-slate-600 font-semibold text-[11px]">
            <Layers className="w-3.5 h-3.5 text-sky-700" />
            <span>Map View:</span>
          </div>

          <button
            type="button"
            onClick={() => switchLayer('google_roadmap')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              activeLayer === 'google_roadmap'
                ? 'bg-sky-700 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Google Road
          </button>

          <button
            type="button"
            onClick={() => switchLayer('google_satellite')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              activeLayer === 'google_satellite'
                ? 'bg-sky-700 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>

          <button
            type="button"
            onClick={() => switchLayer('google_hybrid')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              activeLayer === 'google_hybrid'
                ? 'bg-sky-700 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Hybrid
          </button>

          <button
            type="button"
            onClick={() => switchLayer('google_terrain')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              activeLayer === 'google_terrain'
                ? 'bg-sky-700 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Leaflet Map Div */}
        <div
          ref={mapContainerRef}
          className="w-full h-80 sm:h-96 z-10"
          style={{ minHeight: '320px' }}
        />

        {/* Nearest Address Captured Bar Overlay (Bottom of Map) */}
        {nearestResult && (
          <div className="absolute bottom-3 inset-x-3 z-20 bg-white/95 p-3 rounded-lg border border-slate-300 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-bold text-sky-800 text-[11px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Nearest Google Address Captured
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {nearestResult.wardName}
                </span>
              </div>
              <p className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1">
                {nearestResult.formattedAddress}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={nearestResult.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors"
              >
                Google Maps
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href={nearestResult.streetViewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors"
              >
                Street View
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <button
                type="button"
                onClick={() => onDescriptionChange(nearestResult.formattedAddress)}
                className="px-2.5 py-1 rounded bg-sky-700 hover:bg-sky-800 text-white font-semibold text-[11px] transition-colors cursor-pointer"
              >
                Apply to Form
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Numerical Coordinate Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Latitude"
          type="number"
          step="0.000001"
          required
          value={latitude ?? ''}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0;
            onCoordinatesChange(val, longitude ?? DEFAULT_CENTER.lng);
            handleFetchNearest(val, longitude ?? DEFAULT_CENTER.lng, false);
          }}
          error={errors?.latitude}
          placeholder="e.g. 40.712800"
        />

        <Input
          label="Longitude"
          type="number"
          step="0.000001"
          required
          value={longitude ?? ''}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0;
            onCoordinatesChange(latitude ?? DEFAULT_CENTER.lat, val);
            handleFetchNearest(latitude ?? DEFAULT_CENTER.lat, val, false);
          }}
          error={errors?.longitude}
          placeholder="e.g. -74.006000"
        />
      </div>

      {/* Street Address / Landmark Description */}
      <Input
        label="Location Description / Street Address"
        required
        value={locationDescription}
        onChange={(e) => onDescriptionChange(e.target.value)}
        error={errors?.locationDescription}
        placeholder="e.g. 260 Broadway, Lower Manhattan, New York"
        helperText="Auto-populated with the nearest Google Map fetch. You may refine with building entrance or specific landmarks."
      />
    </div>
  );
}
