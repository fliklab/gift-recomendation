import { API_ENDPOINT, MODEL, TEMPERATURE, QUESTIONS } from "./constants.js";
import {
  createRecommendationPrompt,
  createNextQuestionPrompt,
  cleanJSONResponse,
} from "./prompts.js";

export class ApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getGiftRecommendations(answers) {
    const prompt = createRecommendationPrompt(answers, QUESTIONS);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: TEMPERATURE,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const cleaned = cleanJSONResponse(content);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      throw error;
    }
  }

  async getNextQuestion(previousAnswers) {
    const prompt = createNextQuestionPrompt(previousAnswers, QUESTIONS);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: TEMPERATURE,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
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
  // 정규식으로 ```json ... ``` 사이의 내용만 추출
  const match = text.match(/```json\s*([\s\S]*?)```/);
  const jsonString = match ? match[1].trim() : text.trim();
  return JSON.parse(jsonString);
}
