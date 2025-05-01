/**
 * 선물 추천 관련 기본 프롬프트
 */
const DEFAULT_RECOMMENDATION_PROMPT = `
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
{{현재까지답변}}

결과는 다음 JSON 형식으로 출력해주세요:
{
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4"],
  "descriptions": ["설명1", "설명2", "설명3", "설명4"]
}
`;

/**
 * 다음 질문 관련 기본 프롬프트
 */
const DEFAULT_NEXT_QUESTION_PROMPT = `
당신은 뛰어난 선물 추천 도우미입니다.

지금까지 수집된 사용자 정보를 바탕으로, 다음 질문과 선택지를 생성해주세요.
- 질문은 이모티콘을 활용한 자연스럽고 친근한 어투로 작성
- 왜 선물을 하려는지, 사용자의 감정과 맥락까지 고려한 말투와 질문.
- 선택지는 4-6개 정도로 제한
- 이전 답변을 고려하여 개인화된 선택지 제공
- 선택지는 간결한 표현을 사용하되, 후반에는 좀더 구체적이고 현실적인 예시로 구성
- 중복 질문은 피하기
- 관계, 선물 이유, 가격대 등을 물어보기

지금까지의 답변:
{{현재까지답변}}

결과는 다음 JSON 형식으로 출력해주세요:
{
  "question": "다음 질문",
  "description": "질문에 대한 설명",
  "chips": ["선택지1", "선택지2", ...]
}
`;

/**
 * 옵션 설정 모달 관리 클래스
 */
export class OptionsModal {
  constructor() {
    this.isOpen = false;
    this.originalSettings = {};
    this.currentSettings = {};
    this.changedFields = new Set();

    // DOM 요소
    this.modalContainer = null;
    this.saveButton = null;
    this.resetButton = null;
    this.copyButton = null;
    this.closeButton = null;
    this.modalButton = null;

    this.init();
  }

  /**
   * 초기 설정 및 DOM 요소 생성
   */
  async init() {
    this.createModalButton();
    this.createModalContainer();
    await this.loadSettings();
    this.setupEventListeners();
  }

