import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

interface Member {
  id: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'DISPATCH';
  user: { id: string; name: string; email: string; phone: string | null };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UserManagementModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'STAFF' | 'DISPATCH'>('STAFF');
  const [msg, setMsg] = useState('');
  const [credentialMemberId, setCredentialMemberId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/business/members'),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      api.post('/business/members', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setMsg('User created');
      setName('');
      setEmail('');
      setPassword('');
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Create failed'),
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

  const updateCredentials = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/business/members/${id}/credentials`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setMsg('Credentials updated');
      setNewPassword('');
      setCredentialMemberId(null);
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Update failed'),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    create.mutate({ name, email, password, role });
  }

  function handleUpdateCredentials(e: FormEvent) {
    e.preventDefault();
    if (credentialMemberId) {
      updateCredentials.mutate({ id: credentialMemberId, password: newPassword });
    }
  }

  function handleClose() {
    setMsg('');
    setCredentialMemberId(null);
    setNewPassword('');
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border bg-card shadow-3d"
          >
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-3.5">
              <h2 className="font-semibold">Users & Roles</h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              <AnimatePresence>
                {msg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-md bg-green-50 p-3 text-sm text-green-700"
                  >
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="space-y-4"
              >
                {/* Create user */}
                <form onSubmit={handleCreate} className="rounded-lg border bg-card p-4 space-y-3">
                  <h3 className="font-semibold">Create User</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Full name"
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Login email"
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Password"
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'MANAGER' | 'STAFF' | 'DISPATCH')}
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="DISPATCH">Dispatch</option>
                    </select>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={create.isPending}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {create.isPending ? 'Creating...' : 'Create'}
                  </motion.button>
                </form>

                {/* Members list */}
                <div className="rounded-lg border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/50">
                    <h3 className="font-semibold">Members</h3>
                  </div>
                  <div className="divide-y">
                    {members.map((m) => (
                      <div key={m.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                            <option value="DISPATCH">Dispatch</option>
                          </select>
                          {m.role === 'DISPATCH' && (
                            <button
                              onClick={() => setCredentialMemberId(m.id)}
                              className="rounded-md bg-primary/10 px-3 py-1 text-sm text-primary hover:bg-primary/20"
                            >
                              Set Password
                            </button>
                          )}
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

                {/* Update dispatch user credentials */}
                <AnimatePresence>
                  {credentialMemberId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Update Dispatch User Password</h3>
                        <button
                          onClick={() => { setCredentialMemberId(null); setNewPassword(''); }}
                          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <form onSubmit={handleUpdateCredentials} className="space-y-3">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder="New password (min 6 characters)"
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={updateCredentials.isPending}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                          >
                            {updateCredentials.isPending ? 'Updating...' : 'Update Password'}
                          </motion.button>
                          <button
                            type="button"
                            onClick={() => { setCredentialMemberId(null); setNewPassword(''); }}
                            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
