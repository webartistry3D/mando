import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { X, Upload, X as XIcon } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  logoAttachmentId: string | null;
  cacNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BusinessProfileModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: () => api.get<Business>('/business'),
    enabled: open,
  });

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cacNumber: '',
  });

  useEffect(() => {
    if (business) {
      setProfile({
        name: business.name || '',
        phone: business.phone || '',
        email: business.email || '',
        address: business.address || '',
        cacNumber: business.cacNumber || '',
      });
      if (business.logoAttachmentId) {
        // Fetch the attachment URL
        api.get<{ url: string }>(`/attachments/${business.logoAttachmentId}/url`)
          .then((data) => setLogoPreview(data.url))
          .catch(() => setLogoPreview(null));
      }
    }
  }, [business]);

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      return api.post<{ id: string }>('/attachments', {
        entityType: 'BUSINESS',
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileData: base64,
      });
    },
  });

  const updateBusiness = useMutation({
    mutationFn: async (data: Partial<typeof profile & { logoAttachmentId: string | null }>) => {
      let logoAttachmentId = data.logoAttachmentId;
      if (logoFile) {
        const uploaded = await uploadLogo.mutateAsync(logoFile);
        logoAttachmentId = uploaded.id;
      }
      return api.patch('/business', { ...data, logoAttachmentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      setMsg('Business profile updated');
      setTimeout(() => {
        handleClose();
      }, 1500);
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Update failed'),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  function handleClose() {
    setMsg('');
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
              <h2 className="font-semibold">Business Profile</h2>
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateBusiness.mutate({
                      ...profile,
                      logoAttachmentId: logoPreview && !logoFile ? business?.logoAttachmentId : null,
                    });
                  }}
                  className="rounded-lg border bg-card p-4 space-y-4"
                >
                  <h3 className="text-lg font-semibold">Business Profile</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Logo</label>
                      <div className="mt-1 flex items-center gap-4">
                        {logoPreview ? (
                          <div className="relative h-20 w-20 rounded-lg border bg-muted overflow-hidden">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="absolute right-1 top-1 rounded-full bg-background/80 p-1 hover:bg-background"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-20 w-20 rounded-lg border border-dashed bg-muted flex items-center justify-center">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            id="logo"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="logo"
                            className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                          >
                            <Upload className="h-4 w-4" />
                            {logoPreview ? 'Change Logo' : 'Upload Logo'}
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Business Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Address</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CAC / Registration Number</label>
                      <input
                        type="text"
                        value={profile.cacNumber}
                        onChange={(e) => setProfile((p) => ({ ...p, cacNumber: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={updateBusiness.isPending}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {updateBusiness.isPending ? 'Saving...' : 'Save Profile'}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
