/**
 * DIGITAL HEROES GOLF: SCALABILITY ENGINE
 * Centralized logic for Global Prize Distribution
 */

export const PRIZE_CONSTANTS = {
  SUBSCRIPTION_FEE: 25,
  CHARITY_CUT: 10, // $10 per sub
  POOL_CONTRIBUTION: 10, // $10 per sub
  TIERS: {
    MATCH_5: 0.40, // 40% of pool
    MATCH_4: 0.35, // 35% of pool
    MATCH_3: 0.25, // 25% of pool
  },
  DEFAULT_COUNTRY: 'US',
  DEFAULT_CURRENCY: 'USD'
};

export function calculatePrizePool(activeUserCount: number, previousRollover: number = 0) {
  const generatedPool = activeUserCount * PRIZE_CONSTANTS.POOL_CONTRIBUTION;
  const totalPool = generatedPool + previousRollover;

  return {
    totalPool,
    generatedPool,
    previousRollover,
    split: {
      match5: totalPool * PRIZE_CONSTANTS.TIERS.MATCH_5,
      match4: totalPool * PRIZE_CONSTANTS.TIERS.MATCH_4,
      match3: totalPool * PRIZE_CONSTANTS.TIERS.MATCH_3,
    }
  };
}

export function getPrizePerWinner(totalTierPool: number, winnerCount: number) {
  if (winnerCount === 0) return totalTierPool; // Rollover logic
  return totalTierPool / winnerCount;
}