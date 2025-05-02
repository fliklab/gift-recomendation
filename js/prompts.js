/**
 * 선물 추천 관련 프롬프트 정의
 */
import { PROMPTS } from "./constants.js";

/**
 * 선물 추천 프롬프트 생성
 * @param {Array<string>} answers 사용자 답변 배열
 * @param {Array<string>} questions 질문 배열
 * @returns {string} 생성된 프롬프트
 */
export function createRecommendationPrompt(answers, questions) {
  // settings.json에서 정의한 프롬프트를 사용합니다 (필수)
  const customPrompt = PROMPTS()?.recommendationPrompt;
  if (!customPrompt) {
    throw new Error("recommendationPrompt 설정이 누락되었습니다.");
  }
  return parsePromptTemplate(customPrompt, { answers, questions });
}

/**
 * 다음 질문 프롬프트 생성
 * @param {Array<string>} previousAnswers 이전 사용자 답변 배열
 * @param {Array<string>} questions 질문 배열
 * @returns {string} 생성된 프롬프트
 */
export function createNextQuestionPrompt(previousAnswers, questions) {
  // settings.json에서 정의한 프롬프트를 사용합니다 (필수)
  const customPrompt = PROMPTS()?.nextQuestionPrompt;
  if (!customPrompt) {
    throw new Error("nextQuestionPrompt 설정이 누락되었습니다.");
  }
  return parsePromptTemplate(customPrompt, {
    answers: previousAnswers,
    questions,
  });
}

/**
 * JSON 응답 정제
 * @param {string} responseText 응답 텍스트
 * @returns {string} 정제된 JSON 문자열
 */
export function cleanJSONResponse(responseText) {
  // 코드블록(```json ... ```) 제거 및 trim
  return responseText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * 프롬프트 템플릿 파싱
 * @param {string} template 프롬프트 템플릿 문자열
 * @param {Object} data 치환할 데이터 객체
 * @returns {string} 처리된 프롬프트
 */
export function parsePromptTemplate(template, data) {
  if (!template) return "";

  // 템플릿 처리 최적화
  let processedTemplate = template;

  // 템플릿 변수 정규식으로 한 번에 찾기
  const templateVars = template.match(/\{\{([^}]+)\}\}/g) || [];

  // 찾은 모든 변수에 대해 처리
  for (const variable of templateVars) {
    const varName = variable.replace(/\{\{|\}\}/g, "");

    // '현재까지답변' 변수 처리
    if (varName === "현재까지답변" && data.answers && data.questions) {
      const answersText = data.answers
        .map((answer, index) => {
          const question =
            index < data.questions.length
              ? data.questions[index]
              : `질문 ${index + 1}`;
          return `- ${question}: ${answer}`;
        })
        .join("\n");

      processedTemplate = processedTemplate.replace(variable, answersText);
      continue;
    }

    // 다른 변수들도 필요하면 여기에 추가 처리
  }

  return processedTemplate;
}
