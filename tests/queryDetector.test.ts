import { QueryDetector } from '../src/utils/queryDetector';

describe('QueryDetector', () => {
  it('returns null for empty input', () => {
    const result = QueryDetector.detectDetailed('');
    expect(result.type).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects base58 like strings', () => {
    const result = QueryDetector.detectDetailed('9xQeWvG816bUx9EPfQz7iJ7uG8d9n8K7bYkGJ3nq9X5a');
    expect(result.type).not.toBeNull();
    expect(result.confidence).toBeGreaterThan(0);
  });
});
