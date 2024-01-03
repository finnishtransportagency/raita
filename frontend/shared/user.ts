import { useEffect, useState } from 'react';
import { getUser } from './rest';
import { useQuery } from '@tanstack/react-query';

export enum RaitaRole {
  Read = 'Raita_luku',
  Admin = 'Raita_admin',
  Extended = 'Raita_extended',
}

export type User = {
  roles: RaitaRole[];
};
export function useUser(): { loading: boolean; user: User | null } {
  const query = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    // avoid multiple requests on single page load
    staleTime: 30 * 1000,
  });

  return { loading: query.isLoading, user: (query.data as User) ?? null };
}
