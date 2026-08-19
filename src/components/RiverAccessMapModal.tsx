import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Navigation,
  AlertTriangle,
  Anchor,
  Compass,
  Copy,
  Check,
  LifeBuoy,
  Footprints,
  Info,
  Trees,
  ShieldCheck,
  Activity,
  Waves,
  Download,
} from 'lucide-react';
import { RiverAccessPoint, FloatSafetyProfile, WadeSafetyProfile, TribalAccessProtocol } from '../types/steelhead';

interface RiverAccessMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  riverName: string;
  accessPoints: RiverAccessPoint[];
  floatSafety?: FloatSafetyProfile;
  wadeSafety?: WadeSafetyProfile;
  tribalProtocols?: TribalAccessProtocol;
  initialSelectedPointId?: string;
}

export const RiverAccessMapModal: React.FC<RiverAccessMapModalProps> = ({
  isOpen,
  onClose,
  riverName,
  accessPoints,
  floatSafety,
  wadeSafety,
  tribalProtocols,
  initialSelectedPointId,
}) => {
  const [selectedPointId, setSelectedPointId] = useState<string>(
    initialSelectedPointId || accessPoints[0]?.id || ''
  );
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (initialSelectedPointId) {
      setSelectedPointId(initialSelectedPointId);
    } else if (accessPoints.length > 0) {
      setSelectedPointId(accessPoints[0].id);
    }
  }, [initialSelectedPointId, accessPoints]);

  // Listen for message from Leaflet iframe when a pin is clicked
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SELECT_WAYPOINT' && event.data.id) {
        setSelectedPointId(event.data.id);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // When selectedPointId changes from React list, message iframe to fly to that pin
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow && selectedPointId) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'FLY_TO_WAYPOINT', id: selectedPointId },
        '*'
      );
    }
  }, [selectedPointId]);

  // When filterType changes, message iframe to filter visible pins and select first match if needed
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_FILTER', filterType },
        '*'
      );
    }
  }, [filterType]);

  if (!isOpen) return null;

  const filteredPoints = accessPoints.filter((pt) => {
    if (filterType === 'all') return true;
    if (filterType === 'trails') return pt.type === 'bushwhack' || pt.type === 'crown-land' || pt.type === 'railway-easement' || pt.type === 'walk-in';
    return pt.type === filterType;
  });

  const activePoint =
    filteredPoints.find((p) => p.id === selectedPointId) ||
    accessPoints.find((p) => p.id === selectedPointId) ||
    filteredPoints[0] ||
    accessPoints[0];

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    const newFiltered = accessPoints.filter((pt) => {
      if (type === 'all') return true;
      if (type === 'trails') return pt.type === 'bushwhack' || pt.type === 'crown-land' || pt.type === 'railway-easement' || pt.type === 'walk-in';
      return pt.type === type;
    });
    if (newFiltered.length > 0 && !newFiltered.some((p) => p.id === selectedPointId)) {
      setSelectedPointId(newFiltered[0].id);
    }
  };

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Export GPX with all waypoints for Apple Maps / Gaia GPS / Google Earth / Garmin
  const handleExportGPX = () => {
    const escapeXml = (unsafe: string) =>
      unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });

    const gpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Skeena Steelhead Tracker" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(riverName)} River Access Points</name>
    <desc>Verified launch points, bushwhack trails, and takeout routes for the ${escapeXml(riverName)} River.</desc>
  </metadata>
  ${accessPoints
    .map(
      (pt) => `
  <wpt lat="${pt.lat}" lon="${pt.lng}">
    <name>${escapeXml(pt.name)}</name>
    <desc>${escapeXml(pt.description)} | Access: ${escapeXml(pt.roadAccess)}${pt.bushwhackDifficulty ? ` | Trail: ${escapeXml(pt.bushwhackDifficulty)}` : ''}</desc>
    <type>${escapeXml(pt.type)}</type>
    <sym>${pt.type === 'put-in' ? 'Boat Ramp' : pt.type === 'hazard-canyon' ? 'Danger Area' : 'Trail Head'}</sym>
  </wpt>`
    )
    .join('')}
