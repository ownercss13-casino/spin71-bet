/**
 * Centralized API Service for Spin71 Bet
 * This handles all external communications, proxying through our backend when necessary.
 */

import { getBackendUrl } from '../config';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private static instance: ApiService;
  private backendUrl = getBackendUrl();
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
    const backend = getBackendUrl();
    // Ensure endpoint has leading slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Construct full URL
    let fullUrl = cleanEndpoint;
    
    // If relative API call, prepend the correct backend
    if (!cleanEndpoint.startsWith('http')) {
      if (cleanEndpoint.startsWith(this.baseUrl)) {
         fullUrl = `${backend}${cleanEndpoint}`;
      } else {
         fullUrl = `${backend}${this.baseUrl}${cleanEndpoint}`;
      }
    }
    
    console.log(`[ApiService] Requesting: ${fullUrl}`);
    
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
        try {
          data = await response.json();
        } catch (parseError: any) {
          console.error(`[ApiService] JSON parse error from ${endpoint}:`, parseError);
          const rawText = await response.text().catch(() => 'unavailable');
          throw new Error(`Failed to parse JSON response. Content-Type was ${contentType}, but content was: ${rawText.substring(0, 100)}`);
        }
      } else {
        const text = await response.text().catch(() => "could not read body");
        console.warn(`Non-JSON response from ${endpoint}:`, text.substring(0, 100));
        
        // If it looks like HTML, it might be the SPA fallback
        if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
          throw new Error(`The API returned an HTML page instead of JSON. This usually means the route doesn't exist or the server crashed. URL: ${fullUrl}`);
        }
        
        throw new Error(`Expected JSON but received ${contentType || 'text'}. Content: ${text.substring(0, 50)}...`);
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

  public async get<T>(endpoint: string, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public async post<T>(endpoint: string, body: any, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), headers });
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
