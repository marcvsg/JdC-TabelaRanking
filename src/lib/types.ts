export interface Column {
  id: string;
  name: string;
  order: number;
}

export interface Participant {
  id: string;
  name: string;
  scores: Record<string, number>;
  createdAt: number;
}

export type UserRole = 'admin' | 'viewer';

export interface UserProfile {
  email: string;
  role: UserRole;
  createdAt: number;
}
