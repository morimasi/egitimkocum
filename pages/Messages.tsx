import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Message, UserRole, Poll, PollOption, Conversation } from '../types';
import { SendIcon, BellIcon, VideoIcon, MicIcon, PaperclipIcon, DocumentIcon, ReplyIcon, EmojiIcon, CheckIcon, PollIcon, XIcon, UserPlusIcon, UserGroupIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import AudioRecorder from '../components/AudioRecorder';


const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-3">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

const PollCreationModal = ({ isOpen, onClose, onSend }: { isOpen: boolean; onClose: () => void; onSend: (poll: Poll) => void }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const handleSend = () => {
        if (question.trim() && options.every(o => o.trim())) {
            onSend({ question, options: options.map(o => ({ text: o, votes: [] })) });
            onClose();
            setQuestion('');
            setOptions(['', '']);
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

const AnnouncementModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { currentUser, sendMessage } = useDataContext();
    const { addToast } = useUI();
    const [announcementText, setAnnouncementText] = useState('');

    const handleSendAnnouncement = () => {
        if (!announcementText.trim() || !currentUser) return;
        sendMessage({
            senderId: currentUser.id,
            conversationId: 'conv-announcements',
            text: announcementText,
            type: 'announcement',
        });
        addToast("Duyuru başarıyla gönderildi.", "success");
        setAnnouncementText('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Duyuru Yap">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">Bu mesaj tüm öğrencilerinize gönderilecektir.</p>
                <textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows={5}
                    placeholder="Duyurunuzu buraya yazın..."
                    className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                ></textarea>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button onClick={handleSendAnnouncement} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Gönder</button>
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

const MessageBubble = React.memo(({ msg, isOwnMessage, onReply, onReact, conversation }: { msg: Message, isOwnMessage: boolean, onReply: (msg: Message) => void, onReact: (msg: Message, emoji: string) => void, conversation: Conversation }) => {
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
                    {msg.type === 'audio' ? <div className="w-64"><AudioRecorder initialAudio={msg.audioUrl} readOnly /></div>
                    : msg.type === 'file' ? (
                        msg.imageUrl ? (
                            <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                                <img src={msg.imageUrl} alt={msg.fileName} className="max-w-xs max-h-64 rounded-lg object-cover" />
                            </a>
                        ) : (
                            <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-2 underline hover:no-underline"><DocumentIcon className="w-6 h-6 flex-shrink-0" /><span>{msg.fileName}</span></a>
                        )
                    )
                    : msg.type === 'poll' && msg.poll ? (
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
                    )
                    : <p className="whitespace-pre-wrap">{msg.text}</p>}
                    
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
                 {/* FIX: Removed redundant `msg.type !== 'system'` check. The component returns early for system messages, so this check is not needed. */}
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
                <button onClick={() => { onAddUsers(selected); onClose(); }} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Ekle</button>
            </div>
        </Modal>
    );
};

const ConversationListItem = React.memo(({ conv, isSelected, onSelect }: { conv: Conversation, isSelected: boolean, onSelect: (id: string) => void }) => {
    const { unreadCounts, lastMessagesMap, currentUser, users } = useDataContext();
    const unreadCount = unreadCounts.get(conv.id) || 0;
    const lastMessage = lastMessagesMap.get(conv.id);

    const getConversationDisplayInfo = (c: Conversation) => {
        if (!currentUser) return { name: '...', picture: '' };
        if (c.isGroup) {
            return { name: c.groupName || 'Grup Sohbeti', picture: c.groupImage || 'https://i.pravatar.cc/150?u=group-' + c.id };
        } else {
            const otherUserId = c.participantIds.find(id => id !== currentUser.id);
            const otherUser = users.find(u => u.id === otherUserId);
            return { name: otherUser?.name || 'Bilinmeyen Kullanıcı', picture: otherUser?.profilePicture || '' };
        }
    };

    const { name, picture } = getConversationDisplayInfo(conv);

    return (
        <div onClick={() => onSelect(conv.id)} className={`flex items-center p-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <div className="relative">
                <img src={picture} alt={name} className="w-12 h-12 rounded-full" />
                {unreadCount > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>}
            </div>
            <div className="flex-1 ml-3 overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{name}</p>
                    {lastMessage && <p className={`text-xs flex-shrink-0 ${isSelected ? 'text-primary-200' : 'text-gray-400'}`}>{new Date(lastMessage.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                <p className={`text-xs truncate ${isSelected ? 'text-primary-200' : 'text-gray-500'}`}>
                    {lastMessage ? (lastMessage.type === 'audio' ? '🎤 Sesli Mesaj' : (lastMessage.type === 'file' ? '📎 Dosya' : (lastMessage.senderId === currentUser?.id && lastMessage.type !== 'announcement' ? `Siz: ${lastMessage.text}` : lastMessage.text))) : 'Henüz mesaj yok'}
                </p>
            </div>
        </div>
    );
});


const Messages = () => {
    const { currentUser, users, conversations, getMessagesForConversation, sendMessage, markMessagesAsRead, typingStatus, addReaction, uploadFile, unreadCounts, lastMessagesMap, startGroupChat, addUserToConversation } = useDataContext();
    const { addToast, startCall, initialFilters, setInitialFilters } = useUI();
    
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialFilters.contactId || null);
    const [newMessage, setNewMessage] = useState('');
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
    const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isCoach = currentUser?.role === UserRole.Coach;
    
    const userConversations = useMemo(() => {
        if (!currentUser) return [];
        return conversations
            .filter(c => c.participantIds.includes(currentUser.id) && !c.isArchived)
            .sort((a,b) => {
                const lastMsgA = lastMessagesMap.get(a.id);
                const lastMsgB = lastMessagesMap.get(b.id);
                if (!lastMsgA) return 1;
                if (!lastMsgB) return -1;
                return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
            });
    }, [conversations, currentUser, lastMessagesMap]);

    const selectedConversation = useMemo(() => userConversations.find(c => c.id === selectedConversationId) || null, [userConversations, selectedConversationId]);

    useEffect(() => {
        if (initialFilters.contactId) {
            const conversation = userConversations.find(c => !c.isGroup && c.participantIds.includes(initialFilters.contactId!));
            if (conversation) setSelectedConversationId(conversation.id);
            setInitialFilters({});
        } else if (!selectedConversationId && userConversations.length > 0) {
            setSelectedConversationId(userConversations[0].id);
        }
    }, [userConversations, selectedConversationId, initialFilters, setInitialFilters]);
    
    useEffect(() => {
        if (selectedConversationId) {
            markMessagesAsRead(selectedConversationId);
        }
    }, [selectedConversationId, getMessagesForConversation, markMessagesAsRead]);
    
    const conversationMessages = selectedConversationId ? getMessagesForConversation(selectedConversationId) : [];
    
    useEffect(() => {
        if (!showScrollToBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversationMessages, typingStatus, showScrollToBottom]);

    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (container) {
            const isScrolledUp = container.scrollHeight - container.scrollTop > container.clientHeight + 100;
            setShowScrollToBottom(isScrolledUp);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !selectedConversationId) return;
        sendMessage({
            senderId: currentUser.id,
            conversationId: selectedConversationId,
            text: newMessage,
            type: 'text',
            replyTo: replyingTo?.id,
        });
        setNewMessage('');
        setReplyingTo(null);
    };

    const handleStartNewGroup = async (userId: string) => {
        if (!currentUser) return;
        const otherUser = users.find(u => u.id === userId);
        if (!otherUser) return;
        const groupName = `${currentUser.name}, ${otherUser.name}`;
        const newConvId = await startGroupChat([currentUser.id, userId], groupName);
        if (newConvId) setSelectedConversationId(newConvId);
    };

    const handleAddUsersToConversation = async (userIds: string[]) => {
        if (!selectedConversation) return;
        
        if (!selectedConversation.isGroup) {
            const participantIds = [...selectedConversation.participantIds, ...userIds];
            const participants = users.filter(u => participantIds.includes(u.id));
            const groupName = participants.map(p => p.name.split(' ')[0]).slice(0, 3).join(', ');
            const newConvId = await startGroupChat(participantIds, groupName);
            if (newConvId) setSelectedConversationId(newConvId);
        } else {
            for (const userId of userIds) {
                await addUserToConversation(selectedConversation.id, userId);
            }
        }
    };
    
    const getConversationDisplayInfo = (conv: Conversation) => {
        if (!currentUser) return { name: '...', picture: '' };
        if (conv.isGroup) {
            return { name: conv.groupName || 'Grup Sohbeti', picture: conv.groupImage || 'https://i.pravatar.cc/150?u=group-' + conv.id };
        } else {
            const otherUserId = conv.participantIds.find(id => id !== currentUser.id);
            const otherUser = users.find(u => u.id === otherUserId);
            return { name: otherUser?.name || 'Bilinmeyen Kullanıcı', picture: otherUser?.profilePicture || '' };
        }
    };

    if (!currentUser) return null;
    
    return (
        <>
            <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="w-full sm:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Sohbetler</h2>
                        {isCoach && <button onClick={() => setIsAnnouncementModalOpen(true)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Duyuru Yap"><BellIcon className="w-5 h-5"/></button>}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {userConversations.map(conv => (
                            <ConversationListItem
                                key={conv.id}
                                conv={conv}
                                isSelected={selectedConversationId === conv.id}
                                onSelect={setSelectedConversationId}
                            />
                        ))}
                    </div>
                </div>

                <div className="w-2/3 flex-col hidden sm:flex">
                    {selectedConversation ? (
                        <>
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center">
                                    <img src={getConversationDisplayInfo(selectedConversation).picture} alt={getConversationDisplayInfo(selectedConversation).name} className="w-10 h-10 rounded-full mr-3" />
                                    <div>
                                        <p className="font-semibold">{getConversationDisplayInfo(selectedConversation).name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedConversation.id !== 'conv-announcements' && !selectedConversation.isGroup && (
                                        <button onClick={() => {
                                            const otherUserId = selectedConversation.participantIds.find(id => id !== currentUser.id);
                                            const contact = users.find(u => u.id === otherUserId);
                                            if (contact) startCall(contact);
                                        }}
                                            className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                            title="Görüntülü Arama Başlat">
                                            <VideoIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    {isCoach && selectedConversation.id !== 'conv-announcements' && (
                                        <>
                                            <button onClick={() => setIsAddToGroupModalOpen(true)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Gruba Kişi Ekle"><UserPlusIcon className="w-5 h-5" /></button>
                                            {selectedConversation.isGroup && <button onClick={() => setIsGroupInfoModalOpen(true)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Grup Bilgisi"><UserGroupIcon className="w-5 h-5" /></button>}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 space-y-4 relative">
                                {conversationMessages.map(msg => <MessageBubble key={msg.id} msg={msg} isOwnMessage={msg.senderId === currentUser.id} onReply={setReplyingTo} onReact={(m, e) => addReaction(m.id, e)} conversation={selectedConversation} />)}
                                <div ref={messagesEndRef} />
                                {showScrollToBottom && <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} className="absolute bottom-4 right-4 bg-primary-500 text-white w-10 h-10 rounded-full shadow-lg animate-bounce">↓</button>}
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                {selectedConversation.id !== 'conv-announcements' ? (
                                    <form onSubmit={handleSendMessage} className="flex items-center">
                                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mesajınızı yazın..." className={`flex-1 p-2 border bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full`}/>
                                        <button type="submit" className="ml-2 p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600" aria-label="Gönder"><SendIcon className="w-5 h-5" /></button>
                                    </form>
                                ) : <p className="text-center text-sm text-gray-400">Duyurulara yanıt verilemez.</p>}
                            </div>
                        </>
                    ) : <div className="flex items-center justify-center h-full text-gray-500"><p>Görüntülemek için bir sohbet seçin.</p></div>}
                </div>
            </div>
            {isAnnouncementModalOpen && <AnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} />}
            {isGroupInfoModalOpen && <GroupInfoModal conversation={selectedConversation} onClose={() => setIsGroupInfoModalOpen(false)} />}
            {isAddToGroupModalOpen && selectedConversation && <AddToGroupModal conversation={selectedConversation} onClose={() => setIsAddToGroupModalOpen(false)} onAddUsers={handleAddUsersToConversation} />}
        </>
    );
};

export default Messages;