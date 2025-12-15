/**
 * Query detector that attempts to classify an input string as a wallet,
 * transaction signature or token mint. Uses a simple heuristic with
 * confidence scoring and human readable reasons.
 */

export type QueryType = 'wallet' | 'transaction' | 'token';

export interface DetectionReason {
  rule: string;
  weight: number;
}

export interface DetectionResult {
  type: QueryType | null;
  confidence: number;
  reasons: DetectionReason[];
}

export class QueryDetector {
  static detectDetailed(value: string): DetectionResult {
    const trimmed = value.trim();
    const reasons: DetectionReason[] = [];

    if (!trimmed) {
      return { type: null, confidence: 0, reasons: [] };
    }

    const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Pattern.test(trimmed)) {
      reasons.push({ rule: 'nonBase58Characters', weight: -1 });
      return { type: null, confidence: 0, reasons };
    }

    const length = trimmed.length;

    if (length >= 32 && length <= 44) {
      reasons.push({ rule: 'walletLengthRange', weight: 2 });
    }

    if (length > 60 && length <= 90) {
      reasons.push({ rule: 'signatureLengthRange', weight: 2 });
    }

    if (length >= 40 && length <= 50) {
      reasons.push({ rule: 'mintLengthRange', weight: 2 });
    }

    let walletScore = 0;
    let txScore = 0;
    let tokenScore = 0;

    for (const r of reasons) {
      if (r.rule === 'walletLengthRange') {
        walletScore += r.weight;
      }
      if (r.rule === 'signatureLengthRange') {
        txScore += r.weight;
      }
      if (r.rule === 'mintLengthRange') {
        tokenScore += r.weight;
      }
    }

    const scores: Array<{ type: QueryType; score: number }> = [
      { type: 'wallet', score: walletScore },
      { type: 'transaction', score: txScore },
      { type: 'token', score: tokenScore }
    ];

    const best = scores.reduce((a, b) => (b.score > a.score ? b : a), {
      type: 'wallet' as QueryType,
      score: -Infinity
    });

    if (best.score <= 0) {
      return { type: null, confidence: 0, reasons };
    }

    const maxScore = 4;
    const confidence = Math.min(1, Math.max(0, best.score / maxScore));

    return {
      type: best.type,
      confidence,
      reasons
    };
  }

  static detect(value: string): QueryType | null {
    return this.detectDetailed(value).type;
  }
}
