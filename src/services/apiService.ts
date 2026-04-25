/**
 * Centralized API Service for Spin71 Bet
 * This handles all external communications, proxying through our backend when necessary.
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private static instance: ApiService;
  private baseUrl = window.location.origin + '/api';

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Universal fetch helper with error handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { success: true, data };
    } catch (error: any) {
      console.error(`API Request Error [${endpoint}]:`, error);
      return { success: false, error: error.message || 'Something went wrong' };
    }
  }

  /**
   * Proxy a request to an external API via our backend
   * This avoids CORS and hides API keys
   */
  public async proxyGet<T>(url: string, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('/proxy', {
      method: 'POST',
      body: JSON.stringify({ url, method: 'GET', headers }),
    });
  }

  public async proxyPost<T>(url: string, body: any, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('/proxy', {
      method: 'POST',
      body: JSON.stringify({ url, method: 'POST', body, headers }),
    });
  }

  /**
   * Specific helper for AI services
   */
  public async getAiChat(message: string, userId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/chat', {
      method: 'POST',
      body: JSON.stringify({ text: message, userId }),
    });
  }

  /**
   * Specific helper for game stats
   */
  public async getTrafficStats(token: string): Promise<ApiResponse<any>> {
    return this.request<any>('/admin/traffic/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}

export const apiService = ApiService.getInstance();
