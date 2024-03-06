import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import { ACCESS_TOKEN } from '../../utils/constants';
import './Map.scss';
import { RouteEvent } from '../../types/interfaces';

mapboxgl.accessToken = ACCESS_TOKEN;

const MapWithDirections = () => {
  const [isDisabled, setIsDisabled] = useState(true);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [routePath, setRoutePath] = useState<number[][]>([]);

  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-79.4512, 43.6568],
      zoom: 13,
    });

    // @ts-expect-error - directly connected to html
    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving',
      type: 'LineString',
      overview: 'full',
      controls: {
        instructions: false,
        profileSwitcher: false,
      },
      continue_straight: true,
    });

    newMap.addControl(directions, 'top-left');

    directions.on('route', (e: RouteEvent) => {
      const routes = e.route;
      const fullPath = routes[0]?.legs.flatMap((leg) =>
        leg?.steps.flatMap((step) =>
          step?.intersections.map((intr) => intr.location)
        )
      );

      setRoutePath(fullPath);
      setIsDisabled(false);
    });

    newMap.on('load', () => {
      newMap.addSource('point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      newMap.addLayer({
        id: 'point',
        source: 'point',
        type: 'symbol',
        layout: {
          'icon-image': 'heliport',
          'icon-size': 1.3,
          'icon-allow-overlap': true,
        },
      });
    });

    setMap(newMap);

    return () => {
      newMap.remove();
    };
  }, []);

  const StartDelivery = (path: number[][]) => {
    setIsDisabled(true);

    let currentIndex = 0;
    const maxIndex = path.length - 1;
    let progress = 0;
    const speed = 0.045;

    const interpolate = (start: number[], end: number[], t: number) => {
      return [
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ];
    };

    const move = () => {
      if (currentIndex < maxIndex) {
        requestAnimationFrame(() => {
          if (map) {
            const source = map.getSource('point') as mapboxgl.GeoJSONSource;
            const currentPoint = path[currentIndex];
            const nextPoint = path[currentIndex + 1];
            const interpolatedPoint = interpolate(
              currentPoint,
              nextPoint,
              progress
            );

            source.setData({
              type: 'FeatureCollection',
              features: [
                {
                  properties: {},
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: interpolatedPoint,
                  },
                },
              ],
            });

            progress += speed;
            if (progress >= 1) {
              currentIndex++;
              progress = 0;
            }

            move();
          }
        });
      } else {
        alert('Delivered successfully');
        window.location.reload();
      }
    };

    move();
  };

  return (
    <div>
      <div id="map" className="map-container" />
      <div className="overlay">
        <button
          className="start-button"
          disabled={isDisabled}
          onClick={() => StartDelivery(routePath)}
        >
          Start Delivery
        </button>
      </div>
    </div>
  );
};

export default MapWithDirections;
