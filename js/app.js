import {
  QUESTIONS,
  QUESTION_DESCRIPTIONS,
  QUESTION_CHIPS,
  COMMON_DESCRIPTION,
} from "./constants.js";
import { ApiService } from "./apiService.js";
import { UIService } from "./uiService.js";

class GiftRecommender {
  constructor() {
    console.log("GiftRecommender initialized");
    this.ui = new UIService();
    this.currentIndex = 0;
    this.answers = [];
  }

  init() {
    console.log("Initializing...");

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
        this.ui.showQuestion(
          QUESTIONS[this.currentIndex],
          QUESTION_DESCRIPTIONS[this.currentIndex],
          COMMON_DESCRIPTION,
          QUESTION_CHIPS[this.currentIndex]
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
    this.ui.showQuestion(
      QUESTIONS[this.currentIndex],
      QUESTION_DESCRIPTIONS[this.currentIndex],
      COMMON_DESCRIPTION,
      QUESTION_CHIPS[this.currentIndex]
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
    this.currentIndex++;

    if (this.currentIndex < QUESTIONS.length) {
      try {
        const nextQuestion = await this.api.getNextQuestion(this.answers);
        this.ui.showQuestion(
          nextQuestion.question,
          nextQuestion.description,
          COMMON_DESCRIPTION,
          nextQuestion.chips
        );
      } catch (error) {
        console.error("다음 질문 생성 실패:", error);
        // 실패 시 기본 질문으로 폴백
        this.ui.showQuestion(
          QUESTIONS[this.currentIndex],
          QUESTION_DESCRIPTIONS[this.currentIndex],
          COMMON_DESCRIPTION,
          QUESTION_CHIPS[this.currentIndex]
        );
      }
    } else {
      await this.getRecommendations();
    }
  }

  async getRecommendations() {
    try {
      this.ui.showLoading();
      const result = await this.api.getGiftRecommendations(this.answers);
      this.ui.showResult(result.keywords, result.descriptions);
    } catch (error) {
      console.error("추천 받기 실패:", error);
      this.ui.showError(
        "선물 추천을 받는 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  }
}

// 애플리케이션 시작
console.log("Starting application...");
const app = new GiftRecommender();
app.init();
