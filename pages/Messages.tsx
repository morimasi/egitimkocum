import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Message, UserRole, Poll, Conversation, ToastType } from '../types';
import { SendIcon, VideoIcon, PaperclipIcon, DocumentIcon, ReplyIcon, EmojiIcon, CheckIcon, PollIcon, XIcon, UserPlusIcon, UserGroupIcon, ArrowLeftIcon, SearchIcon, MessagesIcon, ArchiveIcon, UnarchiveIcon, PhoneIcon, EditIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import AudioRecorder from '../components/AudioRecorder';
import VideoRecorder from '../components/VideoRecorder';
import EmptyState from '../components/EmptyState';
import { useDropzone } from 'react-dropzone';


const MESSAGE_PAGE_SIZE = 20;

const PollCreationModal = ({
    isOpen,
    onClose,
    onSend,
    addToast
}: {
    isOpen: boolean;
    onClose: () => void;
    onSend: (poll: Poll) => void;
    addToast: (message: string, type: ToastType) => void;
}) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    useEffect(() => {
        if (isOpen) {
            setQuestion('');
            setOptions(['', '']);
        }
    }, [isOpen]);

    const handleSend = () => {
        if (question.trim() && options.length >= 2 && options.every(o => o.trim())) {
            onSend({ question, options: options.map(o => ({ text: o, votes: [] })) });
        } else {
            addToast("Lütfen anket sorusunu ve en az iki seçeneği doldurun.", "error");
        }
    };
    
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        } else {
            addToast("En fazla 10 seçenek ekleyebilirsiniz.", "info");
        }
    };
    
    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Anket Oluştur">
            <div className="space-y-4">
                <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Anket Sorusu" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Seçenek ${i + 1}`} className="flex-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                        {options.length > 2 && <button type="button" onClick={() => removeOption(i)} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><XIcon className="w-4 h-4" /></button>}
                    </div>
                ))}
                <button type="button" onClick={addOption} className="text-sm text-primary-600 font-semibold hover:text-primary-800">+ Seçenek Ekle</button>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button type="button" onClick={handleSend} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Gönder</button>
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
    const sender = useMemo(() => users.find(u => u.id === msg.senderId), [users, msg.senderId]);
    
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
            ? msg.readBy.length >= totalParticipants 
            : msg.readBy.length > 1; 

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
                        <img src={msg.imageUrl} alt={msg.fileName || 'image'} className="max-w-xs max-h-64 rounded-lg object-cover" loading="lazy" />
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
            className={`flex items-end gap-2.5 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
        >
            {!isOwnMessage && sender && (
                <img src={sender.profilePicture} alt={sender.name} className="w-8 h-8 rounded-full flex-shrink-0" loading="lazy" />
            )}
            <div className={`flex flex-col w-full max-w-xs sm:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                 <div 
                    className="relative group"
                    onClick={() => {
                        if (msg.type !== 'announcement') {
                            setShowToolbar(prev => !prev);
                            if (showToolbar) setShowReactionPicker(false);
                        }
                    }}
                >
                    <div className={`rounded-2xl px-3 py-2 relative ${msg.type === 'announcement' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 w-full' : (isOwnMessage ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-lg')}`}>
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
                                    <div key={emoji} className="bg-white dark:bg-gray-600 px-1.5 py-0.5 rounded-full text-xs flex items-center shadow">
                                        <span>{emoji}</span>
                                        <span className="ml-1 font-semibold">{userIds.length}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className={`absolute top-1/2 -translate-y-1/2 flex items-center bg-gray-100 dark:bg-gray-900 rounded-full shadow-md transition-opacity duration-200 ${isOwnMessage ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} ${showToolbar || showReactionPicker ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'}`}>
                        {showReactionPicker && <ReactionPicker onSelect={handleReactionSelect} onClose={() => setShowReactionPicker(false)} />}
                        <button onClick={(e) => { e.stopPropagation(); setShowReactionPicker(p => !p); }} className="p-1.5 text-gray-500 hover:text-primary-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><EmojiIcon className="w-5 h-5"/></button>
                        <button onClick={(e) => { e.stopPropagation(); onReply(msg); }} className="p-1.5 text-gray-500 hover:text-primary-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ReplyIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className={`flex items-center gap-1 text-xs mt-1.5 ${isOwnMessage ? 'self-end' : 'self-start'}`}>
                    <span className="text-gray-400">{new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    {isOwnMessage && <ReadReceipt />}
                </div>
            </div>
        </div>
    );
};
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
                            <img src={member.profilePicture} alt={member.name} className="w-8 h-8 rounded-full" loading="lazy" />
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
                            <img src={student.profilePicture} alt={student.name} className="w-8 h-8 rounded-full mx-3" loading="lazy" />
                            <span className="font-medium">{student.name}</span>
                        </label>
                    </li>
                ))}
            </ul>
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button onClick={() => { onAddUsers(selected); onClose(); }} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Ekle</button>
            </div>
        </Modal>
    );
};

