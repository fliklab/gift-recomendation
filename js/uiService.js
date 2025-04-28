export class UIService {
  constructor() {
    console.log("UIService initialized");
    this.apiKeyBox = document.getElementById("api-key-box");
    this.questionBox = document.getElementById("question-box");
    this.resultBox = document.getElementById("result-box");
    this.loadingSpinner = document.getElementById("loading-spinner");
    this.questionElement = document.getElementById("question");
    this.answerInput = document.getElementById("answer");
    this.submitButton = document.getElementById("submit-btn");
    this.apiKeyInput = document.getElementById("api-key");
    this.startButton = document.getElementById("start-btn");

    if (!this.startButton) {
      console.error("Start button not found!");
    }
  }

  showApiKeyInput() {
    console.log("Showing API key input");
    this.apiKeyBox.classList.remove("hidden");
    this.questionBox.classList.add("hidden");
    this.resultBox.classList.add("hidden");
    this.loadingSpinner.classList.add("hidden");
    this.apiKeyInput.focus();
  }

  hideApiKeyInput() {
    console.log("Hiding API key input");
    this.apiKeyBox.classList.add("hidden");
    this.questionBox.classList.remove("hidden");
  }

  getApiKey() {
    return this.apiKeyInput.value.trim();
  }

  setStartHandler(handler) {
    console.log("Setting start handler");
    if (this.startButton) {
      this.startButton.addEventListener("click", () => {
        console.log("Start button clicked in UIService");
        handler();
      });

      this.apiKeyInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          console.log("Enter key pressed in API key input");
          handler();
        }
      });
    } else {
      console.error("Start button is null");
    }
  }

  showQuestion(question) {
    this.questionElement.textContent = question;
    this.questionBox.classList.remove("hidden");
    this.resultBox.classList.add("hidden");
    this.loadingSpinner.classList.add("hidden");
    this.answerInput.value = "";
    this.answerInput.focus();
  }

  showLoading() {
    this.questionBox.classList.add("hidden");
    this.resultBox.classList.add("hidden");
    this.loadingSpinner.classList.remove("hidden");
  }

  showResult(keywords) {
    this.questionBox.classList.add("hidden");
    this.loadingSpinner.classList.add("hidden");
    this.resultBox.classList.remove("hidden");

    this.resultBox.innerHTML = `
      <h2>🎁 추천 키워드</h2>
      <ul>
        ${keywords.map((word) => `<li>${word}</li>`).join("")}
      </ul>
    `;
  }

  showError(message) {
    this.questionBox.classList.add("hidden");
    this.loadingSpinner.classList.add("hidden");
    this.resultBox.classList.remove("hidden");

    this.resultBox.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
        <button onclick="window.location.reload()">다시 시도하기</button>
      </div>
    `;
  }

  getAnswer() {
    return this.answerInput.value.trim();
  }

  setSubmitHandler(handler) {
    this.submitButton.addEventListener("click", handler);
    this.answerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handler();
      }
    });
  }
}
