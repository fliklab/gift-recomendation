import {
  API_ENDPOINT,
  MODEL,
  TEMPERATURE,
  QUESTIONS,
  PROMPTS,
} from "./constants.js";
import {
  createRecommendationPrompt,
  createNextQuestionPrompt,
  cleanJSONResponse,
} from "./prompts.js";

// API 응답 캐시 추가
const apiCache = new Map();

export class ApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.controller = null; // AbortController 인스턴스 저장용
  }

  /**
   * 기본 fetch 함수에 타임아웃과 캐시 적용
   * @param {string} endpoint API 엔드포인트
   * @param {Object} options fetch 옵션
   * @param {string} cacheKey 캐시 키
   * @param {number} timeout 타임아웃 (밀리초)
   * @returns {Promise<any>}
   */
  async fetchWithTimeout(endpoint, options, cacheKey = null, timeout = 60000) {
    // 캐시된 응답이 있는지 확인
    if (cacheKey && apiCache.has(cacheKey)) {
      console.log("🔄 캐시된 응답 사용:", cacheKey);
      return apiCache.get(cacheKey);
    }

    // 이전 요청이 있으면 취소
    if (this.controller) {
      this.controller.abort();
    }

    // 새 AbortController 생성
    this.controller = new AbortController();
    const { signal } = this.controller;

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      this.controller.abort();
    }, timeout);

    try {
      console.time("API 요청 시간");
      const response = await fetch(endpoint, { ...options, signal });
      console.timeEnd("API 요청 시간");

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // 캐시에 응답 저장
      if (cacheKey) {
        apiCache.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(
          "API 요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요."
        );
      }
      throw error;
    }
  }

  async getGiftRecommendations(answers) {
    const prompt = createRecommendationPrompt(answers, QUESTIONS());
    console.log("🎁 선물 추천 요청 시작");

    // 캐시 키 생성 (답변 배열을 문자열로 변환하여 사용)
    const cacheKey = `recommendations-${JSON.stringify(answers)}`;

    try {
      const data = await this.fetchWithTimeout(
        API_ENDPOINT(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: MODEL(),
            messages: [{ role: "user", content: prompt }],
            temperature: TEMPERATURE(),
          }),
        },
        cacheKey
      );

      const content = data.choices[0].message.content;
      const cleaned = cleanJSONResponse(content);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      throw new Error(`선물 추천을 가져오는데 실패했습니다: ${error.message}`);
    }
  }

  async getNextQuestion(previousAnswers) {
    const prompt = createNextQuestionPrompt(previousAnswers, QUESTIONS());
    console.log("❓ 다음 질문 요청 시작");

    // 캐시 키 생성 (이전 답변 배열을 문자열로 변환하여 사용)
    const cacheKey = `nextQuestion-${JSON.stringify(previousAnswers)}`;

    try {
      const data = await this.fetchWithTimeout(
        API_ENDPOINT(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: MODEL(),
            messages: [{ role: "user", content: prompt }],
            temperature: TEMPERATURE(),
          }),
        },
        cacheKey
      );

      const content = data.choices[0].message.content;
      const cleaned = cleanJSONResponse(content);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("다음 질문 생성 중 오류 발생:", error);
      throw new Error(
        "다음 질문 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  }
}

/**
 * 코드블록(```json ... ```)이 포함된 문자열에서 JSON만 추출
 * @param {string} text
 * @returns {object}
 */
export function parseJsonFromCodeBlock(text) {
  try {
    // 정규식으로 ```json ... ``` 사이의 내용만 추출
    const match = text.match(/```json\s*([\s\S]*?)```/);
    const jsonString = match ? match[1].trim() : text.trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON 파싱 오류:", error);
    throw new Error("응답 형식이 올바르지 않습니다. 다시 시도해주세요.");
  }
}
