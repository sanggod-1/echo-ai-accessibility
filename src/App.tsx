import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Settings,
  ShieldAlert,
  Languages,
  Activity,
  ChevronRight,
  Info,
  Maximize2,
  Volume2,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Types
import { useTranscription } from './hooks/useTranscription';
import { analyzeTranscription } from './services/geminiService';

interface AIInsight {
  correctedText: string;
  keywords: string[];
  emotion: string;
  suggestions: string[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transcribe' | 'sound' | 'translate' | 'rehab'>('transcribe');
  const { isListening, interimTranscript, finalTranscripts, startListening, stopListening } = useTranscription();
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="glass-morphism header">
        <div className="logo-section">
          <div className="logo-orb"></div>
          <h1>Echo AI <span className="version">v1.0</span></h1>
        </div>
        <div className="header-actions">
          <div className="status-badge">
            <Activity size={14} className="pulse-icon" />
            <span>AI 엔진 가동 중</span>
          </div>
          <button className="icon-btn"><Settings size={20} /></button>
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
                    <p>상대방의 음성을 실시간으로 텍스트화하여 보여줍니다.</p>
                  </div>
                  <div className="view-actions">
                    <button className="action-btn-secondary"><History size={18} /> 기록 보기</button>
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
                        >
                          <div className="bubble-content">{t.text}</div>
                          <div className="bubble-meta">
                            {t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </motion.div>
                      ))}
                      {interimTranscript && (
                        <motion.div
                          className="transcript-bubble interim"
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
                        animate={isListening ? { height: [10, 30, 10] } : { height: 4 }}
                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                        className="v-bar"
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
                    <p>위험 신호 및 주요 환경음을 시각적으로 포착합니다.</p>
                  </div>
                </div>

                <div className="radar-container glass-morphism">
                  <div className="radar-circle outer"></div>
                  <div className="radar-circle middle"></div>
                  <div className="radar-circle inner"></div>
                  <div className="radar-sweep"></div>

                  {/* Mock Sound Detections */}
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

            {activeTab !== 'transcribe' && activeTab !== 'sound' && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="placeholder-view"
              >
                <Activity size={48} className="spin-icon" />
                <h3>모듈 개발 중</h3>
                <p>현재 {activeTab} 기능을 연동하고 있습니다.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Sidebar - Intelligence Panel */}
        <aside className="intelligence-panel glass-morphism">
          <div className="panel-section">
            <h3>대화 지능 분석</h3>
            {isAnalyzing ? (
              <div className="analysis-loading">
                <Activity size={16} className="spin-icon" />
                <span>AI가 분석 중...</span>
              </div>
            ) : aiInsight ? (
              <>
                <div className="insight-card">
                  <div className="insight-label">핵심 키워드</div>
                  <div className="keyword-tags">
                    {aiInsight.keywords.map(k => <span key={k} className="tag">{k}</span>)}
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-label">대화 감정</div>
                  <div className="emotion-value">{aiInsight.emotion}</div>
                </div>
              </>
            ) : (
              <div className="empty-panel-state">대화를 시작하면 AI 분석이 표시됩니다.</div>
            )}
          </div>

          <div className="panel-section">
            <h3>추천 답변 (빠른 응답)</h3>
            {aiInsight?.suggestions.map((s, idx) => (
              <div key={idx} className="suggestion-card">
                <p>{s}</p>
                <ChevronRight size={14} />
              </div>
            )) || (
                <div className="empty-panel-state">대화 기반 답변을 생성합니다.</div>
              )}
          </div>

          <div className="panel-section">
            <h3>보조 통계</h3>
            <div className="parameter-card">
              <div className="param-label">음성 정확도</div>
              <div className="progress-bg">
                <div className="progress-fill highlight" style={{ width: '98%' }}></div>
              </div>
              <div className="param-value text-secondary">최상 (98.2%)</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

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
