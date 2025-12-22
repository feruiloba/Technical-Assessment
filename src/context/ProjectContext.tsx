import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Project, EffectInput, projectsApi, effectsApi, CreateProjectInput } from '../api';

interface ProjectContextValue {
  // Project list state
  projects: Project[];
  isLoadingProjects: boolean;
  projectsError: string | null;

  // Selected project state
  selectedProject: Project | null;
  isLoadingProject: boolean;

  // Actions
  fetchProjects: () => Promise<void>;
  selectProject: (id: string | null) => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, data: Partial<CreateProjectInput>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Effects actions
  addEffect: (effect: EffectInput) => Promise<void>;
  updateAllEffects: (effects: EffectInput[]) => Promise<void>;
  removeEffect: (effectId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

interface ProjectProviderProps {
  children: React.ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectsError(null);
    try {
      const data = await projectsApi.list();
      setProjects(data);
    } catch (err) {
      setProjectsError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const selectProject = useCallback(async (id: string | null) => {
    if (!id) {
      setSelectedProject(null);
      return;
    }

    setIsLoadingProject(true);
    try {
      const project = await projectsApi.get(id);
      setSelectedProject(project);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoadingProject(false);
    }
  }, []);

  const createProject = useCallback(async (data: CreateProjectInput): Promise<Project> => {
    const project = await projectsApi.create(data);
    setProjects((prev) => [project, ...prev]);
    return project;
  }, []);

  const updateProject = useCallback(async (id: string, data: Partial<CreateProjectInput>) => {
    const updated = await projectsApi.update(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (selectedProject?.id === id) {
      setSelectedProject(updated);
    }
  }, [selectedProject]);

  const deleteProject = useCallback(async (id: string) => {
    await projectsApi.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  }, [selectedProject]);

  const addEffect = useCallback(async (effect: EffectInput) => {
    if (!selectedProject) return;

    const newEffect = await effectsApi.add(selectedProject.id, effect);
    setSelectedProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        effects: [...prev.effects, newEffect],
      };
    });
  }, [selectedProject]);

  const updateAllEffects = useCallback(async (effects: EffectInput[]) => {
    if (!selectedProject) return;

    const newEffects = await effectsApi.replaceAll(selectedProject.id, effects);
    setSelectedProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        effects: newEffects,
      };
    });
  }, [selectedProject]);

  const removeEffect = useCallback(async (effectId: string) => {
    if (!selectedProject) return;

    await effectsApi.delete(selectedProject.id, effectId);
    
    setSelectedProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        effects: prev.effects.filter((e) => e.id !== effectId),
      };
    });
  }, [selectedProject]);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const value: ProjectContextValue = {
    projects,
    isLoadingProjects,
    projectsError,
    selectedProject,
    isLoadingProject,
    fetchProjects,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
    addEffect,
    updateAllEffects,
    removeEffect,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}
