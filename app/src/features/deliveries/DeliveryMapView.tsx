import { useEffect, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DeliveryMapViewProps {
  address?: string | null;
  label?: string;
  status?: string;
}

type Coordinates = [number, number];

const DEFAULT_COORDS: Coordinates = [3.3792, 6.5244];

export default function DeliveryMapView({ address, label = 'Delivery location', status }: DeliveryMapViewProps) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(Boolean(address));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !token) {
      setLoading(false);
      setCoordinates(null);
      if (!token) setError('Mapbox token missing. Add VITE_MAPBOX_TOKEN to your environment.');
      return;
    }

    let cancelled = false;

    const geocodeAddress = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=ng&limit=1&access_token=${token}`
        );

        if (!response.ok) {
          throw new Error('Geocoding failed');
        }

        const data = await response.json();
        const feature = data.features?.[0];

        if (!feature || !Array.isArray(feature.center) || feature.center.length < 2) {
          throw new Error('No map coordinates found for this delivery address');
        }

        if (!cancelled) {
          setCoordinates([feature.center[0], feature.center[1]] as Coordinates);
        }
      } catch (err) {
        if (!cancelled) {
          setCoordinates(DEFAULT_COORDS);
          setError(err instanceof Error ? err.message : 'Unable to place this delivery on the map.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    geocodeAddress();
    return () => {
      cancelled = true;
    };
  }, [address, token]);

  if (!token) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground shadow-3d-sm">
        Mapbox is not configured yet. Add VITE_MAPBOX_TOKEN to your app environment to enable the delivery map.
      </div>
    );
  }

  const mapCenter = coordinates ?? DEFAULT_COORDS;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-3d-sm">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dispatch map</p>
          <h2 className="text-sm font-semibold text-foreground">{label}</h2>
        </div>
        {status && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-blue-700">
            {status.replace('_', ' ')}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex h-[280px] items-center justify-center bg-muted/20 text-sm text-muted-foreground">
          Loading route map...
        </div>
      )}

      {!loading && error && (
        <div className="flex h-[280px] flex-col items-center justify-center gap-2 bg-muted/20 px-4 text-center text-sm text-muted-foreground">
          <MapPin className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && (
        <Map
          mapboxAccessToken={token}
          initialViewState={{
            longitude: mapCenter[0],
            latitude: mapCenter[1],
            zoom: 12,
          }}
          style={{ width: '100%', height: 300 }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" />
          <Marker longitude={mapCenter[0]} latitude={mapCenter[1]} anchor="bottom">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
          </Marker>
        </Map>
      )}
    </div>
  );
}
