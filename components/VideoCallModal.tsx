import React, { useEffect, useState, useRef } from 'react';
import { useUI } from '../contexts/UIContext';
import { PhoneOffIcon, MicIcon, MicOffIcon, MoveIcon, MaximizeIcon, MinimizeIcon, VideoIcon as VideoOnIcon, PhoneIcon } from './Icons';
import { User, Conversation } from '../types';
import { useDataContext } from '../contexts/DataContext';

const VideoCallModal = () => {
    const { callState, callContact, callConversation, endCall, answerCall, callType } = useUI();
    const { users, currentUser } = useDataContext();
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const widgetRef = useRef<HTMLDivElement>(null);

    const isGroupCall = !!callConversation;
    const participants = isGroupCall
        ? users.filter(u => callConversation.participantIds.includes(u.id))
        : [callContact, currentUser].filter((u): u is User => !!u);
    const callTitle = isGroupCall ? callConversation.groupName : callContact?.name;
    const activeSpeaker = users.find(u => u.id === activeSpeakerId);
    
    useEffect(() => {
        if(participants.length > 0 && !activeSpeakerId) {
            const initialSpeaker = participants.find(p => p.id !== currentUser?.id) || participants[0];
            setActiveSpeakerId(initialSpeaker.id);
        }
    }, [participants, currentUser, activeSpeakerId]);

    useEffect(() => {
        let timer: number | undefined;
        if (callState === 'in-call') {
            setCallDuration(0);
            timer = window.setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else if (callState === 'calling') {
            // Simulate auto-answer for demo
            timer = window.setTimeout(() => {
                answerCall();
            }, 2000);
        }
        return () => {
            if (timer) {
                clearInterval(timer);
                clearTimeout(timer);
            }
        };
    }, [callState, answerCall]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !widgetRef.current) return;
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;
        const maxX = window.innerWidth - widgetRef.current.offsetWidth;
        const maxY = window.innerHeight - widgetRef.current.offsetHeight;
        setPosition({ x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) });
    };

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (callState === 'idle' || (!callContact && !callConversation)) return null;
    
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    const Header = ({ title }: { title?: string }) => (
         <div 
            onMouseDown={handleMouseDown}
            className={`flex items-center justify-between p-2 bg-gray-700 text-white rounded-t-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
            <div className="flex items-center gap-2">
                <MoveIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">{title}</span>
                {callState === 'in-call' && <span className="text-xs text-gray-300">{formatDuration(callDuration)}</span>}
                {callState === 'calling' && <span className="text-xs text-gray-300 animate-pulse">Aranıyor...</span>}
            </div>
            <div className="flex items-center">
                 <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-gray-600 rounded-full">
                    {isMinimized ? <MaximizeIcon className="w-4 h-4" /> : <MinimizeIcon className="w-4 h-4" />}
                </button>
                <button onClick={endCall} className="p-1 hover:bg-red-500 rounded-full ml-1">
                    <PhoneOffIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
    
    return (
        <div 
            ref={widgetRef}
            className="fixed z-[100] w-96 bg-gray-800 rounded-lg shadow-2xl border border-gray-600/50 transform transition-all duration-300 animate-fade-in"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <Header title={callTitle} />

            {!isMinimized && (
                <>
                <div className="relative h-64 bg-black flex items-center justify-center">
                    {activeSpeaker ? (
                        <>
                            {callType === 'voice' ? (
                                <div className="flex flex-col items-center text-white">
                                    <img src={activeSpeaker.profilePicture} alt={activeSpeaker.name} className="w-32 h-32 rounded-full mb-4 border-4 border-gray-600" />
                                    <p className="font-semibold">{activeSpeaker.name}</p>
                                    <p className="text-sm text-gray-300">Sesli Arama</p>
                                </div>
                            ) : (
                                <img src={activeSpeaker.profilePicture} alt={activeSpeaker.name} className="w-24 h-24 rounded-full" />
                            )}
                            <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">{activeSpeaker.name}</div>
                        </>
                    ) : (
                        <div className="text-white">Bağlanılıyor...</div>
                    )}
                    
                    {callType === 'video' && !isGroupCall && currentUser && callContact && (
                         <div className="absolute bottom-2 right-2 w-24 h-24 bg-gray-700 rounded-lg overflow-hidden shadow-lg border-2 border-gray-500 flex items-center justify-center">
                            <img src={currentUser.profilePicture} alt="Siz" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {isGroupCall && (
                    <div className="p-2 bg-gray-900 overflow-x-auto">
                        <div className="flex gap-2 justify-center">
                            {participants.map(p => (
                                <div key={p.id} className="text-center flex-shrink-0" onClick={() => setActiveSpeakerId(p.id)}>
                                    <img
                                        src={p.profilePicture}
                                        alt={p.name}
                                        className={`w-16 h-16 rounded-lg object-cover cursor-pointer border-2 ${activeSpeakerId === p.id ? 'border-primary-500' : 'border-transparent hover:border-gray-400'}`}
                                    />
                                    <p className="text-xs text-white truncate w-16 mt-1">{p.name.split(' ')[0]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex items-center justify-center space-x-4 p-3 bg-gray-700/50 rounded-b-lg">
                    <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                        aria-label={isMuted ? 'Sesi Aç' : 'Sessize Al'}
                    >
                        {isMuted ? <MicOffIcon className="w-5 h-5"/> : <MicIcon className="w-5 h-5" />}
                    </button>
                     <button onClick={endCall} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700" aria-label="Aramayı Sonlandır">
                        <PhoneOffIcon className="w-6 h-6" />
                    </button>
                </div>
                </>
            )}
        </div>
    );
};

export default VideoCallModal;