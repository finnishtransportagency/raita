import { useEffect, useState } from 'react';
import { getUser } from './rest';

export enum RaitaRole {
  Read = 'Raita_luku',
  Admin = 'Raita_admin',
  Extended = 'Raita_extended',
}

export type User = {
  roles: RaitaRole[];
};
export function useUser(): { loading: boolean; user: User | null } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getUser().then(response => {
      if (response.roles && response.roles.length) {
        setUser({ roles: response.roles as RaitaRole[] });
        setLoading(false);
      } else {
        // handle error elsewhere?
        setLoading(false);
        setUser(null);
      }
    });
  }, []);
  return { loading, user };
}
