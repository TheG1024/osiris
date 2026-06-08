import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, Circle, X, Save } from 'lucide-react';

interface DrawToolbarProps {
  mode: 'view' | 'polygon' | 'circle';
  onModeChange: (mode: 'view' | 'polygon' | 'circle') => void;
  hasDraft: boolean;
  onClear: () => void;
  onSave: (name: string, watchTypes: string[]) => void;
}

export default function DrawToolbar({
  mode,
  onModeChange,
  hasDraft,
  onClear,
  onSave,
}: DrawToolbarProps) {
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [name, setName] = useState('');
  const [watchTypes, setWatchTypes] = useState<string[]>(['flight', 'ship', 'satellite']);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, watchTypes);
    setName('');
    setShowSavePanel(false);
  };

  const toggleWatchType = (type: string) => {
    setWatchTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 180,
      left: 20,
      zIndex: 100,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: 8,
        background: 'rgba(10, 10, 15, 0.95)',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 8,
      }}>
        {/* Polygon Button */}
        <button
          onClick={() => onModeChange(mode === 'polygon' ? 'view' : 'polygon')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: mode === 'polygon' ? '#D4AF37' : 'transparent',
            border: '1px solid #D4AF37',
            borderRadius: 6,
            padding: '8px 12px',
            color: mode === 'polygon' ? '#000' : '#D4AF37',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 11,
          }}
        >
          <Square size={14} />
          POLY
        </button>

        {/* Circle Button */}
        <button
          onClick={() => onModeChange(mode === 'circle' ? 'view' : 'circle')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: mode === 'circle' ? '#D4AF37' : 'transparent',
            border: '1px solid #D4AF37',
            borderRadius: 6,
            padding: '8px 12px',
            color: mode === 'circle' ? '#000' : '#D4AF37',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 11,
          }}
        >
          <Circle size={14} />
          CIRCLE
        </button>

        {/* Clear Button (when draft exists) */}
        {hasDraft && (
          <button
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid #FF3232',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#FF3232',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
            }}
          >
            <X size={14} />
            CLEAR
          </button>
        )}

        {/* Save Button (when draft exists) */}
        {hasDraft && !showSavePanel && (
          <button
            onClick={() => setShowSavePanel(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid #00FFB4',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#00FFB4',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
            }}
          >
            <Save size={14} />
            SAVE
          </button>
        )}
      </div>

      {/* Save Panel */}
      <AnimatePresence>
        {showSavePanel && (
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
              padding: 12,
              width: 240,
            }}
          >
            <input
              type="text"
              placeholder="Zone name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                background: '#1a1a1f',
                border: '1px solid #333',
                borderRadius: 4,
                padding: '8px 10px',
                color: '#D4AF37',
                fontSize: 12,
                fontFamily: 'monospace',
                marginBottom: 10,
              }}
            />

            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: '#666' }}>Watch:</span>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {['flight', 'ship', 'satellite'].map(type => (
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
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                width: '100%',
                background: name.trim() ? '#D4AF37' : '#333',
                border: 'none',
                borderRadius: 4,
                padding: '8px 12px',
                color: name.trim() ? '#000' : '#666',
                fontWeight: 600,
                fontSize: 11,
                cursor: name.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              SAVE ZONE
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {mode !== 'view' && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: 'rgba(10, 10, 15, 0.9)',
          border: '1px solid #444',
          borderRadius: 6,
          fontSize: 10,
          color: '#888',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}>
          {mode === 'polygon'
            ? 'Click to add points • Double-click to complete'
            : 'Click center • Drag to set radius • Release to complete'}
        </div>
      )}
    </div>
  );
}