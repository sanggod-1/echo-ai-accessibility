import { useState, useCallback, useRef, useEffect } from 'react';

export interface TranscriptionResult {
    text: string;
    isFinal: boolean;
    timestamp: Date;
    speakerId?: number;
}

export const useTranscription = (language: string = 'ko-KR') => {
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [finalTranscripts, setFinalTranscripts] = useState<TranscriptionResult[]>(() => {
        const saved = localStorage.getItem('echo_transcripts');
        return saved ? JSON.parse(saved).map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })) : [];
    });
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        localStorage.setItem('echo_transcripts', JSON.stringify(finalTranscripts));
    }, [finalTranscripts]);

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다. 크롬을 사용해 주세요.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                alert('마이크 접근 권한이 필요합니다.');
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const text = event.results[i][0].transcript;
                    // Simulate Speaker ID (randomly for UI demo, in production we'd use diarization logic)
                    const speakerId = Math.floor(Math.random() * 3) + 1;
                    setFinalTranscripts(prev => [...prev, {
                        text,
                        isFinal: true,
                        timestamp: new Date(),
                        speakerId
                    }]);
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setInterimTranscript(interim);
        };

        recognition.start();
        recognitionRef.current = recognition;
    }, [language]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            setInterimTranscript('');
        }
    }, []);

    const clearHistory = useCallback(() => {
        setFinalTranscripts([]);
        localStorage.removeItem('echo_transcripts');
    }, []);

    return {
        isListening,
        interimTranscript,
        finalTranscripts,
        startListening,
        stopListening,
        clearHistory
    };
};
