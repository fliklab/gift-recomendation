/**
 * 옵션 설정 모달 관리 클래스
 */
import { FileImporter } from "./utils/fileImporter.js";

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
        <p class="help-text">모델별 특징 및 비용<br>
          - GPT-3.5-turbo: 빠르고 저렴 (1,000토큰당 $0.0015)<br>
          - GPT-4o-mini: 균형 잡힌 성능과 비용 (1,000토큰당 $0.0020)<br>
          - GPT-4: 최고 성능, 비용 높음 (1,000토큰당 약 $0.03)<br>
          - GPT-4-turbo: GPT-4 유사 성능, 빠르고 다소 저렴 (1,000토큰당 약 $0.03)
        </p>
        <div class="settings-row">
          <label for="temperature-slider">Temperature</label>
          <input type="range" id="temperature-slider" min="0" max="2" step="0.1" value="0.7">
          <span id="temperature-value">0.7</span>
        </div>
        <p class="help-text">Tempertature가 높을수록 더 창의적이고 다양한 답변을 생성합니다. 일반적으로 1 이하를 권장합니다.</p>
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
      <button id="import-from-file" class="secondary-button">설정 리스트 보기</button>
      <!-- 임시 비활성화 <button id="export-settings" class="secondary-button">현재 설정 내보내기</button> -->
      <button id="add-to-list" class="secondary-button">리스트에 추가하기</button>
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
    this.exportButton = document.getElementById("export-settings");
    this.closeButton = document.getElementById("close-modal-button");

    // 이벤트 리스너 설정
    const addToListButton = document.getElementById("add-to-list");
    addToListButton.addEventListener("click", () => this.addToSettingsList());
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

    // 설정 불러오기 버튼
    const importButton = document.getElementById("import-from-file");
    importButton.addEventListener("click", () => this.openFileSelectModal());

    // 설정 내보내기 버튼
    this.exportButton.addEventListener("click", () => this.openExportModal());

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
    // JSON 설정값을 그대로 사용하여 UI에 표시합니다
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

      // constants.js를 통해 설정 저장
      const constants = await import("./constants.js");
      await constants.saveSettings(this.currentSettings);

      alert("설정이 저장되었습니다.");
      this.closeModal();
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    }
  }

  /**
   * 설정을 리스트에 추가
   */
  async addToSettingsList() {
    try {
      // UI 값에서 설정 업데이트
      this.updateSettingsFromUI();

      // 현재 날짜와 시간 가져오기
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");

      // 리스트에 추가할 데이터 준비
      const settingsToAdd = {
        ...this.currentSettings,
        id: this.generateUniqueId(),
        isLocal: true,
        title: `새로운 설정 ${dateStr}_${timeStr}`,
        createdAt: now.toISOString().split("T")[0],
      };

      // 로컬스토리지에 저장
      if (this.saveToLocalStorage(settingsToAdd)) {
        alert("설정이 리스트에 추가되었습니다.");
        this.closeModal();
      } else {
        alert("설정 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("설정 추가 실패:", error);
      alert("설정 추가 중 오류가 발생했습니다.");
    }
  }

  /**
   * 파일 선택 모달 열기
   */
  openFileSelectModal() {
    const fileSelectModal = document.createElement("div");
    fileSelectModal.id = "file-select-modal";
    fileSelectModal.className = "modal-container";
    fileSelectModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>설정 파일 선택</h2>
          <button class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div class="file-list-container">
            <div class="file-list-header">
              <span>제목</span>
              <span>저자</span>
              <span>등록일</span>
            </div>
            <div id="file-list" class="file-list">
              <!-- 파일 목록이 여기에 동적으로 추가됨 -->
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="import-json-file" class="secondary-button">JSON 파일 불러오기</button>
          <button id="paste-json-settings" class="secondary-button">JSON 직접 입력하기</button>
          <button id="cancel-file-select" class="secondary-button">취소</button>
        </div>
      </div>
    `;

    document.body.appendChild(fileSelectModal);

    // 이벤트 리스너 설정
    const closeButton = fileSelectModal.querySelector(".close-button");
    const cancelButton = fileSelectModal.querySelector("#cancel-file-select");
    const pasteJSONButton = fileSelectModal.querySelector(
      "#paste-json-settings"
    );
    const importJSONButton = fileSelectModal.querySelector("#import-json-file");

    const closeFileSelectModal = () => {
      document.body.removeChild(fileSelectModal);
    };

    closeButton.addEventListener("click", closeFileSelectModal);
    cancelButton.addEventListener("click", closeFileSelectModal);

    pasteJSONButton.addEventListener("click", () => {
      this.openPasteModal();
      closeFileSelectModal();
    });

    importJSONButton.addEventListener("click", () => {
      this.importJSONFile();
      closeFileSelectModal();
    });

    // 파일 목록 로드 및 표시
    this.loadAndDisplayFileList();
  }

  /**
   * JSON 파일 불러오기
   */
  importJSONFile() {
    FileImporter.importJSONFile((jsonContent) => {
      // JSON 입력 모달 열기
      this.openPasteModal(jsonContent);
    });
  }

  /**
   * JSON 입력 모달 열기
   */
  openPasteModal(preloadContent = "") {
    const pasteModal = document.createElement("div");
    pasteModal.id = "paste-json-modal";
    pasteModal.className = "modal-container";
    pasteModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>JSON 설정 입력하기</h2>
          <button class="close-button">×</button>
        </div>
        <div class="modal-body">
          <textarea id="paste-json-textarea" class="full-width" rows="15" placeholder="JSON 설정을 입력해주세요...">${preloadContent}</textarea>
          <div id="json-validation-message" class="validation-message"></div>
        </div>
        <div class="modal-footer">
          <button id="cancel-paste" class="secondary-button">취소</button>
          <button id="confirm-paste" class="primary-button" disabled>저장</button>
        </div>
      </div>
    `;

    document.body.appendChild(pasteModal);

    // 이벤트 리스너 설정
    const closeButton = pasteModal.querySelector(".close-button");
    const cancelButton = pasteModal.querySelector("#cancel-paste");
    const confirmButton = pasteModal.querySelector("#confirm-paste");
    const textarea = pasteModal.querySelector("#paste-json-textarea");
    const validationMessage = pasteModal.querySelector(
      "#json-validation-message"
    );

    const closePasteModal = () => {
      document.body.removeChild(pasteModal);
    };

    closeButton.addEventListener("click", closePasteModal);
    cancelButton.addEventListener("click", closePasteModal);

    // 초기 JSON 검증 (파일에서 불러온 경우)
    if (preloadContent) {
      this.validateJSONInput(textarea, validationMessage, confirmButton);
    }

    // JSON 검증 및 저장
    textarea.addEventListener("input", () => {
      this.validateJSONInput(textarea, validationMessage, confirmButton);
    });

    confirmButton.addEventListener("click", () => {
      try {
        const json = JSON.parse(textarea.value);
        if (this.validateSettings(json)) {
          this.currentSettings = json;
          this.originalSettings = JSON.parse(JSON.stringify(json));
          this.changedFields.clear();
          this.populateSettings();
          closePasteModal();
          alert("설정이 성공적으로 적용되었습니다.");
        }
      } catch (error) {
        console.error("설정 적용 실패:", error);
        alert("설정 적용 중 오류가 발생했습니다.");
      }
    });
  }

  /**
   * JSON 입력값 검증
   */
  validateJSONInput(textarea, validationMessage, confirmButton) {
    try {
      const json = JSON.parse(textarea.value);
      if (this.validateSettings(json)) {
        validationMessage.textContent = "유효한 JSON 설정입니다.";
        validationMessage.className = "validation-message valid";
        confirmButton.disabled = false;
      } else {
        validationMessage.textContent = "필수 필드가 누락되었습니다.";
        validationMessage.className = "validation-message invalid";
        confirmButton.disabled = true;
      }
    } catch (error) {
      validationMessage.textContent = "잘못된 JSON 형식입니다.";
      validationMessage.className = "validation-message invalid";
      confirmButton.disabled = true;
    }
  }

  /**
   * 설정 내보내기 모달 열기
   */
  openExportModal() {
    const exportModal = document.createElement("div");
    exportModal.id = "export-settings-modal";
    exportModal.className = "modal-container";
    exportModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>설정 내보내기</h2>
          <button class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div class="settings-row">
            <label for="export-title">제목</label>
            <input type="text" id="export-title" class="full-width" placeholder="설정 파일 제목을 입력하세요">
          </div>
          <div class="settings-row">
            <label for="export-author">작성자</label>
            <input type="text" id="export-author" class="full-width" placeholder="작성자 이름을 입력하세요">
          </div>
          <div class="settings-row">
            <label for="export-description">설명</label>
            <textarea id="export-description" class="full-width" rows="3" placeholder="설정 파일에 대한 설명을 입력하세요"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button id="cancel-export" class="secondary-button">취소</button>
          <button id="copy-to-clipboard" class="secondary-button">복사만 하기</button>
          <button id="save-to-file" class="secondary-button">파일로 저장하기</button>
          <button id="create-pr" class="primary-button">PR 올리기</button>
        </div>
      </div>
    `;

    document.body.appendChild(exportModal);

    // 이벤트 리스너 설정
    const closeButton = exportModal.querySelector(".close-button");
    const cancelButton = exportModal.querySelector("#cancel-export");
    const saveToFileButton = exportModal.querySelector("#save-to-file");
    const createPRButton = exportModal.querySelector("#create-pr");
    const copyToClipboardButton =
      exportModal.querySelector("#copy-to-clipboard");

    const closeExportModal = () => {
      document.body.removeChild(exportModal);
    };

    closeButton.addEventListener("click", closeExportModal);
    cancelButton.addEventListener("click", closeExportModal);

    saveToFileButton.addEventListener("click", () => {
      this.exportToFile();
      closeExportModal();
    });

    createPRButton.addEventListener("click", () => {
      this.createPullRequest();
      closeExportModal();
    });

    copyToClipboardButton.addEventListener("click", () => {
      this.copySettingsToClipboard();
      closeExportModal();
    });
  }

  /**
   * 설정을 파일로 내보내기
   */
  exportToFile() {
    try {
      const title = document.getElementById("export-title").value;
      const author = document.getElementById("export-author").value;
      const description = document.getElementById("export-description").value;

      if (!title || !author) {
        alert("제목과 작성자는 필수 입력 항목입니다.");
        return;
      }

      // 현재 설정 가져오기
      this.updateSettingsFromUI();

      // 메타데이터 추가
      const exportData = {
        ...this.currentSettings,
        id: this.generateUniqueId(),
        title: title,
        author: author,
        description: description,
        createdAt: new Date().toISOString().split("T")[0],
      };

      // 파일로 저장
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("설정이 파일로 저장되었습니다.");
    } catch (error) {
      console.error("설정 내보내기 실패:", error);
      alert("설정 내보내기에 실패했습니다.");
    }
  }

  /**
   * GitHub PR 생성
   */
  async createPullRequest() {
    alert("준비중입니다.");
  }

  /**
   * 고유 ID 생성
   */
  generateUniqueId() {
    return (
      "setting_" +
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 5)
    );
  }

  /**
   * 설정을 클립보드에 복사
   */
  async copySettingsToClipboard() {
    try {
      const title = document.getElementById("export-title").value;
      const author = document.getElementById("export-author").value;
      const description = document.getElementById("export-description").value;

      if (!title || !author) {
        alert("제목과 작성자는 필수 입력 항목입니다.");
        return;
      }

      // 현재 설정 가져오기
      this.updateSettingsFromUI();

      // 메타데이터 추가
      const exportData = {
        ...this.currentSettings,
        id: this.generateUniqueId(),
        title: title,
        author: author,
        description: description,
        createdAt: new Date().toISOString().split("T")[0],
      };

      // 클립보드에 복사
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      alert("설정이 클립보드에 복사되었습니다.");
    } catch (error) {
      console.error("설정 복사 실패:", error);
      alert("설정을 클립보드에 복사하는데 실패했습니다.");
    }
  }

  /**
   * 파일 목록 로드 및 표시
   */
  async loadAndDisplayFileList() {
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "";

    try {
      // 로컬스토리지에서 저장된 설정 가져오기
      const savedSettings = JSON.parse(
        localStorage.getItem("savedSettings") || "[]"
      );

      // 기본 설정 파일 목록
      const defaultFiles = [
        {
          id: "default",
          title: "기본 설정",
          author: "시스템",
          createdAt: "2024-03-20",
          isLocal: false,
        },
        {
          id: "birthday",
          title: "생일 선물 설정",
          author: "사용자1",
          createdAt: "2024-03-21",
          isLocal: false,
        },
      ];

      // 로컬스토리지 설정과 기본 설정 파일을 합침
      const allFiles = [...defaultFiles, ...savedSettings];

      allFiles.forEach((file) => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-list-item";
        fileItem.innerHTML = `
          <div class="file-info">
            <span class="file-title">${file.title}</span>
            <span class="file-author">${file.author}</span>
            <span class="file-date">${file.createdAt}</span>
            ${file.isLocal ? '<span class="local-badge">로컬</span>' : ""}
          </div>
          <div class="file-actions">
            ${
              file.isLocal
                ? `<button class="delete-file-button" data-id="${file.id}">삭제</button>`
                : ""
            }
          </div>
        `;

        // 파일 선택 이벤트
        fileItem.querySelector(".file-info").addEventListener("click", () => {
          this.loadSelectedFile(file.id, file.isLocal);
        });

        // 삭제 버튼 이벤트 (로컬 파일인 경우에만)
        if (file.isLocal) {
          fileItem
            .querySelector(".delete-file-button")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              this.deleteFromLocalStorage(file.id);
            });
        }

        fileList.appendChild(fileItem);
      });
    } catch (error) {
      console.error("파일 목록 로드 실패:", error);
      alert("파일 목록을 불러오는데 실패했습니다.");
    }
  }

  /**
   * 선택된 파일 로드
   */
  async loadSelectedFile(fileId, isLocal = false) {
    try {
      let settings;
      if (isLocal) {
        // 로컬스토리지에서 설정 가져오기
        const savedSettings = JSON.parse(
          localStorage.getItem("savedSettings") || "[]"
        );
        settings = savedSettings.find((file) => file.id === fileId);
      } else {
        // 기본 설정 파일 로드
        const response = await fetch(`/js/settings/${fileId}.json`);
        settings = await response.json();
      }

      if (!settings) {
        throw new Error("설정을 찾을 수 없습니다.");
      }

      this.currentSettings = settings;
      this.originalSettings = JSON.parse(JSON.stringify(settings));
      this.changedFields.clear();

      this.populateSettings();
      document.getElementById("file-select-modal").remove();
      alert("설정이 성공적으로 로드되었습니다.");
    } catch (error) {
      console.error("파일 로드 실패:", error);
      alert("파일을 불러오는데 실패했습니다.");
    }
  }

  /**
   * 설정을 로컬스토리지에 저장
   */
  saveToLocalStorage(settings) {
    try {
      const savedSettings = JSON.parse(
        localStorage.getItem("savedSettings") || "[]"
      );
      const existingIndex = savedSettings.findIndex(
        (file) => file.id === settings.id
      );

      if (existingIndex >= 0) {
        savedSettings[existingIndex] = settings;
      } else {
        savedSettings.push(settings);
      }

      localStorage.setItem("savedSettings", JSON.stringify(savedSettings));
      return true;
    } catch (error) {
      console.error("로컬스토리지 저장 실패:", error);
      return false;
    }
  }

  /**
   * 설정 JSON 검증
   */
  validateSettings(settings) {
    // 필수 필드 검증
    const requiredFields = [
      "questions",
      "questionDescriptions",
      "questionChips",
      "model",
      "temperature",
      "prompts",
      "commonDescription",
    ];

    for (const field of requiredFields) {
      if (!(field in settings)) {
        return false;
      }
    }

    // questions 배열 검증
    if (!Array.isArray(settings.questions) || settings.questions.length === 0) {
      return false;
    }

    // questionDescriptions 배열 검증
    if (
      !Array.isArray(settings.questionDescriptions) ||
      settings.questionDescriptions.length !== settings.questions.length
    ) {
      return false;
    }

    // questionChips 배열 검증
    if (
      !Array.isArray(settings.questionChips) ||
      settings.questionChips.length !== settings.questions.length
    ) {
      return false;
    }

    // model 값 검증
    const validModels = [
      "gpt-4o-mini",
      "gpt-3.5-turbo",
      "gpt-4",
      "gpt-4-turbo",
    ];
    if (!validModels.includes(settings.model)) {
      return false;
    }

    // temperature 값 검증
    if (
      typeof settings.temperature !== "number" ||
      settings.temperature < 0 ||
      settings.temperature > 2
    ) {
      return false;
    }

    // prompts 객체 검증
    if (
      typeof settings.prompts !== "object" ||
      !settings.prompts.recommendationPrompt ||
      !settings.prompts.nextQuestionPrompt
    ) {
      return false;
    }

    return true;
  }

  /**
   * 프롬프트 파서 - 템플릿 문법을 실제 데이터로 치환
   */
  parsePromptTemplate(template, data) {
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

  /**
   * 로컬스토리지에서 설정 삭제
   */
  deleteFromLocalStorage(fileId) {
    if (confirm("이 설정을 삭제하시겠습니까?")) {
      try {
        const savedSettings = JSON.parse(
          localStorage.getItem("savedSettings") || "[]"
        );
        const updatedSettings = savedSettings.filter(
          (file) => file.id !== fileId
        );
        localStorage.setItem("savedSettings", JSON.stringify(updatedSettings));

        // 파일 목록 새로고침
        this.loadAndDisplayFileList();
        alert("설정이 삭제되었습니다.");
      } catch (error) {
        console.error("설정 삭제 실패:", error);
        alert("설정 삭제에 실패했습니다.");
      }
    }
  }
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

.validation-message {
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.validation-message.valid {
  background-color: #e6f4ea;
  color: #137333;
  border: 1px solid #34a853;
}

.validation-message.invalid {
  background-color: #fce8e6;
  color: #c5221f;
  border: 1px solid #d93025;
}

#paste-json-textarea {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 300px;
}

#paste-json-modal .modal-content {
  max-width: 800px;
  width: 90%;
}

#paste-json-modal .modal-body {
  padding: 20px;
}

.file-list-container {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.file-list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 500;
}

.file-list {
  max-height: 300px;
  overflow-y: auto;
}

.file-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-list-item:hover {
  background-color: #f1f3f4;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.file-title {
  font-weight: 500;
  min-width: 200px;
}

.file-author {
  color: #5f6368;
  min-width: 100px;
}

.file-date {
  color: #5f6368;
  min-width: 100px;
}

.local-badge {
  background-color: #e8f0fe;
  color: #1a73e8;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.delete-file-button {
  background-color: #fce8e6;
  color: #d93025;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.delete-file-button:hover {
  background-color: #fad2cf;
}
`;

document.head.appendChild(styleElement);
