import { API_ENDPOINT, MODEL, TEMPERATURE, QUESTIONS } from "./constants.js";

export class ApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getGiftRecommendations(answers) {
    const prompt = this._createPrompt(answers);

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
      const cleaned = this._cleanJSONResponse(content);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      throw error;
    }
  }

  async getNextQuestion(previousAnswers) {
    const prompt = this._createNextQuestionPrompt(previousAnswers);

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
      const cleaned = this._cleanJSONResponse(content);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("다음 질문 생성 중 오류 발생:", error);
      throw new Error(
        "다음 질문 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  }

  _createPrompt(answers) {
    return `
당신은 뛰어난 선물 추천 도우미입니다.

아래 사용자의 정보를 참고하여, "선물 키워드" 4개를 추천해주세요.
ex. 샤넬 지갑 100만원대, 5만원 미만 카드지갑
- 키워드는 취향, 취미, 관심사 등 사용자의 취향을 반영하되 브랜드명이나 가격대, 카테고리 등을 포함한 구체적인 검색 키워드 작성
- 서로 다른 카테고리로 다양하게 추천
- 선물 대상과 상황을 고려해서 현실성 있게 추천
- 이전 답변들을 바탕으로 개인화된 추천 제공
- 각 키워드에 대하여 자연스럽고 친근한 어투로 간단한 설명 추가("~~이에요" 형식)
    - 예: "40대 여성들이 좋아하는 브랜드에요"

사용자 정보:
${answers.map((answer, index) => `- ${QUESTIONS[index]}: ${answer}`).join("\n")}

결과는 다음 JSON 형식으로 출력해주세요:
{
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4"],
  "descriptions": ["설명1", "설명2", "설명3", "설명4"]
}
`;
  }

  _createNextQuestionPrompt(previousAnswers) {
    return `
당신은 뛰어난 선물 추천 도우미입니다.

지금까지 수집된 사용자 정보를 바탕으로, 다음 질문과 선택지를 생성해주세요.
- 질문은 자연스럽고 친근한 어투로 작성
- 선택지는 4-6개 정도로 제한
- 이전 답변을 고려하여 개인화된 선택지 제공
- 선택지는 간결한 표현을 사용하되, 후반에는 좀더 구체적이고 현실적인 예시로 구성
- 중복 질문은 피하기
- 관계, 선물 이유, 가격대 등을 물어보기

지금까지의 답변:
${previousAnswers
  .map((answer, index) => `- ${QUESTIONS[index]}: ${answer}`)
  .join("\n")}

결과는 다음 JSON 형식으로 출력해주세요:
{
  "question": "다음 질문",
  "description": "질문에 대한 설명",
  "chips": ["선택지1", "선택지2", ...]
}
`;
  }

  _cleanJSONResponse(responseText) {
    // 코드블록(```json ... ```) 제거 및 trim
    return responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
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
