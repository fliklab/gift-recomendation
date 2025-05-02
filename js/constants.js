// settings.json에서 설정값을 불러오는 함수
async function loadSettingsFromJSON() {
  try {
    const response = await fetch("js/settings/default.json");
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

// 설정 초기값: settings.json 및 로컬 스토리지 설정 병합
let SETTINGS = {};

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
  SETTINGS = jsonSettings || {};

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
