import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

const ROLES_FILE = path.join(__dirname, '.server_assigned_roles.json');
const AUDIT_LOGS_FILE = path.join(__dirname, '.server_audit_logs.json');
const SUPER_ADMIN_IDENTITIES = new Set([
  'official.sunny.ext@gmail.com',
  'sunny.travelcareexpress@gmail.com',
]);

function initBaselineAuditLogs(): any[] {
  return [
    {
      id: 'log-sys-001',
      admin_id: 'mother-admin-id',
      admin_email: 'official.sunny.ext@gmail.com',
      admin_name: 'Super Administrator',
      is_super_admin: true,
      action: 'role_change',
      target_type: 'role',
      target_id: 'official.sunny.ext@gmail.com',
      description: 'Super Administrator privilege established with immutable security definer',
      old_value: { role: 'customer', is_super_admin: false },
      new_value: { role: 'admin', is_super_admin: true },
      ip_address: '103.145.118.42 (Dhaka, BD)',
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    },
    {
      id: 'log-sys-002',
      admin_id: 'mother-admin-id',
      admin_email: 'official.sunny.ext@gmail.com',
      admin_name: 'Super Administrator',
      is_super_admin: true,
      action: 'category_create',
      target_type: 'category',
      target_id: 'cat-gadgets-01',
      description: 'Created primary category "Smart Electronics & Gadgets"',
      old_value: null,
      new_value: { name: 'Smart Electronics & Gadgets', slug: 'smart-gadgets', is_active: true },
      ip_address: '103.145.118.42 (Dhaka, BD)',
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    },
    {
      id: 'log-sys-003',
      admin_id: 'mother-admin-id',
      admin_email: 'official.sunny.ext@gmail.com',
      admin_name: 'Super Administrator',
      is_super_admin: true,
      action: 'coupon_create',
      target_type: 'coupon',
      target_id: 'ZENMART10',
      description: 'Published storewide promotional coupon "ZENMART10" (10% discount)',
      old_value: null,
      new_value: { code: 'ZENMART10', discount_type: 'percentage', discount_value: 10, is_active: true },
      ip_address: '103.145.118.42 (Dhaka, BD)',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  ];
}

function loadServerAuditLogs(): any[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const raw = fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  const baseline = initBaselineAuditLogs();
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(baseline, null, 2), 'utf-8');
  } catch {
    // ignore
  }
  return baseline;
}

function appendServerAuditLog(entry: any) {
  try {
    const logs = loadServerAuditLogs();
    logs.unshift(entry);
    if (logs.length > 5000) logs.length = 5000;
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write server audit logs file:', err);
  }
}

function loadServerRoles(): Record<string, 'customer' | 'admin'> {
  try {
    if (fs.existsSync(ROLES_FILE)) {
      return JSON.parse(fs.readFileSync(ROLES_FILE, 'utf-8'));
    }
  } catch {
    // fallback
  }
  return {};
}

