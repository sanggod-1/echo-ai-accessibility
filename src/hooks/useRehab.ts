import { useState, useCallback } from 'react';

export const useRehab = () => {
    const [score, setScore] = useState(() => Number(localStorage.getItem('echo_rehab_score')) || 0);
    const [currentWord, setCurrentWord] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'result'>('idle');
    const [lastResult, setLastResult] = useState<{ success: boolean; word: string } | null>(null);

    const wordSets = [
        ['사과', '사자', '사탕'],
        ['바다', '파다', '타다'],
        ['가구', '카구', '타구'],
        ['나무', '나비', '나침반'],
        ['포도', '모도', '보도'],
        ['엄마', '엄니', '언니'],
        ['학교', '학구', '학기']
    ];

    const startNewRound = useCallback(() => {
        const set = wordSets[Math.floor(Math.random() * wordSets.length)];
        const target = set[Math.floor(Math.random() * set.length)];
        setCurrentWord(target);
        setOptions([...set].sort(() => Math.random() - 0.5));
        setGameStatus('playing');
        setLastResult(null);

        // Play the word
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(target);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.7; // Slightly slow to challenge discrimination
        utterance.pitch = 0.9;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
    }, []);

    const playAgain = useCallback(() => {
        if (!currentWord) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentWord);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.7;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
    }, [currentWord]);

    const checkAnswer = (answer: string) => {
        const success = answer === currentWord;
        if (success) {
            const newScore = score + 10;
            setScore(newScore);
            localStorage.setItem('echo_rehab_score', newScore.toString());
        }
        setLastResult({ success, word: currentWord });
        setGameStatus('result');
        return success;
    };

    const resetGame = () => {
        setGameStatus('idle');
        setLastResult(null);
    };

    return {
        score,
        currentWord,
        options,
        isPlaying,
        gameStatus,
        lastResult,
        startNewRound,
        playAgain,
        checkAnswer,
        resetGame
    };
};
