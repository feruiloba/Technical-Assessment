import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import ProjectList from './ProjectList';
import CreateProjectModal from './CreateProjectModal';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    projects,
    isLoadingProjects,
    selectedProject,
    selectProject,
    createProject,
    deleteProject,
  } = useProject();

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const handleCreateProject = async (name: string, videoUrl?: string) => {
    const project = await createProject({ name, video_url: videoUrl });
    await selectProject(project.id);
  };

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <span>VideoFX</span>
          </div>
          <button
            className="sidebar-toggle"
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <ProjectList
          projects={projects}
          selectedProjectId={selectedProject?.id || null}
          onSelectProject={selectProject}
          onDeleteProject={deleteProject}
          isLoading={isLoadingProjects}
          collapsed={isCollapsed}
        />

        <button
          className="btn-create-project"
          onClick={() => setIsModalOpen(true)}
          title={isCollapsed ? 'New Project' : undefined}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Project</span>
        </button>
      </aside>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </>
  );
};

export default Sidebar;