  /**
   * 현재 설정 로드
   */
  async loadSettings() {
    // constants.js에서 설정 로드
    try {
      const constants = await import("./constants.js");
      await constants.initSettings(); // 설정 초기화

      this.originalSettings = constants.getSettings();
      this.currentSettings = JSON.parse(JSON.stringify(this.originalSettings));

      // 현재 열려있는 모달에 값 적용
      if (this.isOpen) {
        this.populateSettings();
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
    }
  }

  /**
   * 모달 열기 버튼 생성
   */
  createModalButton() {
    this.modalButton = document.createElement("button");
    this.modalButton.id = "options-modal-button";
    this.modalButton.innerHTML = "⚙️ 설정";
    this.modalButton.className = "modal-open-button";
    document.body.appendChild(this.modalButton);
  }

  /**
   * 모달 컨테이너 및 내용 생성
   */
  createModalContainer() {
    this.modalContainer = document.createElement("div");
    this.modalContainer.id = "options-modal";
    this.modalContainer.className = "modal-container hidden";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalHeader.innerHTML = `
      <h2>설정</h2>
      <button id="close-modal-button" class="close-button">×</button>
    `;

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.innerHTML = `
      <div class="modal-tabs">
        <button class="tab-button active" data-tab="questions-tab">질문 설정</button>
        <button class="tab-button" data-tab="model-tab">모델 설정</button>
        <button class="tab-button" data-tab="prompts-tab">프롬프트 설정</button>
      </div>
      
      <div class="tab-content active" id="questions-tab">
        <h3>질문 및 선택지 설정</h3>
        <div id="questions-container" class="settings-container">
          <!-- 여기에 질문 설정이 동적으로 추가됨 -->
        </div>
        <h3>공통 설명</h3>
        <textarea id="common-description" class="full-width"></textarea>
      </div>
      
      <div class="tab-content" id="model-tab">
        <h3>모델 설정</h3>
        <div class="settings-row">
          <label for="model-select">모델</label>
          <select id="model-select">
            <option value="gpt-4o-mini">GPT-4o-mini</option>
            <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4-turbo</option>
          </select>
        </div>
        <div class="settings-row">
          <label for="temperature-slider">Temperature</label>
          <input type="range" id="temperature-slider" min="0" max="2" step="0.1" value="0.7">
          <span id="temperature-value">0.7</span>
        </div>
      </div>
      
      <div class="tab-content" id="prompts-tab">
        <h3>선물 추천 프롬프트</h3>
        <p class="help-text">프롬프트 내 <code>{{현재까지답변}}</code> 부분은 자동으로 사용자 답변으로 대체됩니다.</p>
        <textarea id="recommendation-prompt" class="prompt-textarea" rows="15"></textarea>
        
        <h3>다음 질문 프롬프트</h3>
        <textarea id="next-question-prompt" class="prompt-textarea" rows="15"></textarea>
      </div>
    `;

    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";
    modalFooter.innerHTML = `
      <button id="copy-settings" class="secondary-button">현재 설정 복사하기</button>
      <button id="reset-settings" class="secondary-button">초기화</button>
      <button id="save-settings" class="primary-button">저장</button>
    `;

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    this.modalContainer.appendChild(modalContent);
    document.body.appendChild(this.modalContainer);

    // 버튼 요소 저장
    this.saveButton = document.getElementById("save-settings");
    this.resetButton = document.getElementById("reset-settings");
    this.copyButton = document.getElementById("copy-settings");
    this.closeButton = document.getElementById("close-modal-button");
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 모달 열기 버튼
    this.modalButton.addEventListener("click", () => this.openModal());

    // 모달 닫기 버튼
    this.closeButton.addEventListener("click", () => this.closeModal());

    // 모달 외부 클릭 시 닫기
    this.modalContainer.addEventListener("click", (e) => {
      if (e.target === this.modalContainer) {
        this.closeModal();
      }
    });

    // 탭 전환 이벤트
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const tabContents = document.querySelectorAll(".tab-content");
        tabContents.forEach((content) => content.classList.remove("active"));

        const targetTab = button.getAttribute("data-tab");
        document.getElementById(targetTab).classList.add("active");
      });
    });

    // 저장 버튼
    this.saveButton.addEventListener("click", () => this.saveSettings());

    // 초기화 버튼
    this.resetButton.addEventListener("click", () => this.resetSettings());

    // 설정 복사 버튼
    this.copyButton.addEventListener("click", () => this.copySettings());

    // Temperature 슬라이더
    const temperatureSlider = document.getElementById("temperature-slider");
    const temperatureValue = document.getElementById("temperature-value");
    temperatureSlider.addEventListener("input", () => {
      temperatureValue.textContent = temperatureSlider.value;
      this.markAsChanged("temperature");
    });
  }

  /**
   * 모달 열기 및 데이터 표시
   */
  openModal() {
    this.isOpen = true;
    this.modalContainer.classList.remove("hidden");

    // 기본값 설정 (프롬프트가 아직 로드되지 않았을 경우 대비)
    if (!this.currentSettings.prompts) {
      this.currentSettings.prompts = {};
    }

    if (!this.currentSettings.prompts.recommendationPrompt) {
      this.currentSettings.prompts.recommendationPrompt =
        DEFAULT_RECOMMENDATION_PROMPT.trim();
    }

    if (!this.currentSettings.prompts.nextQuestionPrompt) {
      this.currentSettings.prompts.nextQuestionPrompt =
        DEFAULT_NEXT_QUESTION_PROMPT.trim();
    }

    console.log("모달 열기 - 현재 설정:", JSON.stringify(this.currentSettings));
    console.log(
      "모달 열기 - 질문 개수:",
      this.currentSettings.questions.length
    );
    console.log("모달 열기 - 질문 목록:", this.currentSettings.questions);

    this.populateSettings();
  }

  /**
   * 모달 닫기
   */
  closeModal() {
    this.isOpen = false;
    this.modalContainer.classList.add("hidden");
  }

  /**
   * 설정 초기값으로 리셋
   */
  async resetSettings() {
    if (confirm("모든 설정을 초기값으로 되돌리시겠습니까?")) {
      try {
        const constants = await import("./constants.js");
        this.currentSettings = await constants.resetSettings();
        this.originalSettings = JSON.parse(
          JSON.stringify(this.currentSettings)
        );
        this.changedFields.clear();

        this.populateSettings();
        alert("모든 설정이 초기화되었습니다.");
      } catch (error) {
        console.error("설정 초기화 실패:", error);
        alert("설정 초기화 중 오류가 발생했습니다.");
      }
    }
  }

  /**
   * 현재 설정을 UI에 표시
   */
  populateSettings() {
    // 질문 설정 탭 데이터 표시
    this.populateQuestionsTab();

    // 모델 설정 탭 데이터 표시
    document.getElementById("model-select").value = this.currentSettings.model;
    document.getElementById("temperature-slider").value =
      this.currentSettings.temperature;
    document.getElementById("temperature-value").textContent =
      this.currentSettings.temperature;

    // 프롬프트 설정 탭 데이터 표시
    document.getElementById("recommendation-prompt").value =
      this.currentSettings.prompts?.recommendationPrompt || "";
    document.getElementById("next-question-prompt").value =
      this.currentSettings.prompts?.nextQuestionPrompt || "";

    // 변경된 필드 표시
    this.highlightChangedFields();
  }

  /**
   * 질문 설정 탭 데이터 표시
   */
  populateQuestionsTab() {
    const questionsContainer = document.getElementById("questions-container");
    questionsContainer.innerHTML = "";

    // 공통 설명 설정
    document.getElementById("common-description").value =
      this.currentSettings.commonDescription;

    // 각 질문별 설정 생성
    if (this.currentSettings.questions) {
      this.currentSettings.questions.forEach((question, index) => {
        const questionCard = document.createElement("div");
        questionCard.className = "question-card";
        // 나중에 카드 개수 확인을 위해 data-index 속성 추가
        questionCard.setAttribute("data-index", index);

        const questionHeader = document.createElement("div");
        questionHeader.className = "question-header";
        questionHeader.innerHTML = `
          <h4>질문 ${index + 1}</h4>
          <button class="delete-question" data-index="${index}">삭제</button>
        `;

        const questionContent = document.createElement("div");
        questionContent.className = "question-content";

        // 질문 유형 (일반/AI 맞춤형)
        const questionTypeRow = document.createElement("div");
        questionTypeRow.className = "settings-row";

        // 기본값 설정 (questionTypes가 없을 경우)
        if (!this.currentSettings.questionTypes) {
          this.currentSettings.questionTypes = Array(
            this.currentSettings.questions.length
          ).fill("normal");
        }

        const currentType =
          this.currentSettings.questionTypes[index] || "normal";
        const isAIQuestion = currentType === "ai";

        questionTypeRow.innerHTML = `
          <label>질문 유형</label>
          <div class="question-type-selector">
            <label class="radio-label">
              <input type="radio" name="question-type-${index}" value="normal" class="question-type-radio" data-index="${index}" ${
          currentType === "normal" ? "checked" : ""
        }>
              일반 질문
            </label>
            <label class="radio-label">
              <input type="radio" name="question-type-${index}" value="ai" class="question-type-radio" data-index="${index}" ${
          isAIQuestion ? "checked" : ""
        }>
              AI 맞춤형 질문
            </label>
          </div>
        `;

        // 질문 텍스트
        const questionTextRow = document.createElement("div");
        questionTextRow.className = `settings-row question-text-row ${
          isAIQuestion ? "ai-mode hidden" : ""
        }`;
        questionTextRow.innerHTML = `
          <label for="question-text-${index}">질문</label>
          <input type="text" id="question-text-${index}" class="question-text" data-index="${index}" value="${question}" ${
          isAIQuestion ? "disabled" : ""
        }>
        `;

        // 질문 설명
        const questionDescRow = document.createElement("div");
        questionDescRow.className = `settings-row question-desc-row ${
          isAIQuestion ? "hidden" : ""
        }`;
        questionDescRow.innerHTML = `
          <label for="question-desc-${index}">설명</label>
          <input type="text" id="question-desc-${index}" class="question-desc" data-index="${index}" 
            value="${this.currentSettings.questionDescriptions[index] || ""}">
        `;

        // 선택지(칩)
        const chipsContainer = document.createElement("div");
        chipsContainer.className = `chips-editor ${
          isAIQuestion ? "hidden" : ""
        }`;
        chipsContainer.innerHTML = `
          <label>선택지</label>
          <div class="chips-input-container">
            <input type="text" id="new-chip-${index}" placeholder="새 선택지 추가 후 Enter" class="new-chip-input" data-index="${index}">
          </div>
          <div id="chips-list-${index}" class="editable-chips-list"></div>
        `;

        // AI 맞춤형 질문 설명 추가
        const aiQuestionHint = document.createElement("div");
        aiQuestionHint.className = `ai-question-hint ${
          isAIQuestion ? "" : "hidden"
        }`;
        aiQuestionHint.innerHTML = `
          <p class="hint-text">AI 맞춤형 질문이 활성화되면 이전 답변들을 기반으로 AI가 자동으로 질문을 생성합니다.</p>
          <p class="hint-text"><strong>참고:</strong> AI 맞춤형 질문은 실제 대화 중에 동적으로 생성되므로 질문, 설명, 선택지를 미리 정의할 수 없습니다.</p>
        `;

        questionContent.appendChild(questionTypeRow);
        questionContent.appendChild(questionTextRow);
        questionContent.appendChild(questionDescRow);
        questionContent.appendChild(chipsContainer);
        questionContent.appendChild(aiQuestionHint);

        questionCard.appendChild(questionHeader);
        questionCard.appendChild(questionContent);
        questionsContainer.appendChild(questionCard);

        // 선택지(칩) 표시 - AI 모드가 아닐 때만
        if (!isAIQuestion) {
          this.renderEditableChips(index);
        }

        // 질문 유형 변경 시 설명 표시/숨김 처리 및 입력 필드 활성화/비활성화
        const handleQuestionTypeChange = (e) => {
          const qIndex = parseInt(e.target.getAttribute("data-index"));
          const isAI = e.target.value === "ai";
          const questionContent = e.target.closest(".question-content");
          const hintElement =
            questionContent.querySelector(".ai-question-hint");
          const textInput = questionContent.querySelector(".question-text");
          const textRow = questionContent.querySelector(".question-text-row");
          const descRow = questionContent.querySelector(".question-desc-row");
          const chipsEditor = questionContent.querySelector(".chips-editor");

          // AI 맞춤형 질문 힌트 표시/숨김 및 필드 표시/숨김
          if (isAI) {
            // AI 모드 활성화 시
            hintElement.classList.remove("hidden");
            textInput.disabled = true;
            textRow.classList.add("ai-mode");

            // 질문 텍스트 필드 숨기기 (가려주기)
            textRow.classList.add("hidden");

            descRow.classList.add("hidden");
            chipsEditor.classList.add("hidden");

            // AI 맞춤형 질문 선택 시 기본 텍스트 표시하지 않음
            // 원래 값을 저장만 하고 덮어쓰지 않음
            if (!textInput.getAttribute("data-original-value")) {
              textInput.setAttribute("data-original-value", textInput.value);
            }
            // 텍스트 입력값을 변경하지 않음 (비워두지 않음)
          } else {
            // 일반 모드로 전환 시
            hintElement.classList.add("hidden");
            textInput.disabled = false;
            textRow.classList.remove("ai-mode");
            textRow.classList.remove("hidden");
            descRow.classList.remove("hidden");
            chipsEditor.classList.remove("hidden");

            // 원래 값으로 복원
            const originalValue = textInput.getAttribute("data-original-value");
            if (originalValue) {
              textInput.value = originalValue;
              textInput.removeAttribute("data-original-value");
            }

            // 선택지(칩) 다시 렌더링
            this.renderEditableChips(qIndex);
          }

          // 설정 업데이트
          this.currentSettings.questionTypes[qIndex] = e.target.value;
          if (isAI) {
            // AI 맞춤형 질문으로 변경될 때 원래 질문 저장
            if (!this.currentSettings.originalQuestions) {
              this.currentSettings.originalQuestions = {};
            }
            this.currentSettings.originalQuestions[qIndex] =
              this.currentSettings.questions[qIndex];

            // 값을 비워두지 않고 원래 값을 유지
            // this.currentSettings.questions[qIndex] = "";
          } else if (
            this.currentSettings.originalQuestions &&
            this.currentSettings.originalQuestions[qIndex]
          ) {
            // 원래 질문으로 복원
            this.currentSettings.questions[qIndex] =
              this.currentSettings.originalQuestions[qIndex];
          }

          this.markAsChanged(`questionTypes.${qIndex}`);
        };

        // 질문 유형 변경 이벤트
        questionContent
          .querySelectorAll(".question-type-radio")
          .forEach((radio) => {
            radio.addEventListener("change", handleQuestionTypeChange);
          });

        // 선택지 추가 이벤트
        const newChipInput = document.getElementById(`new-chip-${index}`);
        if (newChipInput) {
          newChipInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && newChipInput.value.trim()) {
              if (!this.currentSettings.questionChips[index]) {
                this.currentSettings.questionChips[index] = [];
              }
              this.currentSettings.questionChips[index].push(
                newChipInput.value.trim()
              );
              newChipInput.value = "";
              this.renderEditableChips(index);
              this.markAsChanged(`questionChips.${index}`);
            }
          });
        }
      });

      // 새 질문 추가 버튼
      const addQuestionButton = document.createElement("button");
      addQuestionButton.id = "add-question-button";
      addQuestionButton.className = "add-question";
      addQuestionButton.textContent = "+ 새 질문 추가";
      addQuestionButton.addEventListener("click", () => this.addNewQuestion());

      questionsContainer.appendChild(addQuestionButton);

      // 질문 텍스트 변경 이벤트
      document.querySelectorAll(".question-text").forEach((input) => {
        input.addEventListener("input", (e) => {
          const index = parseInt(e.target.getAttribute("data-index"));
          this.currentSettings.questions[index] = e.target.value;
          this.markAsChanged(`questions.${index}`);
        });
      });

      // 질문 설명 변경 이벤트
      document.querySelectorAll(".question-desc").forEach((input) => {
        input.addEventListener("input", (e) => {
          const index = parseInt(e.target.getAttribute("data-index"));
          this.currentSettings.questionDescriptions[index] = e.target.value;
          this.markAsChanged(`questionDescriptions.${index}`);
        });
      });

      // 질문 삭제 이벤트
      document.querySelectorAll(".delete-question").forEach((button) => {
        button.addEventListener("click", (e) => {
          const index = parseInt(e.target.getAttribute("data-index"));
          if (confirm(`질문 ${index + 1}을(를) 삭제하시겠습니까?`)) {
            this.deleteQuestion(index);
          }
        });
      });
    }

    // 공통 설명 변경 이벤트
    document
      .getElementById("common-description")
      .addEventListener("input", (e) => {
        this.currentSettings.commonDescription = e.target.value;
        this.markAsChanged("commonDescription");
      });
  }

  /**
   * 선택지(칩) 렌더링
   */
  renderEditableChips(questionIndex) {
    const chipsListContainer = document.getElementById(
      `chips-list-${questionIndex}`
    );
    if (!chipsListContainer) return; // 컨테이너가 없으면 종료

    chipsListContainer.innerHTML = "";

    if (this.currentSettings.questionChips[questionIndex]) {
      this.currentSettings.questionChips[questionIndex].forEach(
        (chip, chipIndex) => {
          const chipElement = document.createElement("div");
          chipElement.className = "editable-chip";
          chipElement.innerHTML = `
          <span>${chip}</span>
          <button class="delete-chip" data-question="${questionIndex}" data-chip="${chipIndex}">×</button>
        `;
          chipsListContainer.appendChild(chipElement);
        }
      );

      // 선택지 삭제 이벤트
      chipsListContainer.querySelectorAll(".delete-chip").forEach((button) => {
        button.addEventListener("click", (e) => {
          const qIndex = parseInt(e.target.getAttribute("data-question"));
          const cIndex = parseInt(e.target.getAttribute("data-chip"));
          this.currentSettings.questionChips[qIndex].splice(cIndex, 1);
          this.renderEditableChips(qIndex);
          this.markAsChanged(`questionChips.${qIndex}`);
        });
      });
    }
  }

  /**
   * 새 질문 추가
   */
  addNewQuestion() {
    this.currentSettings.questions.push("새 질문");
    this.currentSettings.questionDescriptions.push("");
    this.currentSettings.questionChips.push([]);

    // 질문 유형 추가
    if (!this.currentSettings.questionTypes) {
      this.currentSettings.questionTypes = Array(
        this.currentSettings.questions.length - 1
      ).fill("normal");
    }
    this.currentSettings.questionTypes.push("normal");

    this.populateQuestionsTab();
    this.markAsChanged(
      `questions.${this.currentSettings.questions.length - 1}`
    );
  }

  /**
   * 질문 삭제
   */
  deleteQuestion(index) {
    this.currentSettings.questions.splice(index, 1);
    this.currentSettings.questionDescriptions.splice(index, 1);
    this.currentSettings.questionChips.splice(index, 1);

    // 질문 유형도 함께 삭제
    if (this.currentSettings.questionTypes) {
      this.currentSettings.questionTypes.splice(index, 1);
    }

    this.populateQuestionsTab();
    this.markAsChanged("questions");
  }

  /**
   * 필드 변경 표시
   */
  markAsChanged(fieldPath) {
    this.changedFields.add(fieldPath);
    this.highlightChangedFields();
  }

  /**
   * 변경된 필드 하이라이트
   */
  highlightChangedFields() {
    // 기본 설정과 비교하여 변경된 필드 표시

    // 모델 설정
    if (this.currentSettings.model !== this.originalSettings.model) {
      document.getElementById("model-select").classList.add("changed");
    } else {
      document.getElementById("model-select").classList.remove("changed");
    }

    if (
      this.currentSettings.temperature !== this.originalSettings.temperature
    ) {
      document.getElementById("temperature-slider").classList.add("changed");
      document.getElementById("temperature-value").classList.add("changed");
    } else {
      document.getElementById("temperature-slider").classList.remove("changed");
      document.getElementById("temperature-value").classList.remove("changed");
    }

    // 프롬프트 설정
    if (
      this.currentSettings.prompts?.recommendationPrompt !==
      this.originalSettings.recommendationPrompt
    ) {
      document.getElementById("recommendation-prompt").classList.add("changed");
    } else {
      document
        .getElementById("recommendation-prompt")
        .classList.remove("changed");
    }

    if (
      this.currentSettings.prompts?.nextQuestionPrompt !==
      this.originalSettings.nextQuestionPrompt
    ) {
      document.getElementById("next-question-prompt").classList.add("changed");
    } else {
      document
        .getElementById("next-question-prompt")
        .classList.remove("changed");
    }

    // 공통 설명
    if (
      this.currentSettings.commonDescription !==
      this.originalSettings.commonDescription
    ) {
      document.getElementById("common-description").classList.add("changed");
    } else {
      document.getElementById("common-description").classList.remove("changed");
    }

    // 질문, 설명, 선택지 하이라이트
    this.currentSettings.questions.forEach((_, index) => {
      const questionText = document.getElementById(`question-text-${index}`);
      const questionDesc = document.getElementById(`question-desc-${index}`);

      if (questionText) {
        if (
          index >= this.originalSettings.questions.length ||
          this.currentSettings.questions[index] !==
            this.originalSettings.questions[index]
        ) {
          questionText.classList.add("changed");
        } else {
          questionText.classList.remove("changed");
        }
      }

      if (questionDesc) {
        if (
          index >= this.originalSettings.questionDescriptions.length ||
          this.currentSettings.questionDescriptions[index] !==
            this.originalSettings.questionDescriptions[index]
        ) {
          questionDesc.classList.add("changed");
        } else {
          questionDesc.classList.remove("changed");
        }
      }
    });
  }

  /**
   * 현재 설정을 클립보드에 복사
   */
  copySettings() {
    try {
      // 저장하기 전에 현재 UI의 값을 가져옴
      this.updateSettingsFromUI();

      // JSON 형식으로 변환해 클립보드에 복사
      const settingsJSON = JSON.stringify(this.currentSettings, null, 2);
      navigator.clipboard
        .writeText(settingsJSON)
        .then(() => {
          alert("현재 설정이 클립보드에 복사되었습니다.");
        })
        .catch((err) => {
          console.error("클립보드 복사 실패:", err);
          alert("설정 복사에 실패했습니다.");
        });
    } catch (error) {
      console.error("설정 복사 중 오류 발생:", error);
      alert("설정 복사 중 오류가 발생했습니다.");
    }
  }

  /**
   * UI 값에서 설정 업데이트
   */
  updateSettingsFromUI() {
    // 모델 설정 값 가져오기
    this.currentSettings.model = document.getElementById("model-select").value;
    this.currentSettings.temperature = parseFloat(
      document.getElementById("temperature-slider").value
    );
    this.currentSettings.commonDescription =
      document.getElementById("common-description").value;

    // 프롬프트 설정 값 가져오기
    if (!this.currentSettings.prompts) {
      this.currentSettings.prompts = {};
    }
    this.currentSettings.prompts.recommendationPrompt = document.getElementById(
      "recommendation-prompt"
    ).value;
    this.currentSettings.prompts.nextQuestionPrompt = document.getElementById(
      "next-question-prompt"
    ).value;

    // 질문 설정 값 가져오기
    const questions = [];
    const questionDescriptions = [];
    const questionTypes = [];

    // 모달 내 모든 질문 카드 요소를 가져옴
    const questionCards = document.querySelectorAll(".question-card");

    // 각 질문 카드에서 데이터 추출
    questionCards.forEach((card, index) => {
      // 질문 텍스트 추출
      const textInput = card.querySelector(".question-text");
      if (textInput) {
        questions[index] = textInput.value;
      }

      // 질문 설명 추출
      const descInput = card.querySelector(".question-desc");
      if (descInput) {
        questionDescriptions[index] = descInput.value;
      }

      // 질문 유형 추출
      const aiRadio = card.querySelector('input[value="ai"]');
      questionTypes[index] = aiRadio?.checked ? "ai" : "normal";
    });

    console.log("수집한 질문:", questions);
    console.log("수집한 설명:", questionDescriptions);
    console.log("수집한 유형:", questionTypes);

    // 배열에 빈 요소가 있는지 확인하고 정리
    const cleanQuestions = questions.filter((q) => q !== undefined);
    const cleanDescriptions = questionDescriptions.filter(
      (d) => d !== undefined
    );
    const cleanTypes = questionTypes.filter((t) => t !== undefined);

    console.log("정리된 질문:", cleanQuestions);
    console.log("정리된 설명:", cleanDescriptions);
    console.log("정리된 유형:", cleanTypes);

    this.currentSettings.questions = cleanQuestions;
    this.currentSettings.questionDescriptions = cleanDescriptions;
    this.currentSettings.questionTypes = cleanTypes;
  }

  /**
   * 설정 저장
   */
  async saveSettings() {
    try {
      // UI 값에서 설정 업데이트
      this.updateSettingsFromUI();

      console.log("저장할 설정:", JSON.stringify(this.currentSettings));
      console.log("질문 개수:", this.currentSettings.questions.length);
      console.log("질문 목록:", this.currentSettings.questions);

      // constants.js를 통해 설정 저장
      const constants = await import("./constants.js");
      await constants.saveSettings(this.currentSettings);

      alert(
        "설정이 저장되었습니다. 페이지를 새로고침하면 변경사항이 적용됩니다."
      );
      this.closeModal();

      // 페이지 새로고침 확인
      if (confirm("지금 페이지를 새로고침하여 변경사항을 적용하시겠습니까?")) {
        window.location.reload();
      }
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    }
  }
}

