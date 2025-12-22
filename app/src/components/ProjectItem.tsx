import React from 'react';
import { Project } from '../api';

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  collapsed?: boolean;
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isSelected,
  onSelect,
  onDelete,
  collapsed = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      onDelete(project.id);
    }
  };

  return (
    <div
      className={`project-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(project.id)}
      title={collapsed ? project.name : undefined}
    >
      <div className="project-item-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </div>
      {!collapsed && (
        <>
          <div className="project-item-content">
            <div className="project-item-name">{project.name}</div>
            <div className="project-item-date">{formatDate(project.created_at)}</div>
          </div>
          <button 
            className="project-item-delete"
            onClick={handleDelete}
            title="Delete project"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default ProjectItem;
