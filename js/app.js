import {
  initSettings,
  QUESTIONS,
  QUESTION_DESCRIPTIONS,
  QUESTION_CHIPS,
  QUESTION_TYPES,
  COMMON_DESCRIPTION,
  MODEL,
  TEMPERATURE,
} from "./constants.js";
import { ApiService } from "./apiService.js";
import { UIService } from "./uiService.js";
import { OptionsModal } from "./optionsModal.js";
import { calculateCost, convertUSDToKRW } from "./utils/costUtils.js";
import { VERSION } from "./config/version.js";
import { storage } from "./utils/storage.js";

class GiftRecommender {
  constructor() {
    console.log("GiftRecommender initialized");
    this.ui = new UIService();
    this.currentIndex = 0;
    this.answers = [];
    this.questionAnswerPairs = [];
    this.currentQuestion = "";
    this.totalTokens = 0; // API 호출 토큰 누적 합계 저장

    // 옵션 모달 초기화
    this.optionsModal = new OptionsModal();
  }

  async init() {
    console.log("Initializing...");
    await initSettings();

    // URL에서 API 키 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const apiKeyFromUrl = urlParams.get("apiKey");

    if (apiKeyFromUrl) {
      console.log("API key found in URL");
      // API 키 형식 검증
      const apiKeyPattern = /^sk-[A-Za-z0-9-_]{32,}$/;
      if (apiKeyPattern.test(apiKeyFromUrl)) {
        console.log("API key is valid");
        this.api = new ApiService(apiKeyFromUrl);
        this.ui.hideApiKeyInput();

        this.currentQuestion = QUESTIONS()[this.currentIndex];

        this.ui.showQuestion(
          this.currentQuestion,
          QUESTION_DESCRIPTIONS()[this.currentIndex],
          COMMON_DESCRIPTION(),
          QUESTION_CHIPS()[this.currentIndex]
        );
        this.ui.setSubmitHandler(() => {
          console.log("Submit button clicked");
          this.handleSubmit();
        });
        return;
      } else {
        console.log("Invalid API key format in URL");
        alert("URL의 API 키 형식이 올바르지 않습니다!");
      }
    }

    this.ui.showApiKeyInput();

    // API 키 입력 필드의 type을 text로 변경
    const apiKeyInput = document.getElementById("api-key");
    if (apiKeyInput) {
      apiKeyInput.type = "text";
    }

    // sessionStorage에 저장된 API 키가 있으면 자동 입력 및 바로 시작
    const savedApiKey = sessionStorage.getItem("openai_api_key");
    if (savedApiKey) {
      apiKeyInput.value = savedApiKey;
      this.handleStart();
      return;
    }

    this.ui.setStartHandler(() => {
      console.log("Start button clicked");
      this.handleStart();
    });
  }

  handleStart() {
    console.log("Handling start...");
    const apiKey = this.ui.getApiKey();

    if (!apiKey) {
      alert("API 키를 입력해주세요!");
      return;
    }

    // API 키 형식 검증
    const apiKeyPattern = /^sk-[A-Za-z0-9-_]{32,}$/;
    if (!apiKeyPattern.test(apiKey)) {
      alert(
        "올바른 API 키 형식이 아닙니다!\nsk-로 시작하고, 그 뒤에 32자 이상의 영문자, 숫자, 하이픈(-), 언더스코어(_)가 와야 합니다."
      );
      return;
    }

    // sessionStorage에 저장
    sessionStorage.setItem("openai_api_key", apiKey);

    this.api = new ApiService(apiKey);
    this.ui.hideApiKeyInput();

    this.currentQuestion = QUESTIONS()[this.currentIndex];

    this.ui.showQuestion(
      this.currentQuestion,
      QUESTION_DESCRIPTIONS()[this.currentIndex],
      COMMON_DESCRIPTION(),
      QUESTION_CHIPS()[this.currentIndex]
    );
    this.ui.setSubmitHandler(() => {
      console.log("Submit button clicked");
      this.handleSubmit();
    });
  }

  async handleSubmit() {
    const answer = this.ui.getAnswer();

    if (!answer) {
      alert("답변을 입력해주세요!");
      return;
    }

    this.answers.push(answer);

    this.questionAnswerPairs.push({
      question: this.currentQuestion,
      answer: answer,
    });

    // 설정 저장
    this.saveCurrentSettings();

    this.currentIndex++;

    if (this.currentIndex < QUESTIONS().length) {
      // 현재 질문의 유형 확인
      const questionTypes = QUESTION_TYPES();
      const currentQuestionType =
        questionTypes && questionTypes[this.currentIndex]
          ? questionTypes[this.currentIndex]
          : "normal";

      // AI 맞춤형 질문 여부
      const isAIQuestion = currentQuestionType === "ai";

      // AI 맞춤형 질문인 경우
      if (isAIQuestion) {
        try {
          const nextQuestion = await this.api.getNextQuestion(this.answers);
          // 다음 질문 생성 API 토큰 사용량 누적
          this.totalTokens += nextQuestion.usage?.total_tokens || 0;
          this.currentQuestion = nextQuestion.question;

          // AI 맞춤형 질문인 경우 UI에 질문 필드를 숨기고 설명만 표시
          this.ui.showQuestion(
            this.currentQuestion,
            nextQuestion.description,
            COMMON_DESCRIPTION(),
            nextQuestion.chips
          );
        } catch (error) {
          console.error("다음 질문 생성 실패:", error);
          // 실패 시 기본 질문으로 폴백
          this.currentQuestion = QUESTIONS()[this.currentIndex];
          document.getElementById("question").classList.remove("hidden");
          this.ui.showQuestion(
            this.currentQuestion,
            QUESTION_DESCRIPTIONS()[this.currentIndex],
            COMMON_DESCRIPTION(),
            QUESTION_CHIPS()[this.currentIndex]
          );
        }
      } else {
        // 일반 질문 처리 (미리 정의된 질문 사용)
        this.currentQuestion = QUESTIONS()[this.currentIndex];
        document.getElementById("question").classList.remove("hidden");
        this.ui.showQuestion(
          this.currentQuestion,
          QUESTION_DESCRIPTIONS()[this.currentIndex],
          COMMON_DESCRIPTION(),
          QUESTION_CHIPS()[this.currentIndex]
        );
      }
    } else {
      await this.getRecommendations();
    }
  }

