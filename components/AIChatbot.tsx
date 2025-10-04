import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, LiveServerMessage, Modality, Blob } from "@google/genai";
import { BotIcon, XIcon, SendIcon, MicIcon } from './Icons';
import { useDataContext } from '../contexts/DataContext';

// --- Ses işleme yardımcı fonksiyonları ---
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
// --- Bitti ---


type Message = {
    sender: 'user' | 'ai';
    text: string;
};

type Transcript = {
    sender: 'user' | 'ai' | 'error';
    text: string;
    isFinal: boolean;
}


const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'text' | 'voice'>('text');

    // Text mode state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    
    // Voice mode state
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const sessionPromise = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);

    // Common AI instance
    const ai = useRef<GoogleGenAI | null>(null);
    const { currentUser } = useDataContext();

     const initializeApi = useCallback(() => {
        if (ai.current) return;
        try {
            if (!process.env.API_KEY) {
                console.error("API_KEY environment variable not set.");
                setMessages([{ sender: 'ai', text: "Üzgünüm, API anahtarı yapılandırılmamış." }]);
                return;
            }
            ai.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (error) {
            console.error("AI could not be initialized:", error);
            setMessages([{ sender: 'ai', text: "Üzgünüm, bir sorun oluştu." }]);
        }
    }, []);

    const stopLiveSession = useCallback(async () => {
        setStatus('idle');
        if (sessionPromise.current) {
            try {
                const session = await sessionPromise.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
            sessionPromise.current = null;
        }
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        scriptProcessor.current?.disconnect();
        mediaStreamSource.current?.disconnect();
        scriptProcessor.current = null;
        mediaStreamSource.current = null;
        
        if (inputAudioContext.current?.state !== 'closed') inputAudioContext.current?.close();
        if (outputAudioContext.current?.state !== 'closed') outputAudioContext.current?.close();
    }, []);

    useEffect(() => {
        if (isOpen) {
            initializeApi();
            if (mode === 'text' && !chatRef.current) {
                if (!ai.current) return;
                chatRef.current = ai.current.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "Senin adın Mahmut Hoca. Sen bir 'Çalışma Arkadaşı'sın. Öğrencilere ödevlerinde yardımcı olan, konuları araştırmalarına destek olan, esprili ve teşvik edici bir yapay zeka asistansın. Önceki konuşmaları dikkate alarak bağlamı sürdür. Konuşma tarzın samimi ve bir öğretmen gibi yol gösterici olmalı.",
                    },
                });
                setMessages([{ sender: 'ai', text: "Selamlar! Ben çalışma arkadaşın Mahmut Hoca. Hangi konuda yardıma ihtiyacın var?" }]);
            }
        } else {
            // Cleanup on close
            stopLiveSession();
        }

        return () => {
            if (isOpen) {
                stopLiveSession();
            }
        }
    }, [isOpen, mode, initializeApi, stopLiveSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, transcripts, isLoading]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chatRef.current) return;
        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        try {
            const response = await chatRef.current.sendMessage({ message: input });
            setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'ai', text: "Üzgünüm, bir hata oluştu." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Live Session Logic ---
    const startLiveSession = async () => {
        if (!ai.current) {
            setStatus('idle');
            return;
        }
        setStatus('connecting');
        setTranscripts([]);
        
        let nextStartTime = 0;
        const sources = new Set<AudioBufferSourceNode>();

        inputAudioContext.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContext.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        sessionPromise.current = ai.current.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: async () => {
                    setStatus('listening');
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaStreamSource.current = inputAudioContext.current!.createMediaStreamSource(streamRef.current);
                    scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.current.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    mediaStreamSource.current.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(inputAudioContext.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setTranscripts(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.sender === 'user' && !last.isFinal) {
                                return [...prev.slice(0, -1), { sender: 'user', text: last.text + text, isFinal: false }];
                            }
                            return [...prev, { sender: 'user', text, isFinal: false }];
                        });
                    }
                    if (message.serverContent?.outputTranscription) {
                         setStatus('speaking');
                        const text = message.serverContent.outputTranscription.text;
                         setTranscripts(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.sender === 'ai' && !last.isFinal) {
                                return [...prev.slice(0, -1), { sender: 'ai', text: last.text + text, isFinal: false }];
                            }
                            return [...prev, { sender: 'ai', text, isFinal: false }];
                        });
                    }
                     if (message.serverContent?.turnComplete) {
                        setStatus('listening');
                        setTranscripts(prev => prev.map(t => ({ ...t, isFinal: true })));
                    }
                     const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                     if (audioData && outputAudioContext.current) {
                        nextStartTime = Math.max(nextStartTime, outputAudioContext.current.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext.current, 24000, 1);
                        const source = outputAudioContext.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.current.destination);
                        source.addEventListener('ended', () => sources.delete(source));
                        source.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        sources.add(source);
                     }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setStatus('idle');
                    setTranscripts(prev => [...prev, { sender: 'error', text: 'Bağlantı hatası. Oturum sonlandırıldı.', isFinal: true }]);
                },
                onclose: (e: CloseEvent) => {
                    setStatus('idle');
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: "Senin adın Mahmut Hoca. Sen bir 'Çalışma Arkadaşı'sın ve sesli olarak konuşuyorsun. Öğrencilere ödevlerinde yardımcı olan, konuları araştırmalarına destek olan, esprili ve teşvik edici bir yapay zeka asistansın. Önceki konuşmaları dikkate alarak bağlamı sürdür. Konuşma tarzın samimi ve bir öğretmen gibi yol gösterici olmalı.",
            }
        });
    };

    const toggleMode = () => {
        if (mode === 'text') {
            setMode('voice');
        } else {
            stopLiveSession();
            setMode('text');
        }
    };
    
    const renderVoiceUI = () => {
        const speakingClass = status === 'speaking' ? 'animate-pulse ring-2 ring-blue-500/50' : '';
        return (
            <>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {transcripts.map((t, i) => {
                        if (t.sender === 'error') {
                            return (
                                <div key={i} className="text-center text-xs text-red-500 py-2 italic">
                                    <span>{t.text}</span>
                                </div>
                            );
                        }
                        return (
                             <div key={i} className={`flex items-end gap-2.5 ${t.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                {t.sender === 'ai' ? (
                                    <BotIcon className={`w-8 h-8 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 ${speakingClass}`} />
                                ) : (
                                    currentUser && <img src={currentUser.profilePicture} alt={currentUser.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                                )}
                                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${t.sender === 'user' ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-lg'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{t.text}</p>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t dark:border-gray-700 text-center flex-shrink-0">
                    {status === 'idle' && <button onClick={startLiveSession} className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700">Oturumu Başlat</button>}
                    {status === 'connecting' && <p className="text-sm text-gray-500 animate-pulse">Bağlanılıyor...</p>}
                    {status === 'listening' && <p className="text-sm text-green-500 font-semibold animate-pulse">Dinliyorum...</p>}
                    {status === 'speaking' && <p className="text-sm text-blue-500 font-semibold animate-pulse">Konuşuyor...</p>}
                    {status !== 'idle' && <button onClick={stopLiveSession} className="mt-2 text-xs text-red-500 hover:underline">Oturumu Bitir</button>}
                </div>
            </>
        );
    }
    
    const renderTextUI = () => (
        <>
             <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.sender === 'ai' ? (
                             <BotIcon className="w-8 h-8 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"/>
                        ) : (
                            currentUser && <img src={currentUser.profilePicture} alt={currentUser.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                        )}
                        <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-lg'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2.5">
                        <BotIcon className="w-8 h-8 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"/>
                        <div className="px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-lg">
                            <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
             <div className="p-3 border-t dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' ? handleSendMessage() : null} placeholder="Bir soru sorun..." className="flex-1 bg-transparent focus:outline-none" disabled={isLoading}/>
                    <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-2 text-primary-500 disabled:text-gray-400"><SendIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-40 w-16 h-16 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-transform transform hover:scale-110"
                aria-label="AI Yardımcı'yı Aç"
            >
                <BotIcon className="w-8 h-8"/>
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 lg:bottom-28 lg:right-10 z-50 w-full max-w-sm h-[60vh] max-h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col border dark:border-gray-700 animate-fade-in-right">
                    <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center gap-2"><BotIcon className="w-6 h-6 text-primary-500"/><h3 className="font-bold text-lg">Çalışma Arkadaşım</h3></div>
                        <div className="flex items-center gap-2">
                             <button onClick={toggleMode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary-600 bg-primary-100 dark:bg-primary-900/50 rounded-full hover:bg-primary-200 dark:hover:bg-primary-900">
                                <MicIcon className="w-4 h-4" />
                                {mode === 'text' ? 'Sese Geç' : 'Metne Geç'}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    {mode === 'text' ? renderTextUI() : renderVoiceUI()}
                </div>
            )}
        </>
    );
};

export default AIChatbot;