import { useState, useRef, useEffect, useCallback } from 'react';
import { MicIcon, VideoIcon, StopIcon, PlayIcon, PauseIcon, XIcon } from './Icons';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { useDropzone } from 'react-dropzone';

interface VideoRecorderProps {
    onSave?: (videoUrl: string | null) => void;
    initialVideo?: string | null;
    readOnly?: boolean;
    uploadPath?: string;
}

const VideoRecorder = ({ onSave, initialVideo = null, readOnly = false, uploadPath }: VideoRecorderProps) => {
    const [status, setStatus] = useState<'idle' | 'recording' | 'preview' | 'uploading'>('idle');
    const [videoSrc, setVideoSrc] = useState<string | null>(initialVideo);
    const [isMuted, setIsMuted] = useState(true);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const { addToast } = useUI();
    const { uploadFile, currentUser } = useDataContext();

    useEffect(() => {
        // Clean up stream on unmount
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            addToast("Video kaydı bu tarayıcıda desteklenmiyor.", "error");
            return;
        }
        try {
            stopStream(); // Stop any existing stream
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true; // Mute live preview
            }
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
            chunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const videoUrl = URL.createObjectURL(blob);
                setVideoSrc(videoUrl);
                setStatus('preview');
                uploadAndSave(blob);
            };
            mediaRecorderRef.current.start();
            setStatus('recording');
        } catch (err) {
            console.error("Error starting video recording:", err);
            if (err instanceof DOMException) {
                if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    addToast("Kullanılabilir bir kamera veya mikrofon bulunamadı.", "error");
                } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    addToast("Kamera ve mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.", "error");
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    addToast("Kamera veya mikrofon donanımınız tarafından kullanılıyor olabilir.", "error");
                } else {
                    addToast(`Kamera/mikrofon başlatılırken bir hata oluştu: ${err.message}`, "error");
                }
            } else {
                addToast("Kamera/mikrofon başlatılırken bilinmeyen bir hata oluştu.", "error");
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
            stopStream();
        }
    };
    
    const uploadAndSave = async (blobOrFile: Blob | File) => {
        if (!currentUser) return;
        setStatus('uploading');
        try {
            const file = blobOrFile instanceof File ? blobOrFile : new File([blobOrFile], "video.webm", { type: "video/webm" });
            const finalUploadPath = uploadPath ? `${uploadPath}/${Date.now()}.webm` : `video-uploads/${currentUser.id}/${Date.now()}.webm`;
            const uploadedUrl = await uploadFile(file);
            onSave?.(uploadedUrl);
            setVideoSrc(uploadedUrl); // Update src to the persistent URL
            addToast("Video başarıyla yüklendi.", "success");
            setStatus('preview');
        } catch (error) {
            addToast("Video yüklenirken bir hata oluştu.", "error");
            setStatus('idle');
            setVideoSrc(null);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (!file.type.startsWith('video/')) {
                addToast("Lütfen geçerli bir video dosyası seçin.", "error");
                return;
            }
            const videoUrl = URL.createObjectURL(file);
            setVideoSrc(videoUrl);
            setStatus('preview');
            uploadAndSave(file);
        }
    }, [uploadAndSave]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        noClick: true,
        noKeyboard: true,
        accept: { 'video/*': ['.mp4', '.webm', '.mov'] }
    });

    const handleClearVideo = () => {
        setVideoSrc(null);
        setStatus('idle');
        onSave?.(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    if (readOnly) {
        if (!initialVideo) return null;
        return (
             <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                <video src={initialVideo} controls className="w-full rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div {...getRootProps()} className={`relative bg-black rounded-lg w-full aspect-video flex items-center justify-center text-gray-400 overflow-hidden ${isDragActive ? 'border-2 border-dashed border-primary-500' : ''}`}>
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted={status === 'recording' || isMuted} loop={status === 'preview'} src={status === 'recording' ? undefined : (videoSrc || undefined)}></video>
                {status === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                         <p>Video Açıklama Kaydedin veya Yükleyin</p>
                         <p className="text-xs">Dosyayı buraya sürükleyebilirsiniz.</p>
                    </div>
                )}
                {isDragActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <p className="text-white font-semibold">Videoyu bırakın</p>
                    </div>
                )}
                 {status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <p className="text-white animate-pulse">Yükleniyor...</p>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {status === 'idle' && (
                        <>
                             <button type="button" onClick={startRecording} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">
                                <VideoIcon className="w-4 h-4" /> Kaydet
                            </button>
                             <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 cursor-pointer">
                                <input {...getInputProps()} type="file" className="hidden"/> Yükle
                            </label>
                        </>
                    )}
                    {status === 'recording' && (
                        <button type="button" onClick={stopRecording} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded-md animate-pulse">
                            <StopIcon className="w-4 h-4" /> Kaydı Durdur
                        </button>
                    )}
                    {status === 'preview' && (
                        <>
                            <button type="button" onClick={() => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause()} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                                {videoRef.current?.paused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                            </button>
                            <button type="button" onClick={() => setIsMuted(m => !m)} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                                <MicIcon className={`w-4 h-4 ${isMuted ? 'text-gray-400' : ''}`} />
                            </button>
                        </>
                    )}
                </div>
                {videoSrc && status !== 'recording' && (
                    <button type="button" onClick={handleClearVideo} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                        <XIcon className="w-3 h-3"/> Videoyu Kaldır
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoRecorder;