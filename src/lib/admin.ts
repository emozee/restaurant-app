import type { User } from '@supabase/supabase-js';

const ADMIN_ROLES = new Set(['admin', 'owner', 'manager']);

const HARDCODED_ADMINS = new Set([
  'nima.eimoze.yoezer@gmail.com',
  'lhamo5pema@gmail.com',
]);

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
  if (!user) {
    console.warn('[admin] hasAdminAccess called with no user');
    return false;
  }

  console.log('[admin] checking access for', user.email, 'user_metadata:', user.user_metadata, 'app_metadata:', user.app_metadata);

  if (hasAdminRoleInMetadata(user)) {
    console.log('[admin] granted via metadata role');
    return true;
  }

  if (user.email && HARDCODED_ADMINS.has(user.email.toLowerCase())) {
    console.log('[admin] granted via hardcoded admin list');
    return true;
  }

  const allowedEmails = configuredAdminEmails();
  if (allowedEmails.length === 0) {
    console.log('[admin] VITE_ADMIN_EMAILS empty — allowing all');
    return true;
  }

  const matched = Boolean(user.email && allowedEmails.includes(user.email.toLowerCase()));
  console.log('[admin] email whitelist check:', matched, '| allowed:', allowedEmails);
  return matched;
}
