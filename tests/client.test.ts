import { ZKScanClient } from '../src/api/client';

describe('ZKScanClient configuration', () => {
  it('applies default values', () => {
    const client = new ZKScanClient({
      apiUrl: 'https://zkscan.app/api',
      apiKey: 'test'
    } as any);

    expect((client as any).config.enableProofs).toBe(true);
    expect((client as any).config.proofPolicy).toBe('optional');
  });
});
