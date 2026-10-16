const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7070'

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // 쿠키 포함 (세션 기반 인증)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'API 요청 실패')
      }

      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Auth
  async login(username, birth) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, birth }),
    })
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Projects
  async getProjects() {
    return this.request('/projects')
  }

  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // Todos
  async getTodos(projectId = null) {
    const params = projectId ? `?projectId=${projectId}` : ''
    return this.request(`/todos${params}`)
  }

  async createTodo(data) {
    return this.request('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTodo(id, data) {
    return this.request(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTodo(id) {
    return this.request(`/todos/${id}`, {
      method: 'DELETE',
    })
  }

  // Health Check
  async healthCheck() {
    return this.request('/health')
  }
}

export const apiClient = new ApiClient()
