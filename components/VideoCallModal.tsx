import React, { useEffect, useState, useRef } from 'react';
import { useUI } from '../contexts/UIContext';
import { PhoneOffIcon, MicIcon, MicOffIcon, MoveIcon, MaximizeIcon, MinimizeIcon, VideoIcon as VideoOnIcon } from './Icons';
import { User } from '../types';

const VideoCallModal = () => {
    const { callState, callContact, endCall, answerCall } = useUI();
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const widgetRef = useRef<HTMLDivElement>(null);

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
            }
        };
    }, [callState, answerCall]);
    

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return; // Ignore clicks on buttons
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !widgetRef.current) return;
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;
        
        // Boundary checks
        const maxX = window.innerWidth - widgetRef.current.offsetWidth;
        const maxY = window.innerHeight - widgetRef.current.offsetHeight;

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

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

    if (callState === 'idle' || !callContact) {
        return null;
    }
    
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    const Header = ({ contact }: { contact: User }) => (
         <div 
            onMouseDown={handleMouseDown}
            className={`flex items-center justify-between p-2 bg-gray-700 text-white rounded-t-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
            <div className="flex items-center gap-2">
                <MoveIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">{contact.name}</span>
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
            <Header contact={callContact} />

            {!isMinimized && (
                 <div className="relative h-64 animate-fade-in">
                    <div className="w-full h-full bg-black flex items-center justify-center">
                        <img src={callContact.profilePicture} alt={callContact.name} className="w-24 h-24 rounded-full" />
                         <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">{callContact.name}</div>
                    </div>
                    <div className="absolute bottom-2 right-2 w-24 h-24 bg-gray-700 rounded-lg overflow-hidden shadow-lg border-2 border-gray-500 flex items-center justify-center">
                        <VideoOnIcon className="w-8 h-8 text-white"/>
                    </div>
                 </div>
            )}

            {!isMinimized && (
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
            )}
        </div>
    );
};

export default VideoCallModal;