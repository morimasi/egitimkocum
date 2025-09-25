import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Message, UserRole, Poll, PollOption } from '../types';
import { SendIcon, BellIcon, VideoIcon, MicIcon, PaperclipIcon, DocumentIcon, ReplyIcon, EmojiIcon, CheckIcon, PollIcon, XIcon } from '../components/Icons';
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
    const { coach, sendMessage } = useDataContext();
    const { addToast } = useUI();
    const [announcementText, setAnnouncementText] = useState('');

    const handleSendAnnouncement = () => {
        if (!announcementText.trim() || !coach) return;
        sendMessage({
            senderId: coach.id,
            receiverId: 'all', // Special receiver for announcements
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

const MessageBubble = React.memo(({ msg, isOwnMessage, onReply, onReact }: { msg: Message, isOwnMessage: boolean, onReply: (msg: Message) => void, onReact: (msg: Message, emoji: string) => void }) => {
    const { findMessageById, voteOnPoll, currentUser, users } = useDataContext();
    const [showToolbar, setShowToolbar] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const repliedToMessage = msg.replyTo ? findMessageById(msg.replyTo) : null;
    
    const ReadReceipt = () => {
        if (!isOwnMessage || msg.type === 'announcement') return null;
        const isRead = msg.readBy.length > 1; // Read by someone other than the sender
        return (
             <div className={`relative w-4 h-4 ${isRead ? 'text-blue-400' : 'text-gray-400'}`}>
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


const Messages = () => {
    const { currentUser, coach, students, getMessagesWithUser, sendMessage, markMessagesAsRead, messages, typingStatus, updateTypingStatus, addReaction, uploadFile, unreadCounts, lastMessagesMap } = useDataContext();
    const { addToast, startCall, initialFilters, setInitialFilters } = useUI();
    
    const [selectedContactId, setSelectedContactId] = useState<string | null>(initialFilters.contactId || null);
    const [newMessage, setNewMessage] = useState('');
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (initialFilters.contactId) {
            setInitialFilters({});
        }
    }, [initialFilters, setInitialFilters]);

    const isCoach = currentUser?.role === UserRole.Coach;
    const contacts = isCoach ? students : (coach ? [coach] : []);
    
    const studentContacts = isCoach ? contacts : [{ id: 'announcements', name: 'Duyurular', profilePicture: 'https://cdn-icons-png.flaticon.com/512/1041/1041891.png' }, ...contacts];

    const selectedContact = studentContacts.find(c => c.id === selectedContactId) || null;

    useEffect(() => {
        if (!selectedContactId && studentContacts.length > 0) {
            const firstContact = studentContacts[0].id === 'announcements' && studentContacts.length > 1 ? studentContacts[1] : studentContacts[0];
            setSelectedContactId(firstContact.id);
        }
    }, [studentContacts, selectedContactId]);
    
    useEffect(() => {
        if (selectedContactId) {
            markMessagesAsRead(selectedContactId);
        }
    }, [selectedContactId, messages, markMessagesAsRead]);
    
    const conversation = selectedContactId ? getMessagesWithUser(selectedContactId) : [];
    
    useEffect(() => {
        if (!showScrollToBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversation, typingStatus, showScrollToBottom]);

    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (container) {
            const isScrolledUp = container.scrollHeight - container.scrollTop > container.clientHeight + 100;
            setShowScrollToBottom(isScrolledUp);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !selectedContactId || selectedContactId === 'announcements') return;
        sendMessage({
            senderId: currentUser.id,
            receiverId: selectedContactId,
            text: newMessage,
            type: 'text',
            replyTo: replyingTo?.id,
        });
        setNewMessage('');
        setReplyingTo(null);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            updateTypingStatus(false);
        }
    };
    
    const handleSendPoll = (poll: Poll) => {
        if (!currentUser || !selectedContactId || selectedContactId === 'announcements') return;
        sendMessage({
            senderId: currentUser.id,
            receiverId: selectedContactId,
            text: `Anket: ${poll.question}`,
            type: 'poll',
            poll,
        });
    };
    
    const handleSendAudio = (audioUrl: string) => {
        if (!currentUser || !selectedContactId || selectedContactId === 'announcements') return;
         sendMessage({
            senderId: currentUser.id,
            receiverId: selectedContactId,
            text: 'Sesli mesaj',
            type: 'audio',
            audioUrl: audioUrl,
        });
        setShowAudioRecorder(false);
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && currentUser && selectedContactId) {
            setIsUploading(true);
            try {
                const fileUrl = await uploadFile(file, `messages/${currentUser.id}`);
                const isImage = file.type.startsWith('image/');
                
                sendMessage({
                    senderId: currentUser.id,
                    receiverId: selectedContactId,
                    text: file.name,
                    type: 'file',
                    fileName: file.name,
                    fileUrl: fileUrl,
                    fileType: file.type,
                    imageUrl: isImage ? fileUrl : undefined,
                });
                addToast("Dosya başarıyla gönderildi.", "success");
            } catch (error) {
                 addToast("Dosya gönderilirken bir hata oluştu.", "error");
            } finally {
                setIsUploading(false);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else {
            updateTypingStatus(true);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            updateTypingStatus(false);
            typingTimeoutRef.current = null;
        }, 2000);
    };
    
    if (!currentUser) return null;

    const isContactTyping = selectedContactId && typingStatus[selectedContactId];

    return (
        <>
            <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="w-full sm:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Kişiler</h2>
                        {isCoach && <button onClick={() => setIsAnnouncementModalOpen(true)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Duyuru Yap"><BellIcon className="w-5 h-5"/></button>}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {studentContacts.map(contact => {
                            const unreadCount = unreadCounts.get(contact.id) || 0;
                            const lastMessage = lastMessagesMap.get(contact.id);
                            return (
                                <div key={contact.id} onClick={() => setSelectedContactId(contact.id)} className={`flex items-center p-3 cursor-pointer transition-colors ${selectedContactId === contact.id ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <div className="relative"><img src={contact.profilePicture} alt={contact.name} className="w-12 h-12 rounded-full" />{unreadCount > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>}</div>
                                    <div className="flex-1 ml-3 overflow-hidden">
                                        <div className="flex justify-between items-center"><p className={`font-semibold text-sm ${selectedContactId === contact.id ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{contact.name}</p>{lastMessage && <p className={`text-xs flex-shrink-0 ${selectedContactId === contact.id ? 'text-primary-200' : 'text-gray-400'}`}>{new Date(lastMessage.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>}</div>
                                        <p className={`text-xs truncate ${selectedContactId === contact.id ? 'text-primary-200' : 'text-gray-500'}`}>{typingStatus[contact.id] ? <span className="italic text-green-500">yazıyor...</span> : (lastMessage ? (lastMessage.type === 'audio' ? '🎤 Sesli Mesaj' : (lastMessage.type === 'file' ? '📎 Dosya' : (lastMessage.senderId === currentUser.id && lastMessage.type !== 'announcement' ? `Siz: ${lastMessage.text}` : lastMessage.text))) : 'Henüz mesaj yok')}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="w-2/3 flex-col hidden sm:flex">
                    {selectedContact ? (
                        <>
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center"><img src={selectedContact.profilePicture} alt={selectedContact.name} className="w-10 h-10 rounded-full mr-3" /><div><p className="font-semibold">{selectedContact.name}</p></div></div>
                                {selectedContact.id !== 'announcements' && <button onClick={() => startCall(selectedContact as User)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Görüntülü Arama Başlat"><VideoIcon className="w-6 h-6" /></button>}
                            </div>
                            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 space-y-4 relative">
                                {conversation.map(msg => <MessageBubble key={msg.id} msg={msg} isOwnMessage={msg.senderId === currentUser.id} onReply={setReplyingTo} onReact={(m, e) => addReaction(m.id, e)} />)}
                                {isContactTyping && <div className="flex justify-start"><div className="bg-gray-200 dark:bg-gray-700 rounded-lg"><TypingIndicator /></div></div>}
                                <div ref={messagesEndRef} />
                                {showScrollToBottom && <button onClick={scrollToBottom} className="absolute bottom-4 right-4 bg-primary-500 text-white w-10 h-10 rounded-full shadow-lg animate-bounce">↓</button>}
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                {selectedContactId !== 'announcements' ? (
                                    showAudioRecorder ? (
                                        <div className="flex flex-col items-center"><AudioRecorder onSave={handleSendAudio} /><button onClick={() => setShowAudioRecorder(false)} className="text-sm text-gray-500 mt-2">İptal</button></div>
                                    ) : (
                                        <div>
                                            {replyingTo && (
                                                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md flex justify-between items-center">
                                                    <div><p className="text-xs font-bold text-primary-600">Yanıtlanıyor:</p><p className="text-sm truncate text-gray-600 dark:text-gray-300">{replyingTo.text}</p></div>
                                                    <button onClick={() => setReplyingTo(null)} className="p-1"><XIcon className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                            <form onSubmit={handleSendMessage} className="flex items-center">
                                                <input type="text" value={newMessage} onChange={handleTyping} placeholder="Mesajınızı yazın..." className={`flex-1 p-2 border bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 ${replyingTo ? 'rounded-b-full rounded-t-none' : 'rounded-full'}`}/>
                                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                                                {isCoach && <button type="button" onClick={() => setIsPollModalOpen(true)} className="ml-3 p-3 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Anket Oluştur"><PollIcon className="w-5 h-5"/></button>}
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="ml-1 p-3 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Dosya Ekle" disabled={isUploading}><PaperclipIcon className="w-5 h-5"/></button>
                                                <button type="button" onClick={() => setShowAudioRecorder(true)} className="ml-1 p-3 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Sesli Mesaj Gönder"><MicIcon className="w-5 h-5"/></button>
                                                <button type="submit" className="ml-1 p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600" aria-label="Gönder"><SendIcon className="w-5 h-5" /></button>
                                            </form>
                                        </div>
                                    )
                                ) : <p className="text-center text-sm text-gray-400">Duyurulara yanıt verilemez.</p>}
                            </div>
                        </>
                    ) : <div className="flex items-center justify-center h-full text-gray-500"><p>Görüntülemek için bir kişi seçin.</p></div>}
                </div>
            </div>
            {isAnnouncementModalOpen && <AnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} />}
            {isPollModalOpen && <PollCreationModal isOpen={isPollModalOpen} onClose={() => setIsPollModalOpen(false)} onSend={handleSendPoll} />}

        </>
    );
};

export default Messages;
