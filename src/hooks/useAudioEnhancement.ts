import { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

export const useAudioEnhancement = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [volume, setVolume] = useState(0);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const animationRef = useRef<number | null>(null);

    const refreshDevices = async () => {
        const devs = await audioService.getDevices();
        setDevices(devs);
        // If no device selected or selected device no longer exists, use first one
        if (devs.length > 0) {
            const exists = devs.find(d => d.deviceId === selectedDeviceId);
            if (!exists || !selectedDeviceId) {
                setSelectedDeviceId(devs[0].deviceId);
            }
        }
    };

    useEffect(() => {
        const handleDeviceChange = () => {
            console.log("Audio devices changed, refreshing...");
            refreshDevices();
        };
        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

        refreshDevices();
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Selection effect: Re-init if enabled and device changes
    useEffect(() => {
        if (isEnabled && selectedDeviceId) {
            audioService.init(selectedDeviceId).then(() => {
                startVolumeMonitoring();
            });
        }
    }, [selectedDeviceId]);

    const toggleEnhancement = async () => {
        if (isEnabled) {
            audioService.stop();
            setIsEnabled(false);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            setVolume(0);
        } else {
            await audioService.init(selectedDeviceId);
            setIsEnabled(true);
            startVolumeMonitoring();
        }
    };

    const startVolumeMonitoring = () => {
        const analyser = audioService.getAnalyser();
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const update = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setVolume(average);
            animationRef.current = requestAnimationFrame(update);
        };

        update();
    };

    return {
        isEnabled,
        volume,
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        refreshDevices,
        toggleEnhancement,
        setClarity: (v: number) => audioService.setClarity(v),
        setMumbleReduction: (v: number) => audioService.setMumbleReduction(v),
        setSituationMode: (mode: 'quiet' | 'normal' | 'noisy') => audioService.setSituationMode(mode)
    };
};
