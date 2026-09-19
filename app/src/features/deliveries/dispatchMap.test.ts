import { describe, expect, it } from 'vitest';
import { buildDispatchMapPoints } from './dispatchMap';

describe('buildDispatchMapPoints', () => {
  it('creates valid geographic points for dispatch records', () => {
    const points = buildDispatchMapPoints([
      {
        id: 'delivery-1',
        number: 'DLV-001',
        status: 'OUT_FOR_DELIVERY',
        customer: { name: 'Ada Okafor' },
        deliveryAddress: 'Lekki Phase 1, Lagos',
      },
    ]);

    expect(points).toHaveLength(1);
    expect(points[0].coordinates).toHaveLength(2);
    expect(points[0].coordinates[0]).toBeGreaterThan(3);
    expect(points[0].coordinates[0]).toBeLessThan(4);
    expect(points[0].coordinates[1]).toBeGreaterThan(6);
    expect(points[0].coordinates[1]).toBeLessThan(7);
    expect(points[0].status).toBe('OUT_FOR_DELIVERY');
  });
});
