import { QUESTIONS } from "./constants.js";
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
    this.ui.showApiKeyInput();
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
    const apiKeyPattern = /^sk-[A-Za-z0-9]{32,}$/;
    if (!apiKeyPattern.test(apiKey)) {
      alert(
        "올바른 API 키 형식이 아닙니다!\nsk-로 시작하고, 그 뒤에 32자 이상의 영문자와 숫자가 와야 합니다."
      );
      return;
    }

    this.api = new ApiService(apiKey);
    this.ui.hideApiKeyInput();
    this.ui.showQuestion(QUESTIONS[this.currentIndex]);
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
      this.ui.showQuestion(QUESTIONS[this.currentIndex]);
    } else {
      await this.getRecommendations();
    }
  }

  async getRecommendations() {
    try {
      this.ui.showLoading();
      const keywords = await this.api.getGiftRecommendations(this.answers);
      this.ui.showResult(keywords);
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
