// settings.json에서 설정값을 불러오는 함수
async function loadSettingsFromJSON() {
  try {
    const response = await fetch("js/settings.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("설정 파일 로드 실패:", error);
    return null;
  }
}

// API 엔드포인트 고정값
const API_ENDPOINT_VALUE = "https://api.openai.com/v1/chat/completions";

// 기본 설정값
const DEFAULT_SETTINGS = {
  questions: [
    "누구한테 선물 줄 거야? 🐱",
    "예산은 얼마나 생각하고 있어? 💰",
    "이번 선물은 어떤 상황이야? 🎁",
    "그 분의 나이는 대략 몇 살쯤 돼? 👶👵",
    "요즘 그분이 좋아하거나 관심 있어 하는 게 뭐야? 🤔",
    "최근에 그분이 관심 보인 트렌드나 아이템 있어? 🛍️",
  ],
  questionDescriptions: [
    "",
    "예산을 알려주면 더 좋은 선물 추천해줄게! 😺",
    "",
    "",
    "최근에 얘기했던 주제나 카톡, SNS를 살펴보는 것도 좋을 거야! 📱",
    "최근에 산 물건이나 관심 보인 브랜드, 스타일 알려줘! 🛒",
  ],
  questionTypes: ["normal", "normal", "normal", "ai", "ai", "ai"],
  commonDescription: "자세히 입력하면 좀더 정확한 추천을 해줄게!",
  model: "gpt-4o-mini",
  temperature: 0.7,
  questionChips: [
    [
      "여자친구",
      "남자친구",
      "친한 친구",
      "직장 동료",
      "남편",
      "아내",
      "부모님",
      "아들",
      "딸",
      "선생님",
      "썸남",
      "썸녀",
    ],
    [
      "1만원 이하",
      "1-3만원",
      "3-5만원",
      "5-10만원",
      "10-30만원",
      "30-50만원",
      "50만원 이상",
      "100만원 이상",
    ],
    [
      "생일",
      "입사 축하",
      "감사 인사",
      "졸업",
      "기념일",
      "크리스마스",
      "발렌타인데이",
    ],
    ["10대", "20대", "30대", "40대", "50대 이상"],
    ["패션", "운동", "음악", "여행", "독서", "게임", "요리", "반려동물"],
    [
      "최신 스마트폰",
      "에어팟",
      "명품 가방",
      "스포츠카",
      "캠핑용품",
      "요가 매트",
    ],
  ],
  prompts: {
    recommendationPrompt:
      '당신은 뛰어난 선물 추천 도우미입니다.\n\n아래 사용자의 정보를 참고하여, "선물 키워드" 4개를 추천해주세요.\nex. 샤넬 지갑, 디올 어딕트 립글로우, 캐주얼 카드지갑, 애플 에어팟\n- 키워드는 취향, 취미, 관심사 등 사용자의 취향을 반영하되 브랜드명이나, 카테고리 등을 포함한 구체적인 검색 키워드 작성\n- 선물 대상과 상황을 고려해서 현실성 있게 추천\n- 이전 답변들을 바탕으로 개인화된 추천 제공\n- 각 키워드에 대하여 자연스럽고 친근한 어투로 간단한 설명 추가("~~이에요" 형식)\n  - 사용자가 입력한 내용을 바탕으로 왜 그 선물이 매력적인지 알 수 있는 한줄평이어야 해줘.\n  - 센스 넘치고 귀여운 말투! 이모티콘까지!!\n  - 예: "이 선물이라면 음악을 좋아하는 여자친구가 무조건 좋아할만한 브랜드에요!😄"\n\n사용자 정보:\n{{현재까지답변}}\n\n결과는 다음 JSON 형식으로 출력해주세요:\n{\n  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4"],\n  "descriptions": ["설명1", "설명2", "설명3", "설명4"]\n}',
    nextQuestionPrompt:
      '당신은 선물을 추천하는 귀여운 고양이!\n\n지금까지 수집된 사용자 정보를 바탕으로, 다음 질문과 선택지를 생성해주세요.\n- 질문은 이모티콘을 좋아하고 친구같은 반말 말투, 포근하고 다정한 분위기!\n- 왜 선물을 하려는지, 선물할 때 고민되는 점은 뭔지, 사용자의 감정과 맥락을 고려한 질문.\n- 선택지는 4-6개 정도로 제한\n- 이전 답변을 고려하여 개인화된 선택지 제공\n- 중복 질문은 피하기\n- 선택지는 간결한 표현을 사용하되, 후반에는 좀더 구체적이고 현실적인 예시로 구성\n- 선물 이유, 가격대 등이 파악되어야 함.\n\n지금까지의 답변:\n{{현재까지답변}}\n\n결과는 다음 JSON 형식으로 출력해주세요:\n{\n  "question": "다음 질문",\n  "description": "질문에 대한 설명",\n  "chips": ["선택지1", "선택지2", ...]\n}',
  },
};

// 설정 초기화
let SETTINGS = { ...DEFAULT_SETTINGS };

// 로컬 스토리지에서 설정 불러오기
let savedSettings = null;
try {
  const savedSettingsStr = localStorage.getItem("customSettings");
  if (savedSettingsStr) {
    savedSettings = JSON.parse(savedSettingsStr);

    // apiEndpoint 설정 제거
    if (savedSettings.apiEndpoint) {
      delete savedSettings.apiEndpoint;
    }

    // 저장된 설정이 있으면 병합
    SETTINGS = { ...SETTINGS, ...savedSettings };
  }
} catch (error) {
  console.error("저장된 설정을 불러오는 중 오류 발생:", error);
}

// JSON 파일에서 설정 불러오기 및 내보내기
export const initSettings = async () => {
  const jsonSettings = await loadSettingsFromJSON();
  if (jsonSettings) {
    // apiEndpoint 설정 제거
    if (jsonSettings.apiEndpoint) {
      delete jsonSettings.apiEndpoint;
    }

    // JSON 설정과 로컬 스토리지 설정 병합 (로컬 스토리지가 우선)
    SETTINGS = { ...jsonSettings, ...SETTINGS };
  }
  return SETTINGS;
};

// 설정 가져오기
export const getSettings = () => SETTINGS;

// 설정 저장하기
export const saveSettings = (newSettings) => {
  // apiEndpoint 설정 제거
  if (newSettings.apiEndpoint) {
    delete newSettings.apiEndpoint;
  }

  SETTINGS = { ...SETTINGS, ...newSettings };
  localStorage.setItem("customSettings", JSON.stringify(SETTINGS));
  return SETTINGS;
};

// 설정 초기화
export const resetSettings = async () => {
  const jsonSettings = await loadSettingsFromJSON();
  SETTINGS = jsonSettings || DEFAULT_SETTINGS;

  // apiEndpoint 설정 제거
  if (SETTINGS.apiEndpoint) {
    delete SETTINGS.apiEndpoint;
  }

  localStorage.removeItem("customSettings");
  return SETTINGS;
};

// 편의를 위한 개별 설정 내보내기
export const QUESTIONS = () => SETTINGS.questions;
export const QUESTION_DESCRIPTIONS = () => SETTINGS.questionDescriptions;
export const QUESTION_TYPES = () => SETTINGS.questionTypes;
export const COMMON_DESCRIPTION = () => SETTINGS.commonDescription;
export const API_ENDPOINT = () => API_ENDPOINT_VALUE; // 고정 값 반환
export const MODEL = () => SETTINGS.model;
export const TEMPERATURE = () => SETTINGS.temperature;
export const QUESTION_CHIPS = () => SETTINGS.questionChips;
export const PROMPTS = () => SETTINGS.prompts;
