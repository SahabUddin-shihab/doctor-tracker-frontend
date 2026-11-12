/** Central query-key factory: prefix keys make broad invalidation (e.g. every doctor list) a one-liner. */
export const queryKeys = {
  auth: { me: ['auth', 'me'] as const },
  doctors: {
    all: ['doctors'] as const,
    list: (params: object) => ['doctors', 'list', params] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
    patients: (id: string, params: object) => ['doctors', 'patients', id, params] as const,
    options: (search: string) => ['doctors', 'options', search] as const,
    filterOptions: ['doctors', 'filter-options'] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: (params: object) => ['patients', 'list', params] as const,
    conditions: ['patients', 'conditions'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    overview: ['dashboard', 'overview'] as const,
    patientsPerDoctor: ['dashboard', 'patients-per-doctor'] as const,
    trends: (period: string, from: string, to: string) => ['dashboard', 'trends', period, from, to] as const,
    conditions: ['dashboard', 'conditions'] as const,
    activity: ['dashboard', 'activity'] as const,
  },
};
