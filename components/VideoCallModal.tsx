
import React, { useEffect, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { PhoneIcon, PhoneOffIcon, MicIcon, MicOffIcon } from './Icons';

const VideoCallModal = () => {
    const { callState, callContact, answerCall, endCall } = useUI();
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    useEffect(() => {
        let timer: number | undefined;
        if (callState === 'calling') {
            // Simulate auto-answer after 3 seconds
            timer = window.setTimeout(() => {
                answerCall();
            }, 3000);
        } else if (callState === 'in-call') {
            setCallDuration(0);
            timer = window.setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (timer) {
                if(callState === 'in-call') clearInterval(timer);
                else clearTimeout(timer);
            }
        };
    }, [callState, answerCall]);

    if (callState === 'idle' || !callContact) {
        return null;
    }
    
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    const renderContent = () => {
        switch (callState) {
            case 'calling':
                return (
                    <div className="text-center">
                        <img src={callContact.profilePicture} alt={callContact.name} className="w-28 h-28 rounded-full mx-auto border-4 border-white shadow-lg" />
                        <h2 className="text-2xl font-bold mt-4 text-white">{callContact.name}</h2>
                        <p className="text-gray-300 mt-2 animate-pulse">Aranıyor...</p>
                    </div>
                );
            case 'in-call':
                return (
                     <>
                        {/* Remote Video */}
                        <div className="absolute top-4 right-4 w-1/4 h-1/4 bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-gray-500">
                             <img src={callContact.profilePicture} className="w-full h-full object-cover" alt="Remote user"/>
                             <div className="absolute bottom-1 left-2 text-xs text-white bg-black/50 px-1 rounded">{callContact.name}</div>
                        </div>
                         {/* Local Video */}
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <div className="text-center text-white">
                                <p>(Kamera görüntünüz)</p>
                                <p className="font-bold text-lg">{formatDuration(callDuration)}</p>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex flex-col justify-between items-center p-8 animate-fade-in" role="dialog" aria-modal="true">
            <div className="w-full h-full flex items-center justify-center">
                {renderContent()}
            </div>
            
            {/* Call Controls */}
            <div className="flex items-center space-x-6">
                <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-gray-800' : 'bg-gray-500/50 text-white hover:bg-gray-600/50'}`}
                    aria-label={isMuted ? 'Sesi Aç' : 'Sessize Al'}
                >
                    {isMuted ? <MicOffIcon className="w-6 h-6"/> : <MicIcon className="w-6 h-6" />}
                </button>
                 {callState === 'calling' &&
                    <button onClick={answerCall} className="p-5 rounded-full bg-green-500 text-white hover:bg-green-600 transform hover:scale-110 transition-transform" aria-label="Aramayı Cevapla">
                        <PhoneIcon className="w-8 h-8" />
                    </button>
                 }
                 <button onClick={endCall} className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transform hover:scale-110 transition-transform" aria-label="Aramayı Sonlandır">
                    <PhoneOffIcon className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

export default VideoCallModal;