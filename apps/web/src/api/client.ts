import type {
  IProject,
  IMessage,
  IRequirement,
  IValidationIssue,
  CreateProjectRequest,
  SendMessageRequest,
  UpdateProjectRequest,
  CreateRequirementRequest,
  UpdateRequirementRequest,
  ResolveValidationIssueRequest,
  DiscoveryPhase,
  IDesignSpec,
  IScreenSpec,
  UpdateDesignSpecRequest,
  AnalyzeImageRequest,
  CreateScreenSpecRequest,
  UpdateScreenSpecRequest,
  VisualThemeCategory,
  TechCategory,
  TechDecisionStatus,
  ITechRecommendation,
  TechCompatibilityReport,
  CreateTechRecommendationRequest,
  UpdateTechRecommendationRequest,
  UpdateTechStatusRequest,
  IDatabaseEntity,
  IApiEndpoint,
  IArchitecturePlan,
  CreateEntityRequest,
  UpdateEntityRequest,
  CreateApiEndpointRequest,
  UpdateApiEndpointRequest,
  UpdateArchitecturePlanRequest,
  IThirdPartyIntegration,
  IHumanAction,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  CreateHumanActionRequest,
  UpdateHumanActionRequest,
  UpdateHumanActionStatusRequest,
  IPlanRoadmapPhase,
  IPlanMilestone,
  IPlanFeature,
  IPlanUserStory,
  IPlanTask,
  IImplementationPlan,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  UpdateImplementationPlanRequest,
  IProjectReadinessReport,
  ICategoryReadiness,
  ApproveProjectRequest,
  FinalizeProjectRequest,
  ReadinessCategory,
  ReadinessItemStatus,
  IProjectSpec,
  ISpecificationVersion,
  CreateSpecVersionRequest,
  IModularSpecBundle,
  IEngineeringHandoffPackage,
  IEngineeringAgentHandoff,
  ITaskQueueItem,
  IAgentFeedbackReport,
  InitializeHandoffRequest,
  ClaimTaskRequest,
  CompleteTaskRequest,
  FailTaskRequest,
  SubmitFeedbackRequest,
  IUser,
  IAuthResponse,
  SignUpRequest,
  SignInRequest,
} from '@project-planner/types';




const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return normalizeEntity(data) as T;
}

function normalizeEntity(item: any): any {
  if (!item || typeof item !== 'object') return item;
  if (Array.isArray(item)) return item.map(normalizeEntity);
  
  const copy = { ...item };
  if (copy._id && !copy.id) {
    copy.id = String(copy._id);
  }
  return copy;
}

export interface SendMessageResponse {
  userMessage: IMessage;
  assistantMessage: IMessage;
  meta: {
    phase: DiscoveryPhase;
    phaseAdvanced: boolean;
    messageCount: number;
    extractedCount?: number;
    validationIssuesCount?: number;
  };
}

