export const QUESTIONS = [
  "누구에게 선물할 건가요?",
  "그 분의 나이는 대략 몇 살쯤 될까요?",
  "요즘 그분이 좋아하거나 관심 있어 하는 것들이 있을까요?",
  "이번 선물은 어떤 상황을 위한 건가요? (ex. 생일, 입사 축하, 감사 인사 등)",
  "예산은 어느 정도로 생각하고 계신가요?",
];

export const QUESTION_DESCRIPTIONS = [
  "",
  "",
  "최근에 이야기했던 주제나 카톡, SNS를 살펴보는 것도 좋아요!",
  "",
  "예산을 알려주시면 더 적절한 선물을 추천해드릴 수 있어요!",
];

export const COMMON_DESCRIPTION =
  "자세히 입력하면 정확한 추천을 받을 확률이 높아져요!";

export const API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
export const MODEL = "gpt-4o-mini"; // 또는 gpt-3.5-turbo
export const TEMPERATURE = 0.7;

export const QUESTION_CHIPS = [
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
  ["10대", "20대", "30대", "40대", "50대 이상"],
  ["패션", "운동", "음악", "여행", "독서"],
  ["생일", "입사 축하", "감사 인사", "졸업", "기념일"],
  ["1만원 이하", "1-3만원", "3-5만원", "5-10만원", "10만원 이상"],
];
