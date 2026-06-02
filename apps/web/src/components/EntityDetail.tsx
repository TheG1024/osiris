import { useState } from 'react';

export default function EntityDetail() {
  const [selected, setSelected] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  if (!visible || !selected) return null;

  return (
    <div className="absolute top-4 right-4 w-80 bg-gray-900/95 backdrop-blur p-4 rounded-lg shadow-xl text-white">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">{selected.id}</h3>
        <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-white">
          ×
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div><span className="text-gray-400">Type:</span> {selected.type}</div>
        <div><span className="text-gray-400">Lat:</span> {selected.lat?.toFixed(4)}</div>
        <div><span className="text-gray-400">Lon:</span> {selected.lon?.toFixed(4)}</div>
        {selected.altitude && <div><span className="text-gray-400">Alt:</span> {selected.altitude}m</div>}
        {selected.velocity && <div><span className="text-gray-400">Speed:</span> {selected.velocity}km/h</div>}
      </div>
    </div>
  );
}
