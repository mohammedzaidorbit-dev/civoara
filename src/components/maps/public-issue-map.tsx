'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import type * as LeafletType from 'leaflet';
import {
  MapPin,
  List,
  Map as MapIcon,
  Search,
  ExternalLink,
  RotateCcw,
  Layers,
  PlusCircle,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { CONFIGURED_MUNICIPAL_WARDS } from '@/services/ward.service';
import { getPublicMapIncidentsAction } from '@/lib/actions/incident';
import { searchAddressAction } from '@/lib/actions/geocoding';

export interface PublicMapIncident {
  id: string;
  ticketNumber: string;
  title: string;
  category: 'pothole' | 'garbage' | 'broken_streetlight' | 'water_leakage' | 'other';
  wardId: string | null;
  wardName: string;
  status: 'submitted' | 'triaged' | 'assigned' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  locationDescription: string;
  reportedAt: string;
  photoUrl?: string;
}

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
    attribution: '&copy; Google Maps Satellite Imagery',
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

interface PublicIssueMapProps {
  initialIncidents?: PublicMapIncident[];
}

export function PublicIssueMap({ initialIncidents }: PublicIssueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const markersLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const tileLayerRef = useRef<LeafletType.TileLayer | null>(null);

  // Live Incident Dataset from DB (strictly zero dummy/mock data)
  const [incidents, setIncidents] = useState<PublicMapIncident[]>(initialIncidents || []);
  const [loading, setLoading] = useState(!initialIncidents);

  // Filters State
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('google_roadmap');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [jumpQuery, setJumpQuery] = useState('');
  const [jumping, setJumping] = useState(false);

  // Load real incidents from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadRealIncidents() {
      try {
        const liveData = await getPublicMapIncidentsAction();
        if (isMounted) {
          setIncidents(liveData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load map incidents:', err);
        if (isMounted) setLoading(false);
      }
    }

    if (!initialIncidents) {
      loadRealIncidents();
    }
    return () => {
      isMounted = false;
    };
  }, [initialIncidents]);

  // Filtered dataset
  const filteredIncidents = incidents.filter((item) => {
    // Search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchText =
        item.ticketNumber.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.locationDescription.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    // Category match
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Ward match
    if (selectedWard !== 'all') {
      if (selectedWard === 'unassigned') {
        if (item.wardId !== null) return false;
      } else if (item.wardId !== selectedWard) {
        return false;
      }
    }

    // Status match
    if (selectedStatus !== 'all' && item.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  // Category Color & Badge Code
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'pothole':
        return { color: '#d97706', code: 'P' }; // Amber
      case 'water_leakage':
        return { color: '#0284c7', code: 'W' }; // Blue
      case 'broken_streetlight':
        return { color: '#0f766e', code: 'L' }; // Teal
      case 'garbage':
        return { color: '#059669', code: 'G' }; // Emerald
      default:
        return { color: '#475569', code: 'O' }; // Slate
    }
  };

  const renderMarkers = useCallback(
    (
      L: typeof LeafletType,
      _map: LeafletType.Map,
      layer: LeafletType.LayerGroup,
      dataset: PublicMapIncident[]
    ) => {
      layer.clearLayers();

      if (dataset.length === 0) return;

      dataset.forEach((item) => {
        const theme = getCategoryTheme(item.category);

        const html = `
          <div style="
            background-color: ${theme.color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            border: 2px solid white;
            cursor: pointer;
          ">
            <span style="font-size: 13px; font-weight: 800; font-family: ui-sans-serif, system-ui, sans-serif; color: white; line-height: 1;">${theme.code}</span>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: 'civoara-leaflet-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
        const googleStreetViewLink = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${item.latitude},${item.longitude}`;

        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 240px; padding: 4px;">
            <div style="font-size: 10px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
              ${item.ticketNumber} &bull; ${item.wardName}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 4px 0;">
              ${item.title}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
              ${item.locationDescription}
            </div>
            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; background: #e0f2fe; color: #0369a1; text-transform: capitalize;">
                ${item.category.replace('_', ' ')}
              </span>
              <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; background: #f1f5f9; color: #334155; text-transform: uppercase;">
                ${item.status}
              </span>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
              <a href="/public/track?id=${encodeURIComponent(
                item.ticketNumber
              )}" style="font-size: 11px; font-weight: 700; color: #0369a1; text-decoration: none;">
                Track Operational Progress &rarr;
              </a>
              <div style="display: flex; gap: 10px; margin-top: 2px;">
                <a href="${googleMapsLink}" target="_blank" rel="noreferrer" style="font-size: 10px; font-weight: 600; color: #475569; text-decoration: underline;">
                  Google Maps View
                </a>
                <a href="${googleStreetViewLink}" target="_blank" rel="noreferrer" style="font-size: 10px; font-weight: 600; color: #475569; text-decoration: underline;">
                  Street View
                </a>
              </div>
            </div>
          </div>
        `;

        const marker = L.marker([item.latitude, item.longitude], { icon });
        marker.bindPopup(popupContent);
        layer.addLayer(marker);
      });
    },
    []
  );

  // Initialize Leaflet Map (Client-side Only) with Google Maps Layer
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Create Map centered on Central Municipal Grid
      const map = L.map(mapContainerRef.current, {
        center: [40.715, -74.005],
        zoom: 13,
        zoomControl: true,
      });

      // Default: Google Roadmap Layer
      const cfg = MAP_LAYERS.google_roadmap;
      const tileLayer = L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        attribution: cfg.attribution,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Layer Group for Ward Boundaries
      const wardLayer = L.layerGroup().addTo(map);
      CONFIGURED_MUNICIPAL_WARDS.forEach((w) => {
        const poly = L.polygon(w.polygon, {
          color: w.color,
          weight: 2,
          opacity: 0.8,
          fillColor: w.color,
          fillOpacity: 0.08,
          dashArray: '4, 4',
        });
        poly.bindTooltip(
          `<strong>${w.name}</strong><br/>Supervisor: ${w.supervisorName}<br/>Pop: ${w.population.toLocaleString()}`,
          { sticky: true }
        );
        wardLayer.addLayer(poly);
      });

      // Layer Group for Incident Markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      renderMarkers(L, map, markersLayer, filteredIncidents);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [filteredIncidents, renderMarkers]);

  // Update Markers whenever filters or data change
  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current || !markersLayerRef.current) return;
      const L = (await import('leaflet')).default;
      renderMarkers(L, mapInstanceRef.current, markersLayerRef.current, filteredIncidents);
    }

    if (viewMode === 'map') {
      updateMarkers();
    }
  }, [filteredIncidents, viewMode, renderMarkers]);

  // Switch Tile Layer
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

  // Jump to Address on Map
  const handleJumpToAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumpQuery.trim() || !mapInstanceRef.current) return;

    setJumping(true);
    try {
      const match = await searchAddressAction(jumpQuery);
      if (match && mapInstanceRef.current) {
        mapInstanceRef.current.setView([match.latitude, match.longitude], 15);
      }
    } catch (err) {
      console.error('Jump error:', err);
    } finally {
      setJumping(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedWard('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-4">
      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by ticket ID, title, or address..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Jump to Map Address Form */}
          <form onSubmit={handleJumpToAddress} className="flex gap-2 max-w-sm w-full lg:w-auto">
            <Input
              placeholder="Jump to address / landmark..."
              value={jumpQuery}
              onChange={(e) => setJumpQuery(e.target.value)}
              className="text-xs"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              isLoading={jumping}
              disabled={!jumpQuery.trim()}
              className="shrink-0"
            >
              Jump
            </Button>
          </form>

          {/* Map / List View Toggle & Reset */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <Button
              type="button"
              variant={viewMode === 'map' ? 'navy' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              leftIcon={<MapIcon className="w-4 h-4" />}
            >
              Map View
            </Button>

            <Button
              type="button"
              variant={viewMode === 'list' ? 'navy' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              leftIcon={<List className="w-4 h-4" />}
            >
              List View
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Multi-filter row: Category, Ward, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <Select
            label="Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'pothole', label: 'Pothole' },
              { value: 'garbage', label: 'Garbage' },
              { value: 'broken_streetlight', label: 'Broken streetlight' },
              { value: 'water_leakage', label: 'Water leakage' },
              { value: 'other', label: 'Other Hazards' },
            ]}
          />

          <Select
            label="Ward Boundary"
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            options={[
              { value: 'all', label: 'All City Wards' },
              { value: '10000000-0000-0000-0000-000000000001', label: 'Ward 1: Central Downtown' },
              { value: '10000000-0000-0000-0000-000000000002', label: 'Ward 2: North Oakridge' },
              { value: '10000000-0000-0000-0000-000000000003', label: 'Ward 3: East Riverfront' },
              { value: '10000000-0000-0000-0000-000000000004', label: 'Ward 4: West Pine Valley' },
              { value: '10000000-0000-0000-0000-000000000005', label: 'Ward 5: South Industrial' },
              { value: 'unassigned', label: 'Unassigned (Outside Wards)' },
            ]}
          />

          <Select
            label="Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'submitted', label: 'Submitted (Intake)' },
              { value: 'assigned', label: 'Assigned to Ward Crew' },
              { value: 'in_progress', label: 'In Progress (Active Onsite)' },
              { value: 'resolved', label: 'Resolved (Closed)' },
            ]}
          />
        </div>

        {/* Results Count Banner */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
          <span>
            {loading ? (
              'Loading verified municipal incidents from database...'
            ) : (
              <>
                Showing <strong className="text-slate-900">{filteredIncidents.length}</strong> active public incidents
              </>
            )}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Google Maps Engine &bull; PostGIS Geolocation
          </span>
        </div>
      </div>

      {/* VIEW MODE: Leaflet Google Map */}
      {viewMode === 'map' && (
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-slate-100">
          {/* Layer Switcher Pill Overlay */}
          <div className="absolute top-3 right-3 z-20 flex items-center bg-white/95 p-1 rounded-lg border border-slate-300 shadow-md text-xs">
            <div className="flex items-center gap-1 px-2 py-0.5 text-slate-600 font-semibold text-[11px]">
              <Layers className="w-3.5 h-3.5 text-sky-700" />
              <span>Map Layer:</span>
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

            <button
              type="button"
              onClick={() => switchLayer('osm')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                activeLayer === 'osm'
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              OSM
            </button>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[540px] z-10"
            style={{ minHeight: '540px' }}
          />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-20 bg-white p-3 rounded-lg border border-slate-300 shadow-md text-xs space-y-2 pointer-events-auto">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Incident Map Legend
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>Pothole (P)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span>Water Leakage (W)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-700 inline-block" />
                <span>Streetlight (L)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span>Garbage (G)</span>
              </div>
            </div>
          </div>

          {/* Zero Reports Notice Overlay on Map */}
          {!loading && filteredIncidents.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/95 p-6 rounded-2xl border border-slate-200 shadow-xl max-w-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-700 mx-auto flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Civic Grid Clear
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  No public incidents match your current filter criteria. All municipal systems are operating normally.
                </p>
              </div>
              <Link href="/report">
                <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Report New Issue
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: List Table */}
      {viewMode === 'list' && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-0">
            {filteredIncidents.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">No Incidents Found</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    No active civic issues match your selected filters in the municipal ledger.
                  </p>
                </div>
                <Link href="/report">
                  <Button variant="outline" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Submit Incident Report
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Title & Location</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Ward Boundary</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-slate-900">
                        {item.ticketNumber}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 line-clamp-1 max-w-sm">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-sm">{item.locationDescription}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                          {item.category.replace('_', ' ')}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-slate-700">
                        {item.wardName}
                      </TableCell>

                      <TableCell>
                        <PriorityBadge priority={item.priority} />
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/public/track?id=${encodeURIComponent(item.ticketNumber)}`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                          >
                            Track
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
