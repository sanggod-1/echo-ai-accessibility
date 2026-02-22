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
    const shouldBeListeningRef = useRef(false);

    // Save transcripts to local storage
    useEffect(() => {
        localStorage.setItem('echo_transcripts', JSON.stringify(finalTranscripts));
    }, [finalTranscripts]);

    const initRecognition = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log(`Recognition Started: ${language}`);
            setIsListening(true);
        };

        recognition.onend = () => {
            console.log('Recognition Ended');
            setIsListening(false);
            setInterimTranscript('');

            // Crucial: Auto-restart only if we still "should" be listening
            if (shouldBeListeningRef.current) {
                console.log('Restarting engine...');
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Restart failed, trying delayed...', e);
                    setTimeout(() => {
                        if (shouldBeListeningRef.current) {
                            try { recognition.start(); } catch (err) { console.error("Final restart fail", err); }
                        }
                    }, 1000);
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Recognition Error:', event.error);
            if (event.error === 'not-allowed') {
                shouldBeListeningRef.current = false;
            }
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    console.log('Final:', transcript);
                    const speakerId = Math.floor(Math.random() * 3) + 1;
                    setFinalTranscripts(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.text === transcript && (Date.now() - last.timestamp.getTime() < 500)) {
                            return prev;
                        }
                        return [...prev, {
                            text: transcript,
                            isFinal: true,
                            timestamp: new Date(),
                            speakerId
                        }];
                    });
                } else {
                    interim += transcript;
                }
            }
            setInterimTranscript(interim);
        };

        return recognition;
    }, [language]);

    const startListening = useCallback(() => {
        if (isListening && recognitionRef.current) return;

        shouldBeListeningRef.current = true;
        const rec = initRecognition();
        if (rec) {
            recognitionRef.current = rec;
            try {
                rec.start();
            } catch (e) {
                console.error('Start error:', e);
            }
        }
    }, [initRecognition, isListening]);

    const stopListening = useCallback(() => {
        shouldBeListeningRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
        setInterimTranscript('');
    }, []);

    useEffect(() => {
        if (shouldBeListeningRef.current) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            const timer = setTimeout(() => {
                if (shouldBeListeningRef.current) startListening();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [language]);

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
