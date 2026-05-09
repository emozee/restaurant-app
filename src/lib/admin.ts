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

  const role = String(
    user.app_metadata?.role ||
      user.app_metadata?.user_role ||
      user.user_metadata?.role ||
      '',
  ).toLowerCase();

  if (ADMIN_ROLES.has(role)) return true;

  const allowedEmails = configuredAdminEmails();
  if (allowedEmails.length === 0) return true;

  return Boolean(user.email && allowedEmails.includes(user.email.toLowerCase()));
}
