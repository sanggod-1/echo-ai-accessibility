import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCg2ZZH3u0rImNQp5RxY81_OmeVyK-SwSU";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeTranscription = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      상황: 청각 장애가 있는 아버님을 위한 실시간 대화 지원 시스템입니다.
      입력 텍스트: "${text}"
      
      작업:
      1. 위 문장에서 아버님이 잘못 들었을 가능성이 높은 '유사 발음'이나 '헷갈리는 단어'가 있다면 보정된 문장을 제시하세요.
      2. 대화의 핵심 키워드를 요약하세요.
      3. 대화자의 감정 상태를 분석하세요. (예: 기쁨, 걱정, 평온)
      4. 아버님이 다음에 답변하기 좋은 추천 답변 후보 2개를 만드세요.

      JSON 형식으로 응답하세요:
      {
        "correctedText": "보정된 문장",
        "keywords": ["키워드1", "키워드2"],
        "emotion": "감정",
        "suggestions": ["추천답변1", "추천답변2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, "");
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
