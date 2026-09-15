import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Member {
  id: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  user: { id: string; name: string; email: string; phone: string | null };
}

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'STAFF'>('STAFF');
  const [msg, setMsg] = useState('');

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/business/members'),
  });

  const invite = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api.post('/business/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setMsg('User invited');
      setInviteEmail('');
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Invite failed'),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/business/members/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setMsg('Role updated');
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Update failed'),
  });

  const removeMember = useMutation({
    mutationFn: (id: string) => api.delete(`/business/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setMsg('Member removed');
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Remove failed'),
  });

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    invite.mutate({ email: inviteEmail, role: inviteRole });
  }

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">Users & Roles</h1>

      {msg && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{msg}</div>}

      {/* Invite */}
      <form onSubmit={handleInvite} className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Invite Member</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            placeholder="user@example.com"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'MANAGER' | 'STAFF')}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="STAFF">Staff</option>
            <option value="MANAGER">Manager</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={invite.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {invite.isPending ? 'Inviting...' : 'Invite'}
        </button>
        <p className="text-xs text-muted-foreground">
          The user must already be registered in Mando.
        </p>
      </form>

      {/* Members list */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50">
          <h2 className="font-semibold">Members</h2>
        </div>
        <div className="divide-y">
          {members.map((m) => (
            <div key={m.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{m.user.name}</p>
                <p className="text-sm text-muted-foreground">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) => updateRole.mutate({ id: m.id, role: e.target.value })}
                  disabled={m.role === 'OWNER'}
                  className="rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
                >
                  <option value="OWNER">Owner</option>
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staff</option>
                </select>
                {m.role !== 'OWNER' && (
                  <button
                    onClick={() => removeMember.mutate(m.id)}
                    className="rounded-md bg-destructive/10 px-3 py-1 text-sm text-destructive hover:bg-destructive/20"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No members found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
