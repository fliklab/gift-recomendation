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
  // constants.js를 통해 저장된 프롬프트 가져오기
  const customPrompt = PROMPTS()?.recommendationPrompt;

  if (customPrompt) {
    // 템플릿 변수 처리
    return parsePromptTemplate(customPrompt, { answers, questions });
  }

  // 기본 프롬프트 반환 (이전 버전과의 호환성 유지)
  return `
당신은 뛰어난 선물 추천 도우미입니다.

아래 사용자의 정보를 참고하여, "선물 키워드" 4개를 추천해주세요.
ex. 샤넬 지갑, 디올 어딕트 립글로우, 캐주얼 카드지갑, 애플 에어팟
- 키워드는 취향, 취미, 관심사 등 사용자의 취향을 반영하되 브랜드명이나, 카테고리 등을 포함한 구체적인 검색 키워드 작성
- 선물 대상과 상황을 고려해서 현실성 있게 추천
- 이전 답변들을 바탕으로 개인화된 추천 제공
- 각 키워드에 대하여 자연스럽고 친근한 어투로 간단한 설명 추가("~~이에요" 형식)
  - 사용자가 입력한 내용을 바탕으로 왜 그 선물이 매력적인지 알 수 있는 한줄평이어야 해줘.
  - 센스 넘치고 귀여운 말투! 이모티콘까지!!
  - 예: "이 선물이라면 음악을 좋아하는 여자친구가 무조건 좋아할만한 브랜드에요!😄"

사용자 정보:
${answers.map((answer, index) => `- ${questions[index]}: ${answer}`).join("\n")}

결과는 다음 JSON 형식으로 출력해주세요:
{
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4"],
  "descriptions": ["설명1", "설명2", "설명3", "설명4"]
}
`;
}

/**
 * 다음 질문 프롬프트 생성
 * @param {Array<string>} previousAnswers 이전 사용자 답변 배열
 * @param {Array<string>} questions 질문 배열
 * @returns {string} 생성된 프롬프트
 */
export function createNextQuestionPrompt(previousAnswers, questions) {
  // constants.js를 통해 저장된 프롬프트 가져오기
  const customPrompt = PROMPTS()?.nextQuestionPrompt;

  if (customPrompt) {
    // 템플릿 변수 처리
    return parsePromptTemplate(customPrompt, {
      answers: previousAnswers,
      questions,
    });
  }

  // 기본 프롬프트 반환 (이전 버전과의 호환성 유지)
  return `
당신은 선물을 추천하는 귀여운 고양이!

지금까지 수집된 사용자 정보를 바탕으로, 다음 질문과 선택지를 생성해주세요.
- 질문은 이모티콘을 좋아하고 친구같은 반말 말투, 포근하고 다정한 분위기!
- 왜 선물을 하려는지, 선물할 때 고민되는 점은 뭔지, 사용자의 감정과 맥락을 고려한 질문.
- 선택지는 4-6개 정도로 제한
- 이전 답변을 고려하여 개인화된 선택지 제공
- 중복 질문은 피하기
- 선택지는 간결한 표현을 사용하되, 후반에는 좀더 구체적이고 현실적인 예시로 구성
- 선물 이유, 가격대 등이 파악되어야 함.

지금까지의 답변:
${previousAnswers
  .map((answer, index) => `- ${questions[index]}: ${answer}`)
  .join("\n")}

결과는 다음 JSON 형식으로 출력해주세요:
{
  "question": "다음 질문",
  "description": "질문에 대한 설명",
  "chips": ["선택지1", "선택지2", ...]
}
`;
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