  // 현재 설정을 저장하는 메서드
  saveCurrentSettings() {
    const currentSettings = {
      answers: [...this.answers],
      questionAnswerPairs: [...this.questionAnswerPairs],
      currentIndex: this.currentIndex,
      currentQuestion: this.currentQuestion,
      timestamp: new Date().toISOString(),
    };

    console.log("설정 저장:", currentSettings);
    storage.setLastSettings(currentSettings);
  }

  async getRecommendations() {
    try {
      this.ui.showLoading();
      console.time("추천 프로세스 총 시간");

      // 로딩 메시지 업데이트 함수
      const updateLoadingMessage = (message) => {
        const loadingMessage = document.querySelector("#loading-message");
        if (loadingMessage) {
          loadingMessage.textContent = message;
        }
        // 진행 상태 텍스트 업데이트 추가
        this.ui.updateProgressText(message);
      };

      // 로딩 단계별 메시지 표시
      const steps = [
        "AI 모델에 질문 전송 중...",
        "맞춤형 선물 추천 생성 중...",
        "결과 데이터 정리 중...",
        "추천 결과 준비 완료!",
      ];

      let currentStep = 0;
      updateLoadingMessage(steps[currentStep]);

      // 주기적으로 로딩 메시지 업데이트 (클래스 멤버 변수에 저장)
      this.loadingInterval = setInterval(() => {
        currentStep = (currentStep + 1) % (steps.length - 1);
        updateLoadingMessage(steps[currentStep]);
      }, 3500);

      const result = await this.api.getGiftRecommendations(this.answers);
      // 최종 추천 API 토큰 사용량 누적
      this.totalTokens += result.usage?.total_tokens || 0;

      // 로딩 메시지 업데이트 중지
      clearInterval(this.loadingInterval);
      this.loadingInterval = null; // 참조 제거
      updateLoadingMessage(steps[steps.length - 1]);

      // 잠시 대기 후 결과 표시 (사용자가 완료 메시지를 볼 수 있도록)
      setTimeout(() => {
        console.timeEnd("추천 프로세스 총 시간");
        // 예상 비용 계산
        const cost = calculateCost(MODEL(), this.totalTokens);
        const costInKRW = convertUSDToKRW(cost);
        this.ui.showResult(
          result.keywords,
          result.descriptions,
          this.answers,
          this.questionAnswerPairs,
          `${MODEL()}(temperature:${TEMPERATURE()})`,
          this.totalTokens,
          `${cost} USD, 약 ${costInKRW}원`
        );
      }, 1000);
    } catch (error) {
      console.error("추천 받기 실패:", error);

      // 로딩 인터벌 제거 (오류 발생 시에도 인터벌 정리)
      if (this.loadingInterval) {
        clearInterval(this.loadingInterval);
        this.loadingInterval = null; // 참조 제거
      }

      // 에러 메시지 표시
      this.ui.updateProgressText("오류 발생");
      this.ui.showError(
        "선물 추천을 받는 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  }
}

// 버전 체크 및 설정 관리
function checkVersionAndSettings() {
  const lastVersion = storage.getLastVersion();
  const lastSettings = storage.getLastSettings();

  console.log("버전 체크:", { lastVersion, currentVersion: VERSION });

  // 버전 표시
  document.getElementById("version").textContent = `v${VERSION}`;

  // 버전이 다르거나 lastVersion이 없는 경우 (첫 방문)
  if (!lastVersion || lastVersion !== VERSION) {
    console.log("버전이 변경되었거나 첫 방문입니다.");

    // 이전 설정이 있는 경우 알림 표시
    if (lastSettings) {
      console.log("이전 설정이 있습니다:", lastSettings);

      // 알림 표시
      const notification = document.createElement("div");
      notification.className = "notification";
      notification.innerHTML = `
        <p>새로운 버전이 업데이트되었습니다!</p>
        <p>마지막으로 변경했던 설정은 리스트에 저장되어 있어요.</p>
      `;
      document
        .querySelector(".container")
        .insertBefore(notification, document.querySelector("h1"));

      // 이전 설정을 리스트에 추가
      if (lastSettings.answers) {
        const chipsContainer = document.getElementById("chips-container");
        lastSettings.answers.forEach((answer) => {
          const chip = document.createElement("div");
          chip.className = "chip";
          chip.textContent = answer;
          chipsContainer.appendChild(chip);
        });
      }
    } else {
      console.log("이전 설정이 없습니다.");
    }

    // 설정 초기화
    storage.clearSettings();
  } else {
    console.log("버전이 동일합니다.");
  }

  // 현재 버전 저장
  storage.setLastVersion(VERSION);
}

// 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 버전 체크를 먼저 실행
  checkVersionAndSettings();

  // 그 다음 GiftRecommender 초기화
  console.log("Starting application...");
  const app = new GiftRecommender();
  app.init();
});
