import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type OrganizationDetails } from "~/server/queries/organizations";
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Helsinki coordinates
const HELSINKI_CENTER = {
  latitude: 60.1699,
  longitude: 24.9384
};

// Generate some random markers around Helsinki
const SAMPLE_MARKERS = Array(5).fill(0).map(() => ({
  latitude: HELSINKI_CENTER.latitude + (Math.random() - 0.5) * 0.1,
  longitude: HELSINKI_CENTER.longitude + (Math.random() - 0.5) * 0.1,
}));

export function LocationMap({
  organization,
}: {
  organization: OrganizationDetails;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full overflow-hidden rounded-md">
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            initialViewState={{
              ...HELSINKI_CENTER,
              zoom: 11
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            {SAMPLE_MARKERS.map((marker, index) => (
              <Marker
                key={index}
                latitude={marker.latitude}
                longitude={marker.longitude}
                color="#FF0000"
              />
            ))}
          </Map>
        </div>
      </CardContent>
    </Card>
  );
}