const NewChatModal = ({ isOpen, onClose, onChatCreated }: { isOpen: boolean; onClose: () => void; onChatCreated: (conversationId: string) => void; }) => {
    const { students, users, currentUser, findOrCreateConversation, startGroupChat } = useDataContext();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [groupType, setGroupType] = useState<'student' | 'teacher'>('student');

    const handleToggleUser = (id: string) => {
        setSelectedUserIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    };

    const availableUsersForChat = useMemo(() => {
        if (groupType === 'student') {
            return students;
        } else {
            return users.filter(u =>
                (u.role === UserRole.Coach || u.role === UserRole.SuperAdmin) &&
                u.id !== currentUser!.id
            );
        }
    }, [groupType, students, users, currentUser]);

    const handleStartChat = async () => {
        if (selectedUserIds.length === 0) return;
        let convId;
        if (selectedUserIds.length === 1) {
            convId = await findOrCreateConversation(selectedUserIds[0]);
        } else {
            if (!groupName.trim()) {
                alert("Lütfen grup için bir ad girin.");
                return;
            }
            convId = await startGroupChat(selectedUserIds, groupName);
        }
        if (convId) onChatCreated(convId);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Yeni Sohbet Başlat">
            <div className="flex gap-4 mb-4 border-b dark:border-gray-600 pb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="groupType" value="student" checked={groupType === 'student'} onChange={() => { setGroupType('student'); setSelectedUserIds([]); }} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                    Öğrenci Grubu
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="groupType" value="teacher" checked={groupType === 'teacher'} onChange={() => { setGroupType('teacher'); setSelectedUserIds([]); }} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                    Öğretmen Grubu
                </label>
            </div>
            {selectedUserIds.length > 1 && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Grup Adı</label>
                    <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Grubunuza bir ad verin" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
            )}
            <p className="text-sm text-gray-500 mb-2">
                 {groupType === 'student'
                    ? 'Sohbet başlatmak için bir veya daha fazla öğrenci seçin.'
                    : 'Sohbet başlatmak için bir veya daha fazla öğretmen/admin seçin.'}
            </p>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {availableUsersForChat.map(user => (
                    <li key={user.id}>
                        <label className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => handleToggleUser(user.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full mx-3" loading="lazy" />
                            <span className="font-medium">{user.name}</span>
                        </label>
                    </li>
                ))}
            </ul>
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600">İptal</button>
                <button onClick={handleStartChat} disabled={selectedUserIds.length === 0} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">Sohbeti Başlat</button>
            </div>
        </Modal>
    )
};


