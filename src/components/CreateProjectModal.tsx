import React, { useState } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, videoUrl?: string) => Promise<void>;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    // Only validate URL if one is provided
    if (videoUrl.trim()) {
      try {
        new URL(videoUrl);
      } catch {
        setError('Please enter a valid URL');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), videoUrl.trim() || undefined);
      setName('');
      setVideoUrl('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              className="glass-input"
              placeholder="My Video Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="video-url">
              Video URL <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(optional)</span>
            </label>
            <input
              id="video-url"
              type="url"
              className="glass-input"
              placeholder="https://example.com/video.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <p style={{
              margin: '6px 0 0',
              fontSize: '12px',
              color: 'var(--color-text-muted)'
            }}>
              You can upload a video later if you don't have a URL yet.
            </p>
          </div>

          {error && (
            <div style={{
              color: 'var(--color-danger)',
              fontSize: '13px',
              marginTop: '-8px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
