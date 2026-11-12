import { api, setCsrfToken } from '@/lib/api/client';
import type { ApiSuccess, Admin } from '@/types';
import type { LoginValues } from '@/lib/validations/auth';

interface SessionPayload {
  admin: Admin;
  csrfToken: string;
}

export async function login(values: LoginValues): Promise<Admin> {
  const res = await api.post<ApiSuccess<SessionPayload>>('/auth/login', values);
  setCsrfToken(res.data.data.csrfToken);
  return res.data.data.admin;
}

/** Page-load session check. A 401 transparently triggers one refresh attempt in the axios interceptor. */
export async function fetchMe(): Promise<Admin> {
  const res = await api.get<ApiSuccess<SessionPayload>>('/auth/me');
  setCsrfToken(res.data.data.csrfToken);
  return res.data.data.admin;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setCsrfToken(null);
  }
}
