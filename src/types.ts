
export type ToastType = 'success' | 'info' | 'error' | 'warning';

export interface UserData {
  id?: string;
  username?: string;
  balance?: number;
  vipLevel?: number;
  kycStatus?: 'pending' | 'verified' | 'unverified';
  kycSubmittedAt?: string;
  kycDocumentType?: string;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  avatarUrl?: string;
  [key: string]: any;
}
