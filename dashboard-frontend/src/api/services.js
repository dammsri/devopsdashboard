import api from "./client";

export const authApi = {
  login: (userId, password) => api.post("/auth/login", { user_id: userId, password }),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
  me: () => api.get("/auth/me"),
};

export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
  getActivity: () => api.get("/dashboard/activity"),
  getEnvironmentSummaries: () => api.get("/dashboard/environment-summaries"),
  getTrends: () => api.get("/dashboard/metrics/trends"),
};

export const usersApi = {
  list: () => api.get("/users/"),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users/", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const applicationsApi = {
  getApplications: () => api.get("/applications"),
  getEnvironmentDetails: (appId, envId) => api.get(`/applications/${appId}/environments/${envId}`),
  listAllEnvironments: () => api.get("/applications/environments"),
  create: (data) => api.post("/applications/", data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  remove: (id) => api.delete(`/applications/${id}`),
  // Environments
  createEnvironment: (data) => api.post("/applications/environments", data),
  updateEnvironment: (appId, envId, data) => api.put(`/applications/${appId}/environments/${envId}`, data),
  removeEnvironment: (appId, envId) => api.delete(`/applications/${appId}/environments/${envId}`),
  // Generic Services
  listAllServices: () => api.get("/applications/services"),
  createService: (data) => api.post("/applications/services", data),
  updateService: (itamId, envId, name, data) => api.put(`/applications/${itamId}/${envId}/${name}`, data),
  removeService: (itamId, envId, name) => api.delete(`/applications/${itamId}/${envId}/${name}`),
};

export const infrastructureApi = {
  getInfrastructureGroups: () => api.get('/infrastructure/groups'),
  getInfrastructureServers: (category, appId) => api.get(`/infrastructure/${category}/${appId}/servers`),
  // Settings/CRUD
  listServers: () => api.get("/infrastructure/servers"),
  createServer: (data) => api.post("/infrastructure/servers", data),
  updateServer: (itamId, ip, user, data) => api.put(`/infrastructure/servers/${itamId}/${ip}/${user}`, data),
  removeServer: (itamId, ip, user) => api.delete(`/infrastructure/servers/${itamId}/${ip}/${user}`),
};

export const skeEnvironmentsApi = {
  // Clusters
  listClusters: () => api.get('/ske/clusters'),
  createCluster: (data) => api.post('/ske/clusters', data),
  updateCluster: (itamId, clusterId, data) => api.put(`/ske/clusters/${itamId}/${clusterId}`, data),
  removeCluster: (itamId, clusterId) => api.delete(`/ske/clusters/${itamId}/${clusterId}`),

  // Namespaces
  listNamespaces: () => api.get('/ske/namespaces'),
  createNamespace: (data) => api.post('/ske/namespaces', data),
  updateNamespace: (itamId, clusterId, envId, ns, data) => api.put(`/ske/namespaces/${itamId}/${clusterId}/${envId}/${ns}`, data),
  removeNamespace: (itamId, clusterId, envId, ns) => api.delete(`/ske/namespaces/${itamId}/${clusterId}/${envId}/${ns}`),

  // Environments
  getEnvironments: () => api.get('/ske/environments'),
  createEnvironment: (data) => api.post('/ske/environments', data),
  updateEnvironment: (itamId, clusterId, envId, data) => api.put(`/ske/environments/${itamId}/${clusterId}/${envId}`, data),
  removeEnvironment: (itamId, clusterId, envId) => api.delete(`/ske/environments/${itamId}/${clusterId}/${envId}`),

  // Services
  listAllServices: () => api.get('/ske/services'),
  getEnvironmentServices: (envId) => api.get(`/ske/environments/${envId}/services`),
  getServiceDetail: (envId, svcId) => api.get(`/ske/services/${envId}/${svcId}`),
  createService: (data) => api.post('/ske/services', data),
  updateService: (itamId, clusterId, envId, ns, svcId, data) => api.put(`/ske/services/${itamId}/${clusterId}/${envId}/${ns}/${svcId}`, data),
  removeService: (itamId, clusterId, envId, ns, svcId) =>
    api.delete(`/ske/services/${itamId}/${clusterId}/${envId}/${ns}/${svcId}`),
};

export const summaryApi = {
  getApplicationSummary: (itamId) => api.get(`/summary/${itamId}`),
};

export const importApi = {
  upload: (category, formData) => api.post(`/import/${category}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const opsApi = {
  getJobs: () => api.get("/settings/ops/jobs"),
};

export const securityApi = {
  getRoles: () => api.get("/security/roles"),
  getFunctionalities: () => api.get("/security/functionalities"),
  createRole: (data) => api.post("/security/roles", data),
  updateRole: (id, data) => api.put(`/security/roles/${id}`, data),
  removeRole: (id) => api.delete(`/security/roles/${id}`),
  updateFunctionality: (id, data) => api.put(`/security/functionalities/${id}`, data),
};
