

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Message, UserRole, Poll, PollOption, Conversation, ToastType } from '../types';
import { SendIcon, BellIcon, VideoIcon, MicIcon, PaperclipIcon, DocumentIcon, ReplyIcon, EmojiIcon, CheckIcon, PollIcon, XIcon, UserPlusIcon, UserGroupIcon, ArrowLeftIcon, PlusCircleIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, SearchIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import AudioRecorder from '../components/AudioRecorder';
import AnnouncementModal from '../components/AnnouncementModal';
import VideoRecorder from '../components/VideoRecorder';

const MESSAGE_PAGE_SIZE = 20;

const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-3">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

const PollCreationModal = ({ isOpen, onClose, onSend, addToast }: { isOpen: boolean; onClose: () => void; onSend: (poll: Poll) => void; addToast: (message: string, type: ToastType) => void; }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const handleSend = () => {
        if (question.trim() && options.every(o => o.trim())) {
            onSend({ question, options: options.map(o => ({ text: o, votes: [] })) });
            onClose();
            setQuestion('');
            setOptions(['', '']);
        } else {
            addToast("Lütfen anket sorusunu ve tüm seçenekleri doldurun.", "error");
        }
    };
    
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => setOptions([...options, '']);
    const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Anket Oluştur">
            <div className="space-y-4">
                <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Anket Sorusu" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Seçenek ${i + 1}`} className="flex-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                        {options.length > 2 && <button onClick={() => removeOption(i)} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><XIcon className="w-4 h-4" /></button>}
                    </div>
                ))}
                <button onClick={addOption} className="text-sm text-primary-600 font-semibold hover:text-primary-800">+ Seçenek Ekle</button>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button onClick={handleSend} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Gönder</button>
            </div>
        </Modal>
    );
};

const ReactionPicker = ({ onSelect, onClose }: { onSelect: (emoji: string) => void, onClose: () => void }) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={pickerRef} className="absolute -top-10 bg-white dark:bg-gray-700 rounded-full shadow-lg p-1 flex gap-1 animate-scale-in">
            {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-transform transform hover:scale-125">
                    {emoji}
                </button>
            ))}
        </div>
    );
};

