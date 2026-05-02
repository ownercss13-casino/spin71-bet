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
  private baseUrl = '/api';

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
    // Use relative URL for API requests to avoid origin issues in iframes
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    console.log(`[ApiService] Requesting: ${endpoint}, Full URL: ${fullUrl}`);
    
    try {
      console.log(`[ApiService] Fetching: ${fullUrl}`, { 
        method: options.method || 'GET',
        hasBody: !!options.body
      });
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      const contentType = response.headers.get('Content-Type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.warn(`Non-JSON response from ${endpoint}:`, text.substring(0, 100));
        throw new Error(`Expected JSON but received ${contentType || 'text'}. Server might be misconfigured or returning an error page.`);
      }

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
    return this.request<T>('/external-fetch', {
      method: 'POST',
      body: JSON.stringify({ url, method: 'GET', headers }),
    });
  }

  public async proxyPost<T>(url: string, body: any, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('/external-fetch', {
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
