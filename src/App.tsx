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
import { analyzeTranscription } from './services/geminiService';
import { useAudioEnhancement } from './hooks/useAudioEnhancement';

interface AIInsight {
  correctedText: string;
  keywords: string[];
  emotion: string;
  suggestions: string[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transcribe' | 'sound' | 'translate' | 'rehab'>('transcribe');
  const { isListening, interimTranscript, finalTranscripts, startListening, stopListening, clearHistory } = useTranscription();
  const [clarity, setClarityVal] = useState(() => Number(localStorage.getItem('echo_clarity')) || 60);
  const [mumbleRed, setMumbleRedVal] = useState(() => Number(localStorage.getItem('echo_mumble')) || 40);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('echo_font')) || 1.1); // rem
  const [situation, setSituation] = useState<'quiet' | 'normal' | 'noisy'>(() => (localStorage.getItem('echo_situation') as any) || 'normal');

  useEffect(() => {
    localStorage.setItem('echo_clarity', clarity.toString());
    localStorage.setItem('echo_mumble', mumbleRed.toString());
    localStorage.setItem('echo_font', fontSize.toString());
    localStorage.setItem('echo_situation', situation);
  }, [clarity, mumbleRed, fontSize, situation]);

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

  // Analyze with Gemini when a new final transcript is added
  useEffect(() => {
    const analyzeLatest = async () => {
      if (finalTranscripts.length > 0) {
        setIsAnalyzing(true);
        const lastText = finalTranscripts[finalTranscripts.length - 1].text;
        const result = await analyzeTranscription(lastText);
        if (result) setAiInsight(result);
        setIsAnalyzing(false);
      }
    };
    analyzeLatest();
  }, [finalTranscripts]);

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
      <header className="glass-morphism header">
        <div className="logo-section">
          <div className="logo-orb"></div>
          <h1>Echo AI <span className="version">v1.4 Premium</span></h1>
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

      <div className="content-layout">
        {/* Sidebar */}
        <nav className="sidebar glass-morphism">
          <TabButton
            active={activeTab === 'transcribe'}
            onClick={() => setActiveTab('transcribe')}
            icon={<Mic size={22} />}
            label="실시간 자막"
          />
          <TabButton
            active={activeTab === 'sound'}
            onClick={() => setActiveTab('sound')}
            icon={<ShieldAlert size={22} />}
            label="주변 소리 감지"
          />
          <TabButton
            active={activeTab === 'translate'}
            onClick={() => setActiveTab('translate')}
            icon={<Languages size={22} />}
            label="실시간 번역"
          />
          <TabButton
            active={activeTab === 'rehab'}
            onClick={() => setActiveTab('rehab')}
            icon={<Activity size={22} />}
            label="청능 재활"
          />

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
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={isListening ? { height: [10, 30 + (volume / 2), 10] } : { height: 4 }}
                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                        className="v-bar"
                        style={{ backgroundColor: volume > 50 ? '#ef4444' : 'var(--primary-color)' }}
                      />
                    ))}
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
                      width: [0, volume * 4],
                      height: [0, volume * 4],
                      opacity: [0.5, 0]
                    }}
                    transition={{ duration: 0.2 }}
                  />

                  <div className="sound-point danger" style={{ top: '20%', left: '70%' }}>
                    <ShieldAlert size={20} />
                    <span className="point-label">자동차 경적</span>
                  </div>
                  <div className="sound-point info" style={{ top: '60%', left: '30%' }}>
                    <Volume2 size={20} />
                    <span className="point-label">초인종</span>
                  </div>
                </div>

                <div className="sound-history">
                  <h3>최근 감지 기록</h3>
                  <div className="history-list">
                    <div className="history-item danger">
                      <ShieldAlert size={18} />
                      <div className="item-info">
                        <span className="name">위험 신호 감지</span>
                        <span className="detail">남동쪽 방향에서 큰 경적 소리</span>
                      </div>
                      <span className="time">14:02</span>
                    </div>
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
                      <span>오늘의 목표 달성: 60%</span>
                    </div>
                  </div>
                </div>

                <div className="rehab-grid">
                  <RehabCard
                    icon={<Volume2 />}
                    title="소리 감지 훈련"
                    desc="작은 소리나 특정 대역의 소리가 발생했을 때 반응하는 감각을 키웁니다."
                    level="초급"
                    points={120}
                  />
                  <RehabCard
                    icon={<Zap />}
                    title="어음 변별 게임"
                    desc="유사한 발음(사/차/파)을 듣고 정확하게 구분하는 능력을 훈련합니다."
                    level="중급"
                    points={350}
                  />
                  <RehabCard
                    icon={<BookOpen />}
                    title="문장 이해력"
                    desc="소음이 섞인 환경에서 문장의 전체 맥락을 파악하는 실전 훈련입니다."
                    level="고급"
                    points={0}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'translate' && (
              <motion.div
                key="translate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="placeholder-view"
              >
                <Languages size={48} className="spin-icon" />
                <h3>실시간 번역 모듈 준비 중</h3>
                <p>Gemini 1.5 Pro의 실시간 스트리밍 번역 기술을 연동하고 있습니다.</p>
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
              <div className="analysis-loading">
                <Activity size={16} className="spin-icon" />
                <span>AI가 보정 및 분석 중...</span>
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
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button className={`nav-tab ${active ? 'active' : ''}`} onClick={onClick}>
    <div className="tab-icon">{icon}</div>
    <span className="tab-label">{label}</span>
    {active && <motion.div layoutId="active-tab" className="active-indicator" />}
  </button>
);

export default App;
