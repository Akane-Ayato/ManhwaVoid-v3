import { getData } from './http';

export type AdminRole = 'owner' | 'admin' | 'content_manager' | 'moderator' | 'user';
export interface AdminMe {
  id: string;
  username: string;
  display_name: string;
  email: string;
  role: AdminRole;
  permissions: string[];
}

/** The only control-plane request needed before loading the admin UI bundle. */
export const getAdminMe = () => getData<AdminMe>('/_control/me');
