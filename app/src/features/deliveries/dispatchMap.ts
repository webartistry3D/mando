export type DispatchMapPoint = {
  id: string;
  label: string;
  status?: string;
  coordinates: [number, number];
};

type DispatchMapEntry = {
  id: string;
  number?: string | null;
  status?: string | null;
  customer?: { name?: string | null } | null;
  recipientName?: string | null;
  deliveryAddress?: string | null;
};

const defaultCoordinates: [number, number] = [3.3792, 6.5244];

function parseAddressCoordinates(address: string): [number, number] {
  const normalized = address.toLowerCase();

  if (normalized.includes('lekki')) return [3.4737, 6.5244];
  if (normalized.includes('ikeja')) return [3.338, 6.594];
  if (normalized.includes('abuja')) return [7.3986, 9.0765];
  if (normalized.includes('port harcourt')) return [7.0498, 4.8156];

  return defaultCoordinates;
}

export function buildDispatchMapPoints(entries: DispatchMapEntry[]): DispatchMapPoint[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.customer?.name || entry.recipientName || entry.number || 'Delivery location',
    status: entry.status || undefined,
    coordinates: entry.deliveryAddress ? parseAddressCoordinates(entry.deliveryAddress) : defaultCoordinates,
  }));
}
