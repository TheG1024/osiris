'use client';

import { useState } from 'react';

// Cesium integration requires custom webpack config for Next.js
// See: https://cesium.com/cesiumjs/docs/api/Integrations.html#Next.js
// For now, we use a visual placeholder

const CesiumPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black">
    <div className="text-center">
      {/* Simple CSS globe representation */}
      <div className="relative w-64 h-64 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900 via-blue-600 to-blue-900 opacity-80 animate-pulse"></div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-t from-transparent via-blue-400/20 to-transparent"></div>
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/30"></div>
        {/* Grid lines */}
        <div className="absolute inset-0 rounded-full border border-white/10"></div>
        <div className="absolute inset-0 rounded-full border-x border-white/10"></div>
      </div>
      <h2 className="text-xl text-white font-bold mb-2">Osiris Globe</h2>
      <p className="text-gray-400">Planetary view loading...</p>
    </div>
  </div>
);

export default function Globe() {
  const [loading, setLoading] = useState(true);
  
  // Set loading to false after 2 seconds for demo
  // In production with Cesium, this would be the actual viewer
  setTimeout(() => setLoading(false), 2000);

  return <CesiumPlaceholder />;
}
