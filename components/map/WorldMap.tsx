"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapRegion, MapRegionDetail, getMapRegions, getMapRegionDetail } from "@/lib/api";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import RegionPanel from "./RegionPanel";

const COUNTRIES_GEOJSON =
  "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson";

// Dark map style using CARTO Dark Matter tiles — no API key required
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© CARTO © OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "carto-dark-layer", type: "raster", source: "carto-dark" },
  ],
};

// Country name lookup by ISO alpha-2 (Natural Earth uses "admin" field too,
// but this gives friendly names for the panel header)
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", DE: "Germany",
  FR: "France", CN: "China", JP: "Japan", IN: "India", AU: "Australia",
  BR: "Brazil", MX: "Mexico", KR: "South Korea", IT: "Italy", ES: "Spain",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland",
  PL: "Poland", CZ: "Czech Republic", AT: "Austria", CH: "Switzerland",
  BE: "Belgium", PT: "Portugal", IE: "Ireland", SG: "Singapore",
  NZ: "New Zealand", ZA: "South Africa", NG: "Nigeria", EG: "Egypt",
  SA: "Saudi Arabia", AE: "UAE", IL: "Israel", TR: "Turkey", RU: "Russia",
  UA: "Ukraine", AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru",
  ID: "Indonesia", TH: "Thailand", VN: "Vietnam", PH: "Philippines",
  MY: "Malaysia", PK: "Pakistan", BD: "Bangladesh", HK: "Hong Kong",
  TW: "Taiwan", GR: "Greece", HU: "Hungary", RO: "Romania", SK: "Slovakia",
};

function countryLabel(iso2: string, adminName: string): string {
  return COUNTRY_NAMES[iso2] ?? adminName ?? iso2;
}


