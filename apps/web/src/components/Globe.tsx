import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Cesium viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      }),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      timeline: false,
      animation: false,
      navigationHelpButton: false
    });

    viewerRef.current = viewer;

    // Set initial camera position
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000)
    });

    return () => {
      viewer.destroy();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
