/**
 * JSON 파일 임포트 유틸리티
 */
export class FileImporter {
  /**
   * JSON 파일을 선택하고 읽어오는 메서드
   * @param {Function} onFileRead - 파일 읽기가 완료된 후 호출될 콜백 함수
   */
  static importJSONFile(onFileRead) {
    // 숨겨진 파일 입력 요소 생성
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    // 파일 선택 이벤트 처리
    fileInput.addEventListener("change", async (event) => {
      try {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonContent = e.target.result;
            onFileRead(jsonContent);
          } catch (error) {
            console.error("JSON 파일 파싱 실패:", error);
            alert("JSON 파일을 읽는데 실패했습니다.");
          }
        };
        reader.readAsText(file);
      } finally {
        // 파일 입력 요소 제거
        document.body.removeChild(fileInput);
      }
    });

    // 파일 선택 다이얼로그 열기
    fileInput.click();
  }
}