/**
 * 프롬프트 파서 - 템플릿 문법을 실제 데이터로 치환
 */
export function parsePromptTemplate(template, data) {
  // {{현재까지답변}} 형식의 템플릿 변수 처리
  if (template.includes("{{현재까지답변}}")) {
    if (data.questions && data.answers) {
      const answersText = data.answers
        .map((answer, index) => `- ${data.questions[index]}: ${answer}`)
        .join("\n");

      return template.replace("{{현재까지답변}}", answersText);
    }
  }

  // 다른 템플릿 변수 처리 (필요시 확장)
  return template;
}

// 스타일 추가
const styleElement = document.createElement("style");
styleElement.textContent = `
.modal-open-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  padding: 10px 15px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.modal-open-button:hover {
  background-color: #3367d6;
  transform: translateY(-2px);
}

.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container.hidden {
  display: none;
}

.modal-content {
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #202124;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #5f6368;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary-button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.secondary-button {
  background-color: #f1f3f4;
  color: #5f6368;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.modal-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 15px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab-button.active {
  border-bottom-color: #4285f4;
  color: #4285f4;
  font-weight: 500;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.settings-row label {
  width: 150px;
  font-weight: 500;
}

.settings-row input,
.settings-row select {
  flex: 1;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.full-width {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 15px;
}

.question-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-header h4 {
  margin: 0;
  color: #202124;
}

.delete-question {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.prompt-textarea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}

.chips-editor {
  margin-top: 10px;
}

.chips-input-container {
  margin-bottom: 10px;
}

.new-chip-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.editable-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.editable-chip {
  display: flex;
  align-items: center;
  background-color: #f1f3f4;
  padding: 5px 10px;
  border-radius: 16px;
  font-size: 14px;
}

.editable-chip span {
  margin-right: 8px;
}

.delete-chip {
  background: transparent;
  border: none;
  color: #5f6368;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
}

.add-question {
  background-color: #f1f3f4;
  color: #4285f4;
  border: 1px dashed #4285f4;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  text-align: center;
  margin-top: 15px;
}

.help-text {
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 8px;
}

.changed {
  background-color: #e6f4ea !important;
  border-color: #34a853 !important;
  color: #137333 !important;
}

textarea.changed {
  border-left: 3px solid #34a853 !important;
}

.question-type-selector {
  display: flex;
  gap: 15px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-label input {
  margin-right: 5px;
}

.ai-question-hint {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-left: 3px solid #4285f4;
  border-radius: 4px;
}

.ai-question-hint.hidden {
  display: none;
}

.hint-text {
  margin: 0;
  font-size: 13px;
  color: #5f6368;
}

input:disabled {
  background-color: #f1f1f1;
  cursor: not-allowed;
  color: #888;
}

.hidden {
  display: none !important;
}

.question-text-row.ai-mode {
  background-color: #e8f0fe;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.question-text-row.ai-mode input {
  background-color: #e1e8f5;
  border-color: #c6d5f5;
  font-style: italic;
}
`;

document.head.appendChild(styleElement);
