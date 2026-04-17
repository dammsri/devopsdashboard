import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true, // send httpOnly refresh cookie
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach access token from memory ─────────────────────
api.interceptors.request.use((config) => {
  const token = window.__ACCESS_TOKEN__;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: token refresh on 401 ───────────────────────────────
let refreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isLoginOrRefresh = original.url.includes("/auth/login") || original.url.includes("/auth/refresh");

    if (error.response?.status === 401 && !original._retry && !isLoginOrRefresh) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      refreshing = true;
      try {
        const { data } = await api.post("/auth/refresh");
        window.__ACCESS_TOKEN__ = data.access_token;
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        window.__ACCESS_TOKEN__ = null;
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
