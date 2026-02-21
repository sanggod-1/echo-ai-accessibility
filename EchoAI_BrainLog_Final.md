# Echo AI Project Brain Log: v1.1 - v1.4 Premium Evolution
**Date:** 2026-02-21
**Project Goal:** Developing a life-changing AI mobility assistant for individuals with partial hearing loss (Father's companion).

---

## [KR] 프로젝트 진화 과정 요약

### v1.1 - 핵심 기반 구축
- **STT 구현:** 실시간 전사를 위한 Google Web Speech API 도입.
- **지연 시간 최적화:** 대화 중 인지 부하를 줄이기 위해 중간 인식 결과를 즉시 표시.

### v1.2 - 오디오 증강 (잔존 청력 최적화)
- **오디오 서비스 엔진:** Web Audio API 기반의 필터링 시스템 구현.
- **웅웅거림 제거:** 저주파 소음을 제거하여 말소리의 명료도 향상.
- **선명도 부스팅:** 고령 사용자에게 필수적인 고주파 대역(자음 ㅅ, ㅎ, ㅋ 등) 증폭.

### v1.3 - 하드웨어 시너지 및 원격 마이크
- **외부 마이크 지원:** 장치 변경 실시간 감지 및 자동 재설정 로직 구축.
- **원격 마이크 전략:** 상대방에게 부담을 주지 않으면서 SNR을 극대화할 수 있는 사용자 본인 착용형 마이크 가이드 제공.
- **시각적 미터링:** 마이크 입력 품질을 즉시 확인할 수 있는 미니 볼륨 바 추가.

### v1.4 Premium - 상황 인지형 지능 서비스 (현재)
- **화자 분리 UI:** 다수가 대화하는 식사 환경 등을 고려해 누가 말하는지 구분하는 시각적 태그 추가.
- **상황별 프리셋:** 🏠 집(조용함), 🌊 야외(보통), ☕ 카페(시끄러움) 상황에 맞춰 필터와 컴프레서를 동적 조절.
- **보편적 접근성:** 고령자의 사용성을 고려한 실시간 글자 크기 조절 및 고대비 UI.
- **지능형 분석 연동:** Gemini 1.5 Pro를 이용한 전사 보정, 키워드 추출, 감지 분석 및 제언.

---

## [EN] Project Evolution Summary

### v1.1 - Core Foundation
- **STT Implementation:** Integrated Google Web Speech API for real-time transcription.
- **Latency Optimization:** Immediate display of interim results to minimize cognitive load during natural flow of conversation.

### v1.2 - Audio Augmentation (Residual Hearing Optimization)
- **Audio Service Engine:** Implemented advanced filtering using Web Audio API.
- **Mumble Reduction:** High-pass filtering to remove low-frequency rumble, significantly enhancing vocal clarity.
- **Clarity Boost:** High-shelf amplification for high-frequency bands (consonants like s, h, k), crucial for users with age-related hearing loss.

### v1.3 - Hardware Synergy & Remote Mic
- **External Mic Support:** Implemented real-time device change monitoring and auto-reinit logic.
- **Remote Mic Strategy:** Provided guidance for user-worn microphones (neckband/lapel) to maximize SNR (Signal-to-Noise Ratio) without social burden on the speaker.
- **Visual Metering:** Added mini-volume bars for instant validation of input quality.

### v1.4 Premium - Situation-Aware Intelligence (Current)
- **Speaker Diarization UI:** Visual tags to distinguish multiple voices in group settings or dining environments.
- **Situation Preset Modes:** Dynamic adjustment for 🏠 Quiet, 🌊 Normal, and ☕ Noisy environments.
- **Universal Accessibility:** Real-time font size control and high-contrast UI tailored for elderly usability.
- **Intelligence Integration:** Gemini 1.5 Pro-powered transcription correction, keyword extraction, and emotional insights.

---

## [KR] 핵심 제품 로직 (마케팅 및 매뉴얼용)

### 1. SNR 우선 설계 (신호 대 잡음비)
단순히 소리를 크게 키우는 것이 아니라, 배경 소음에서 말소리를 골라냅니다. `웅웅거림 제거`와 `선명도 부스팅`의 조합으로 소란스러운 장소에서도 대화를 놓치지 않게 돕습니다.

### 2. 인지 부하 감소
청각 장애인은 놓친 단어를 유추하는 데 엄청난 에너지를 소모합니다. 실시간 자막은 뇌의 '유추' 단계를 '시각적 확인'으로 전환하여 피로도를 획기적으로 낮춥니다.

### 3. 사운드 가디언 (안전 도우미)
음성 외에도 자동차 경적, 초인종 등 중요한 생활 소리를 감지하여 시각적 효과와 햅틱 진동으로 알립니다.

### 4. 청능 재활 (Auditory Rehabilitation)
단순한 도구를 넘어 고령자의 청각 피질 신경 가소성을 자극하는 Erber 4단계 기반 훈련 게임을 제공하여 노인성 난청의 가속화를 늦춥니다.

---

## [EN] Core Product Logic (For Marketing & Manuals)

### 1. SNR-First Design (Signal-to-Noise Ratio)
Echo AI focuses on "Clarity" over "Volume." By separating speech from background noise through custom filters, we ensure clear communication in any setting.

### 2. Cognitive Load Reduction
Missing words forces the brain to "guess," leading to mental fatigue. Real-time visual transcripts act as a visual anchor, allowing the brain to confirm audio segments effortlessly.

### 3. Sound Guardian (Life Safety)
Beyond speech, the "Sound Radar" monitors critical acoustic events (horns, bells) and provides haptic/visual alerts for situational awareness.

### 4. Auditory Rehabilitation
The app encourages neural plasticity through "Neuro-Rehab" games designed around Erber's 4 stages, helping users maintain their current hearing capacity longer.
