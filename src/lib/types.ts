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

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  participant1Id?: string;
  participant2Id?: string;
}

export interface Championship {
  id: string;
  name: string;
  columnIds: string[];
  groups: ChampionshipGroup[];
  classifyCount: number;
  currentPhase: 1 | 2;
  phase2ColumnIds?: string[];
  bracket?: BracketMatch[];
  createdAt: number;
}

export type UserRole = 'admin' | 'viewer';

export interface UserProfile {
  email: string;
  role: UserRole;
  createdAt: number;
}
