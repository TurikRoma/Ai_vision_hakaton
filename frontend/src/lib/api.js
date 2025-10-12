// API client with graceful fallback to mocks
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TokenManager = {
  setTokens({ accessToken, refreshToken }) {
    if (accessToken) {
      localStorage.setItem("aiface_access_token", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("aiface_refresh_token", refreshToken);
    }
  },

  getAccessToken() {
    return localStorage.getItem("aiface_access_token");
  },

  getRefreshToken() {
    return localStorage.getItem("aiface_refresh_token");
  },

  clearTokens() {
    localStorage.removeItem("aiface_access_token");
    localStorage.removeItem("aiface_refresh_token");
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};

class ApiClient {
  constructor() {
    this.baseUrl = BASE_URL;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...options.headers,
      },
    };

    if (options.body instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    const accessToken = TokenManager.getAccessToken();
    if (accessToken && !options.skipAuth) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      let response = await fetch(url, config);

      if (response.status === 401 && !options.isRefresh && !options.skipAuth) {
        const refreshed = await this._refreshToken();
        if (refreshed) {
          // Повторяем запрос с новым токеном
          config.headers.Authorization = `Bearer ${TokenManager.getAccessToken()}`;
          response = await fetch(url, config);
        } else {
          TokenManager.clearTokens();
          // Можно добавить редирект на страницу логина
          window.location.href = "/login";
          throw new Error("Session expired");
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.detail || `HTTP ${response.status}`;
        throw new Error(detail);
      }

      // Для ответов без тела (например, 204 No Content)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async _refreshToken() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }
    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh();
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async _performRefresh() {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        isRefresh: true, // Флаг, чтобы избежать бесконечного цикла
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      TokenManager.setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Auth
  async signup({ email, password }) {
    const data = await this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    TokenManager.setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
    return data;
  }

  async login({ email, password }) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    TokenManager.setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
    return data;
  }

  async logout() {
    const refreshToken = TokenManager.getRefreshToken();
    try {
      if (refreshToken) {
        await this.request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (e) {
      // Игнорируем ошибки, просто чистим токены
    } finally {
      TokenManager.clearTokens();
    }
  }

  // Analyses
  async processImage({ imageDataUrl }) {
    const form = new FormData();
    form.append("file", dataUrlToFile(imageDataUrl, "selfie.jpg"));
    return this.request("/analyses/process", {
      method: "POST",
      body: form,
      skipAuth: !TokenManager.isAuthenticated(),
    });
  }

  async saveAnalysis({ imageDataUrl, results }) {
    const form = new FormData();
    form.append("file", dataUrlToFile(imageDataUrl, "selfie.jpg"));
    form.append("recommendations", results.recommendations || "");
    form.append("puffiness", results.puffiness || 0);
    form.append("dark_circles", results.darkCircles || 0);
    form.append("fatigue", results.fatigue || 0);
    form.append("acne", results.acne || 0);
    form.append("skin_condition", results.skinCondition || "normal");
    form.append("eyes_health", results.eyesHealth || 0);
    form.append("skin_health", results.skinHealth || 0);

    return this.request("/analyses/", {
      method: "POST",
      body: form,
      // Этот эндпоинт может быть вызван анонимно
      skipAuth: !TokenManager.isAuthenticated(),
    });
  }

  async fetchHistory() {
    return this.request("/analyses/");
  }

  async fetchAnalysisById(id) {
    return this.request(`/analyses/${id}`);
  }
}

export const api = new ApiClient();
export { TokenManager };

// Helper: convert dataURL to File
export function dataUrlToFile(dataUrl, filename) {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
