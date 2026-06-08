import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Power, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useGeofenceStore, EntityType, Geofence } from '@/store/geofenceStore';

export default function GeofencePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'circle' as 'circle' | 'polygon',
    lat: '',
    lon: '',
    radius: '',
  });
  const [watchTypes, setWatchTypes] = useState<EntityType[]>(['flight', 'ship', 'satellite']);

  const { 
    geofences, 
    addGeofence, 
    removeGeofence, 
    toggleGeofence 
  } = useGeofenceStore();

  const handleAdd = () => {
    if (!formData.name || !formData.lat || !formData.lon || !formData.radius) return;

    addGeofence({
      name: formData.name,
      type: 'circle',
      center: {
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
      },
      radius: parseFloat(formData.radius) * 1000, // Convert km to meters
      watchTypes,
      active: true,
    });

    // Reset form
    setFormData({ name: '', type: 'circle', lat: '', lon: '', radius: '' });
    setShowAdd(false);
  };

  const toggleWatchType = (type: EntityType) => {
    setWatchTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: 20,
      zIndex: 100,
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(10, 10, 15, 0.95)',
          border: '1px solid #D4AF37',
          borderRadius: 8,
          padding: '10px 16px',
          color: '#D4AF37',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        <MapPin size={16} />
        Geofences ({geofences.filter(g => g.active).length})
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 8,
              background: 'rgba(10, 10, 15, 0.95)',
              border: '1px solid #333',
              borderRadius: 8,
              padding: 16,
              width: 280,
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {/* Add Button */}
            {!showAdd ? (
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  background: 'transparent',
                  border: '1px dashed #444',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#888',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  marginBottom: 12,
                }}
              >
                <Plus size={14} />
                Add Zone
              </button>
            ) : (
              <div style={{
                background: 'rgba(20, 20, 25, 0.8)',
                borderRadius: 6,
                padding: 12,
                marginBottom: 12,
              }}>
                <input
                  type="text"
                  placeholder="Zone name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#1a1a1f',
                    border: '1px solid #333',
                    borderRadius: 4,
                    padding: '6px 8px',
                    color: '#D4AF37',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    marginBottom: 8,
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Lat"
                    value={formData.lat}
                    onChange={e => setFormData({ ...formData, lat: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Lon"
                    value={formData.lon}
                    onChange={e => setFormData({ ...formData, lon: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Radius (km)"
                  value={formData.radius}
                  onChange={e => setFormData({ ...formData, radius: e.target.value })}
                  style={inputStyle}
                />

                {/* Watch Types */}
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: '#666' }}>Watch:</span>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {(['flight', 'ship', 'satellite'] as EntityType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => toggleWatchType(type)}
                        style={{
                          background: watchTypes.includes(type) ? '#D4AF3730' : 'transparent',
                          border: `1px solid ${watchTypes.includes(type) ? '#D4AF37' : '#333'}`,
                          borderRadius: 4,
                          padding: '4px 8px',
                          color: watchTypes.includes(type) ? '#D4AF37' : '#666',
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        {type === 'flight' ? '✈️' : type === 'ship' ? '🚢' : '🛰️'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  style={{
                    width: '100%',
                    background: '#D4AF37',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 12px',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  ADD ZONE
                </button>
              </div>
            )}

            {/* Geofence List */}
            {geofences.map(geo => (
              <div
                key={geo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'rgba(20, 20, 25, 0.8)',
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => toggleGeofence(geo.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: geo.active ? '#D4AF37' : '#444',
                      cursor: 'pointer',
                    }}
                  >
                    <Power size={14} />
                  </button>
                  <span style={{
                    color: geo.active ? '#D4AF37' : '#666',
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }}>
                    {geo.name}
                  </span>
                </div>
                <button
                  onClick={() => removeGeofence(geo.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#444',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1a1a1f',
  border: '1px solid #333',
  borderRadius: 4,
  padding: '6px 8px',
  color: '#D4AF37',
  fontSize: 11,
  fontFamily: 'monospace',
};