'use client';

import useSWR from 'swr';
import { getAuthAction } from '@/auth/actions';
import { SWR_KEYS } from '@/swr';

export const useAuth = () => {
  const { data: auth } = useSWR(SWR_KEYS.GET_AUTH, getAuthAction);
  return auth;
};

export const useIsAdmin = () => {
  const auth = useAuth();
  return auth?.user?.role === 'admin';
};

export const useIsViewer = () => {
  const auth = useAuth();
  return auth?.user?.role === 'viewer';
};

export const useUserRole = () => {
  const auth = useAuth();
  return auth?.user?.role;
};
