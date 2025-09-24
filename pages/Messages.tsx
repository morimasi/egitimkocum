import React, { useState, useEffect, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Message, UserRole } from '../types';
import { SendIcon, BellIcon, VideoIcon, MicIcon } from '../components/Icons';
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


const Messages = () => {
    const { currentUser, coach, students, getMessagesWithUser, sendMessage, markMessagesAsRead, messages, typingStatus, updateTypingStatus } = useDataContext();
    const { startCall, initialFilters, setInitialFilters } = useUI();
    
    const [selectedContactId, setSelectedContactId] = useState<string | null>(initialFilters.contactId || null);
    const [newMessage, setNewMessage] = useState('');
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    
    useEffect(() => {
        if (initialFilters.contactId) {
            setInitialFilters({});
        }
    }, [initialFilters, setInitialFilters]);

    const isCoach = currentUser?.role === UserRole.Coach;
    const contacts = isCoach ? students : (coach ? [coach] : []);
    
    const studentContacts = !isCoach ? [{ id: 'announcements', name: 'Duyurular', profilePicture: 'https://cdn-icons-png.flaticon.com/512/1041/1041891.png' }, ...contacts] : contacts;

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, typingStatus]);


    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !selectedContactId || selectedContactId === 'announcements') return;
        sendMessage({
            senderId: currentUser.id,
            receiverId: selectedContactId,
            text: newMessage,
            type: 'text',
        });
        setNewMessage('');
        if (currentUser && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            updateTypingStatus(currentUser.id, false);
        }
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

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (!currentUser) return;
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else {
            updateTypingStatus(currentUser.id, true);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            updateTypingStatus(currentUser.id, false);
            typingTimeoutRef.current = null;
        }, 2000);
    };
    
    const getUnreadCount = (contactId: string) => {
        if (!currentUser) return 0;
        return messages.filter(m => m.receiverId === currentUser.id && m.senderId === contactId && !m.isRead).length;
    };
    
    const getLastMessage = (contactId: string): Message | undefined => {
        if (!currentUser) return undefined;
        let userMessages = [];
        if (contactId === 'announcements') {
            userMessages = messages.filter(m => m.type === 'announcement');
        } else {
            userMessages = messages.filter(m => (m.senderId === currentUser.id && m.receiverId === contactId) || (m.senderId === contactId && m.receiverId === currentUser.id));
        }
        return userMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    };
    
    if (!currentUser) return null;

    const isContactTyping = selectedContactId && typingStatus[selectedContactId];

    return (
        <>
            <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                {/* Contacts Panel */}
                <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Kişiler</h2>
                        {isCoach && (
                            <button onClick={() => setIsAnnouncementModalOpen(true)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Duyuru Yap">
                                <BellIcon className="w-5 h-5"/>
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {studentContacts.map(contact => {
                            const unreadCount = getUnreadCount(contact.id);
                            const lastMessage = getLastMessage(contact.id);
                            return (
                                <div
                                    key={contact.id}
                                    onClick={() => setSelectedContactId(contact.id)}
                                    className={`flex items-center p-3 cursor-pointer transition-colors ${
                                        selectedContactId === contact.id
                                            ? 'bg-primary-500 text-white'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="relative">
                                        <img src={contact.profilePicture} alt={contact.name} className="w-12 h-12 rounded-full" />
                                        {unreadCount > 0 && 
                                            <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>
                                        }
                                    </div>
                                    <div className="flex-1 ml-3 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className={`font-semibold text-sm ${selectedContactId === contact.id ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{contact.name}</p>
                                            {lastMessage && <p className={`text-xs flex-shrink-0 ${selectedContactId === contact.id ? 'text-primary-200' : 'text-gray-400'}`}>{new Date(lastMessage.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>}
                                        </div>
                                        <p className={`text-xs truncate ${selectedContactId === contact.id ? 'text-primary-200' : 'text-gray-500'}`}>
                                        {typingStatus[contact.id] ? <span className="italic text-green-500">yazıyor...</span> : (lastMessage ? (lastMessage.type === 'audio' ? '🎤 Sesli Mesaj' : (lastMessage.senderId === currentUser.id && lastMessage.type !== 'announcement' ? `Siz: ${lastMessage.text}` : lastMessage.text)) : 'Henüz mesaj yok')}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="w-2/3 flex flex-col">
                    {selectedContact ? (
                        <>
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center">
                                    <img src={selectedContact.profilePicture} alt={selectedContact.name} className="w-10 h-10 rounded-full mr-3" />
                                    <div>
                                        <p className="font-semibold">{selectedContact.name}</p>
                                    </div>
                                </div>
                                {selectedContact.id !== 'announcements' && (
                                     <button onClick={() => startCall(selectedContact as User)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Görüntülü Arama Başlat">
                                        <VideoIcon className="w-6 h-6" />
                                     </button>
                                )}
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                                {conversation.map(msg => (
                                    <div key={msg.id} className={`flex mb-4 ${msg.senderId === currentUser.id && msg.type !== 'announcement' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`rounded-lg p-3 max-w-lg ${msg.type === 'announcement' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 w-full' : (msg.senderId === currentUser.id ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white')}`}>
                                            {msg.type === 'announcement' && <strong className="font-bold block mb-1">📢 Duyuru</strong>}
                                            {msg.type === 'audio' ? (
                                                <div className="w-64">
                                                    <AudioRecorder initialAudio={msg.audioUrl} readOnly />
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                            <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                                        </div>
                                    </div>
                                ))}
                                {isContactTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg">
                                            <TypingIndicator />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                {selectedContactId !== 'announcements' ? (
                                    showAudioRecorder ? (
                                        <div className="flex flex-col items-center">
                                            <AudioRecorder onSave={handleSendAudio} />
                                            <button onClick={() => setShowAudioRecorder(false)} className="text-sm text-gray-500 mt-2">İptal</button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="flex items-center">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={handleTyping}
                                                placeholder="Mesajınızı yazın..."
                                                className="flex-1 p-2 border rounded-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                            <button type="button" onClick={() => setShowAudioRecorder(true)} className="ml-3 p-3 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Sesli Mesaj Gönder">
                                                <MicIcon className="w-5 h-5"/>
                                            </button>
                                            <button type="submit" className="ml-2 p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600" aria-label="Gönder">
                                                <SendIcon className="w-5 h-5" />
                                            </button>
                                        </form>
                                    )
                                ) : (
                                    <p className="text-center text-sm text-gray-400">Duyurulara yanıt verilemez.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Görüntülemek için bir kişi seçin.</p>
                        </div>
                    )}
                </div>
            </div>
            {isAnnouncementModalOpen && <AnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} />}
        </>
    );
};

export default Messages;