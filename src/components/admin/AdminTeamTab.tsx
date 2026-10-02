import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  ToggleLeft,
  ToggleRight,
  Activity,
  Users,
  Search,
  Lock,
} from 'lucide-react';
import type { TeamMember, AuditLog } from '../../types.js';
import { TeamMemberModal } from './TeamMemberModal.js';
import { StaffPasswordModal } from './StaffPasswordModal.js';

interface AdminTeamTabProps {
  token: string | null;
}

export const AdminTeamTab: React.FC<AdminTeamTabProps> = ({ token }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [viewMode, setViewMode] = useState<'members' | 'activity'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [passwordMember, setPasswordMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    loadTeam();
    loadActivity();
  }, [token]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/team', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const res = await fetch('/api/admin/team/activity', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (err) {
      console.error('Failed to load staff activity:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleToggleStatus = async (m: TeamMember) => {
    const newStatus = m.status === 'active' ? 'disabled' : 'active';
    const actionLabel = newStatus === 'active' ? 'enable' : 'disable';

    if (!confirm(`Are you sure you want to ${actionLabel} ${m.name}'s staff account?`)) return;

    try {
      const res = await fetch(`/api/admin/team/${m.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(
          newStatus === 'active'
            ? `${m.name}'s account is now ACTIVE and can sign in.`
            : `${m.name}'s account has been DISABLED. Active sessions terminated.`
        );
        loadTeam();
        loadActivity();
      }
    } catch (err) {
      console.error('Status toggle failed:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete staff member ${name}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`Staff account for ${name} permanently removed.`);
        loadTeam();
        loadActivity();
      }
    } catch (err) {
      console.error('Failed to delete staff:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' };
      case 'manager':
        return { label: 'Atelier Manager', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' };
      case 'order_manager':
        return { label: 'Logistics / Dispatch', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' };
      case 'catalog_manager':
        return { label: 'Catalog Specialist', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' };
      case 'accountant':
        return { label: 'Finance & Tax', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' };
      case 'support':
        return { label: 'Customer Concierge', color: 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/20' };
      default:
        return { label: role, color: 'bg-stone-500/10 text-stone-600 border-stone-500/20' };
    }
  };

  const filteredTeam = team.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <span>Atelier Staff Management & Role-Based Access</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Lifetime staff accounts with custom RBAC permissions. No automated expiration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadTeam();
              loadActivity();
            }}
            className="p-2 rounded-xl border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500"
            title="Refresh Staff List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMember(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-serif uppercase tracking-widest font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Staff Account</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('members')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'members'
                ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Accounts ({team.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('activity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'activity'
                ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Staff Activity Logs ({activityLogs.length})</span>
          </button>
        </div>

        {viewMode === 'members' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}
      </div>

      {/* Lifetime Account Guarantee Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold block">Lifetime Account Policy</span>
          <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
            Staff accounts are permanent and do NOT expire automatically after 24h, 7d, or 30d. You retain absolute control to enable, disable, change permissions, or reset passwords at any moment.
          </p>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'members' ? (
        filteredTeam.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <Users className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              No staff members match your query
            </p>
            <p className="text-xs text-stone-400">
              Click "Create Staff Account" above to issue lifetime atelier credentials.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeam.map((m) => {
              const roleBadge = getRoleBadge(m.role);
              const isActive = m.status === 'active';

              return (
                <div
                  key={m.id}
                  className={`p-5 bg-white dark:bg-zinc-900 border rounded-2xl shadow-xs space-y-4 transition ${
                    isActive
                      ? 'border-stone-200 dark:border-zinc-800'
                      : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20'
                  }`}
                >
                  {/* Top Bar: Avatar, Name, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-800 shrink-0 bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-700 dark:text-stone-200 font-serif font-bold text-lg">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          m.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 leading-tight">
                          {m.name}
                        </h3>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${roleBadge.color}`}
                        >
                          {roleBadge.label}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(m)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                      }`}
                      title="Click to toggle account status"
                    >
                      {isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      <span>{isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-zinc-800 text-xs text-stone-600 dark:text-stone-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate font-mono">{m.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="font-mono">{m.phone || 'No phone'}</span>
                    </div>
                  </div>

                  {/* Permissions Summary */}
                  <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                      Permitted Pages:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(m.permissions?.pages || ['dashboard']).slice(0, 4).map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300 rounded text-[10px] font-mono capitalize"
                        >
                          {p}
                        </span>
                      ))}
                      {(m.permissions?.pages?.length || 0) > 4 && (
                        <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-zinc-800 text-stone-400 rounded text-[10px] font-mono">
                          +{(m.permissions?.pages?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setPasswordMember(m)}
                      className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 transition"
                      title="Reset Password"
                    >
                      <Key className="w-3 h-3" />
                      <span>Password</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(m);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-amber-600 transition"
                        title="Edit profile & permissions"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {m.role !== 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id, m.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition"
                          title="Delete staff account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Activity Logs View */
        <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/60 flex items-center justify-between">
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Staff Activity Audit Trail
            </span>
            <span className="text-xs font-mono text-stone-400">
              Real-time administrative records
            </span>
          </div>

          {activityLogs.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              No staff activity recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-zinc-800 text-xs">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        {log.action}
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {log.entityType} {log.entityId ? `(#${log.entityId})` : ''}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-stone-600 dark:text-stone-400 text-[11px]">{log.details}</p>
                    )}
                  </div>
                  <div className="text-right sm:shrink-0 text-[11px] text-stone-400 font-mono">
                    <div>{log.adminEmail}</div>
                    <div>{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit / Create Staff Modal */}
      <TeamMemberModal
        isOpen={isModalOpen}
        member={editingMember}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showToast(
            editingMember
              ? `Staff member ${editingMember.name} updated successfully.`
              : 'New lifetime staff account created successfully.'
          );
          loadTeam();
          loadActivity();
        }}
        token={token}
      />

      {/* Change Password Modal */}
      <StaffPasswordModal
        isOpen={Boolean(passwordMember)}
        member={passwordMember}
        onClose={() => setPasswordMember(null)}
        onSuccess={(msg) => {
          showToast(msg);
          loadTeam();
          loadActivity();
        }}
        token={token}
      />
    </div>
  );
};
