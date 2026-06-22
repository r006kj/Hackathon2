export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  details: Record<string, unknown>;
}

export interface LoginRequest {
  teamCode: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt?: string;
}

export interface User {
  id: string;
  email: string;
  teamCode: string;
  role: string;
}

export interface DashboardSummary {
  totalTropels: number;
  criticalTropels: number;
  openSignals: number;
  sectorStabilityAvg: number;
}

export type VitalState = 'CRITICAL' | 'STABLE' | 'UNSTABLE' | 'UNKNOWN';

export interface Tropel {
  id: string;
  name: string;
  species: string;
  vitalState: VitalState;
  sectorId: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type TropelSortField = 'name' | 'vitalState' | 'createdAt';

export interface TropelFilters {
  species?: string;
  vitalState?: VitalState;
  sectorId?: string;
  sort?: TropelSortField;
  page: number;          
  size: 10 | 20 | 50;
}

export type SignalStatus = 'PENDIENTE' | 'PROCESANDO' | 'ATENDIDA';

export interface Signal {
  id: string;
  title: string;
  description: string;
  status: SignalStatus;
  sectorId: string;
  createdAt: string;
}

export interface SignalFeedPage {
  items: Signal[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PatchStatusRequest {
  status: Extract<SignalStatus, 'ATENDIDA' | 'PROCESANDO'>;
}

export interface StageMetric {
  label: string;
  value: number | string;
}

export interface StoryStage {
  id: string;
  order: number;
  title: string;
  description: string;
  colorToken: string;
  assetKey: string;
  metrics: StageMetric[];
}

export interface SectorStory {
  sectorId: string;
  stages: StoryStage[];
}