</gpx>`;

    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${riverName.toLowerCase().replace(/\s+/g, '-')}-waypoints.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPinIcon = (type: string) => {
    switch (type) {
      case 'put-in':
        return <Anchor className="w-3 h-3 text-emerald-500" />;
      case 'take-out':
        return <Navigation className="w-3 h-3 text-cyan-500" />;
      case 'hazard-canyon':
        return <AlertTriangle className="w-3 h-3 text-rose-500" />;
      case 'bushwhack':
        return <Compass className="w-3 h-3 text-amber-500" />;
      case 'crown-land':
        return <Trees className="w-3 h-3 text-emerald-500" />;
      case 'railway-easement':
        return <Activity className="w-3 h-3 text-indigo-500" />;
      case 'tribal-access':
        return <ShieldCheck className="w-3 h-3 text-purple-500" />;
      case 'bridge-access':
        return <Waves className="w-3 h-3 text-sky-500" />;
      case 'walk-in':
      default:
        return <Footprints className="w-3 h-3 text-amber-500" />;
    }
  };

  const getPinBadgeStyle = (type: string) => {
    switch (type) {
      case 'put-in':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold';
      case 'take-out':
        return 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-semibold';
      case 'hazard-canyon':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-semibold';
      case 'bushwhack':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold';
      case 'crown-land':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold';
      case 'railway-easement':
        return 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-semibold';
      case 'tribal-access':
        return 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 font-semibold';
      case 'bridge-access':
        return 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400 font-semibold';
      case 'walk-in':
      default:
        return 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold';
    }
  };

  // Generate Leaflet Multi-Marker HTML map with dynamic real-time category filtering
  const pointsJson = JSON.stringify(accessPoints);
  const activePointId = activePoint?.id || '';

  const leafletHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #0f172a; }
    .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.6);
      border: 2px solid white;
      font-size: 13px;
      cursor: pointer;
      transition: transform 0.15s ease-out;
    }
    .custom-pin:hover, .custom-pin.active {
      transform: scale(1.25);
      z-index: 1000 !important;
      border-color: #fef08a;
    }
    .pin-put-in { background: #10b981; }
    .pin-take-out { background: #06b6d4; }
    .pin-hazard-canyon { background: #f43f5e; }
    .pin-bushwhack { background: #f59e0b; }
    .pin-crown-land { background: #059669; }
    .pin-railway-easement { background: #6366f1; }
    .pin-tribal-access { background: #a855f7; }
    .pin-bridge-access { background: #0ea5e9; }
    .pin-walk-in { background: #d97706; }
    .leaflet-popup-content-wrapper {
      background: #1e293b;
      color: #f8fafc;
      border-radius: 8px;
      border: 1px solid #334155;
      font-family: sans-serif;
      padding: 2px;
    }
    .leaflet-popup-tip { background: #1e293b; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const points = ${pointsJson};
    let activeId = "${activePointId}";
    let currentFilter = "${filterType}";
    const markers = {};

    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    const getPinEmoji = (type) => {
      switch(type) {
        case 'put-in': return '⚓';
        case 'take-out': return '⛵';
        case 'hazard-canyon': return '⚠️';
        case 'bushwhack': return '🥾';
        case 'crown-land': return '🌲';
        case 'railway-easement': return '🚂';
        case 'tribal-access': return '🦅';
        case 'bridge-access': return '🌉';
        default: return '📍';
      }
    };

    const filterMatches = (pt, filter) => {
      if (filter === 'all') return true;
      if (filter === 'trails') return ['bushwhack', 'crown-land', 'railway-easement', 'walk-in'].includes(pt.type);
      return pt.type === filter;
    };

    points.forEach(pt => {
      const emoji = getPinEmoji(pt.type);
      const iconClass = 'custom-pin pin-' + pt.type + (pt.id === activeId ? ' active' : '');
      
      const customIcon = L.divIcon({
        className: 'pin-wrapper',
        html: '<div class="' + iconClass + '" id="pin-' + pt.id + '">' + emoji + '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });
      
      marker.bindPopup(
        '<div style="font-size:11px;line-height:1.3;padding:2px;">' +
          '<strong style="font-size:12px;display:block;margin-bottom:2px;color:#38bdf8;">' + pt.name + '</strong>' +
          '<span style="font-size:9px;text-transform:uppercase;font-weight:bold;color:#94a3b8;display:block;margin-bottom:3px;">' + pt.type + ' &bull; ' + pt.roadAccess + '</span>' +
          '<p style="margin:0 0 4px 0;color:#cbd5e1;font-size:10px;">' + pt.description + '</p>' +
          '<span style="font-size:9px;font-family:monospace;color:#64748b;">GPS: ' + pt.lat.toFixed(4) + ', ' + pt.lng.toFixed(4) + '</span>' +
        '</div>'
      );

      marker.on('click', () => {
        window.parent.postMessage({ type: 'SELECT_WAYPOINT', id: pt.id }, '*');
      });

      markers[pt.id] = { marker, pt };
    });

    function applyFilter(filter) {
      currentFilter = filter;
      const visibleLatLngs = [];
      points.forEach(pt => {
        const item = markers[pt.id];
        if (filterMatches(pt, filter)) {
          if (!map.hasLayer(item.marker)) {
            item.marker.addTo(map);
          }
          visibleLatLngs.push([pt.lat, pt.lng]);
        } else {
          if (map.hasLayer(item.marker)) {
            map.removeLayer(item.marker);
          }
        }
      });
      if (visibleLatLngs.length > 0) {
        map.fitBounds(L.latLngBounds(visibleLatLngs), { padding: [30, 30], maxZoom: 13 });
      }
    }

    applyFilter(currentFilter);

    // Handle messages from parent React component
    window.addEventListener('message', (event) => {
      if (!event.data) return;
      if (event.data.type === 'SET_FILTER') {
        applyFilter(event.data.filterType);
      } else if (event.data.type === 'FLY_TO_WAYPOINT' && event.data.id) {
        const item = markers[event.data.id];
        if (item) {
          if (!map.hasLayer(item.marker)) {
            item.marker.addTo(map);
          }
          map.flyTo(item.marker.getLatLng(), 13, { duration: 0.6 });
          item.marker.openPopup();
          
          document.querySelectorAll('.custom-pin').forEach(el => el.classList.remove('active'));
          const pinEl = document.getElementById('pin-' + event.data.id);
          if (pinEl) pinEl.classList.add('active');
        }
      }
    });
  </script>
</body>
</html>`;

  // Apple Maps URL
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(activePoint?.name || riverName)}&ll=${activePoint?.lat},${activePoint?.lng}&t=m`;
  
  // Google Maps URL
  const googleMapsUrl = activePoint?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${activePoint?.lat},${activePoint?.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-main)] bg-[var(--bg-card)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--accent-teal)] shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-heading font-extrabold text-[var(--text-main)] truncate">
                  {riverName} &bull; River Access
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)] whitespace-nowrap">
                  {filteredPoints.length}/{accessPoints.length} Pins
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Compact GPX Export Button */}
            <button
              onClick={handleExportGPX}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
              title="Download GPX for Apple Maps, Gaia GPS, OnX, Google Earth"
            >
              <Download className="w-3 h-3 text-[var(--accent-teal)]" />
              <span>GPX</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-y-auto lg:overflow-hidden bg-[var(--bg-surface)]">
          {/* Left Column: Waypoints list & Protocols (5 cols on lg) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[var(--border-main)] p-3 flex flex-col gap-2.5 min-h-0 lg:h-full lg:overflow-y-auto">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs font-mono shrink-0">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'all'
                    ? 'bg-[var(--accent-teal)] text-white border-[var(--accent-teal)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                All ({accessPoints.length})
              </button>
              <button
                onClick={() => handleFilterChange('put-in')}
                className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'put-in'
                    ? 'bg-[var(--accent-teal)] text-white border-[var(--accent-teal)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                ⚓ Put-In
              </button>
              <button
                onClick={() => handleFilterChange('take-out')}
                className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'take-out'
                    ? 'bg-[var(--accent-teal)] text-white border-[var(--accent-teal)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                ⛵ Take-Out
              </button>
              <button
                onClick={() => handleFilterChange('trails')}
                className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'trails'
                    ? 'bg-[var(--accent-teal)] text-white border-[var(--accent-teal)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                🥾 Trails
              </button>
              <button
                onClick={() => handleFilterChange('hazard-canyon')}
                className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'hazard-canyon'
                    ? 'bg-[var(--accent-teal)] text-white border-[var(--accent-teal)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                ⚠️ Hazards
              </button>
            </div>

            {/* Waypoints Selection List */}
            <div className="space-y-1.5 flex-1 min-h-[180px] overflow-y-auto pr-1">
              {filteredPoints.map((pt) => {
                const isSelected = pt.id === activePoint?.id;
                return (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedPointId(pt.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-[var(--bg-card)] border-[var(--accent-teal)] shadow-sm ring-1 ring-[var(--accent-teal)]/30'
                        : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--accent-teal)]/50'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`p-0.5 rounded border text-[10px] ${getPinBadgeStyle(pt.type)}`}>
                          {getPinIcon(pt.type)}
                        </span>
                        <span className="font-heading font-bold text-xs text-[var(--text-main)] truncate">
                          {pt.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 font-mono">
                        {pt.roadAccess}
                      </p>
                      {pt.bushwhackDifficulty && (
                        <span className="inline-block text-[9px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                          {pt.bushwhackDifficulty}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-[var(--text-muted)] whitespace-nowrap pt-0.5">
                      {pt.lat.toFixed(2)}°, {pt.lng.toFixed(2)}°
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tribal Access Protocol Card */}
            {tribalProtocols && (
              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1 text-[11px] font-mono shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-main)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                    <span>{tribalProtocols.nation}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      tribalProtocols.permitRequired
                        ? 'bg-rose-500/15 border border-rose-500/40 text-rose-500'
                        : 'bg-teal-500/15 border border-teal-500/40 text-[var(--accent-teal)]'
                    }`}
                  >
                    {tribalProtocols.permitRequired ? 'Permit Req.' : 'Crown Land'}
                  </span>
                </div>
                <p className="text-[10px] font-sans text-[var(--text-secondary)] line-clamp-2">{tribalProtocols.permitDetails}</p>
              </div>
            )}

            {/* Float & Wading Quick Safety Badges */}
            {(floatSafety || wadeSafety) && (
              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5 text-[11px] font-mono shrink-0">
                {floatSafety && (
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-[var(--text-main)]">
                      <LifeBuoy className="w-3 h-3 text-[var(--accent-teal)]" />
                      <span>Float: <strong>{floatSafety.rating}</strong></span>
                    </div>
                    <span className="text-[var(--text-secondary)]">{floatSafety.whitewaterClass}</span>
                  </div>
                )}
                {wadeSafety && (
                  <div className="pt-1.5 border-t border-[var(--border-main)] flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-[var(--text-main)]">
                      <Footprints className="w-3 h-3 text-[var(--accent-teal)]" />
                      <span>Wading: <strong>{wadeSafety.difficulty}</strong></span>
                    </div>
                    <span className="text-[var(--text-secondary)]">{wadeSafety.bankAccessibility}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Embedded Multi-Pin Interactive Map & Waypoint Inspector (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 lg:h-full lg:overflow-y-auto bg-[var(--bg-surface)]">
            {/* Interactive Multi-Marker Map Frame */}
            <div className="relative h-60 sm:h-72 lg:h-72 w-full bg-[var(--bg-card)] border-b border-[var(--border-main)] shrink-0 overflow-hidden">
              <iframe
                ref={iframeRef}
                title={`Interactive Multi-Pin Map of ${riverName}`}
                srcDoc={leafletHtml}
                className="w-full h-full border-0"
                loading="lazy"
              />

              {/* Map Floating Overlay Controls */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10 gap-1.5">
                <div className="px-2 py-1 rounded-md bg-black/85 backdrop-blur-sm border border-white/10 text-white text-[11px] font-mono flex items-center gap-1.5 pointer-events-auto shadow-sm max-w-[140px] sm:max-w-[220px] truncate">
                  <MapPin className="w-3 h-3 text-[var(--accent-teal)] shrink-0" />
                  <span className="font-bold truncate">{activePoint?.name}</span>
                </div>

                <div className="flex items-center gap-1 pointer-events-auto">
                  {/* Compact Apple Maps button */}
                  <a
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-[10px] font-mono flex items-center gap-1 border border-white/10 transition-colors shadow-sm whitespace-nowrap"
                    title="Open in Apple Maps"
                  >
                    <span>Apple</span>
                    <ExternalLink className="w-2.5 h-2.5 text-sky-400" />
                  </a>

                  {/* Compact Google Maps button */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-[var(--accent-teal)] hover:opacity-90 text-white font-bold text-[10px] font-mono flex items-center gap-1 transition-opacity shadow-sm whitespace-nowrap"
                    title="Open in Google Maps"
                  >
                    <span>Google</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Bottom Coordinates & Pins Plotted Count */}
              <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-sm border border-white/10 text-[9px] font-mono text-white flex items-center gap-1.5 pointer-events-auto z-10">
                <span>{activePoint?.lat.toFixed(4)}°, {activePoint?.lng.toFixed(4)}°</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-[var(--accent-teal)] font-bold">{filteredPoints.length} Visible</span>
              </div>
            </div>

            {/* Active Waypoint Dossier Details */}
            {activePoint && (
              <div className="p-3 sm:p-4 space-y-3 font-mono text-xs flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-main)] pb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase border ${getPinBadgeStyle(activePoint.type)}`}>
                        {activePoint.type.toUpperCase()}
                      </span>
                      <h4 className="font-heading font-extrabold text-xs sm:text-sm text-[var(--text-main)] truncate">
                        {activePoint.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5 truncate">
                      📍 {activePoint.roadAccess}
                    </p>
                  </div>

                  {/* Action Buttons: GPS, Apple, Google */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleCopyCoords(activePoint.lat, activePoint.lng)}
                      className="px-2 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--border-light)] font-semibold transition-colors flex items-center gap-1 text-[11px] shadow-sm whitespace-nowrap"
                      title="Copy GPS coordinates"
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>GPS</span>
                        </>
                      )}
                    </button>

                    <a
                      href={appleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--border-light)] font-semibold transition-colors flex items-center gap-1 text-[11px] shadow-sm whitespace-nowrap"
                      title="Open in Apple Maps"
                    >
                      <Navigation className="w-3 h-3 text-sky-500" />
                      <span>Apple</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activePoint.lat},${activePoint.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-md bg-[var(--accent-teal)] hover:opacity-90 text-white font-bold transition-opacity shadow-sm flex items-center gap-1 text-[11px] whitespace-nowrap"
                      title="Open in Google Maps"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Google</span>
                    </a>
                  </div>
                </div>

                {/* Land Tenure & Bushwhacking info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activePoint.landTenure && (
                    <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] space-y-0.5">
                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                        Jurisdiction / Tenure:
                      </span>
                      <span className="text-[var(--text-main)] font-semibold text-[11px] block">
                        🏛️ {activePoint.landTenure}
                      </span>
                    </div>
                  )}

                  {activePoint.bushwhackDifficulty && (
                    <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] space-y-0.5">
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase block">
                        Trail &amp; Terrain:
                      </span>
                      <span className="text-[var(--text-main)] font-semibold text-[11px] block">
                        {activePoint.bushwhackDifficulty}
                      </span>
                    </div>
                  )}
                </div>

                {/* Waypoint Description */}
                <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] space-y-0.5">
                  <span className="text-[9px] font-bold text-[var(--accent-teal)] uppercase tracking-wider block">
                    Access &amp; Tactical Description:
                  </span>
                  <p className="font-sans text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                    {activePoint.description}
                  </p>
                </div>

                {/* Vessel Suitability & Float Times */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activePoint.vesselSuitability && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] space-y-0.5">
                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                        Vessel Suitability:
                      </span>
                      <span className="text-[var(--text-main)] font-semibold text-[11px] block">
                        {activePoint.vesselSuitability}
                      </span>
                    </div>
                  )}

                  {floatSafety?.typicalFloatTimes && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] space-y-0.5">
                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                        Standard Float Times:
                      </span>
                      <span className="text-[var(--text-main)] font-semibold text-[11px] block">
                        {floatSafety.typicalFloatTimes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hazard Warnings Alert Box */}
                {floatSafety?.hazardWarnings && floatSafety.hazardWarnings.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-rose-500">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Navigational &amp; Safety Hazards:</span>
                    </div>
                    <ul className="space-y-0.5 pl-4 list-disc font-sans text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
                      {floatSafety.hazardWarnings.map((hz, i) => (
                        <li key={i}>{hz}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-main)] bg-[var(--bg-card)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Info className="w-3.5 h-3.5 text-[var(--accent-teal)] shrink-0" />
            <span className="truncate">Carry bear spray, PFDs, and InReach/satellite SOS.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] font-bold hover:bg-[var(--border-light)] transition-colors shadow-sm ml-2 shrink-0 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
