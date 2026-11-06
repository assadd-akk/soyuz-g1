export interface TargetPost {
  id: string;
  authorDid: string;
  authorHandle: string;
  text: string;
  createdAt: string;
}

export type LeadGrade = 'A' | 'B' | 'C' | 'D' | 'NONE';

export interface ScoredLead {
  post: TargetPost;
  grade: LeadGrade;
  score: number;
  matchedCategories: string[];
  matchedKeywords: string[];
  isTargetArtist: boolean;
  timestamp: number;
}

export class SoyuzLeadScorer {
  private targetDids: Set<string>;
  private catA: Set<string>;
  private catB: Set<string>;
  private catC: Set<string>;
  private catD: Set<string>;

  constructor(
    targetDids: string[],
    catA: string[],
    catB: string[],
    catC: string[],
    catD: string[]
  ) {
    // Fast O(1) in-memory set lookups for stream workers
    this.targetDids = new Set(targetDids.map(d => d.toLowerCase()));
    this.catA = new Set(catA.map(k => k.toLowerCase()));
    this.catB = new Set(catB.map(k => k.toLowerCase()));
    this.catC = new Set(catC.map(k => k.toLowerCase()));
    this.catD = new Set(catD.map(k => k.toLowerCase()));
  }

  public scorePost(post: TargetPost): ScoredLead | null {
    const textLower = post.text.toLowerCase();
    const isTargetArtist = this.targetDids.has(post.authorDid.toLowerCase());

    const matchedKeywords: string[] = [];
    const matchedCategories: string[] = [];

    let score = 0;

    // Cat A: High-Intent Direct Hiring (+40 pts)
    for (const keyword of this.catA) {
      if (textLower.includes(keyword)) {
        score += 40;
        matchedKeywords.push(keyword);
        if (!matchedCategories.includes('cat_a')) matchedCategories.push('cat_a');
      }
    }

    // Cat B: Budget Queries & Low-Cost (+25 pts)
    for (const keyword of this.catB) {
      if (textLower.includes(keyword)) {
        score += 25;
        matchedKeywords.push(keyword);
        if (!matchedCategories.includes('cat_b')) matchedCategories.push('cat_b');
      }
    }

    // Cat C: Niche Asset & Style Requests (+20 pts)
    for (const keyword of this.catC) {
      if (textLower.includes(keyword)) {
        score += 20;
        matchedKeywords.push(keyword);
        if (!matchedCategories.includes('cat_c')) matchedCategories.push('cat_c');
      }
    }

    // Cat D: General Discovery & Payments (+15 pts)
    for (const keyword of this.catD) {
      if (textLower.includes(keyword)) {
        score += 15;
        matchedKeywords.push(keyword);
        if (!matchedCategories.includes('cat_d')) matchedCategories.push('cat_d');
      }
    }

    // Bonus points if post originates from or interacts with one of 3,030 target DIDs
    if (isTargetArtist) {
      score += 30;
    }

    // Determine Grade Thresholds
    let grade: LeadGrade = 'NONE';
    if (score >= 70) grade = 'A';
    else if (score >= 45) grade = 'B';
    else if (score >= 30) grade = 'C';
    else if (score >= 15) grade = 'D';

    // Ignore posts with no relevant keyword matches
    if (grade === 'NONE') return null;

    return {
      post,
      grade,
      score,
      matchedCategories,
      matchedKeywords,
      isTargetArtist,
      timestamp: Date.now(),
    };
  }
}