import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type OrganizationDetails } from "~/server/queries/organizations";
import Map, { LngLatBoundsLike, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useState } from "react";

// Helsinki coordinates for default center
const HELSINKI_CENTER = {
  latitude: 60.1699,
  longitude: 24.9384
};

// Helper function to get bounds from locations
function getBounds(locations: { latitude: number; longitude: number }[]) {
  if (locations.length === 0) {
    // Return flattened bounds around Helsinki
    return [
      HELSINKI_CENTER.longitude - 0.1,
      HELSINKI_CENTER.latitude - 0.1,
      HELSINKI_CENTER.longitude + 0.1,
      HELSINKI_CENTER.latitude + 0.1
    ];
  }

  const coordinates = locations.map(loc => [loc.longitude, loc.latitude]);

  // Return flattened [west, south, east, north] format
  return [
    Math.min(...coordinates.map(c => c[0] ?? 0)),
    Math.min(...coordinates.map(c => c[1] ?? 0)),
    Math.max(...coordinates.map(c => c[0] ?? 0)),
    Math.max(...coordinates.map(c => c[1] ?? 0))
  ];
}

export function LocationMap({
  organization,
}: {
  organization: OrganizationDetails;
}) {
  const [selectedLocation, setSelectedLocation] = useState<(typeof validLocations)[0] | null>(null);

  // Filter out locations without coordinates and convert string coordinates to numbers
  const validLocations = organization.locations.filter(
    loc => loc.latitude && loc.longitude
  ).map(loc => ({
    ...loc,
    latitude: parseFloat(loc.latitude!),
    longitude: parseFloat(loc.longitude!),
  }));

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
              bounds: getBounds(validLocations) as LngLatBoundsLike,
              fitBoundsOptions: {
                padding: 50,
                maxZoom: 16
              }
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            {validLocations.map((location) => (
              <Marker
                key={location.id}
                latitude={location.latitude}
                longitude={location.longitude}
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedLocation(location);
                }}
              >
                <div className="cursor-pointer" title={location.name}>
                  <div className="relative">
                    <div className="absolute -left-2 -top-5 whitespace-nowrap rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white shadow-md transition-all hover:scale-105">
                      {location.name}
                    </div>
                  </div>
                </div>
              </Marker>
            ))}

            {selectedLocation && (
              <Popup
                latitude={selectedLocation.latitude}
                longitude={selectedLocation.longitude}
                closeOnClick={false}
                onClose={() => setSelectedLocation(null)}
                offset={[50, -23]}
                closeButton={false}
                className="!rounded-lg [&_.mapboxgl-popup-content]:!bg-black [&_.mapboxgl-popup-tip]:!border-t-black"
              >
                <button
                  className="absolute right-1 top-1 rounded-md p-1 hover:bg-gray-800"
                  onClick={() => setSelectedLocation(null)}
                >
                  <svg
                    className="h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="p-2">
                  <h3 className="font-medium mb-2 text-white">{selectedLocation.name}</h3>
                  {selectedLocation.items && selectedLocation.items.length > 0 ? (
                    <ul className="space-y-1">
                      {selectedLocation.items.map((item) => (
                        <li key={item.id} className="text-sm text-gray-200">
                          • {item.identifier}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-300">No items at this location</p>
                  )}
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </CardContent>
    </Card>
  );
}
