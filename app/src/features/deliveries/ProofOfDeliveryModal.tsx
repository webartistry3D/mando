import { useState, useRef, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { X, Camera, Pen, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  deliveryId: string;
}

export default function ProofOfDeliveryModal({ open, onClose, deliveryId }: Props) {
  const queryClient = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [msg, setMsg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      return api.post<{ id: string }>('/attachments', {
        entityType: 'DELIVERY',
        entityId: deliveryId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileData: base64,
      });
    },
  });

  const markDelivered = useMutation({
    mutationFn: async (data: { proofPhotoAttachmentId: string; signatureAttachmentId: string; recipientConfirmation: string }) => {
      return api.patch(`/deliveries/${deliveryId}`, {
        ...data,
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', deliveryId] });
      setMsg('Delivery marked as successful');
      setTimeout(() => {
        handleClose();
      }, 1500);
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Update failed'),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreview(preview);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        setHasSignature(true);
      }
    }
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  };

  const getSignatureDataUrl = (): string => {
    const canvas = canvasRef.current;
    if (canvas) {
      return canvas.toDataURL('image/png');
    }
    return '';
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!photoFile) {
      setMsg('Please capture a proof photo');
      return;
    }
    if (!hasSignature) {
      setMsg('Please capture client signature');
      return;
    }

    try {
      const photoAttachment = await uploadAttachment.mutateAsync(photoFile);

      // Convert signature canvas to file
      const signatureDataUrl = getSignatureDataUrl();
      const signatureBase64 = signatureDataUrl.replace(/^data:image\/png;base64,/, '');
      const signatureBuffer = Buffer.from(signatureBase64, 'base64');
      const signatureFile = new File([signatureBuffer], 'signature.png', { type: 'image/png' });

      const signatureAttachment = await uploadAttachment.mutateAsync(signatureFile);

      markDelivered.mutate({
        proofPhotoAttachmentId: photoAttachment.id,
        signatureAttachmentId: signatureAttachment.id,
        recipientConfirmation: 'Signed and verified',
      });
    } catch (error) {
      setMsg('Failed to upload proof of delivery');
    }
  }

  function handleClose() {
    setMsg('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setHasSignature(false);
    clearSignature();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg rounded-xl border bg-card shadow-3d max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-3.5">
              <h2 className="font-semibold">Proof of Delivery</h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <AnimatePresence>
                {msg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-md p-3 text-sm ${
                      msg.includes('success') || msg.includes('successful')
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo Capture */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Proof Photo
                  </label>
                  <div className="mt-2">
                    {photoPreview ? (
                      <div className="relative h-48 w-full rounded-lg border bg-muted overflow-hidden">
                        <img
                          src={photoPreview}
                          alt="Proof photo"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute right-2 top-2 rounded-full bg-background/80 p-2 hover:bg-background"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-48 w-full rounded-lg border-2 border-dashed bg-muted flex flex-col items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                        <input
                          type="file"
                          id="proof-photo"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="proof-photo"
                          className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Tap to capture photo
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature Capture */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Pen className="h-4 w-4" />
                    Client Signature
                  </label>
                  <div className="mt-2">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full h-40 rounded-lg border bg-background cursor-crosshair touch-none"
                    />
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear signature
                    </button>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={markDelivered.isPending || uploadAttachment.isPending}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {markDelivered.isPending || uploadAttachment.isPending ? (
                    'Processing...'
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm Delivery
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
