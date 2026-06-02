import { useState } from 'react';

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<any[]>([]);

  return (
    <div className="absolute top-4 left-4 w-80 max-h-96 bg-gray-900/95 backdrop-blur p-4 rounded-lg shadow-xl text-white overflow-y-auto">
      <h3 className="text-lg font-bold mb-3">Alerts</h3>
      {alerts.length === 0 ? (
        <p className="text-gray-400 text-sm">No active alerts</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="bg-red-900/30 border border-red-500/50 p-2 rounded text-sm">
              <div className="font-bold">{alert.type}</div>
              <div className="text-gray-300">{alert.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
