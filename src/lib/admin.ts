import type { User } from '@supabase/supabase-js';

const ADMIN_ROLES = new Set(['admin', 'owner', 'manager']);

function configuredAdminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAdminAccess(user?: User | null) {
  if (!user) return false;

  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};

  const role = String(
    meta.role || meta.user_role ||
    appMeta.role || appMeta.user_role ||
    ''
  ).toLowerCase();

  if (role && ADMIN_ROLES.has(role)) return true;

  const allowedEmails = configuredAdminEmails();
  if (allowedEmails.length === 0) return true;

  return Boolean(user.email && allowedEmails.includes(user.email.toLowerCase()));
}
