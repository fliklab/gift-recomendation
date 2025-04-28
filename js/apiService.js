import { API_ENDPOINT, MODEL, TEMPERATURE } from "./constants.js";

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
      return JSON.parse(content);
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      throw error;
    }
  }

  _createPrompt(answers) {
    return `
당신은 뛰어난 선물 추천 도우미입니다.

아래 사용자의 정보를 참고하여,
"선물 키워드" 4개를 추천해주세요.
- 키워드는 짧게 (1~2단어)
- 서로 다른 카테고리로 다양하게 추천
- 선물 대상과 상황을 고려해서 현실성 있게 추천

사용자 정보:
- 관계: ${answers[0]}
- 나이: ${answers[1]}
- 관심사: ${answers[2]}
- 상황: ${answers[3]}

결과는 JSON 배열 형식으로만 출력해주세요.
예시: ["향수", "운동화", "커피머신", "꽃다발"]
`;
  }
}