export default function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredId = useRef<string | number | undefined>(undefined);
  const selectedId = useRef<string | number | undefined>(undefined);
  const rawGeoRef = useRef<GeoJSON.FeatureCollection | null>(null);

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [regions, setRegions] = useState<MapRegion[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Panel state
  const [panelCountryName, setPanelCountryName] = useState("");
  const [panelDetail, setPanelDetail] = useState<MapRegionDetail | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => { setUser(getCurrentUser()); }, []);

  // ── Fetch region data ──────────────────────────────────────────────────────
  useEffect(() => {
    getMapRegions()
      .then(({ regions }) => setRegions(regions))
      .catch(err => console.error("[WorldMap] regions fetch failed:", err));
  }, []);

  // ── Build region lookup ────────────────────────────────────────────────────
  const regionByCode = useCallback(() => {
    const m: Record<string, MapRegion> = {};
    regions.forEach(r => { m[r.country_code] = r; });
    return m;
  }, [regions]);

  // ── Handle country click ───────────────────────────────────────────────────
  const handleCountryClick = useCallback(async (iso2: string, adminName: string) => {
    const label = countryLabel(iso2, adminName);
    setPanelCountryName(label);
    setPanelDetail(null);
    setPanelOpen(true);
    setPanelLoading(true);
    try {
      const detail = await getMapRegionDetail(iso2);
      setPanelDetail(detail);
    } catch {
      setPanelDetail({ country_code: iso2, suppliers: [], summary: { avg_trust_score: 0, avg_reliability_score: 0, supplier_count: 0, product_count: 0 } });
    } finally {
      setPanelLoading(false);
    }
  }, []);

  // ── Update country colors when regions load / map ready ───────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || regions.length === 0) return;
    const map = mapRef.current;
    if (!map.getSource("countries")) return;

    const lookup = regionByCode();
    if (rawGeoRef.current) {
      (map.getSource("countries") as maplibregl.GeoJSONSource).setData(
        buildEnrichedGeoJSON(rawGeoRef.current, lookup)
      );
    }
  }, [regions, mapReady, regionByCode]);

  // ── Initialize map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [10, 20],
      zoom: 1.6,
      minZoom: 1,
      maxZoom: 8,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    mapRef.current = map;

    map.on("load", async () => {
      try {
        const res = await fetch(COUNTRIES_GEOJSON);
        if (!res.ok) throw new Error("Countries GeoJSON failed to load");
        const rawGeo: GeoJSON.FeatureCollection = await res.json();
        rawGeoRef.current = rawGeo;

        const lookup = regionByCode();
        const enriched = buildEnrichedGeoJSON(rawGeo, lookup);

        map.addSource("countries", {
          type: "geojson",
          data: enriched,
          generateId: true,
        });

        // Base country fill — color driven by supplier activity
        map.addLayer({
          id: "countries-fill",
          type: "fill",
          source: "countries",
          paint: {
            "fill-color": [
              "interpolate", ["linear"],
              ["coalesce", ["get", "supplierCount"], 0],
              0, "rgba(0,245,196,0.0)",
              1, "rgba(0,245,196,0.12)",
              3, "rgba(0,245,196,0.28)",
              6, "rgba(0,245,196,0.50)",
              10, "rgba(0,245,196,0.72)",
            ],
            "fill-opacity": 1,
          },
        });

        // Country borders
        map.addLayer({
          id: "countries-border",
          type: "line",
          source: "countries",
          paint: {
            "line-color": "rgba(184,188,200,0.18)",
            "line-width": 0.6,
          },
        });

        // Hover highlight
        map.addLayer({
          id: "countries-hover",
          type: "fill",
          source: "countries",
          paint: {
            "fill-color": "rgba(0,245,196,0.18)",
            "fill-opacity": [
              "case", ["boolean", ["feature-state", "hover"], false], 1, 0,
            ],
          },
        });

        // Selected highlight
        map.addLayer({
          id: "countries-selected",
          type: "fill",
          source: "countries",
          paint: {
            "fill-color": "rgba(0,245,196,0.30)",
            "fill-opacity": [
              "case", ["boolean", ["feature-state", "selected"], false], 1, 0,
            ],
          },
        });

        // Selected border ring
        map.addLayer({
          id: "countries-selected-border",
          type: "line",
          source: "countries",
          paint: {
            "line-color": "#00F5C4",
            "line-width": [
              "case", ["boolean", ["feature-state", "selected"], false], 1.5, 0,
            ],
          },
        });

        setMapReady(true);
      } catch (err) {
        console.error("[WorldMap] load error:", err);
        setLoadError("Failed to load map data. Check your network connection.");
      }
    });

    // ── Hover ────────────────────────────────────────────────────────────────
    map.on("mousemove", "countries-fill", e => {
      const feature = e.features?.[0];
      if (!feature) return;
      const fid = feature.id;

      if (hoveredId.current !== fid) {
        if (hoveredId.current !== undefined) {
          map.setFeatureState({ source: "countries", id: hoveredId.current }, { hover: false });
        }
        hoveredId.current = fid;
        if (fid !== undefined) {
          map.setFeatureState({ source: "countries", id: fid }, { hover: true });
        }
      }

      const name = countryLabel(
        String(feature.properties?.iso_a2 ?? ""),
        String(feature.properties?.admin ?? ""),
      );
      const count = feature.properties?.supplierCount ?? 0;
      const tipText = count > 0
        ? `${name} · ${count} supplier${count !== 1 ? "s" : ""}`
        : name;
      setTooltip({ x: e.point.x, y: e.point.y, text: tipText });
    });

    map.on("mouseleave", "countries-fill", () => {
      if (hoveredId.current !== undefined) {
        map.setFeatureState({ source: "countries", id: hoveredId.current }, { hover: false });
        hoveredId.current = undefined;
      }
      setTooltip(null);
    });

    map.on("mouseenter", "countries-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    // ── Click ────────────────────────────────────────────────────────────────
    map.on("click", "countries-fill", e => {
      const feature = e.features?.[0];
      if (!feature) return;
      const fid = feature.id;
      const iso2 = String(feature.properties?.iso_a2 ?? "");
      const admin = String(feature.properties?.admin ?? "");

      if (selectedId.current !== undefined) {
        map.setFeatureState({ source: "countries", id: selectedId.current }, { selected: false });
      }
      selectedId.current = fid;
      if (fid !== undefined) {
        map.setFeatureState({ source: "countries", id: fid }, { selected: true });
      }

      if (iso2 && iso2 !== "-99") {
        handleCountryClick(iso2, admin);
      }
    });

    // Click on empty ocean — deselect
    map.on("click", e => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["countries-fill"] });
      if (features.length === 0) {
        if (selectedId.current !== undefined) {
          map.setFeatureState({ source: "countries", id: selectedId.current }, { selected: false });
          selectedId.current = undefined;
        }
        setPanelOpen(false);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePanelClose = useCallback(() => {
    setPanelOpen(false);
    if (selectedId.current !== undefined && mapRef.current) {
      mapRef.current.setFeatureState({ source: "countries", id: selectedId.current }, { selected: false });
      selectedId.current = undefined;
    }
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Map container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Error overlay */}
      {loadError && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "rgba(8,10,15,0.85)",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 6 }}>{loadError}</div>
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {!mapReady && !loadError && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "var(--obsidian)",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "2px solid var(--surface3)",
              borderTopColor: "var(--mint)",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }} />
            <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--text-dim)" }} className="font-orbitron">
              LOADING MAP
            </div>
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: tooltip.x + 12, top: tooltip.y - 10,
          background: "var(--surface2)", border: "1px solid var(--border-mint)",
          borderRadius: 4, padding: "5px 9px",
          fontSize: 10, color: "var(--text-primary)",
          pointerEvents: "none", whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}>
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      {mapReady && (
        <div style={{
          position: "absolute", bottom: 32, left: 12,
          background: "rgba(14,17,24,0.88)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "10px 12px",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{ fontSize: 7, letterSpacing: 1.5, color: "var(--text-dim)", marginBottom: 7 }} className="font-orbitron">
            SUPPLIER DENSITY
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 1 }}>
              {["rgba(0,245,196,0.06)", "rgba(0,245,196,0.20)", "rgba(0,245,196,0.38)", "rgba(0,245,196,0.56)", "rgba(0,245,196,0.72)"].map((c, i) => (
                <div key={i} style={{ width: 18, height: 10, background: c, borderRadius: i === 0 ? "2px 0 0 2px" : i === 4 ? "0 2px 2px 0" : 0 }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: 90, fontSize: 7, color: "var(--text-dim)" }}>
              <span>0</span><span>5+</span><span>10+</span>
            </div>
          </div>
        </div>
      )}

      {/* Region count badge */}
      {mapReady && regions.length > 0 && (
        <div style={{
          position: "absolute", top: 12, right: panelOpen ? 332 : 12,
          background: "rgba(14,17,24,0.88)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "7px 12px",
          transition: "right 0.3s",
        }}>
          <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: 0.5 }}>
            {regions.length} region{regions.length !== 1 ? "s" : ""} active
          </span>
          <span style={{ margin: "0 6px", color: "var(--border)" }}>·</span>
          <span style={{ fontSize: 9, color: "var(--mint)" }}>
            {regions.reduce((s, r) => s + r.supplier_count, 0)} suppliers
          </span>
        </div>
      )}

      {/* Region panel */}
      {panelOpen && (
        <RegionPanel
          countryName={panelCountryName}
          detail={panelDetail}
          loading={panelLoading}
          role={user?.role === "supplier" ? "supplier" : "merchant"}
          onClose={handlePanelClose}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .maplibregl-ctrl-top-left { top: 10px !important; left: 10px !important; }
        .maplibregl-ctrl-group { background: var(--surface2) !important; border: 1px solid var(--border) !important; border-radius: 4px !important; }
        .maplibregl-ctrl-group button { background: none !important; border: none !important; color: var(--text-secondary) !important; }
        .maplibregl-ctrl-group button:hover { background: var(--surface3) !important; }
        .maplibregl-ctrl-attrib { background: rgba(14,17,24,0.75) !important; color: var(--text-dim) !important; font-size: 8px !important; }
      `}</style>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildEnrichedGeoJSON(
  raw: GeoJSON.FeatureCollection,
  lookup: Record<string, MapRegion>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: raw.features.map((f): GeoJSON.Feature => {
      const props = f.properties ?? {};
      const iso2 = String(props.iso_a2 ?? "").toUpperCase();
      const region = lookup[iso2];
      return {
        type: "Feature",
        id: f.id,
        geometry: f.geometry,
        properties: {
          ...props,
          supplierCount: region?.supplier_count ?? 0,
          avgTrustScore: region?.avg_trust_score ?? 0,
          avgReliabilityScore: region?.avg_reliability_score ?? 0,
          productCount: region?.product_count ?? 0,
          avgDemandScore: region?.avg_demand_score ?? 0,
          avgMatchScore: region?.avg_match_score ?? 0,
        },
      };
    }),
  };
}