const MessageInput = ({ onSendMessage, replyTo, onClearReply, disabled, openFileDialog }: {
    onSendMessage: (type: Message['type'], content: any) => void;
    replyTo: Message | null;
    onClearReply: () => void;
    disabled?: boolean;
    openFileDialog: () => void;
}) => {
    const [text, setText] = useState('');
    const { addToast } = useUI();
    const { currentUser } = useDataContext();
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);

    const handleSend = () => {
        if (text.trim()) {
            onSendMessage('text', text);
            setText('');
        }
    };
    
    const handleSendAudio = (audioUrl: string) => {
        onSendMessage('audio', { audioUrl });
    };

    const handleSendVideo = (videoUrl: string | null) => {
        if(videoUrl) {
            onSendMessage('video', { videoUrl });
        }
        setIsRecordingVideo(false);
    };
    
    const handleSendPoll = (poll: Poll) => {
        onSendMessage('poll', { poll, text: poll.question });
        setIsPollModalOpen(false);
    };
    
    return (
        <div className={`bg-gray-100 dark:bg-gray-900 p-4 border-t dark:border-gray-700`}>
            {isRecordingVideo ? (
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <VideoRecorder onSave={handleSendVideo}/>
                </div>
            ) : (
                <>
                {replyTo && (
                    <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-t-lg text-sm flex justify-between items-center">
                        <div>
                            <p className="font-semibold">Yanıtlanıyor:</p>
                            <p className="truncate text-gray-600 dark:text-gray-400 max-w-xs">{replyTo.text}</p>
                        </div>
                        <button onClick={onClearReply}><XIcon className="w-4 h-4" /></button>
                    </div>
                )}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg">
                    <input
                        type="text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), handleSend()) : null}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 bg-transparent focus:outline-none"
                        disabled={disabled}
                    />
                    <button onClick={openFileDialog} disabled={disabled} className="p-2 text-gray-500 hover:text-primary-500"><PaperclipIcon className="w-5 h-5" /></button>
                    <button onClick={() => setIsRecordingVideo(true)} disabled={disabled} className="p-2 text-gray-500 hover:text-primary-500"><VideoIcon className="w-5 h-5"/></button>
                    <button onClick={handleSend} disabled={disabled || !text.trim()} className="p-2 text-primary-500 disabled:text-gray-400"><SendIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-4 mt-2 px-2">
                    <AudioRecorder onSave={handleSendAudio} />
                    {currentUser?.role !== UserRole.Student && (
                        <button onClick={() => setIsPollModalOpen(true)} disabled={disabled} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500"><PollIcon className="w-4 h-4"/>Anket</button>
                    )}
                </div>
                </>
            )}
            <PollCreationModal 
                isOpen={isPollModalOpen} 
                onClose={() => setIsPollModalOpen(false)} 
                onSend={handleSendPoll} 
                addToast={addToast}
            />
        </div>
    );
};

