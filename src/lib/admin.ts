import type { User } from '@supabase/supabase-js';

const ADMIN_ROLES = new Set(['admin', 'owner', 'manager']);

function configuredAdminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasAdminRoleInMetadata(user: User): boolean {
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};

  const candidates = [
    meta.role, meta.user_role, meta.admin_role, meta.type,
    appMeta.role, appMeta.user_role, appMeta.admin_role, appMeta.type,
  ];

  for (const c of candidates) {
    if (c && ADMIN_ROLES.has(String(c).toLowerCase())) return true;
  }

  return false;
}

export function hasAdminAccess(user?: User | null) {
  if (!user) return false;

  if (hasAdminRoleInMetadata(user)) return true;

  const allowedEmails = configuredAdminEmails();
  if (allowedEmails.length === 0) return true;

  return Boolean(user.email && allowedEmails.includes(user.email.toLowerCase()));
}
