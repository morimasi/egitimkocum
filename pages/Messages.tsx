
import React, { useState, useEffect, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Message, UserRole } from '../types';
import { SendIcon } from '../components/Icons';

const Messages = () => {
    const { currentUser, coach, students, getMessagesWithUser, sendMessage, markMessagesAsRead } = useDataContext();
    const [selectedContact, setSelectedContact] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const contacts = currentUser?.role === UserRole.Coach ? students : (coach ? [coach] : []);
    
    useEffect(() => {
        // Select the first contact by default
        if (!selectedContact && contacts.length > 0) {
            setSelectedContact(contacts[0]);
        }
    }, [contacts, selectedContact]);
    
    useEffect(() => {
        if (selectedContact) {
            markMessagesAsRead(selectedContact.id);
        }
    }, [selectedContact, markMessagesAsRead]);
    
    const conversation = selectedContact ? getMessagesWithUser(selectedContact.id) : [];
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);


    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !selectedContact) return;
        sendMessage({
            senderId: currentUser.id,
            receiverId: selectedContact.id,
            text: newMessage,
            type: 'text',
        });
        setNewMessage('');
    };
    
    const getUnreadCount = (contactId: string) => {
        if (!currentUser) return 0;
        return getMessagesWithUser(contactId).filter(m => m.receiverId === currentUser.id && !m.isRead).length;
    };
    
    if (!currentUser) return null;

    return (
        <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Contacts Panel */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold">Kişiler</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {contacts.map(contact => {
                        const unreadCount = getUnreadCount(contact.id);
                        return (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`flex items-center p-3 cursor-pointer transition-colors ${
                                    selectedContact?.id === contact.id
                                        ? 'bg-primary-500 text-white'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <img src={contact.profilePicture} alt={contact.name} className="w-10 h-10 rounded-full mr-3" />
                                <div className="flex-1">
                                    <p className={`font-semibold text-sm ${selectedContact?.id === contact.id ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{contact.name}</p>
                                    <p className={`text-xs ${selectedContact?.id === contact.id ? 'text-primary-200' : 'text-gray-500'}`}>{contact.role === UserRole.Coach ? 'Koç' : 'Öğrenci'}</p>
                                </div>
                                {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">{unreadCount}</span>}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Chat Panel */}
            <div className="w-2/3 flex flex-col">
                {selectedContact ? (
                    <>
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                            <img src={selectedContact.profilePicture} alt={selectedContact.name} className="w-10 h-10 rounded-full mr-3" />
                            <div>
                                <p className="font-semibold">{selectedContact.name}</p>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                            {conversation.map(msg => (
                                <div key={msg.id} className={`flex mb-4 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`rounded-lg p-3 max-w-lg ${msg.senderId === currentUser.id ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'}`}>
                                        <p>{msg.text}</p>
                                        <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                             <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={handleSendMessage} className="flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Mesajınızı yazın..."
                                    className="flex-1 p-2 border rounded-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button type="submit" className="ml-3 p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600">
                                    <SendIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Görüntülemek için bir kişi seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
