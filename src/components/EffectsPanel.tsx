import React, { useState } from 'react';
import { Timeframe } from '../types';
import { Effect } from '../api';

// Re-export for backwards compatibility
export type { Timeframe };

const EFFECT_TYPES = [
  { value: 'blur', label: 'Blur' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'invert', label: 'Invert Colors' },
];

interface EffectsPanelProps {
  effectEnabled: boolean;
  onToggleEffect: () => void;
  timeframes: Timeframe[];
  onAddTimeframe: (frame: Timeframe) => void;
  onRemoveTimeframe: (index: number) => void;
  getCurrentTime: () => number;
  videoDuration?: number;
  projectId?: string;
  effects?: Effect[];
  onAddEffect?: (effect: { type: string; start_time: number; end_time: number }) => Promise<void>;
  onRemoveEffect?: (effectId: string) => Promise<void>;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({
  effectEnabled,
  onToggleEffect,
  timeframes,
  onAddTimeframe,
  onRemoveTimeframe,
  getCurrentTime,
  videoDuration = 0,
  projectId,
  effects = [],
  onAddEffect,
  onRemoveEffect,
}) => {
  const [newStart, setNewStart] = useState<string>('');
  const [newEnd, setNewEnd] = useState<string>('');
  const [newEffectType, setNewEffectType] = useState<string>('grayscale');
  const [isAdding, setIsAdding] = useState(false);
  const [useTimeframe, setUseTimeframe] = useState(false);

  const handleAdd = async () => {
    const start = useTimeframe && newStart ? parseFloat(newStart) : 0;
    const end = useTimeframe && newEnd ? parseFloat(newEnd) : -1;
    
    // Validate only if using timeframe
    if (useTimeframe) {
      if (isNaN(start) || isNaN(end) || start >= end) {
        return; // Invalid timeframe
      }
    }

    setIsAdding(true);
    try {
      if (onAddEffect) {
        if (!useTimeframe && videoDuration > 0) {
          // Calculate gaps and fill them
          // 1. Get all intervals, treating end < 0 as duration
          const intervals = effects.map(e => ({
            start: e.start_time,
            end: e.end_time < 0 ? videoDuration : e.end_time
          })).sort((a, b) => a.start - b.start);

          // 2. Find gaps
          const gaps: { start: number; end: number }[] = [];
          let currentPointer = 0;

          for (const interval of intervals) {
            if (interval.start > currentPointer) {
              gaps.push({ start: currentPointer, end: interval.start });
            }
            currentPointer = Math.max(currentPointer, interval.end);
          }

          if (currentPointer < videoDuration) {
            gaps.push({ start: currentPointer, end: videoDuration });
          }

          // 3. Add effects for gaps
          if (gaps.length > 0) {
            await Promise.all(gaps.map(gap => onAddEffect({
              type: newEffectType,
              start_time: gap.start,
              end_time: gap.end,
            })));
          } else if (effects.length === 0) {
             // No effects, add full video
             await onAddEffect({
              type: newEffectType,
              start_time: 0,
              end_time: -1,
            });
          }
        } else {
          await onAddEffect({
            type: newEffectType,
            start_time: start,
            end_time: end,
          });
        }
      } else {
        // Fallback to old timeframe method
        await onAddTimeframe({ 
          start: start, 
          end: end,
          type: newEffectType
        });
      }
      setNewStart('');
      setNewEnd('');
      setUseTimeframe(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (index: number, effectId?: string) => {
    if (onRemoveEffect && effectId) {
      await onRemoveEffect(effectId);
    } else {
      onRemoveTimeframe(index);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0) return 'End';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const getEffectLabel = (type: string) => {
    const effect = EFFECT_TYPES.find(e => e.value === type);
    return effect?.label || type;
  };

  const getEffectColor = (type: string) => {
    const colors: Record<string, string> = {
      segmentation: '#4299e1',
      blur: '#9f7aea',
      grayscale: '#718096',
      sepia: '#d69e2e',
      invert: '#e53e3e',
    };
    return colors[type] || '#4299e1';
  };

  const hasFullVideoEffect = effects.some(e => e.end_time < 0);

  return (
    <div className="stats">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Video Effects</h3>
        <button
          onClick={onToggleEffect}
          className={`btn btn-sm ${effectEnabled ? 'btn-primary' : 'btn-ghost'}`}
        >
          {effectEnabled ? 'On' : 'Off'}
        </button>
      </div>

      {/* Active Effects List */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Active Effects
          </h4>
          {effects.length > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {effects.length} effect{effects.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {effects.length === 0 && timeframes.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
            No effects added yet
          </p>
        ) : (
          <div className="timeframe-list" style={{ opacity: effectEnabled ? 1 : 0.5, pointerEvents: effectEnabled ? 'auto' : 'none' }}>
            {[...effects]
              .sort((a, b) => a.start_time - b.start_time)
              .map((effect, index) => (
              <div key={effect.id || index} className="timeframe-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getEffectColor(effect.type),
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {getEffectLabel(effect.type)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {(effect.end_time < 0) 
                        ? 'Full Video' 
                        : `${formatTime(effect.start_time)} - ${formatTime(effect.end_time)}`}
                    </div>
                  </div>
                </div>
                <button
                  className="timeframe-item-delete"
                  onClick={() => handleRemove(index, effect.id)}
                  title="Remove effect"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Effect Section */}
      <div style={{ borderTop: '1px solid var(--color-border-solid)', paddingTop: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Add New Effect
        </h4>

        {/* Effect Type Selector */}
        <div style={{ marginBottom: '10px' }}>
          <label className="form-label" style={{ fontSize: '11px' }}>Effect Type</label>
          <select
            value={newEffectType}
            onChange={(e) => setNewEffectType(e.target.value)}
            className="glass-input"
            style={{ padding: '8px 12px', cursor: 'pointer' }}
          >
            {EFFECT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Toggle */}
        <div style={{ marginBottom: '10px' }}>
          <label className="form-label" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={useTimeframe} 
              onChange={(e) => setUseTimeframe(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Apply to specific timeframe
          </label>
        </div>

        {/* Time Range Inputs (Conditional) */}
        {useTimeframe && (
          <div style={{ 
            marginBottom: '10px', 
            padding: '10px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '6px',
            border: '1px solid var(--color-border-subtle)'
          }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Start (s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                  placeholder="0.0"
                />
                <button
                  type="button"
                  onClick={() => setNewStart(getCurrentTime().toFixed(1))}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '10px', padding: '2px 8px', height: 'auto' }}
                >
                  Set Current
                </button>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>End (s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                  placeholder="0.0"
                />
                <button
                  type="button"
                  onClick={() => setNewEnd(getCurrentTime().toFixed(1))}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '10px', padding: '2px 8px', height: 'auto' }}
                >
                  Set Current
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={handleAdd}
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={isAdding || !projectId || (useTimeframe && (!newStart || !newEnd)) || (hasFullVideoEffect && !useTimeframe)}
          title={hasFullVideoEffect && !useTimeframe ? "Full video effect already active" : undefined}
        >
          {isAdding ? 'Adding...' : 'Add Effect'}
        </button>

        {hasFullVideoEffect && !useTimeframe && (
          <p style={{
            margin: '8px 0 0',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            textAlign: 'center'
          }}>
            Full video effect is active. Add specific timeframes or remove it to fill gaps.
          </p>
        )}

        {!projectId && !hasFullVideoEffect && (
          <p style={{
            margin: '8px 0 0',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            textAlign: 'center'
          }}>
            Save project first to add effects
          </p>
        )}
      </div>
    </div>
  );
};

export default EffectsPanel;
