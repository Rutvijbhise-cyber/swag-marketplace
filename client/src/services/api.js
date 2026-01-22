const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data
    );
  }

  return data;
}

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function refreshToken() {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  } catch (err) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw err;
  }
}

async function fetchWithRetry(url, options) {
  const response = await fetch(url, options);

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));

    if (data.code === 'TOKEN_EXPIRED') {
      const newToken = await refreshToken();

      // Retry with new token
      const retryOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        }
      };

      return fetch(url, retryOptions);
    }
  }

  return response;
}

export const api = {
  async get(endpoint) {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async post(endpoint, body) {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },

  async patch(endpoint, body) {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },

  async put(endpoint, body) {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },

  async delete(endpoint) {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

export async function getConfig() {
  const response = await fetch(`${API_BASE}/config`);
  return response.json();
}
