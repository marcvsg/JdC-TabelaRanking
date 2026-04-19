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

export interface ChampionshipGroup {
  id: string;
  name: string;
  participantIds: string[];
}

export interface Championship {
  id: string;
  name: string;
  columnIds: string[];
  groups: ChampionshipGroup[];
  classifyCount: number;
  createdAt: number;
}

export type UserRole = 'admin' | 'viewer';

export interface UserProfile {
  email: string;
  role: UserRole;
  createdAt: number;
}