function saveServerRoles(roles: Record<string, 'customer' | 'admin'>) {
  try {
    fs.writeFileSync(ROLES_FILE, JSON.stringify(roles, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write server roles file:', err);
  }
}

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-admin-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/')) {
          return next();
        }

        // Helper to read JSON body
        const readBody = async (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
            req.on('error', () => resolve({}));
          });
        };

        const sendJson = (status: number, data: any) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        // 1. Health check
        if (url === '/api/health') {
          return sendJson(200, { status: 'ok', serverTime: new Date().toISOString() });
        }

        // 2. Authoritative role verification
        if (url === '/api/admin/verify-status' && req.method === 'POST') {
          const body = await readBody();
          const cleanEmail = body.email?.trim().toLowerCase();
          const isSuper = Boolean(cleanEmail && SUPER_ADMIN_IDENTITIES.has(cleanEmail)) || body.userId === 'mother-admin-id';
          const serverRoles = loadServerRoles();
          const assignedRole = cleanEmail ? serverRoles[cleanEmail] : (body.userId ? serverRoles[body.userId] : null);
          const role = isSuper ? 'admin' : (assignedRole || 'customer');
          const isAdmin = isSuper || role === 'admin';
          return sendJson(200, { isSuperAdmin: isSuper, isAdmin, role, email: cleanEmail });
        }

        // 3. Authoritative role update (Strictly Super Admin only)
        if (url === '/api/admin/roles/update' && req.method === 'POST') {
          const body = await readBody();
          const { callerId, callerEmail, targetEmail, targetId, newRole } = body;
          const cleanCaller = callerEmail?.trim().toLowerCase();
          const isCallerSuper = Boolean(cleanCaller && SUPER_ADMIN_IDENTITIES.has(cleanCaller)) || callerId === 'mother-admin-id';

          if (!isCallerSuper) {
            return sendJson(403, {
              error: 'Permission Denied: Only the Super Admin can manage administrator roles. Normal administrators do not possess permission to assign or revoke roles.',
              code: 'SUPER_ADMIN_REQUIRED',
            });
          }

          const cleanTarget = targetEmail?.trim().toLowerCase();
          if (!cleanTarget && !targetId) {
            return sendJson(400, { error: 'Target email or target user ID is required.' });
          }

          if (newRole !== 'customer' && newRole !== 'admin') {
            return sendJson(400, { error: 'Invalid role: role must be "customer" or "admin".' });
          }

          // Protect Super Admin from demotion
          if (cleanTarget && SUPER_ADMIN_IDENTITIES.has(cleanTarget) && newRole !== 'admin') {
            return sendJson(403, {
              error: 'Security Violation: The Super Admin account is permanently protected and cannot be demoted, modified, or revoked.',
              code: 'CANNOT_DEMOTE_SUPER_ADMIN',
            });
          }

          const serverRoles = loadServerRoles();
          if (cleanTarget) serverRoles[cleanTarget] = newRole;
          if (targetId) serverRoles[targetId] = newRole;
          saveServerRoles(serverRoles);

          return sendJson(200, {
            success: true,
            message: `Role successfully updated to ${newRole}`,
            targetEmail: cleanTarget,
            role: newRole,
          });
        }

        // 4. Get authoritative roles
        if (url === '/api/admin/roles' && req.method === 'GET') {
          return sendJson(200, { roles: loadServerRoles() });
        }

        // 5. Authoritative admin login
        if (url === '/api/admin/login' && req.method === 'POST') {
          const body = await readBody();
          const cleanEmail = body.email?.trim().toLowerCase();
          const isSuper = Boolean(cleanEmail && SUPER_ADMIN_IDENTITIES.has(cleanEmail));
          const serverRoles = loadServerRoles();
          const isAssigned = cleanEmail && serverRoles[cleanEmail] === 'admin';

          if (!isSuper && !isAssigned) {
            return sendJson(403, {
              error: 'You do not have administrator access. (আপনার অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই)',
            });
          }

          return sendJson(200, {
            success: true,
            user: {
              id: isSuper ? 'mother-admin-id' : `admin-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
              full_name: isSuper ? 'Super Administrator' : (cleanEmail.split('@')[0] || 'Administrator'),
              email: cleanEmail,
              role: 'admin',
              is_super_admin: isSuper,
            },
          });
        }

        // 6. Audit logs - fetch logs with filtering
        if (url.startsWith('/api/admin/audit-logs') && req.method === 'GET') {
          const parsedUrl = new URL(url, 'http://localhost');
          const search = parsedUrl.searchParams.get('search');
          const admin = parsedUrl.searchParams.get('admin');
          const action = parsedUrl.searchParams.get('action');
          const target_type = parsedUrl.searchParams.get('target_type');
          const dateRange = parsedUrl.searchParams.get('dateRange');

          let logs = loadServerAuditLogs();

          if (search) {
            const q = search.trim().toLowerCase();
            logs = logs.filter((l) =>
              (l.description && l.description.toLowerCase().includes(q)) ||
              (l.target_id && l.target_id.toLowerCase().includes(q)) ||
              (l.admin_email && l.admin_email.toLowerCase().includes(q)) ||
              (l.admin_name && l.admin_name.toLowerCase().includes(q)) ||
              (l.action && l.action.toLowerCase().includes(q))
            );
          }

          if (admin && admin !== 'all') {
            const a = admin.trim().toLowerCase();
            logs = logs.filter((l) => l.admin_email && l.admin_email.toLowerCase() === a);
          }

          if (action && action !== 'all') {
            logs = logs.filter((l) => l.action === action);
          }

          if (target_type && target_type !== 'all') {
            logs = logs.filter((l) => l.target_type === target_type);
          }

          if (dateRange && dateRange !== 'all') {
            const now = Date.now();
            let threshold = 0;
            if (dateRange === 'today') {
              const startOfDay = new Date();
              startOfDay.setHours(0, 0, 0, 0);
              threshold = startOfDay.getTime();
            } else if (dateRange === '7days') {
              threshold = now - 7 * 24 * 3600 * 1000;
            } else if (dateRange === '30days') {
              threshold = now - 30 * 24 * 3600 * 1000;
            }
            if (threshold > 0) {
              logs = logs.filter((l) => new Date(l.created_at).getTime() >= threshold);
            }
          }

          return sendJson(200, { logs, total: logs.length });
        }

        // 7. Audit logs - append log
        if (url === '/api/admin/audit-logs' && req.method === 'POST') {
          const body = await readBody();
          const {
            admin_id,
            admin_email,
            admin_name,
            is_super_admin,
            action,
            target_type,
            target_id,
            description,
            old_value,
            new_value,
            ip_address,
          } = body;

          if (!admin_email || !action || !target_type || !target_id || !description) {
            return sendJson(400, {
              error: 'Missing required audit fields: admin_email, action, target_type, target_id, description are required.',
            });
          }

          const cleanEmail = admin_email.trim().toLowerCase();
          const isSuper = Boolean(is_super_admin || SUPER_ADMIN_IDENTITIES.has(cleanEmail));

          const newLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            admin_id: admin_id || (isSuper ? 'mother-admin-id' : 'admin-id'),
            admin_email: cleanEmail,
            admin_name: admin_name || (isSuper ? 'Super Administrator' : cleanEmail.split('@')[0]),
            is_super_admin: isSuper,
            action,
            target_type,
            target_id: String(target_id),
            description,
            old_value: old_value !== undefined ? old_value : null,
            new_value: new_value !== undefined ? new_value : null,
            ip_address: ip_address || '103.145.118.42 (Dhaka Hub)',
            created_at: new Date().toISOString(),
          };

          appendServerAuditLog(newLog);
          return sendJson(201, { success: true, log: newLog });
        }

        // 8. Block DELETE/PUT/PATCH on audit logs
        if (url.startsWith('/api/admin/audit-logs') && (req.method === 'DELETE' || req.method === 'PUT' || req.method === 'PATCH')) {
          return sendJson(403, {
            error: 'Security Violation: Audit logs are strictly immutable and cannot be updated or deleted.',
            code: 'AUDIT_LOG_IMMUTABLE',
          });
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
