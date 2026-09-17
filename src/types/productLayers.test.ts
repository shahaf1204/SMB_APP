import { describe, expect, it } from 'vitest';
import {
  PRODUCT_FEATURE_DEFAULT_LAYER,
  type ProductFeatureEntitlementKey,
} from './productLayers';

describe('productLayers contracts', () => {
  it('maps every entitlement key to a product value layer', () => {
    const keys = Object.keys(PRODUCT_FEATURE_DEFAULT_LAYER) as ProductFeatureEntitlementKey[];
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(['core', 'automation']).toContain(PRODUCT_FEATURE_DEFAULT_LAYER[key]);
    }
  });

  it('keeps core manual workflows separate from automation features', () => {
    expect(PRODUCT_FEATURE_DEFAULT_LAYER.manual_crm).toBe('core');
    expect(PRODUCT_FEATURE_DEFAULT_LAYER.meta_lead_sync).toBe('automation');
    expect(PRODUCT_FEATURE_DEFAULT_LAYER.customer_messaging).toBe('automation');
  });
});
