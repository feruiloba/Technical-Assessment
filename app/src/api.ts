const API_BASE = 'http://127.0.0.1:8080';

export interface Project {
  id: string;
  name: string;
  video_url: string | null;
  created_at: string;
  effects: Effect[];
}

export interface Effect {
  id: string;
  project_id: string;
  type: string;
  start_time: number;
  end_time: number;
  config: Record<string, unknown> | null;
  created_at: string;
}

export interface EffectInput {
  type?: string;
  start_time: number;
  end_time: number;
  config?: Record<string, unknown>;
}

export interface CreateProjectInput {
  name: string;
  video_url?: string;
}

export interface UploadResponse {
  url: string;
  public_id: string;
  duration: number;
  format: string;
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const projectsApi = {
  list: () => apiFetch<Project[]>('/projects'),

  get: (id: string) => apiFetch<Project>(`/projects/${id}`),

  create: (data: CreateProjectInput) =>
    apiFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateProjectInput>) =>
    apiFetch<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const effectsApi = {
  add: (projectId: string, effect: EffectInput) =>
    apiFetch<Effect>(`/projects/${projectId}/effects`, {
      method: 'POST',
      body: JSON.stringify(effect),
    }),

  replaceAll: (projectId: string, effects: EffectInput[]) =>
    apiFetch<Effect[]>(`/projects/${projectId}/effects`, {
      method: 'PUT',
      body: JSON.stringify({ effects }),
    }),

  delete: (projectId: string, effectId: string) =>
    apiFetch<void>(`/projects/${projectId}/effects/${effectId}`, {
      method: 'DELETE',
    }),
};

export const uploadApi = {
  uploadVideo: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },
};
