export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors: ApiFieldError[];
  code?: string;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface Admin {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorOption {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
}

export type Gender = 'male' | 'female' | 'other';

export interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  age: number;
  gender: Gender;
  condition: string;
  notes: string | null;
  doctor: { id: string; name: string; specialization: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionOption {
  value: string;
  label: string;
  count: number;
}

export interface DashboardOverview {
  totals: { doctors: number; patients: number };
  averagePatientsPerDoctor: number;
  thisMonth: { doctors: number; patients: number };
  lastMonth: { doctors: number; patients: number };
  doctorsWithoutPatients: number;
  unassignedPatients: number;
  timezone: string;
  monthStart: string;
}

export interface PatientsPerDoctor {
  data: Array<{ doctorId: string; name: string; specialization: string; count: number }>;
  totalDoctors: number;
  shown: number;
}

export type TrendPeriod = 'daily' | 'weekly' | 'monthly';

export interface TrendsResponse {
  period: TrendPeriod;
  from: string;
  to: string;
  timezone: string;
  series: Array<{ date: string; doctors: number; patients: number }>;
  totals: { doctors: number; patients: number };
}

export interface ConditionDistribution {
  data: Array<{ key: string; condition: string; count: number }>;
  total: number;
}

export interface ActivityItem {
  id: string;
  type: 'doctor.created' | 'patient.created' | 'patient.updated' | 'patient.deleted' | 'patient.unassigned';
  entityType: 'doctor' | 'patient';
  entityId: string;
  summary: string;
  createdAt: string;
}
