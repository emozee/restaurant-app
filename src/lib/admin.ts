import type { User } from '@supabase/supabase-js';

const ADMIN_ROLES = new Set(['admin', 'owner', 'manager']);

function configuredAdminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
}

function extractRole(user: User): string {
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};

  const candidates = [
    meta.role, meta.user_role, meta.admin_role,
    appMeta.role, appMeta.user_role, appMeta.admin_role,
  ];

  for (const c of candidates) {
    if (c && ADMIN_ROLES.has(String(c).toLowerCase())) {
      return String(c).toLowerCase();
    }
  }

  const plain = String(candidates.find(Boolean) || '');
  return plain.toLowerCase();
}

export function hasAdminAccess(user?: User | null) {
  if (!user) return false;

  if (ADMIN_ROLES.has(extractRole(user))) return true;

  const allowedEmails = configuredAdminEmails();
  if (allowedEmails.length === 0) {
    if (import.meta.env.DEV) {
      console.warn("VITE_ADMIN_EMAILS is empty — all authenticated users are treated as admins. Set VITE_ADMIN_EMAILS in production.");
      return true;
    }
    return false;
  }

  return Boolean(user.email && allowedEmails.includes(user.email.toLowerCase()));
}
