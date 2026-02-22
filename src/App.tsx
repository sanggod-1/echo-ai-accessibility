import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Settings,
  ShieldAlert,
  Languages,
  Activity,
  Info,
  Maximize2,
  Volume2,
  Trash2,
  Download,
  Zap,
  Award,
  BookOpen,
  HelpCircle,
  Smartphone,
  Type,
  Users,
  Coffee,
  Home,
  Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Types & Hooks
import { useTranscription } from './hooks/useTranscription';
import { analyzeTranscription, translateText } from './services/geminiService';
import { useAudioEnhancement } from './hooks/useAudioEnhancement';
import { useRehab } from './hooks/useRehab';
import { CURRENT_PRODUCT, PRODUCTS } from './config/productConfig';

interface AIInsight {
  correctedText: string;
  keywords: string[];
  emotion: string;
  suggestions: string[];
}

const App: React.FC = () => {
  const activeProduct = PRODUCTS[CURRENT_PRODUCT];
  const [activeTab, setActiveTab] = useState<'transcribe' | 'sound' | 'translate' | 'rehab'>(
    activeProduct.allowedTabs[0] as any
  );
  const [sourceLang, setSourceLang] = useState('ko-KR');
  const { isListening, interimTranscript, finalTranscripts, startListening, stopListening, clearHistory: baseClearHistory } = useTranscription(sourceLang);

  const clearHistory = () => {
    baseClearHistory();
    processedIndexRef.current = -1;
  };
  const [clarity, setClarityVal] = useState(() => Number(localStorage.getItem('echo_clarity')) || 60);
  const [mumbleRed, setMumbleRedVal] = useState(() => Number(localStorage.getItem('echo_mumble')) || 40);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('echo_font')) || 1.1); // rem
  const [situation, setSituation] = useState<'quiet' | 'normal' | 'noisy'>(() => (localStorage.getItem('echo_situation') as any) || 'normal');

  // Translation State
  const [targetLang, setTargetLang] = useState('English');
  const [translationResult, setTranslationResult] = useState<{
    detectedLanguage: string;
    translatedText: string;
    pronunciation: string;
    context: string;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', activeProduct.themeColor);
    document.documentElement.style.setProperty('--primary-glow', activeProduct.themeColor + '66');

    localStorage.setItem('echo_clarity', clarity.toString());
    localStorage.setItem('echo_mumble', mumbleRed.toString());
    localStorage.setItem('echo_font', fontSize.toString());
    localStorage.setItem('echo_situation', situation);
  }, [clarity, mumbleRed, fontSize, situation]);

  // Specialized UI State
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('echo_hc') === 'true');
  const [isFlipped, setIsFlipped] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('echo_hc', isHighContrast.toString());
  }, [isHighContrast]);

  const {
    isEnabled: isBoostEnabled,
    volume,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    toggleEnhancement,
    setClarity,
    setMumbleReduction,
    setSituationMode
  } = useAudioEnhancement();

  const {
    score: rehabScore,
    options: rehabOptions,
    isPlaying: isRehabPlaying,
    gameStatus: rehabStatus,
    lastResult: rehabResult,
    startNewRound,
    playAgain: playRehabAgain,
    checkAnswer: checkRehabAnswer,
    resetGame: resetRehab
  } = useRehab();

  const [detectedSounds, setDetectedSounds] = useState<{ id: number; name: string; type: 'danger' | 'info'; time: string; pos: { x: number; y: number } }[]>([]);

  // Sound detection simulation based on volume
  useEffect(() => {
    if (activeTab === 'sound' && isBoostEnabled && volume > 65) {
      const timer = setTimeout(() => {
        const now = new Date();
        const names = volume > 80 ? ['자동차 경적', '급정거 소리', '비명/큰소리'] : ['초인종', '그릇 소리', '가전 알림'];

        const newSound = {
          id: Date.now(),
          name: names[Math.floor(Math.random() * names.length)],
          type: (volume > 80 ? 'danger' : 'info') as 'danger' | 'info',
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pos: { x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 }
        };

        setDetectedSounds(prev => {
          // Prevent duplicates in short time
          if (prev.length > 0 && (Date.now() - prev[0].id < 2000)) return prev;
          return [newSound, ...prev].slice(0, 5);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [volume, activeTab, isBoostEnabled]);

  // Haptic Feedback for Sound Guardian
  useEffect(() => {
    if (activeTab === 'sound' && volume > 70) {
      if ('vibrate' in navigator) navigator.vibrate(200);
    }
  }, [volume, activeTab]);

  const handleClarityChange = (val: number) => {
    setClarityVal(val);
    setClarity(val);
  };

  const handleMumbleChange = (val: number) => {
    setMumbleRedVal(val);
    setMumbleReduction(val);
  };

  const handleSituationChange = (mode: 'quiet' | 'normal' | 'noisy') => {
    setSituation(mode);
    setSituationMode(mode);
    // Sync sliders for visual feedback (approximate)
    if (mode === 'quiet') { handleClarityChange(30); handleMumbleChange(10); }
    if (mode === 'normal') { handleClarityChange(60); handleMumbleChange(40); }
    if (mode === 'noisy') { handleClarityChange(90); handleMumbleChange(80); }
  };

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const exportTranscripts = () => {
    const text = finalTranscripts.map(t => `[${t.timestamp.toLocaleTimeString()}] Speaker ${t.speakerId || '?'}: ${t.text}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echo_ai_transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  // Check API Key on boot
  useEffect(() => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
    console.log("Gemini API Key initialized:", API_KEY ? "Found (starts with " + API_KEY.substring(0, 5) + ")" : "MISSING");
    if (!API_KEY) {
      console.error("CRITICAL: Gemini API Key is missing! Check your .env file.");
      setApiKeyMissing(true);
    } else {
      setApiKeyMissing(false);
    }
  }, []);

  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const quotaBackoffRef = useRef(0);

  // Process transcripts with buffering to save quota
  const processedIndexRef = useRef(-1);
  const isProcessingRef = useRef(false);
  const textBufferRef = useRef("");

  useEffect(() => {
    const processQueue = async () => {
      // Circuit Breaker: If we hit quota recently, wait
      if (Date.now() < quotaBackoffRef.current) {
        setIsQuotaExceeded(true);
        return;
      }
      setIsQuotaExceeded(false);

      if (isProcessingRef.current) return;

      if (finalTranscripts.length > 0 && processedIndexRef.current < finalTranscripts.length - 1) {
        isProcessingRef.current = true;

        try {
          while (processedIndexRef.current < finalTranscripts.length - 1) {
            const nextIndex = processedIndexRef.current + 1;
            const textToProcess = finalTranscripts[nextIndex].text.trim();

            if (textToProcess) {
              textBufferRef.current += (textBufferRef.current ? " " : "") + textToProcess;

              // Buffering: wait for 15 words or a terminal punctuation
              const words = textBufferRef.current.split(" ");
              const isSentenceEnd = /[.!?]$/.test(textToProcess);
              const isLargeBuffer = words.length >= 15;

              if (isSentenceEnd || isLargeBuffer) {
                const textToTranslate = textBufferRef.current;
                textBufferRef.current = "";

                console.log(`Translating buffered [${nextIndex}]: "${textToTranslate}"`);

                setTranslationError(null);
                if (activeTab === 'translate') {
                  setIsTranslating(true);
                  let result = await translateText(textToTranslate, targetLang);

                  // Handle Quota Error (429)
                  if (result && result.error && (result.error.includes("429") || result.error.includes("quota"))) {
                    console.warn("CRITICAL QUOTA HIT - Circuit Breaker ON for 30s");
                    quotaBackoffRef.current = Date.now() + 30000; // 30s silent period
                    setIsQuotaExceeded(true);
                    setTranslationError("무료 사용량이 일시적으로 초과되었습니다. 30초 후 자동으로 재시도합니다.");
                    setIsTranslating(false);
                    break;
                  }

                  if (result && !result.error) {
                    setTranslationResult(result);
                    setIsQuotaExceeded(false);
                  } else {
                    setTranslationError(result?.error || "AI 번역 엔진 응답 오류");
                  }
                  setIsTranslating(false);
                } else if (activeTab === 'transcribe') {
                  setIsAnalyzing(true);
                  const result = await analyzeTranscription(textToTranslate);
                  if (result) setAiInsight(result);
                  setIsAnalyzing(false);
                }
              }
            }

            processedIndexRef.current = nextIndex;
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (err: any) {
          console.error("Queue Processing Error:", err);
        } finally {
          isProcessingRef.current = false;
        }
      }
    };

    // Buffer delay
    const timer = setTimeout(processQueue, 1500);
    return () => clearTimeout(timer);
  }, [finalTranscripts, activeTab, targetLang]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [finalTranscripts, interimTranscript]);

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getSpeakerColor = (id?: number) => {
    switch (id) {
      case 1: return '#3b82f6'; // Blue
      case 2: return '#10b981'; // Green
      case 3: return '#f59e0b'; // Amber
      default: return 'var(--primary-color)';
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="glass-morphism header" style={{ borderColor: activeProduct.themeColor + '33' }}>
        <div className="logo-section">
          <div className="logo-orb" style={{ background: `linear-gradient(135deg, ${activeProduct.themeColor}, #fff)` }}></div>
          <h1>{activeProduct.name} <span className="version">{activeProduct.version}</span></h1>
        </div>
        <div className="header-actions">
          <div className="situation-picker">
            <button className={situation === 'quiet' ? 'active' : ''} onClick={() => handleSituationChange('quiet')}><Home size={16} /></button>
            <button className={situation === 'normal' ? 'active' : ''} onClick={() => handleSituationChange('normal')}><Waves size={16} /></button>
            <button className={situation === 'noisy' ? 'active' : ''} onClick={() => handleSituationChange('noisy')}><Coffee size={16} /></button>
          </div>
          <button
            className={`boost-badge ${isBoostEnabled ? 'active' : ''}`}
            onClick={() => toggleEnhancement()}
          >
            <Zap size={14} fill={isBoostEnabled ? "currentColor" : "none"} />
            <span>음성 증폭 {isBoostEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <div className="status-badge">
            <Activity size={14} className="pulse-icon" />
            <span>AI 엔진 가동 중</span>
          </div>
          <button className="icon-btn" onClick={refreshDevices}><Settings size={20} /></button>
        </div>
      </header>

      <div className={`content-layout ${isHighContrast ? 'high-contrast' : ''} ${isFlipped ? 'flipped-view' : ''}`}>
        {/* Sidebar */}
        <nav className="sidebar glass-morphism">
          {activeProduct.allowedTabs.includes('transcribe') && (
            <TabButton
              active={activeTab === 'transcribe'}
              onClick={() => setActiveTab('transcribe')}
              icon={<Mic size={22} />}
              label="실시간 자막"
              color={activeProduct.themeColor}
            />
          )}
          {activeProduct.allowedTabs.includes('sound') && (
            <TabButton
              active={activeTab === 'sound'}
              onClick={() => setActiveTab('sound')}
              icon={<ShieldAlert size={22} />}
              label="주변 소리 감지"
              color={activeProduct.themeColor}
            />
          )}
          {activeProduct.allowedTabs.includes('translate') && (
            <TabButton
              active={activeTab === 'translate'}
              onClick={() => setActiveTab('translate')}
              icon={<Languages size={22} />}
              label="실시간 번역"
              color={activeProduct.themeColor}
            />
          )}
          {activeProduct.allowedTabs.includes('rehab') && (
            <TabButton
              active={activeTab === 'rehab'}
              onClick={() => setActiveTab('rehab')}
              icon={<Activity size={22} />}
              label="청능 재활"
              color={activeProduct.themeColor}
            />
          )}

          <div className="sidebar-footer">
            <div className="font-size-control">
              <Type size={16} />
              <input
                type="range"
                min="0.8" max="2.5" step="0.1"
                value={fontSize}
                onChange={(e) => setFontSize(parseFloat(e.target.value))}
              />
            </div>
            <button className="help-btn">
              <Info size={18} />
              <span>도움말</span>
            </button>
            {activeProduct.id === 'HEARING' && (
              <button
                className={`special-feature-btn ${isHighContrast ? 'active' : ''}`}
                onClick={() => setIsHighContrast(!isHighContrast)}
              >
                <Maximize2 size={18} />
                <span>고대비 모드</span>
              </button>
            )}
            {activeProduct.id === 'GLOBAL' && activeTab === 'translate' && (
              <button
                className={`special-feature-btn ${isFlipped ? 'active' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <Smartphone size={18} />
                <span>상대방 화면 반전</span>
              </button>
            )}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          <AnimatePresence mode="wait">
            {activeTab === 'transcribe' && (
              <motion.div
                key="transcribe"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="transcribe-view"
              >
                <div className="view-header">
                  <div className="view-title">
                    <h2>실시간 자막 서비스</h2>
                    <p>화자 분리(Diarization) 기술로 누가 말하는지 구분합니다.</p>
                  </div>
                  <div className="view-actions">
                    <button className="action-btn-secondary" onClick={exportTranscripts} title="기록 저장"><Download size={18} /></button>
                    <button className="action-btn-secondary" onClick={clearHistory} title="기록 삭제"><Trash2 size={18} /></button>
                    <button className="action-btn-secondary"><Maximize2 size={18} /></button>
                  </div>
                </div>

                <div className="transcription-display premium-scroll">
                  {finalTranscripts.length === 0 && !interimTranscript ? (
                    <div className="empty-state">
                      <div className="empty-icon-wrap">
                        <Mic size={48} />
                      </div>
                      <h3>대화 시작 대기 중</h3>
                      <p>하단의 마이크 버튼을 눌러 실시간 자막을 시작하세요.</p>
                    </div>
                  ) : (
                    <>
                      {finalTranscripts.map((t, idx) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={idx}
                          className="transcript-bubble user"
                          style={{ fontSize: `${fontSize}rem` }}
                        >
                          <div className="speaker-tag" style={{ color: getSpeakerColor(t.speakerId) }}>
                            <Users size={12} />
                            <span>화자 {t.speakerId || idx + 1}</span>
                          </div>
                          <div className="bubble-content">{t.text}</div>
                          <div className="bubble-meta">
                            {t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </motion.div>
                      ))}
                      {interimTranscript && (
                        <motion.div
                          className="transcript-bubble interim"
                          style={{ fontSize: `${fontSize}rem` }}
                        >
                          <div className="bubble-content">{interimTranscript}</div>
                        </motion.div>
                      )}
                    </>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="controls-footer">
                  <div className="audio-visualizer">
                    {[...Array(12)].map((_, i) => {
                      const fallback = isListening ? 10 : 0;
                      return (
                        <motion.div
                          key={i}
                          animate={isListening ? { height: [10 + fallback, 30 + (volume / 2) + fallback, 10 + fallback] } : { height: 4 }}
                          transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                          className="v-bar"
                          style={{ backgroundColor: volume > 50 ? '#ef4444' : 'var(--primary-color)' }}
                        />
                      );
                    })}
                  </div>
                  <button
                    className={`main-mic-btn ${isListening ? 'recording' : ''}`}
                    onClick={toggleRecording}
                  >
                    <Mic size={32} />
                    <div className="ripple"></div>
                  </button>
                  <div className="mic-status">
                    {isListening ? '듣는 중...' : '마이크 꺼짐'}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'sound' && (
              <motion.div
                key="sound"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="sound-view"
              >
                <div className="view-header">
                  <div className="view-title">
                    <h2>주변 소리 감지 (Sound Guardian)</h2>
                    <p>실시간으로 주변 소리의 크기와 위험 신호를 포착합니다.</p>
                  </div>
                </div>

                <div className="radar-container glass-morphism">
                  <div className="radar-circle outer"></div>
                  <div className="radar-circle middle"></div>
                  <div className="radar-circle inner"></div>
                  <div className="radar-sweep"></div>

                  <motion.div
                    className="radar-pulse"
                    animate={{
                      width: [0, volume * 5],
                      height: [0, volume * 5],
                      opacity: [0.6, 0]
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  {detectedSounds.map(sound => (
                    <motion.div
                      key={sound.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`sound-point ${sound.type}`}
                      style={{ top: `${sound.pos.y}%`, left: `${sound.pos.x}%` }}
                    >
                      {sound.type === 'danger' ? <ShieldAlert size={20} /> : <Volume2 size={20} />}
                      <span className="point-label">{sound.name}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="sound-history">
                  <h3>최근 감지 기록</h3>
                  <div className="history-list premium-scroll" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detectedSounds.length === 0 ? (
                      <div className="empty-history">감지된 소음이 없습니다. (음성 증폭기를 켜주세요)</div>
                    ) : (
                      detectedSounds.map(sound => (
                        <motion.div
                          key={sound.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`history-item ${sound.type}`}
                        >
                          {sound.type === 'danger' ? <ShieldAlert size={18} /> : <Volume2 size={18} />}
                          <div className="item-info">
                            <span className="name">{sound.name} {sound.type === 'danger' && '(위험)'}</span>
                            <span className="detail">{sound.type === 'danger' ? '집중이 필요한 큰 소리입니다.' : '생활 반경 내 소음입니다.'}</span>
                          </div>
                          <span className="time">{sound.time}</span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'rehab' && (
              <motion.div
                key="rehab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rehab-view"
              >
                <div className="view-header">
                  <div className="view-title">
                    <h2>청능 재활 센터</h2>
                    <p>뇌의 청각 처리 능력을 향상시키는 맞춤형 훈련 프로그램입니다.</p>
                  </div>
                  <div className="view-actions">
                    <div className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}>
                      <Award size={14} />
                      <span>누적 포인트: {rehabScore}</span>
                    </div>
                  </div>
                </div>

                {rehabStatus === 'idle' ? (
                  <div className="rehab-grid">
                    <div onClick={startNewRound}>
                      <RehabCard
                        icon={<Zap />}
                        title="어음 변별 게임"
                        desc="유사한 발음(사/차/파)을 듣고 정확하게 구분하는 능력을 훈련합니다."
                        level="중급"
                        points={rehabScore}
                      />
                    </div>
                    <RehabCard
                      icon={<Volume2 />}
                      title="소리 감지 훈련"
                      desc="작은 소리나 특정 대역의 소리가 발생했을 때 반응하는 감각을 키웁니다."
                      level="초급"
                      points={0}
                    />
                    <RehabCard
                      icon={<BookOpen />}
                      title="문장 이해력"
                      desc="소음이 섞인 환경에서 문장의 전체 맥락을 파악하는 실전 훈련입니다."
                      level="고급"
                      points={0}
                    />
                  </div>
                ) : (
                  <div className="rehab-game-container glass-morphism">
                    <div className="game-header">
                      <button className="back-btn" onClick={resetRehab}>목록으로</button>
                      <div className="game-progress">어음 변별 게임 - 진행 중</div>
                      <div className="game-score">점수: {rehabScore}</div>
                    </div>

                    <div className="game-main">
                      <div className={`audio-play-section ${isRehabPlaying ? 'playing' : ''}`} onClick={playRehabAgain}>
                        <motion.div
                          animate={isRehabPlaying ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="audio-orb"
                        >
                          <Volume2 size={48} />
                        </motion.div>
                        <p>{isRehabPlaying ? '단어를 들려드리고 있습니다' : '다시 들으려면 클릭하세요'}</p>
                      </div>

                      {rehabStatus === 'playing' ? (
                        <div className="options-grid">
                          {rehabOptions.map((opt, i) => (
                            <button key={i} className="option-btn" onClick={() => checkRehabAnswer(opt)}>{opt}</button>
                          ))}
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`result-section ${rehabResult?.success ? 'success' : 'fail'}`}
                        >
                          <h3>{rehabResult?.success ? '정답입니다!' : '아쉽습니다...'}</h3>
                          <p>들려드린 단어는 <strong>{rehabResult?.word}</strong> 입니다.</p>
                          <button className="next-btn" onClick={startNewRound}>다음 라운드</button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'translate' && (
              <motion.div
                key="translate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="translate-view"
              >
                <div className="view-header">
                  <div className="view-title">
                    <h2>실시간 AI 번역</h2>
                    <p>상대방의 말을 즉시 다른 언어로 번역하고 발음을 안내합니다.</p>
                  </div>
                  <div className="translate-header">
                    <div className="input-lang-selector">
                      <label>내 언어 (인식):</label>
                      <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="glass-select"
                      >
                        <option value="ko-KR">한국어 (Korean)</option>
                        <option value="en-US">영어 (English)</option>
                        <option value="ja-JP">일본어 (Japanese)</option>
                        <option value="zh-CN">중국어 (Chinese)</option>
                      </select>
                    </div>
                    <div className="swap-icon">→</div>
                    <div className="lang-selector">
                      <label>상대 언어 (번역):</label>
                      <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="glass-select"
                      >
                        <option value="Auto">자동 감지 (Auto)</option>
                        <option value="Korean">한국어 (한국어)</option>
                        <option value="English">영어 (English)</option>
                        <option value="Japanese">일본어 (日本語)</option>
                        <option value="Chinese">중국어 (中文)</option>
                        <option value="Spanish">스페인어 (Español)</option>
                        <option value="French">프랑스어 (Français)</option>
                        <option value="German">독일어 (Deutsch)</option>
                        <option value="Vietnamese">베트남어 (Tiếng Việt)</option>
                        <option value="Thai">태국어 (ภาษาไทย)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="translation-container">
                  <div className="source-section premium-scroll">
                    <div className="source-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>인식된 원문</h3>
                      {translationResult && (
                        <span className="detected-badge">{translationResult.detectedLanguage}</span>
                      )}
                    </div>
                    <div className="transcript-list">
                      {finalTranscripts.slice(-3).map((t, i) => (
                        <div key={i} className="mini-bubble">{t.text}</div>
                      ))}
                      {interimTranscript && <div className="mini-bubble interim">{interimTranscript}</div>}
                    </div>
                  </div>

                  <div className="arrow-divider">
                    <Languages size={24} className={isTranslating ? 'spin-icon' : ''} />
                  </div>

                  <div className="target-section glass-morphism">
                    <div className="target-header">
                      <h3>{targetLang} 번역 결과</h3>
                      {isTranslating && <span className="translating-tag">번역 중...</span>}
                    </div>

                    {apiKeyMissing && (
                      <div className="error-banner" style={{ background: '#7f1d1d', color: '#fecaca', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '10px', border: '1px solid #991b1b' }}>
                        <strong>⚠️ API 키가 설정되지 않았습니다.</strong><br />
                        .env 파일을 확인하고 서버를 재시작해 주세요.
                      </div>
                    )}

                    {isQuotaExceeded && (
                      <div className="error-banner quota-warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '15px', border: '1px solid rgba(245, 158, 11, 0.3)', lineHeight: '1.4' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <ShieldAlert size={16} />
                          <strong>AI 사용량 초과 (일시적)</strong>
                        </div>
                        구글 AI 무료 버전의 사용량이 모두 소진되었습니다.
                        시스템부하를 방지하기 위해 <strong>30초 동안 번역이 일시 중지</strong>되며, 이후 자동으로 가동됩니다.
                      </div>
                    )}

                    {!isQuotaExceeded && translationError && (
                      <div className="error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <strong>⚠️ 번역 오류:</strong> {translationError}
                      </div>
                    )}

                    {translationResult ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="translation-result"
                      >
                        <div className="translated-text">{translationResult.translatedText}</div>
                        <div className="pronunciation">
                          <Volume2 size={16} />
                          <span>{translationResult.pronunciation}</span>
                        </div>
                        <div className="context-info">
                          <Info size={14} />
                          <span>{translationResult.context}</span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="empty-translation">
                        <p>대화를 시작하면 실시간 번역 결과가 여기에 표시됩니다.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="controls-footer">
                  <button
                    className={`main-mic-btn ${isListening ? 'recording' : ''}`}
                    onClick={toggleRecording}
                  >
                    <Mic size={32} />
                    <div className="ripple"></div>
                  </button>
                  <div className="mic-status">
                    {isListening ? '번역 엔진 대기 중...' : '마이크를 켜서 번역 시작'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Sidebar - Intelligence Panel */}
        <aside className="intelligence-panel glass-morphism">
          <div className="panel-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>대화 지능 분석</h3>
              <Activity size={16} color="var(--primary-color)" />
            </div>
            {isAnalyzing ? (
              <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={`status-dot ${isListening ? 'active pulse' : ''}`}></div>
                <span>{isListening ? `${sourceLang} 인식 중...` : '대기 중'}</span>
              </div>
            ) : aiInsight ? (
              <>
                <div className="insight-card">
                  <div className="insight-label">실시간 보정 결과</div>
                  <div className="corrected-box" style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.95rem' }}>
                    {aiInsight.correctedText}
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-label">핵심 키워드</div>
                  <div className="keyword-tags">
                    {aiInsight.keywords.map((k: string) => <span key={k} className="tag">{k}</span>)}
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-label">대화 감정</div>
                  <div className="emotion-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="emotion-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                    {aiInsight.emotion}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-panel-state">대화를 시작하면 AI 분석이 표시됩니다.</div>
            )}
          </div>

          <div className="panel-section">
            <h3>기기 최적화 및 마이크 설정</h3>
            <div className="tuning-controls">
              <div className="tuning-item">
                <div className="tuning-label">
                  <span>입력 장치 선택 (Remote Mic)</span>
                  <button onClick={refreshDevices} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.7rem' }}>새로고침</button>
                </div>
                <div className="device-selection-wrapper">
                  <select
                    className="device-select"
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px',
                      color: 'white',
                      fontSize: '0.85rem'
                    }}
                  >
                    {devices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `마이크 ${d.deviceId.slice(0, 5)}`}</option>
                    ))}
                  </select>
                  {isBoostEnabled && (
                    <div className="mini-volume-meter">
                      <div className="meter-fill" style={{
                        width: `${Math.min(100, volume * 2.5)}%`,
                        backgroundColor: volume > 50 ? '#ef4444' : 'var(--primary-color)'
                      }}></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="tuning-item">
                <div className="tuning-label">
                  <span>웅웅거림 제거 (저음)</span>
                  <span className="tuning-val">{mumbleRed}%</span>
                </div>
                <input
                  type="range"
                  className="tuning-slider"
                  min="0" max="100"
                  value={mumbleRed}
                  onChange={(e) => handleMumbleChange(Number(e.target.value))}
                />
              </div>

              <div className="tuning-item">
                <div className="tuning-label">
                  <span>말소리 선명도 (고음)</span>
                  <span className="tuning-val">{clarity}%</span>
                </div>
                <input
                  type="range"
                  className="tuning-slider"
                  min="0" max="100"
                  value={clarity}
                  onChange={(e) => handleClarityChange(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="section-header">
              <h3>하드웨어 활용 팁</h3>
              <HelpCircle size={16} color="var(--primary-color)" />
            </div>
            <div className="tips-container">
              <div className="tip-card">
                <div className="tip-icon"><Smartphone size={16} /></div>
                <div className="tip-content">
                  <strong>대안: 내 옷에 달아보세요</strong>
                  <p>상대방이 마이크를 차기 부담스러워 한다면, 아버님의 넥타이나 옷깃에 마이크를 달고 <strong>방향을 외부(상대방)</strong>로 향하게 하세요.</p>
                </div>
              </div>
              <div className="tip-card highlighted">
                <div className="tip-icon"><Users size={16} /></div>
                <div className="tip-content">
                  <strong>그룹 대화 팁</strong>
                  <p>모임에서는 스마트폰을 테이블 중앙에 두거나 컵에 꽂아 소리를 모으세요. AI가 화자를 구분하여 보여줍니다.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

interface RehabCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  level: string;
  points: number;
}

const RehabCard: React.FC<RehabCardProps> = ({ icon, title, desc, level, points }) => (
  <div className="rehab-card">
    <div className="rehab-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
    <div className="rehab-stats">
      <div className="stat-item">
        <span className="stat-label">난이도</span>
        <span className="stat-val">{level}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">누적 점수</span>
        <span className="stat-val">{points}</span>
      </div>
    </div>
    <button className="start-btn">훈련 시작</button>
  </div>
);

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label, color = 'var(--primary-color)' }) => (
  <button
    className={`nav-tab ${active ? 'active' : ''}`}
    onClick={onClick}
    style={active ? { background: `${color}1A`, color: 'white' } : {}}
  >
    <div className="tab-icon" style={active ? { color: color } : {}}>{icon}</div>
    <span className="tab-label">{label}</span>
    {active && <motion.div layoutId="active-tab" className="active-indicator" style={{ background: color, boxShadow: `2px 0 10px ${color}66` }} />}
  </button>
);

export default App;
