import React, { useState } from 'react';
import { Project } from '../api';
import ProjectItem from './ProjectItem';

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  isLoading: boolean;
  collapsed?: boolean;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onDeleteProject,
  isLoading,
  collapsed = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="project-list-section">
        {!collapsed && (
          <div className="project-list-header">
            <h3>Projects</h3>
          </div>
        )}
        {[1, 2, 3].map((i) => (
          <div key={i} className="project-item-skeleton">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
              {!collapsed && (
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '80%', height: '14px', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ width: '50%', height: '10px' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="project-list-section">
        {!collapsed && (
          <>
            <div className="project-list-header">
              <h3>Projects</h3>
            </div>
            <div className="project-list-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <p>No projects yet.<br />Create your first project!</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="project-list-section">
      {!collapsed && (
        <div
          className={`project-list-header ${!isExpanded ? 'collapsed' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3>Projects ({projects.length})</h3>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
      {(isExpanded || collapsed) && (
        <div>
          {projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              isSelected={project.id === selectedProjectId}
              onSelect={onSelectProject}
              onDelete={onDeleteProject}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
