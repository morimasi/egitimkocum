import { useState, useRef, useEffect } from 'react';
import { MicIcon, PlayIcon, PauseIcon, StopIcon } from './Icons';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';

interface AudioRecorderProps {
    onSave?: (audioUrl: string) => void;
    initialAudio?: string | null;
    readOnly?: boolean;
}

const AudioRecorder = ({ onSave, initialAudio, readOnly = false }: AudioRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioURL, setAudioURL] = useState(initialAudio || '');
    const [duration, setDuration] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const { addToast } = useUI();
    const { uploadFile, currentUser } = useDataContext();

    useEffect(() => {
        setAudioURL(initialAudio || '');
    }, [initialAudio])

    useEffect(() => {
        if (audioRef.current) {
            const updateTime = () => setDuration(audioRef.current!.currentTime);
            const onEnded = () => setIsPlaying(false);
            const audioEl = audioRef.current;
            audioEl.addEventListener('timeupdate', updateTime);
            audioEl.addEventListener('ended', onEnded);
            return () => {
                audioEl?.removeEventListener('timeupdate', updateTime);
                audioEl?.removeEventListener('ended', onEnded);
            }
        }
    }, [audioURL, isPlaying]);


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                chunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                if (onSave && currentUser) {
                    setIsUploading(true);
                    try {
                        const uploadedUrl = await uploadFile(new File([blob], "audio.webm"));
                        setAudioURL(uploadedUrl);
                        onSave(uploadedUrl);
                    } catch (error) {
                        addToast("Ses kaydı yüklenirken hata oluştu.", "error");
                    } finally {
                        setIsUploading(false);
                    }
                } else {
                     const localAudioUrl = URL.createObjectURL(blob);
                     setAudioURL(localAudioUrl);
                }

                chunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setDuration(0);
            timerRef.current = window.setInterval(() => setDuration(prev => prev + 1), 1000);
        } catch (err) {
            console.error('Error starting recording:', err);
            if (err instanceof DOMException) {
                if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    addToast("Kullanılabilir bir mikrofon bulunamadı. Lütfen bir mikrofon bağlayın.", "error");
                } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    addToast("Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.", "error");
                } else {
                    addToast(`Mikrofon başlatılırken bir hata oluştu: ${err.message}`, "error");
                }
            } else {
                addToast("Mikrofon başlatılırken bilinmeyen bir hata oluştu.", "error");
            }
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const totalDuration = audioRef.current?.duration ? formatTime(audioRef.current.duration) : formatTime(duration);

    return (
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
            {!readOnly && (
                 <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-600'}`} disabled={isUploading}>
                    {isRecording ? <StopIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
                </button>
            )}

            {isUploading && <p className="text-xs text-gray-500 px-2">Yükleniyor...</p>}

            {!isUploading && audioURL && (
                <>
                    <audio ref={audioRef} src={audioURL || undefined} preload="auto" />
                    <button type="button" onClick={togglePlay} className="p-2 rounded-full bg-gray-200 dark:bg-gray-600">
                        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <div className="text-sm font-mono w-20 text-center">
                        {isPlaying ? formatTime(duration) : "0:00"} / {totalDuration}
                    </div>
                </>
            )}
             {isRecording && !audioURL && <div className="text-sm font-mono text-red-500 w-20 text-center">{formatTime(duration)}</div>}
             {!isRecording && !audioURL && !isUploading && <p className="text-xs text-gray-500 px-2">Kayıt için mikrofon simgesine tıklayın.</p>}
        </div>
    );
};

export default AudioRecorder;