const API_BASE = '/api';

/**
 * Helper to execute fetch requests and handle response formatting & errors.
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || `HTTP error! Status code: ${response.status}` };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `API request failed with status: ${response.status}`,
      };
    }

    // Handles instances where FastAPI backend catches an internal exception and returns status "error"
    if (data && data.status === 'error') {
      return {
        success: false,
        error: data.message || 'An error occurred during server execution.',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    return {
      success: false,
      error: 'Cannot establish connection to FastAPI backend. Please verify your backend server is active on port 8000.',
    };
  }
}

export const api = {
  /**
   * Check connection status to backend
   */
  async checkStatus() {
    return apiRequest('/');
  },

  /**
   * Fetch all running applications
   */
  async fetchApps() {
    return apiRequest('/apps');
  },

  /**
   * Deploy a new Nginx container
   * @param {string} appName - Name of the application (container)
   * @param {number} port - Port number mapped on host
   */
  async deployApp(appName, port) {
    return apiRequest('/deploy', {
      method: 'POST',
      body: JSON.stringify({
        app_name: appName,
        port: parseInt(port, 10),
      }),
    });
  },

  /**
   * Stop and remove a running container
   * @param {string} name - Name of the container to delete
   */
  async deleteApp(name) {
    return apiRequest(`/apps/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },
};
