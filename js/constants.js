// 기본 질문 배열
const DEFAULT_QUESTIONS = [
  "누구에게 선물할 건가요?",
  "예산은 어느 정도로 생각하고 계신가요?",
  "이번 선물은 어떤 상황을 위한 건가요?",
  "그 분의 나이는 대략 몇 살쯤 될까요?",
  "요즘 그분이 좋아하거나 관심 있어 하는 것들이 있을까요?",
  "최근에 그분이 관심을 보인 트렌드나 아이템이 있나요?",
];

// 기본 질문 설명 배열
const DEFAULT_QUESTION_DESCRIPTIONS = [
  "",
  "예산을 알려주시면 더 적절한 선물을 추천해드릴 수 있어요!",
  "",
  "",
  "최근에 이야기했던 주제나 카톡, SNS를 살펴보는 것도 좋아요!",
  "최근에 구매한 물건이나 관심을 보인 브랜드, 스타일 등을 알려주세요!",
];

// 기본 질문 유형 배열 ('normal': 일반 질문, 'ai': AI 맞춤형 질문)
const DEFAULT_QUESTION_TYPES = [
  "normal", // 질문 1: 누구에게 선물할 건가요?
  "normal", // 질문 2: 예산은 어느 정도로 생각하고 계신가요?
  "normal", // 질문 3: 이번 선물은 어떤 상황을 위한 건가요?
  "normal", // 질문 4: 그 분의 나이는 대략 몇 살쯤 될까요?
  "normal", // 질문 5: 요즘 그분이 좋아하거나 관심 있어 하는 것들이 있을까요?
  "ai", // 질문 6: 최근에 그분이 관심을 보인 트렌드나 아이템이 있나요? (AI 맞춤형)
];

// 기본 공통 설명
const DEFAULT_COMMON_DESCRIPTION =
  "자세히 입력하면 정확한 추천을 받을 확률이 높아져요!";

// 기본 API 엔드포인트
const DEFAULT_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

// 기본 모델
const DEFAULT_MODEL = "gpt-4o-mini"; // 또는 gpt-3.5-turbo

// 기본 온도 설정
const DEFAULT_TEMPERATURE = 0.7;

// 기본 선택지(칩) 배열
const DEFAULT_QUESTION_CHIPS = [
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
  ["최신 스마트폰", "에어팟", "명품 가방", "스포츠카", "캠핑용품", "요가 매트"],
];

// 저장된 설정 불러오기
let savedSettings = null;
try {
  const savedSettingsStr = localStorage.getItem("customSettings");
  if (savedSettingsStr) {
    savedSettings = JSON.parse(savedSettingsStr);
  }
} catch (error) {
  console.error("저장된 설정을 불러오는 중 오류 발생:", error);
}

// 내보낼 상수 정의 (저장된 설정 또는 기본값)
export const QUESTIONS = savedSettings?.questions || DEFAULT_QUESTIONS;
export const QUESTION_DESCRIPTIONS =
  savedSettings?.questionDescriptions || DEFAULT_QUESTION_DESCRIPTIONS;
export const QUESTION_TYPES =
  savedSettings?.questionTypes || DEFAULT_QUESTION_TYPES;
export const COMMON_DESCRIPTION =
  savedSettings?.commonDescription || DEFAULT_COMMON_DESCRIPTION;
export const API_ENDPOINT = savedSettings?.apiEndpoint || DEFAULT_API_ENDPOINT;
export const MODEL = savedSettings?.model || DEFAULT_MODEL;
export const TEMPERATURE =
  savedSettings?.temperature !== undefined
    ? savedSettings.temperature
    : DEFAULT_TEMPERATURE;
export const QUESTION_CHIPS =
  savedSettings?.questionChips || DEFAULT_QUESTION_CHIPS;
