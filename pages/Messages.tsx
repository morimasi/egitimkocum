import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Message, UserRole, Poll, PollOption, Conversation } from '../types';
import { SendIcon, BellIcon, VideoIcon, MicIcon, PaperclipIcon, DocumentIcon, ReplyIcon, EmojiIcon, CheckIcon, PollIcon, XIcon, UserPlusIcon, UserGroupIcon, ArrowLeftIcon, PlusCircleIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, SearchIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import AudioRecorder from '../components/AudioRecorder';
import AnnouncementModal from '../components/AnnouncementModal';
import VideoRecorder from '../components/VideoRecorder';


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

const ConversationListItem = React.memo(({ conv, isSelected, onSelect, isCollapsed }: { conv: Conversation, isSelected: boolean, onSelect: (id: string) => void, isCollapsed: boolean }) => {
    const { unreadCounts, lastMessagesMap, currentUser, users } = useDataContext();
    const unreadCount = unreadCounts.get(conv.id) || 0;
    const lastMessage = lastMessagesMap.get(conv.id);

    const getConversationDisplayInfo = useCallback((c: Conversation) => {
        if (!currentUser) return { name: '...', picture: '' };
        if (c.isGroup) {
            return { name: c.groupName || 'Grup Sohbeti', picture: c.groupImage || 'https://i.pravatar.cc/150?u=group-' + c.id };
        } else {
            const otherUserId = c.participantIds.find(id => id !== currentUser.id);
            const otherUser = users.find(u => u.id === otherUserId);
            return { name: otherUser?.name || 'Bilinmeyen Kullanıcı', picture: otherUser?.profilePicture || '' };
        }
    }, [currentUser, users]);

    const { name, picture } = getConversationDisplayInfo(conv);
    
    const lastMessageText = useMemo(() => {
        if (!lastMessage) return 'Henüz mesaj yok';

        const senderPrefix = lastMessage.senderId === currentUser?.id && lastMessage.type !== 'announcement' ? 'Siz: ' : '';
        let content = '';

        switch (lastMessage.type) {
            case 'audio': content = '🎤 Sesli Mesaj'; break;
            case 'video': content = '📹 Video Mesajı'; break;
            case 'file': content = '📎 Dosya'; break;
            default: content = lastMessage.text;
        }
        return senderPrefix + content;
    }, [lastMessage, currentUser]);


    return (
        <div onClick={() => onSelect(conv.id)} className={`flex items-center p-3 cursor-pointer transition-colors duration-200 overflow-hidden ${isSelected ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="relative flex-shrink-0">
                <img src={picture} alt={name} className="w-12 h-12 rounded-full" />
                {unreadCount > 0 && <span className={`absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 ${isSelected ? 'border-primary-500' : 'border-white dark:border-gray-800'}`}></span>}
            </div>
            <div className={`flex-1 ml-3 overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:ml-0' : 'lg:w-auto lg:opacity-100'}`}>
                <div className="flex justify-between items-center">
                    <p className={`font-semibold text-sm whitespace-nowrap ${isSelected ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{name}</p>
                    {lastMessage && <p className={`text-xs flex-shrink-0 ${isSelected ? 'text-primary-200' : 'text-gray-400'}`}>{new Date(lastMessage.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                <p className={`text-xs truncate ${isSelected ? 'text-primary-200' : 'text-gray-500'}`}>
                    {lastMessageText}
                </p>
            </div>
        </div>
    );
});

const NewMessageModal = ({ onClose, onSelectContact }: { onClose: () => void, onSelectContact: (userId: string) => void }) => {
    const { users, conversations, currentUser } = useDataContext();

    const contactsWithExistingChat = useMemo(() => {
        if (!currentUser) return new Set();
        const contactIds = new Set<string>();
        conversations
            .filter(c => !c.isGroup && c.participantIds.includes(currentUser.id))
            .forEach(c => {
                c.participantIds.forEach(id => {
                    if (id !== currentUser.id) contactIds.add(id);
                });
            });
        return contactIds;
    }, [conversations, currentUser]);

    // Determine which users to show based on the current user's role
    const [availableContacts, modalTitle, modalDescription] = useMemo(() => {
        if (!currentUser) return [[], '', ''];

        let contacts: User[] = [];
        let title = "Yeni Sohbet Başlat";
        let description = "Sohbet başlatmak için bir kişi seçin.";

        switch (currentUser.role) {
            case UserRole.Student:
                const coach = users.find(u => u.id === currentUser.assignedCoachId);
                if (coach && !contactsWithExistingChat.has(coach.id)) {
                    contacts = [coach];
                }
                title = "Koçunla Sohbet Başlat";
                description = "Koçunla yeni bir sohbet başlat.";
                break;

            case UserRole.Coach:
                contacts = users.filter(u =>
                    u.role === UserRole.Student &&
                    u.assignedCoachId === currentUser.id &&
                    !contactsWithExistingChat.has(u.id)
                );
                description = "Sohbet başlatmak için bir öğrenci seçin.";
                break;
            
            case UserRole.SuperAdmin:
                contacts = users.filter(u =>
                    u.id !== currentUser.id &&
                    !contactsWithExistingChat.has(u.id)
                );
                break;
        }
        return [contacts, title, description];
    }, [users, currentUser, contactsWithExistingChat]);
    
    return (
        <Modal isOpen={true} onClose={onClose} title={modalTitle}>
            <p className="text-sm text-gray-500 mb-4">{modalDescription}</p>
            {availableContacts.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {availableContacts.map(contact => (
                        <li key={contact.id} onClick={() => onSelectContact(contact.id)} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <img src={contact.profilePicture} alt={contact.name} className="w-10 h-10 rounded-full" />
                            <span className="ml-3 font-semibold">{contact.name}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-8">Yeni sohbet başlatılacak kimse bulunmuyor.</p>
            )}
        </Modal>
    );
};


const Messages = () => {
    const { currentUser, users, conversations, getMessagesForConversation, sendMessage, markMessagesAsRead, typingStatus, addReaction, uploadFile, lastMessagesMap, startGroupChat, findOrCreateConversation, addUserToConversation } = useDataContext();
    const { addToast, startCall, initialFilters, setInitialFilters } = useUI();
    
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialFilters.contactId || null);
    const [newMessage, setNewMessage] = useState('');
    const [conversationSearch, setConversationSearch] = useState('');
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
    const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isListCollapsed, setIsListCollapsed] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);

    const isCoach = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
                setShowAttachmentMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [attachmentMenuRef]);

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
    
    const getConversationDisplayInfo = useCallback((conv: Conversation) => {
        if (!currentUser) return { name: '...', picture: '' };
        if (conv.isGroup) {
            return { name: conv.groupName || 'Grup Sohbeti', picture: conv.groupImage || 'https://i.pravatar.cc/150?u=group-' + conv.id };
        } else {
            const otherUserId = conv.participantIds.find(id => id !== currentUser.id);
            const otherUser = users.find(u => u.id === otherUserId);
            return { name: otherUser?.name || 'Bilinmeyen Kullanıcı', picture: otherUser?.profilePicture || '' };
        }
    }, [currentUser, users]);

    const filteredConversations = useMemo(() => {
        if (!conversationSearch) return userConversations;
        return userConversations.filter(conv => {
            const { name } = getConversationDisplayInfo(conv);
            return name.toLowerCase().includes(conversationSearch.toLowerCase());
        });
    }, [userConversations, conversationSearch, getConversationDisplayInfo]);


    const selectedConversation = useMemo(() => userConversations.find(c => c.id === selectedConversationId) || null, [userConversations, selectedConversationId]);

    useEffect(() => {
        if (initialFilters.contactId) {
            const conversation = userConversations.find(c => c.id === initialFilters.contactId || (!c.isGroup && c.participantIds.includes(initialFilters.contactId!)));
            if (conversation) {
                setSelectedConversationId(conversation.id);
            }
            setInitialFilters({});
        }
    }, [userConversations, initialFilters, setInitialFilters]);
    
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
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser || !selectedConversationId) return;

        setIsUploading(true);
        try {
            const fileUrl = await uploadFile(file, `chat-files/${currentUser.id}`);
            const messageData: Partial<Message> = {
                fileUrl,
                fileName: file.name,
                fileType: file.type,
                text: `Dosya: ${file.name}`
            };

            if (file.type.startsWith('image/')) {
                messageData.imageUrl = fileUrl;
            }

            sendMessage({
                senderId: currentUser.id,
                conversationId: selectedConversationId,
                type: 'file',
                ...messageData
            } as any);
            addToast("Dosya gönderildi.", "success");
        } catch (error) {
            console.error("File upload error:", error);
            addToast("Dosya gönderilirken bir hata oluştu.", "error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleAudioSave = (audioUrl: string) => {
        if (!currentUser || !selectedConversationId || !audioUrl) return;
        sendMessage({
            senderId: currentUser.id,
            conversationId: selectedConversationId,
            type: 'audio',
            audioUrl: audioUrl,
            text: 'Sesli Mesaj'
        });
        setShowAudioRecorder(false);
    };
    
    const handleVideoSave = (videoUrl: string | null) => {
        if (!videoUrl) {
            setShowVideoRecorder(false);
            return;
        }
        if (!currentUser || !selectedConversationId) return;
        sendMessage({
            senderId: currentUser.id,
            conversationId: selectedConversationId,
            type: 'video',
            videoUrl: videoUrl,
            text: 'Video Mesajı'
        });
        setShowVideoRecorder(false);
    };

    const handleStartNewConversation = async (userId: string) => {
        const newConvId = await findOrCreateConversation(userId);
        if (newConvId) {
            setSelectedConversationId(newConvId);
        }
        setIsNewMessageModalOpen(false);
    };
    
    const handleSelectConversation = (id: string) => {
        setSelectedConversationId(id);
        if (window.innerWidth >= 1024) { // lg breakpoint
            setIsListCollapsed(true);
        }
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

    const handleNewMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as any);
        }
    };

    if (!currentUser) return null;
    
    return (
        <>
            <div className="flex h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className={`w-full border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${selectedConversationId && 'hidden'} lg:flex ${isListCollapsed ? 'lg:w-24' : 'lg:w-1/3'}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className={`text-lg font-semibold transition-opacity duration-300 whitespace-nowrap overflow-hidden ${isListCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>Sohbetler</h2>
                         <div className="flex items-center gap-1">
                            <div className={`flex items-center gap-1 transition-opacity duration-300 ${isListCollapsed ? 'lg:opacity-0 lg:w-0 lg:hidden' : 'opacity-100'}`}>
                                <button onClick={() => setIsNewMessageModalOpen(true)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Yeni Mesaj"><PlusCircleIcon className="w-5 h-5"/></button>
                                {isCoach && <button onClick={() => setIsAnnouncementModalOpen(true)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Duyuru Yap"><BellIcon className="w-5 h-5"/></button>}
                            </div>
                            <button onClick={() => setIsListCollapsed(!isListCollapsed)} className="hidden lg:block p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title={isListCollapsed ? 'Genişlet' : 'Daralt'}>
                                {isListCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                     <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className={`relative transition-all duration-300 ${isListCollapsed ? 'lg:opacity-0 lg:hidden' : ''}`}>
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-gray-400"/>
                            </div>
                            <input 
                                type="search" 
                                value={conversationSearch} 
                                onChange={e => setConversationSearch(e.target.value)} 
                                placeholder="Sohbetlerde ara..."
                                className="w-full p-2 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>
                         <div className={`text-center ${isListCollapsed ? 'hidden lg:block' : 'hidden'}`}>
                            <button className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <SearchIcon className="w-5 h-5"/>
                            </button>
                         </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.map(conv => (
                            <ConversationListItem
                                key={conv.id}
                                conv={conv}
                                isSelected={selectedConversationId === conv.id}
                                onSelect={handleSelectConversation}
                                isCollapsed={isListCollapsed}
                            />
                        ))}
                    </div>
                </div>

                <div className={`w-full flex flex-col flex-1 ${selectedConversationId ? 'flex' : 'hidden lg:flex'}`}>
                    {selectedConversation ? (
                        <>
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center">
                                    <button onClick={() => setSelectedConversationId(null)} className="lg:hidden mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ArrowLeftIcon className="w-5 h-5" />
                                    </button>
                                    <img src={getConversationDisplayInfo(selectedConversation).picture} alt={getConversationDisplayInfo(selectedConversation).name} className="w-10 h-10 rounded-full mr-3" />
                                    <div>
                                        <p className="font-semibold">{getConversationDisplayInfo(selectedConversation).name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedConversation.id !== 'conv-announcements' && (
                                        <button 
                                            onClick={() => {
                                                if (selectedConversation.isGroup) {
                                                    startCall(selectedConversation);
                                                } else {
                                                    const otherUserId = selectedConversation.participantIds.find(id => id !== currentUser.id);
                                                    const contact = users.find(u => u.id === otherUserId);
                                                    if (contact) startCall(contact);
                                                }
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
                                {replyingTo && (
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-t-lg flex justify-between items-center text-sm mb-2">
                                        <div>
                                            <p className="font-semibold text-primary-500">Yanıtlanıyor:</p>
                                            <p className="text-gray-600 dark:text-gray-300 truncate">{replyingTo.text}</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><XIcon className="w-4 h-4" /></button>
                                    </div>
                                )}
                                {isUploading && <div className="text-center text-sm text-gray-500 p-2">Dosya yükleniyor...</div>}
                                {selectedConversation.id !== 'conv-announcements' ? (
                                    showAudioRecorder ? (
                                        <div className="flex items-center justify-center gap-4">
                                            <AudioRecorder onSave={handleAudioSave} />
                                            <button onClick={() => setShowAudioRecorder(false)} className="text-sm text-red-500 hover:underline">İptal</button>
                                        </div>
                                    ) : showVideoRecorder ? (
                                        <div>
                                            <VideoRecorder onSave={handleVideoSave} />
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                            <div className="relative" ref={attachmentMenuRef}>
                                                <button type="button" onClick={() => setShowAttachmentMenu(s => !s)} className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0 transition-transform transform hover:scale-110" title="Ek Ekle">
                                                    <PlusCircleIcon className="w-6 h-6"/>
                                                </button>
                                                {showAttachmentMenu && (
                                                    <div className="absolute bottom-full mb-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl p-2 flex flex-col gap-1 border dark:border-gray-600 animate-fade-in">
                                                        <button type="button" onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left text-sm">
                                                            <PaperclipIcon className="w-5 h-5 text-gray-500" /><span>Dosya</span>
                                                        </button>
                                                        <button type="button" onClick={() => { setShowVideoRecorder(true); setShowAttachmentMenu(false); }} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left text-sm">
                                                            <VideoIcon className="w-5 h-5 text-gray-500" /><span>Video Mesajı</span>
                                                        </button>
                                                        <button type="button" onClick={() => { setIsPollModalOpen(true); setShowAttachmentMenu(false); }} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left text-sm">
                                                            <PollIcon className="w-5 h-5 text-gray-500" /><span>Anket</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                            <textarea
                                                ref={textareaRef}
                                                rows={1}
                                                value={newMessage}
                                                onChange={handleNewMessageChange}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Mesajınızı yazın..."
                                                className="flex-1 px-4 py-2.5 border bg-gray-100 dark:bg-gray-700 dark:border-gray-600 rounded-2xl resize-none max-h-32 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                            <button 
                                                type={newMessage.trim() ? 'submit' : 'button'}
                                                onClick={!newMessage.trim() ? () => setShowAudioRecorder(true) : undefined}
                                                className="p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600 shrink-0 transition-transform transform hover:scale-110"
                                                aria-label={newMessage.trim() ? 'Gönder' : 'Sesli Mesaj Kaydet'}
                                            >
                                                {newMessage.trim() ? <SendIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                                            </button>
                                        </form>
                                    )
                                ) : <p className="text-center text-sm text-gray-400">Duyurulara yanıt verilemez.</p>}
                            </div>
                        </>
                    ) : <div className="hidden lg:flex items-center justify-center h-full text-gray-500"><p>Görüntülemek için bir sohbet seçin.</p></div>}
                </div>
            </div>
            {isAnnouncementModalOpen && <AnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} />}
            {isNewMessageModalOpen && <NewMessageModal onClose={() => setIsNewMessageModalOpen(false)} onSelectContact={handleStartNewConversation} />}
            {isGroupInfoModalOpen && <GroupInfoModal conversation={selectedConversation} onClose={() => setIsGroupInfoModalOpen(false)} />}
            {isAddToGroupModalOpen && selectedConversation && <AddToGroupModal conversation={selectedConversation} onClose={() => setIsAddToGroupModalOpen(false)} onAddUsers={handleAddUsersToConversation} />}
             {isPollModalOpen && selectedConversationId && (
                <PollCreationModal
                    isOpen={isPollModalOpen}
                    onClose={() => setIsPollModalOpen(false)}
                    onSend={(poll) => {
                        if (currentUser) {
                            sendMessage({
                                senderId: currentUser.id,
                                conversationId: selectedConversationId,
                                text: 'Anket: ' + poll.question,
                                type: 'poll',
                                poll: poll
                            });
                        }
                    }}
                />
            )}
        </>
    );
};

export default Messages;