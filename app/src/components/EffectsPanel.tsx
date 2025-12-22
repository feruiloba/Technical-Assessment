import React, { useState } from 'react';

export interface Timeframe {
  start: number;
  end: number;
}

interface EffectsPanelProps {
  effectEnabled: boolean;
  onToggleEffect: () => void;
  timeframes: Timeframe[];
  onAddTimeframe: (frame: Timeframe) => void;
  onRemoveTimeframe: (index: number) => void;
  getCurrentTime: () => number;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({
  effectEnabled,
  onToggleEffect,
  timeframes,
  onAddTimeframe,
  onRemoveTimeframe,
  getCurrentTime
}) => {
  const [newStart, setNewStart] = useState<string>('0');
  const [newEnd, setNewEnd] = useState<string>('0');

  const handleAdd = () => {
    const start = parseFloat(newStart);
    const end = parseFloat(newEnd);
    if (!isNaN(start) && !isNaN(end) && start < end) {
      onAddTimeframe({ start, end });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="stats" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Video Effects</h3>
        <button
          onClick={onToggleEffect}
          className="btn btn-primary"
          style={{ padding: '5px 10px', fontSize: '12px' }}
        >
          {effectEnabled ? 'Disable' : 'Enable'} Effect
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Active Timeframes</h4>
        {timeframes.length === 0 ? (
          <p style={{ color: '#666', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
            Effect applies to entire video
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {timeframes.map((tf, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', background: '#f8f9fa', padding: '8px', borderRadius: '4px', fontSize: '13px' }}>
                <span>{formatTime(tf.start)} - {formatTime(tf.end)}</span>
                <button
                  onClick={() => onRemoveTimeframe(index)}
                  style={{ border: 'none', background: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px', padding: '0 5px' }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Add Timeframe</h4>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#666' }}>Start (s)</label>
            <input
              type="number"
              step="0.1"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#666' }}>End (s)</label>
            <input
              type="number"
              step="0.1"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <button
                onClick={() => setNewStart(getCurrentTime().toFixed(1))}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '11px', padding: '4px' }}
            >
                Set Start to Now
            </button>
            <button
                onClick={() => setNewEnd(getCurrentTime().toFixed(1))}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '11px', padding: '4px' }}
            >
                Set End to Now
            </button>
        </div>
        <button
          onClick={handleAdd}
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '13px' }}
        >
          Add Timeframe
        </button>
      </div>
    </div>
  );
};

export default EffectsPanel;