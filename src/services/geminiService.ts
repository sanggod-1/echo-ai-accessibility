import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
console.log("Gemini API Service - Key found:", API_KEY ? "Yes (starts with " + API_KEY.substring(0, 5) + ")" : "NO");
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeTranscription = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      상황: 청각 장애가 있는 아버님을 위한 실시간 대화 지원 시스템입니다.
      입력 텍스트: "${text}"
      
      작업 가이드라인:
      1. [문장 보정]: 아버님이 잘못 들었을 가능성이 높은 '유사 발음'을 맥락에 맞게 교정하세요. (예: '수레' -> '수레' 혹은 '술에')
      2. [인지 최적화]: 인지 부하를 줄이기 위해 문장을 더 짧고 명확하게 단순화(Simplify) 하세요.
      3. [뉘앙스 포착]: 화자의 목소리 톤이나 상황에서 느껴지는 감정을 '평온/기쁨/긴급/분노' 중 하나로 분석하십시오.
      4. [추천 답변]: 대화의 흐름을 끊지 않으면서 아버님이 바로 선택해 쓸 수 있는 짧은 답변 2개를 만드세요.
      5. [핵심 키워드]: 대화 내용 중 가장 중요한 단어 2개를 뽑으세요.

      JSON 형식으로만 엄격히 응답하세요:
      {
        "correctedText": "보정 및 단순화된 명확한 문장",
        "keywords": ["핵심단어1", "핵심단어2"],
        "emotion": "분석된 감정",
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
export const translateText = async (text: string, targetLanguage: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a real-time speech translation assistant.
      User says: "${text}"
      Target Language: ${targetLanguage === 'Auto' ? 'Detect input and translate to English (if input is Korean) or Korean (if input is not Korean)' : targetLanguage}
      
      Requirements:
      1. Detect the source language.
      2. Translate clearly and naturally.
      3. For non-Korean results, provide pronunciation in Korean characters.
      4. Add one practical cultural tip.

      Response Format (STRICT JSON ONLY, NO MARKDOWN):
      {
        "detectedLanguage": "Language Name",
        "translatedText": "The translation",
        "pronunciation": "Pronunciation Guide",
        "context": "The cultural tip"
      }
    `;

    console.log(`Starting translation for: "${text.substring(0, 20)}..." to ${targetLanguage}`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    console.log("Gemini Raw Response Received:", rawText);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Gemini returned an empty response");
    }

    // Handle potential JSON inside markdown blocks
    let jsonText = rawText;
    if (rawText.includes("```")) {
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    } else {
      const braceMatch = rawText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonText = braceMatch[0];
      }
    }

    try {
      const parsed = JSON.parse(jsonText.trim());
      console.log("Gemini Parsed Success:", parsed);
      return parsed;
    } catch (parseError) {
      console.error("JSON Parse Error. Content:", jsonText);
      throw new Error(`Failed to parse AI response: ${parseError}`);
    }
  } catch (error: any) {
    console.error("!!! GEMINI TRANSLATION ERROR !!!");
    console.error("Type:", error.name);
    console.error("Message:", error.message);

    return {
      error: error.message || "Unknown API error",
      detectedLanguage: "Error",
      translatedText: "-",
      pronunciation: "-",
      context: "-"
    };
  }
};