export const api = {
  projects: {
    list: () => request<IProject[]>('/projects'),
    get: (id: string) => request<IProject>(`/projects/${id}`),
    create: (data: CreateProjectRequest) =>
      request<IProject>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateProjectRequest) =>
      request<IProject>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  messages: {
    list: (projectId: string) => request<IMessage[]>(`/projects/${projectId}/messages`),
    send: (projectId: string, data: SendMessageRequest) =>
      request<SendMessageResponse>(`/projects/${projectId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  requirements: {
    list: (projectId: string, query?: { type?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (query?.type) params.append('type', query.type);
      if (query?.status) params.append('status', query.status);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return request<IRequirement[]>(`/projects/${projectId}/requirements${queryString}`);
    },
    create: (projectId: string, data: CreateRequirementRequest) =>
      request<IRequirement>(`/projects/${projectId}/requirements`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (projectId: string, reqId: string, data: UpdateRequirementRequest) =>
      request<IRequirement>(`/projects/${projectId}/requirements/${reqId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (projectId: string, reqId: string) =>
      request<{ success: boolean; message: string }>(`/projects/${projectId}/requirements/${reqId}`, {
        method: 'DELETE',
      }),
    extract: (projectId: string) =>
      request<IRequirement[]>(`/projects/${projectId}/requirements/extract`, {
        method: 'POST',
      }),
  },
  validation: {
    list: (projectId: string, query?: { status?: string; type?: string }) => {
      const params = new URLSearchParams();
      if (query?.status) params.append('status', query.status);
      if (query?.type) params.append('type', query.type);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return request<IValidationIssue[]>(`/projects/${projectId}/validation${queryString}`);
    },
    run: (projectId: string) =>
      request<IValidationIssue[]>(`/projects/${projectId}/validation/run`, {
        method: 'POST',
      }),
    resolve: (projectId: string, issueId: string, data: ResolveValidationIssueRequest) =>
      request<IValidationIssue>(`/projects/${projectId}/validation/${issueId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    dismiss: (projectId: string, issueId: string) =>
      request<IValidationIssue>(`/projects/${projectId}/validation/${issueId}/dismiss`, {
        method: 'PATCH',
      }),
  },
  ux: {
    getDesign: (projectId: string) =>
      request<IDesignSpec>(`/projects/${projectId}/design`),
    updateDesign: (projectId: string, data: UpdateDesignSpecRequest) =>
      request<IDesignSpec>(`/projects/${projectId}/design`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    analyzeImage: (projectId: string, data: AnalyzeImageRequest) =>
      request<{ analysis: any; designSpec: IDesignSpec }>(`/projects/${projectId}/design/analyze-image`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listScreens: (projectId: string) =>
      request<IScreenSpec[]>(`/projects/${projectId}/screens`),
    createScreen: (projectId: string, data: CreateScreenSpecRequest) =>
      request<IScreenSpec>(`/projects/${projectId}/screens`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateScreen: (projectId: string, screenId: string, data: UpdateScreenSpecRequest) =>
      request<IScreenSpec>(`/projects/${projectId}/screens/${screenId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteScreen: (projectId: string, screenId: string) =>
      request<{ success: boolean; message: string }>(`/projects/${projectId}/screens/${screenId}`, {
        method: 'DELETE',
      }),
    generateScreens: (projectId: string) =>
      request<IScreenSpec[]>(`/projects/${projectId}/screens/generate`, {
        method: 'POST',
      }),
  },
  tech: {
    list: (projectId: string) =>
      request<ITechRecommendation[]>(`/projects/${projectId}/tech-stack`),
    generate: (projectId: string) =>
      request<ITechRecommendation[]>(`/projects/${projectId}/tech-stack/generate`, {
        method: 'POST',
      }),
    approveAll: (projectId: string) =>
      request<ITechRecommendation[]>(`/projects/${projectId}/tech-stack/approve-all`, {
        method: 'POST',
      }),
    compatibility: (projectId: string) =>
      request<TechCompatibilityReport>(`/projects/${projectId}/tech-stack/compatibility`),
    create: (projectId: string, data: CreateTechRecommendationRequest) =>
      request<ITechRecommendation>(`/projects/${projectId}/tech-stack`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (projectId: string, recId: string, data: UpdateTechRecommendationRequest) =>
      request<ITechRecommendation>(`/projects/${projectId}/tech-stack/${recId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    updateStatus: (projectId: string, recId: string, data: UpdateTechStatusRequest) =>
      request<ITechRecommendation>(`/projects/${projectId}/tech-stack/${recId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (projectId: string, recId: string) =>
      request<{ success: boolean; message: string }>(`/projects/${projectId}/tech-stack/${recId}`, {
        method: 'DELETE',
      }),
  },
  architecture: {
    get: (projectId: string) =>
      request<{
        plan: IArchitecturePlan | null;
        entities: IDatabaseEntity[];
        endpoints: IApiEndpoint[];
      }>(`/projects/${projectId}/architecture`),
    generate: (projectId: string) =>
      request<{
        plan: IArchitecturePlan;
        entities: IDatabaseEntity[];
        endpoints: IApiEndpoint[];
      }>(`/projects/${projectId}/architecture/generate`, {
        method: 'POST',
      }),
    updatePlan: (projectId: string, data: UpdateArchitecturePlanRequest) =>
      request<IArchitecturePlan>(`/projects/${projectId}/architecture`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    listEntities: (projectId: string) =>
      request<IDatabaseEntity[]>(`/projects/${projectId}/architecture/entities`),
    createEntity: (projectId: string, data: CreateEntityRequest) =>
      request<IDatabaseEntity>(`/projects/${projectId}/architecture/entities`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateEntity: (projectId: string, entityId: string, data: UpdateEntityRequest) =>
      request<IDatabaseEntity>(`/projects/${projectId}/architecture/entities/${entityId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteEntity: (projectId: string, entityId: string) =>
      request<{ success: boolean; message: string }>(
        `/projects/${projectId}/architecture/entities/${entityId}`,
        { method: 'DELETE' },
      ),
    listEndpoints: (projectId: string) =>
      request<IApiEndpoint[]>(`/projects/${projectId}/architecture/endpoints`),
    createEndpoint: (projectId: string, data: CreateApiEndpointRequest) =>
      request<IApiEndpoint>(`/projects/${projectId}/architecture/endpoints`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateEndpoint: (projectId: string, endpointId: string, data: UpdateApiEndpointRequest) =>
      request<IApiEndpoint>(`/projects/${projectId}/architecture/endpoints/${endpointId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteEndpoint: (projectId: string, endpointId: string) =>
      request<{ success: boolean; message: string }>(
        `/projects/${projectId}/architecture/endpoints/${endpointId}`,
        { method: 'DELETE' },
      ),
  },
  integrations: {
    get: (projectId: string) =>
      request<{
        integrations: IThirdPartyIntegration[];
        actions: IHumanAction[];
        stats: {
          totalIntegrations: number;
          configuredIntegrations: number;
          totalActions: number;
          completedActions: number;
          pendingBlockingActions: number;
        };
      }>(`/projects/${projectId}/integrations`),
    discover: (projectId: string) =>
      request<{
        integrations: IThirdPartyIntegration[];
        actions: IHumanAction[];
        stats: {
          totalIntegrations: number;
          configuredIntegrations: number;
          totalActions: number;
          completedActions: number;
          pendingBlockingActions: number;
        };
      }>(`/projects/${projectId}/integrations/discover`, {
        method: 'POST',
      }),
    create: (projectId: string, data: CreateIntegrationRequest) =>
      request<IThirdPartyIntegration>(`/projects/${projectId}/integrations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (projectId: string, integrationId: string, data: UpdateIntegrationRequest) =>
      request<IThirdPartyIntegration>(`/projects/${projectId}/integrations/${integrationId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (projectId: string, integrationId: string) =>
      request<{ success: boolean }>(`/projects/${projectId}/integrations/${integrationId}`, {
        method: 'DELETE',
      }),
  },
  actions: {
    list: (projectId: string) =>
      request<IHumanAction[]>(`/projects/${projectId}/actions`),
    create: (projectId: string, data: CreateHumanActionRequest) =>
      request<IHumanAction>(`/projects/${projectId}/actions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (projectId: string, actionId: string, data: UpdateHumanActionRequest) =>
      request<IHumanAction>(`/projects/${projectId}/actions/${actionId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    updateStatus: (projectId: string, actionId: string, data: UpdateHumanActionStatusRequest) =>
      request<IHumanAction>(`/projects/${projectId}/actions/${actionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (projectId: string, actionId: string) =>
      request<{ success: boolean }>(`/projects/${projectId}/actions/${actionId}`, {
        method: 'DELETE',
      }),
  },
  plan: {
    get: (projectId: string) =>
      request<{
        plan: IImplementationPlan | null;
        tasks: IPlanTask[];
        stats: {
          totalTasks: number;
          completedTasks: number;
          inProgressTasks: number;
          blockedTasks: number;
          todoTasks: number;
          executableTasksCount: number;
          totalRoadmapPhases: number;
          totalMilestones: number;
          totalFeatures: number;
          totalUserStories: number;
          totalEstimatedHours: number;
          byType: Record<string, number>;
        };
        executableTaskIds: string[];
      }>(`/projects/${projectId}/plan`),
    generate: (projectId: string) =>
      request<{
        plan: IImplementationPlan;
        tasks: IPlanTask[];
        stats: any;
        executableTaskIds: string[];
      }>(`/projects/${projectId}/plan/generate`, {
        method: 'POST',
      }),
    updatePlan: (projectId: string, data: UpdateImplementationPlanRequest) =>
      request<IImplementationPlan>(`/projects/${projectId}/plan`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    listTasks: (projectId: string) =>
      request<IPlanTask[]>(`/projects/${projectId}/plan/tasks`),
    createTask: (projectId: string, data: CreateTaskRequest) =>
      request<IPlanTask>(`/projects/${projectId}/plan/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTask: (projectId: string, taskId: string, data: UpdateTaskRequest) =>
      request<IPlanTask>(`/projects/${projectId}/plan/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    updateTaskStatus: (projectId: string, taskId: string, data: UpdateTaskStatusRequest) =>
      request<IPlanTask>(`/projects/${projectId}/plan/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteTask: (projectId: string, taskId: string) =>
      request<{ success: boolean }>(`/projects/${projectId}/plan/tasks/${taskId}`, {
        method: 'DELETE',
      }),
    exportSpec: (projectId: string) =>
      request<any>(`/projects/${projectId}/plan/export-spec`),
  },
  readiness: {
    get: (projectId: string) =>
      request<IProjectReadinessReport>(`/projects/${projectId}/readiness`),
    audit: (projectId: string) =>
      request<IProjectReadinessReport>(`/projects/${projectId}/readiness/audit`, {
        method: 'POST',
      }),
    approve: (projectId: string, data?: ApproveProjectRequest) =>
      request<IProjectReadinessReport>(`/projects/${projectId}/readiness/approve`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    finalize: (projectId: string, data?: FinalizeProjectRequest) =>
      request<IProjectReadinessReport>(`/projects/${projectId}/readiness/finalize`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
  },
  export: {
    getJson: (projectId: string) =>
      request<IProjectSpec>(`/projects/${projectId}/export/json`),
    getMarkdown: (projectId: string, includeMermaid: boolean = true) =>
      request<{ markdown: string }>(`/projects/${projectId}/export/markdown?includeMermaid=${includeMermaid}`),
    getBundle: (projectId: string) =>
      request<{ files: IModularSpecBundle }>(`/projects/${projectId}/export/bundle`),
    listVersions: (projectId: string) =>
      request<ISpecificationVersion[]>(`/projects/${projectId}/versions`),
    createVersion: (projectId: string, data: CreateSpecVersionRequest) =>
      request<ISpecificationVersion>(`/projects/${projectId}/versions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getVersion: (projectId: string, versionId: string) =>
      request<ISpecificationVersion>(`/projects/${projectId}/versions/${versionId}`),
    getPdfUrl: (projectId: string, inline: boolean = true) =>
      `/api/projects/${projectId}/export/pdf?inline=${inline}`,
  },
  agent: {
    getHandoff: (projectId: string) =>
      request<IEngineeringHandoffPackage>(`/projects/${projectId}/agent/handoff`),
    initializeHandoff: (projectId: string, data?: InitializeHandoffRequest) =>
      request<IEngineeringHandoffPackage>(`/projects/${projectId}/agent/handoff`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    getQueue: (projectId: string) =>
      request<ITaskQueueItem[]>(`/projects/${projectId}/agent/queue`),
    getNextTask: (projectId: string) =>
      request<ITaskQueueItem | null>(`/projects/${projectId}/agent/next-task`),
    claimTask: (projectId: string, taskId: string, data?: ClaimTaskRequest) =>
      request<IPlanTask>(`/projects/${projectId}/agent/tasks/${taskId}/claim`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    completeTask: (projectId: string, taskId: string, data?: CompleteTaskRequest) =>
      request<IPlanTask>(`/projects/${projectId}/agent/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    failTask: (projectId: string, taskId: string, data: FailTaskRequest) =>
      request<IPlanTask>(`/projects/${projectId}/agent/tasks/${taskId}/fail`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submitFeedback: (projectId: string, data: SubmitFeedbackRequest) =>
      request<IAgentFeedbackReport>(`/projects/${projectId}/agent/feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  auth: {
    signup: (data: SignUpRequest) =>
      request<IAuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: SignInRequest) =>
      request<IAuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () => request<{ user: IUser }>('/auth/me'),
    logout: () =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),
  },
};





