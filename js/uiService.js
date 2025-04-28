export class UIService {
  constructor() {
    console.log("UIService initialized");
    this.apiKeyBox = document.getElementById("api-key-box");
    this.questionBox = document.getElementById("question-box");
    this.resultBox = document.getElementById("result-box");
    this.loadingSpinner = document.getElementById("loading-spinner");
    this.questionElement = document.getElementById("question");
    this.questionDescriptionElement = document.getElementById(
      "question-description"
    );
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

  showQuestion(question, description, commonDescription, chips) {
    this.questionElement.textContent = question;
    this.questionDescriptionElement.innerHTML = `
      <p>${description}</p>
      <p class="common-description">${commonDescription}</p>
    `;
    this.questionBox.classList.remove("hidden");
    this.resultBox.classList.add("hidden");
    this.loadingSpinner.classList.add("hidden");
    this.answerInput.value = "";
    this.answerInput.disabled = false;
    this.submitButton.classList.remove("loading");
    this.answerInput.focus();
    this.renderChips(chips || []);
  }

  renderChips(chips) {
    let chipsContainer = document.getElementById("chips-container");
    if (!chipsContainer) {
      chipsContainer = document.createElement("div");
      chipsContainer.id = "chips-container";
      chipsContainer.className = "chips-container";
      this.answerInput.parentNode.insertBefore(
        chipsContainer,
        this.answerInput
      );
    }
    chipsContainer.innerHTML = "";
    chips.forEach((chip) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.textContent = chip;
      btn.onclick = () => {
        this.answerInput.value = chip;
        this.answerInput.focus();
      };
      chipsContainer.appendChild(btn);
    });
  }

  showLoading() {
    this.questionBox.classList.add("hidden");
    this.resultBox.classList.add("hidden");
    this.loadingSpinner.classList.remove("hidden");
  }

  showResult(keywords, descriptions, answers = []) {
    this.questionBox.classList.add("hidden");
    this.loadingSpinner.classList.add("hidden");
    this.resultBox.classList.remove("hidden");

    // 가격대 정보 가져오기 (두 번째 질문의 답변)
    let minPrice = "";
    let maxPrice = "";

    try {
      const priceRange = answers[1];
      if (priceRange) {
        // 가격대에 따른 minPrice, maxPrice 설정
        switch (priceRange) {
          case "1만원 이하":
            minPrice = "0";
            maxPrice = "10000";
            break;
          case "1-3만원":
            minPrice = "10000";
            maxPrice = "30000";
            break;
          case "3-5만원":
            minPrice = "30000";
            maxPrice = "50000";
            break;
          case "5-10만원":
            minPrice = "50000";
            maxPrice = "100000";
            break;
          case "10-30만원":
            minPrice = "100000";
            maxPrice = "300000";
            break;
          case "30-50만원":
            minPrice = "300000";
            maxPrice = "500000";
            break;
          case "50만원 이상":
            minPrice = "500000";
            maxPrice = "";
            break;
          case "100만원 이상":
            minPrice = "1000000";
            maxPrice = "";
            break;
        }
      }
    } catch (error) {
      console.error("가격대 정보 파싱 실패:", error);
      // 가격대 정보 파싱 실패 시 무시하고 진행
    }

    this.resultBox.innerHTML = `
      <h2>🎁 추천 키워드</h2>
      <div class="recommendations">
        ${keywords
          .map(
            (word, index) => `
          <div class="recommendation-item">
            <h3>${word}</h3>
            <p>${descriptions[index]}</p>
            <a href="https://search.shopping.naver.com/search/all?query=${encodeURIComponent(
              word
            )}${minPrice ? `&minPrice=${minPrice}` : ""}${
              maxPrice ? `&maxPrice=${maxPrice}` : ""
            }" target="_blank" class="search-link">
              상품 찾아보기
            </a>
          </div>
        `
          )
          .join("")}
      </div>
      <button class="restart-btn" onclick="window.location.reload()">다시 시작하기</button>
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
    this.submitButton.addEventListener("click", () => {
      this.answerInput.disabled = true;
      this.submitButton.classList.add("loading");
      handler();
    });

    this.answerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.answerInput.disabled = true;
        this.submitButton.classList.add("loading");
        handler();
      }
    });
  }
}