const MessageBubble = ({ msg, isOwnMessage, onReply, onReact, conversation }: { msg: Message, isOwnMessage: boolean, onReply: (msg: Message) => void, onReact: (msg: Message, emoji: string) => void, conversation: Conversation }) => {
    const { findMessageById, voteOnPoll, currentUser, users } = useDataContext();
    const [showToolbar, setShowToolbar] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const repliedToMessage = msg.replyTo ? findMessageById(msg.replyTo) : null;
    
    if (msg.type === 'system') {
        return (
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2 italic">
                <span>{msg.text}</span>
            </div>
        );
    }
    
    const ReadReceipt = () => {
        if (!isOwnMessage || msg.type === 'announcement') return null;

        const totalParticipants = conversation.participantIds.length;
        const isRead = conversation.isGroup
            ? msg.readBy.length === totalParticipants // For groups, read if everyone read it
            : msg.readBy.length > 1; // For 1-on-1, read if the other person read it

        const tooltipText = conversation.isGroup
            ? isRead ? "Herkes tarafından okundu" : "İletildi"
            : isRead ? "Okundu" : "İletildi";

        return (
             <div title={tooltipText} className={`relative w-4 h-4 ${isRead ? 'text-blue-400' : 'text-gray-400'}`}>
                <CheckIcon className="w-4 h-4 absolute" style={{ left: '2px' }}/>
                <CheckIcon className="w-4 h-4" />
            </div>
        );
    };

    const handleReactionSelect = (emoji: string) => {
        onReact(msg, emoji);
        setShowReactionPicker(false);
    };
    
    const senderName = users.find(u => u.id === repliedToMessage?.senderId)?.name || '...';
    
    const renderMessageContent = () => {
        switch (msg.type) {
            case 'video':
                return <div className="w-64"><VideoRecorder initialVideo={msg.videoUrl} readOnly /></div>;
            case 'audio':
                return <div className="w-64"><AudioRecorder initialAudio={msg.audioUrl} readOnly /></div>;
            case 'file':
                return msg.imageUrl ? (
                    <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                        <img src={msg.imageUrl} alt={msg.fileName} className="max-w-xs max-h-64 rounded-lg object-cover" />
                    </a>
                ) : (
                    <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-2 underline hover:no-underline"><DocumentIcon className="w-6 h-6 flex-shrink-0" /><span>{msg.fileName}</span></a>
                );
            case 'poll':
                if (!msg.poll) return null;
                return (
                    <div>
                        <p className="font-bold mb-2">{msg.poll.question}</p>
                        <div className="space-y-2">
                            {msg.poll.options.map((opt, i) => {
                                const totalVotes = msg.poll!.options.reduce((acc, o) => acc + o.votes.length, 0);
                                const percentage = totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0;
                                const hasVoted = opt.votes.includes(currentUser!.id);

                                return (
                                    <div key={i} onClick={() => voteOnPoll(msg.id, i)} className="w-full text-left p-2 border rounded-md relative overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-600">
                                        <div className="absolute top-0 left-0 h-full bg-primary-200 dark:bg-primary-800 transition-all duration-300" style={{width: `${percentage}%`}}></div>
                                        <div className="relative z-10 flex justify-between items-center">
                                            <span className={`font-medium ${hasVoted ? 'text-primary-800 dark:text-primary-100' : ''}`}>{opt.text}</span>
                                            <span className={`text-sm font-semibold ${hasVoted ? 'text-primary-800 dark:text-primary-100' : 'text-gray-500'}`}>{opt.votes.length} oy</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                );
            default:
                return <p className="whitespace-pre-wrap">{msg.text}</p>;
        }
    };

    return (
        <div 
            className={`flex items-end gap-2 group ${isOwnMessage ? 'flex-row-reverse' : ''}`}
            onMouseEnter={() => setShowToolbar(true)}
            onMouseLeave={() => {setShowToolbar(false); setShowReactionPicker(false)}}
        >
            <div className="relative">
                <div className={`rounded-lg p-3 max-w-lg relative ${msg.type === 'announcement' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 w-full' : (isOwnMessage ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none')}`}>
                    {repliedToMessage && (
                        <div className="border-l-2 border-primary-300 dark:border-primary-500 pl-2 opacity-80 mb-2">
                             <p className="text-xs font-semibold">{senderName}</p>
                            <p className="text-xs truncate">{repliedToMessage.text}</p>
                        </div>
                    )}
                    
                    {msg.type === 'announcement' && <strong className="font-bold block mb-1">📢 Duyuru</strong>}
                    
                    {renderMessageContent()}
                    
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="absolute -bottom-4 right-2 flex gap-1">
                            {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                <div key={emoji} className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full text-xs flex items-center shadow">
                                    <span>{emoji}</span>
                                    <span className="ml-1 font-semibold">{userIds.length}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                 {showToolbar && msg.type !== 'announcement' && (
                    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center bg-gray-100 dark:bg-gray-900 rounded-full shadow-md transition-opacity duration-200 ${isOwnMessage ? '-left-20' : '-right-20'} ${showToolbar ? 'opacity-100' : 'opacity-0'}`}>
                        {showReactionPicker && <ReactionPicker onSelect={handleReactionSelect} onClose={() => setShowReactionPicker(false)} />}
                        <button onClick={() => setShowReactionPicker(true)} className="p-1.5 text-gray-500 hover:text-primary-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><EmojiIcon className="w-5 h-5"/></button>
                        <button onClick={() => onReply(msg)} className="p-1.5 text-gray-500 hover:text-primary-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ReplyIcon className="w-5 h-5"/></button>
                    </div>
                )}
            </div>
            <div className={`flex items-center gap-1 text-xs ${isOwnMessage ? 'self-end' : 'self-start'}`}>
                {isOwnMessage && <ReadReceipt />}
                <span className="text-gray-400">{new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
});
const MemoizedMessageBubble = React.memo(MessageBubble);

const GroupInfoModal = ({ conversation, onClose }: { conversation: Conversation | null; onClose: () => void; }) => {
    const { users, currentUser, removeUserFromConversation, endConversation } = useDataContext();
    if (!conversation) return null;
    const members = users.filter(u => conversation.participantIds.includes(u.id));
    const isAdmin = conversation.adminId === currentUser?.id;
    return (
        <Modal isOpen={!!conversation} onClose={onClose} title="Grup Bilgisi">
            <h4 className="font-semibold mb-2">{conversation.groupName}</h4>
            <p className="text-sm text-gray-500 mb-4">{members.length} üye</p>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {members.map(member => (
                    <li key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center">
                            <img src={member.profilePicture} alt={member.name} className="w-8 h-8 rounded-full" />
                            <span className="ml-3 font-medium">{member.name}</span>
                        </div>
                        {isAdmin && member.id !== currentUser?.id && (
                            <button onClick={() => removeUserFromConversation(conversation.id, member.id)} className="text-xs text-red-500 hover:underline">Çıkar</button>
                        )}
                    </li>
                ))}
            </ul>
            {isAdmin && (
                <div className="mt-6 pt-4 border-t dark:border-gray-700">
                    <button onClick={() => {endConversation(conversation.id); onClose()}} className="w-full text-red-600 font-semibold py-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">Grubu Sonlandır</button>
                </div>
            )}
        </Modal>
    )
};

const AddToGroupModal = ({ conversation, onClose, onAddUsers }: { conversation: Conversation; onClose: () => void; onAddUsers: (userIds: string[]) => void; }) => {
    const { students } = useDataContext();
    const [selected, setSelected] = useState<string[]>([]);
    const unselectedStudents = students.filter(s => !conversation.participantIds.includes(s.id));
    
    const handleToggle = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Gruba Kişi Ekle">
            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {unselectedStudents.map(student => (
                    <li key={student.id}>
                        <label className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <input type="checkbox" checked={selected.includes(student.id)} onChange={() => handleToggle(student.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <img src={student.profilePicture} alt={student.name} className="w-8 h-8 rounded-full mx-3" />
                            <span className="font-medium">{student.name}</span>
                        </label>
                    </li>
                ))}
            </ul>
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button onClick={() => { onAddUsers(selected); onClose(); }} className="