import { useState, useCallback, useRef } from 'react';

export interface TranscriptionResult {
    text: string;
    isFinal: boolean;
    timestamp: Date;
}

export const useTranscription = (language: string = 'ko-KR') => {
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [finalTranscripts, setFinalTranscripts] = useState<TranscriptionResult[]>([]);
    const recognitionRef = useRef<any>(null);

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
                    setFinalTranscripts(prev => [...prev, {
                        text,
                        isFinal: true,
                        timestamp: new Date()
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

    return {
        isListening,
        interimTranscript,
        finalTranscripts,
        startListening,
        stopListening
    };
};
