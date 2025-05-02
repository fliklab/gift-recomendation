export const MODEL_TOKEN_PRICES = {
  "gpt-3.5-turbo": 0.0015, // $0.0015 per 1K tokens
  "gpt-4o-mini": 0.002, // $0.0020 per 1K tokens
  "gpt-4o-large": 0.004, // $0.0040 per 1K tokens
};

/**
 * 모델명과 총 토큰 수를 기반으로 소요 비용을 계산합니다.
 * @param {string} modelName
 * @param {number} totalTokens
 * @returns {number|null} 계산된 비용(USD), 계산 불가 시 null
 */
export function calculateCost(modelName, totalTokens) {
  const pricePerThousand = MODEL_TOKEN_PRICES[modelName];
  if (pricePerThousand == null || totalTokens == null) return null;
  return (totalTokens / 1000) * pricePerThousand;
}

export function convertUSDToKRW(amount) {
  return amount * 1400;
}
