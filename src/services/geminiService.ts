import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
console.log("✅ Tier 1 Key Authorized:", API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : "❌ NO KEY FOUND");
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeTranscription = async (text: string) => {
  try {
    // [2026 고도화] Hybrid Intelligence Strategy
    const modelName = "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    // [2026 고도화] 의료 맥락 감지
    const isMedical = /병원|치과|수술|치료|아파|상담|약|처방/.test(text);

    const prompt = `
      상황: 청각 장애가 있는 어머님/아버님을 위한 실시간 대화 지원 시스템입니다.
      입력 텍스트: "${text}"
      분석 모델: ${modelName} (전략적 모델링 적용)
      
      작업 가이드라인 [Ultimate Sophistication]:
      1. [문장 보정]: 발음이 뭉개졌거나 유사 발음으로 잘못 인식된 단어를 맥락 상 100% 맞는 단어로 교정하십시오.
      2. [인지 최적화]: 인지 부하 감소를 위해 '핵심 팩트' 위주로 극도로 명확하고 짧게 단순화하십시오.
      3. [뉘앙스 및 강도]: 화자의 감정 및 그 강도(1~10)를 정밀 분석하십시오.
      4. [예측형 답변 (Predictive)]: 상대방의 말에 대해 아버님이 바로 선택할 수 있는 '맥락 상의 최적 답변' 2개.
      ${isMedical ? "5. [의료 가이드]: 환자의 안전과 관련된 내용이므로 용어를 정확히 사용하고 긴급도를 체크하십시오." : "5. [주변 생활음 감지]: 텍스트의 맥락 상 주변에서 들릴 수 있는 소리를 예측하십시오."}
      6. [핵심 키워드]: 대화의 주제를 관통하는 단어 2개.

      JSON 형식으로만 엄격히 응답하세요:
      {
        "correctedText": "보정 및 극도로 단순화된 문장",
        "keywords": ["핵심단어1", "핵심단어2"],
        "emotion": "감정명",
        "emotionIntensity": 10,
        "isEmergency": ${isMedical ? "true" : "false"},
        "environmentalPredict": "예측된 주변 소리",
        "suggestions": ["답변1", "답변2"]
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

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