const ChatWindow = ({ conversation, onBack }: { conversation: Conversation; onBack: () => void; }) => {
    const { currentUser, getMessagesForConversation, sendMessage, addReaction, typingStatus, users, addUserToConversation, uploadFile } = useDataContext();
    const { startCall, addToast } = useUI();
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
    const [isAddToGroupOpen, setIsAddToGroupOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [page, setPage] = useState(1);
    const allMessages = useMemo(() => getMessagesForConversation(conversation.id), [conversation.id, getMessagesForConversation]);
    const displayedMessages = useMemo(() => allMessages.slice(-(page * MESSAGE_PAGE_SIZE)), [allMessages, page]);
    const canLoadMore = displayedMessages.length < allMessages.length;
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number | null>(null);

    useLayoutEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            // Adjust scroll for infinite loading
            if (prevScrollHeightRef.current !== null) {
                container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
                prevScrollHeightRef.current = null;
                return;
            }
    
            // Determine if auto-scroll is needed
            const lastMessage = displayedMessages[displayedMessages.length - 1];
            const isOwnMessage = lastMessage?.senderId === currentUser?.id;
            const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 150;
    
            if (isOwnMessage || isNearBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [displayedMessages, currentUser]);

    const handleLoadMore = () => {
        if (chatContainerRef.current) {
            prevScrollHeightRef.current = chatContainerRef.current.scrollHeight;
        }
        setPage(prev => prev + 1);
    };

    const handleSendMessage = useCallback((type: Message['type'], content: any) => {
        if (!currentUser) return;
        const messageData: Partial<Message> = { senderId: currentUser.id, conversationId: conversation.id, type, replyTo: replyTo?.id };
        switch (type) {
            case 'text': messageData.text = content; break;
            case 'poll': 
                messageData.poll = content.poll; 
                messageData.text = content.poll.question;
                break;
            case 'audio': messageData.audioUrl = content.audioUrl; messageData.text = "Sesli mesaj"; break;
            case 'video': messageData.videoUrl = content.videoUrl; messageData.text = "Video mesaj"; break;
            case 'file': 
                messageData.fileUrl = content.fileUrl; messageData.fileName = content.fileName; messageData.fileType = content.fileType;
                messageData.imageUrl = content.imageUrl; 
                messageData.text = content.fileName || "Ekli dosya";
                break;
        }
        sendMessage(messageData as Omit<Message, 'id'|'timestamp'|'readBy'>);
        setReplyTo(null);
    }, [currentUser, sendMessage, replyTo, conversation.id]);

    const handleFileDrop = async (files: File[]) => {
        if (!files || files.length === 0 || !currentUser) return;
        for (const file of files) {
            try {
                // FIX: Removed the second argument from the uploadFile call
                const url = await uploadFile(file);
                const messageType = file.type.startsWith('image/') ? 'file' : 'file'; 
                handleSendMessage(messageType, { fileUrl: url, fileName: file.name, fileType: file.type, imageUrl: file.type.startsWith('image/') ? url : undefined });
            } catch (error) { addToast("Dosya yüklenirken hata oluştu.", "error"); }
        }
    };

    const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop: handleFileDrop, noClick: true, noKeyboard: true });

    const handleReact = useCallback((msg: Message, emoji: string) => { addReaction(msg.id, emoji); }, [addReaction]);
    const otherUser = conversation.isGroup ? null : users.find(u => conversation.participantIds.includes(u.id) && u.id !== currentUser?.id);
    const isTyping = otherUser ? typingStatus[otherUser.id] : false;
    const isAnnouncement = conversation.id === 'conv-announcements';
    const canSend = !isAnnouncement || (currentUser && currentUser.role !== UserRole.Student);
    const isAdmin = conversation.isGroup && conversation.adminId === currentUser?.id;

    return (
        <div {...getRootProps({ className: "h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative" })}>
            <input {...getInputProps()} />
            <header className="flex items-center p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                <button onClick={onBack} className="lg:hidden mr-2 p-2 text-gray-500"><ArrowLeftIcon className="w-6 h-6" /></button>
                <img src={(conversation.isGroup ? conversation.groupImage : otherUser?.profilePicture) || undefined} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                <div className="ml-3">
                    <h2 className="font-semibold">{conversation.isGroup ? conversation.groupName : otherUser?.name}</h2>
                    {isTyping && <p className="text-xs text-green-500">yazıyor...</p>}
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {conversation.isGroup && isAdmin && (
                        <>
                        <button onClick={() => setIsAddToGroupOpen(true)} title="Gruba Ekle" className="p-2 text-gray-500 hover:text-primary-500"><UserPlusIcon className="w-5 h-5" /></button>
                        <button onClick={() => setIsGroupInfoOpen(true)} title="Grup Bilgisi" className="p-2 text-gray-500 hover:text-primary-500"><UserGroupIcon className="w-5 h-5" /></button>
                        </>
                    )}
                    <button onClick={() => startCall(otherUser || conversation, 'voice')} className="p-2 text-gray-500 hover:text-primary-500"><PhoneIcon className="w-5 h-5"/></button>
                    <button onClick={() => startCall(otherUser || conversation, 'video')} className="p-2 text-gray-500 hover:text-primary-500"><VideoIcon className="w-5 h-5"/></button>
                </div>
            </header>
            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
                 {canLoadMore && (
                    <div className="text-center mb-4">
                        <button onClick={handleLoadMore} className="text-sm font-semibold text-primary-600 hover:underline">
                            Daha Fazla Yükle
                        </button>
                    </div>
                )}
                <div className="space-y-1">
                    {displayedMessages.map(msg => (
                        <MemoizedMessageBubble 
                            key={msg.id} msg={msg} isOwnMessage={msg.senderId === currentUser?.id}
                            onReply={setReplyTo} onReact={handleReact} conversation={conversation} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            {canSend ? (
                <MessageInput onSendMessage={handleSendMessage} replyTo={replyTo} onClearReply={() => setReplyTo(null)} openFileDialog={open} />
            ) : (
                <div className="bg-gray-100 dark:bg-gray-900 p-4 text-center text-sm text-gray-500 border-t dark:border-gray-700">
                    Duyuru kanalına sadece koçlar mesaj gönderebilir.
                </div>
            )}

            {isGroupInfoOpen && <GroupInfoModal conversation={conversation} onClose={() => setIsGroupInfoOpen(false)} />}
            {isAddToGroupOpen && <AddToGroupModal conversation={conversation} onClose={() => setIsAddToGroupOpen(false)} onAddUsers={(ids) => ids.forEach(id => addUserToConversation(conversation.id, id))} />}
             {isDragActive && (
                <div className="absolute inset-0 bg-primary-500/20 backdrop-blur-sm border-4 border-dashed border-primary-500 rounded-lg flex items-center justify-center pointer-events-none z-10">
                    <p className="text-primary-800 dark:text-primary-100 font-bold text-xl">Dosyaları buraya bırakın</p>
                </div>
            )}
        </div>
    );
};

const ContactList = ({ onSelectConversation, selectedConversationId, onNewChat }: { onSelectConversation: (id: string) => void; selectedConversationId: string | null; onNewChat: () => void; }) => {
    const { currentUser, conversations, users, unreadCounts, lastMessagesMap, setConversationArchived } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const getOtherParticipant = (conv: Conversation) => {
        if (conv.isGroup) return null;
        const otherId = conv.participantIds.find(id => id !== currentUser!.id);
        return users.find(u => u.id === otherId);
    };

    const sortedConversations = useMemo(() => {
        return [...conversations]
            .filter(c => c.participantIds.includes(currentUser!.id) && (c.isArchived ?? false) === showArchived)
            .sort((a, b) => {
                if (a.id === 'conv-announcements') return -1;
                if (b.id === 'conv-announcements') return 1;

                const lastMsgA = lastMessagesMap.get(a.id);
                const lastMsgB = lastMessagesMap.get(b.id);

                if (lastMsgA && !lastMsgB) return -1;
                if (!lastMsgA && lastMsgB) return 1;
                if (!lastMsgA && !lastMsgB) return 0; 

                return new Date(lastMsgB!.timestamp).getTime() - new Date(lastMsgA!.timestamp).getTime();
            });
    }, [conversations, currentUser, lastMessagesMap, showArchived]);
    
    const filteredConversations = useMemo(() => {
        if (!searchTerm) return sortedConversations;
        return sortedConversations.filter(c => {
            if (c.isGroup) {
                return c.groupName?.toLowerCase().includes(searchTerm.toLowerCase());
            }
            const otherUser = getOtherParticipant(c);
            return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [sortedConversations, searchTerm]);

    const canCreateChat = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800">
            <div className="p-4 border-b dark:border-gray-700 space-y-3">
                 <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <input type="text" placeholder="Sohbet ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-900 rounded-full py-2 pl-10 pr-4 focus:outline-none" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                     {canCreateChat && (
                        <button onClick={onNewChat} title="Yeni Mesaj" className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900">
                            <EditIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="text-center">
                    <button onClick={() => setShowArchived(!showArchived)} className="text-sm font-medium text-primary-600 hover:underline">
                        {showArchived ? 'Aktif Sohbetleri Göster' : 'Arşivlenmiş Sohbetler'}
                    </button>
                </div>
            </div>
            <ul className="overflow-y-auto flex-1">
                {filteredConversations.map(conv => {
                    const otherUser = getOtherParticipant(conv);
                    const title = conv.isGroup ? conv.groupName : otherUser?.name;
                    const profilePic = conv.isGroup ? conv.groupImage : otherUser?.profilePicture;
                    const unreadCount = unreadCounts.get(conv.id) || 0;
                    const lastMessage = lastMessagesMap.get(conv.id);

                    if (!title) return null;

                    return (
                        <li key={conv.id} onClick={() => onSelectConversation(conv.id)} className={`flex items-center p-3 cursor-pointer group relative ${selectedConversationId === conv.id ? 'bg-primary-50 dark:bg-primary-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                            <div className="relative">
                                <img src={profilePic || undefined} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                                {!conv.isGroup && otherUser && (
                                    <span className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800 ${otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} title={otherUser.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}></span>
                                )}
                                {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>}
                            </div>
                            <div className="flex-1 ml-3 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold truncate">{title}</p>
                                    {lastMessage && <p className="text-xs text-gray-400 flex-shrink-0">{new Date(lastMessage.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>}
                                </div>
                                <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-gray-700 dark:text-gray-200' : 'text-gray-500'}`}>{lastMessage?.text || 'Sohbeti başlatın...'}</p>
                            </div>
                             <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {showArchived ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConversationArchived(conv.id, false); }}
                                        title="Arşivden Çıkar"
                                        className="p-2 text-gray-500 hover:text-primary-500 rounded-full bg-gray-100 dark:bg-gray-600"
                                    >
                                        <UnarchiveIcon className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConversationArchived(conv.id, true); }}
                                        title="Arşivle"
                                        disabled={unreadCount > 0}
                                        className="p-2 text-gray-500 hover:text-primary-500 rounded-full bg-gray-100 dark:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ArchiveIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
};

export default function Messages() {
    const { conversations, currentUser, markMessagesAsRead } = useDataContext();
    const { initialFilters, setInitialFilters } = useUI();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialFilters.conversationId || null);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

     useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (initialFilters.conversationId) {
            setSelectedConversationId(initialFilters.conversationId);
            setInitialFilters({});
        }
    }, [initialFilters, setInitialFilters]);

    useEffect(() => {
        if (selectedConversationId) {
            markMessagesAsRead(selectedConversationId);
        }
    }, [selectedConversationId, markMessagesAsRead]);
    
    const selectedConversation = useMemo(() => 
        conversations.find(c => c.id === selectedConversationId), 
        [conversations, selectedConversationId]
    );

    // New state for animation handling
    const [renderedConversation, setRenderedConversation] = useState(selectedConversation);

    useEffect(() => {
        if (selectedConversation) {
            setRenderedConversation(selectedConversation);
        } else {
            // Wait for the slide-out animation to finish before removing the component from the DOM
            const timer = setTimeout(() => {
                setRenderedConversation(undefined);
            }, 300); // This duration should match the transition duration
            return () => clearTimeout(timer);
        }
    }, [selectedConversation]);

    const handleSelectConversation = useCallback((id: string) => {
        setSelectedConversationId(id);
    }, []);

    const handleBack = () => {
        setSelectedConversationId(null);
    };
    
    return (
        <div className="relative h-[calc(100vh-128px)] lg:h-[calc(100vh-96px)] bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden lg:flex">
            {/* Contact List Wrapper */}
            <div className={`
                w-full lg:w-1/3 xl:w-1/4 border-r dark:border-gray-700
                transition-transform duration-300 ease-in-out
                ${isMobileView ? 'absolute top-0 left-0 h-full w-full z-10' : 'lg:relative lg:flex-shrink-0'}
                ${isMobileView && selectedConversation ? '-translate-x-full' : 'translate-x-0'}
            `}>
                <ContactList 
                    selectedConversationId={selectedConversationId} 
                    onSelectConversation={handleSelectConversation}
                    onNewChat={() => setIsNewChatModalOpen(true)}
                />
            </div>

            {/* Chat Window Wrapper */}
            <div className={`
                w-full lg:w-2/3 xl:w-3/4
                transition-transform duration-300 ease-in-out
                ${isMobileView ? 'absolute top-0 left-0 h-full w-full' : 'relative'}
                ${isMobileView && !selectedConversation ? 'translate-x-full' : 'translate-x-0'}
            `}>
                {renderedConversation ? (
                    <ChatWindow conversation={renderedConversation} onBack={handleBack}/>
                ) : (
                    <div className="h-full items-center justify-center hidden lg:flex">
                        <EmptyState 
                            icon={<MessagesIcon className="w-12 h-12" />}
                            title="Bir sohbet seçin"
                            description="Başlamak için kenar çubuğundan bir görüşme seçin veya yeni bir sohbet başlatın."
                        />
                    </div>
                )}
            </div>
            
            {isNewChatModalOpen && (
                <NewChatModal 
                    isOpen={isNewChatModalOpen} 
                    onClose={() => setIsNewChatModalOpen(false)}
                    onChatCreated={(convId) => {
                        setIsNewChatModalOpen(false);
                        handleSelectConversation(convId);
                    }}
                />
            )}
        </div>
    );
};