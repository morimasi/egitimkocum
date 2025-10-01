import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { BotIcon, XIcon, SendIcon } from './Icons';

type Message = {
    sender: 'user' | 'ai';
    text: string;
};

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen && !chatRef.current) {
            try {
                if (!process.env.API_KEY) {
                  console.error("API_KEY environment variable not set.");
                  setMessages([{ sender: 'ai', text: "Üzgünüm, API anahtarı yapılandırılmamış. Lütfen yönetici ile iletişime geçin." }]);
                  return;
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "Senin adın Bilge. Öğrenci koçluğu platformunda çalışan, öğrencilere ve koçlara akademik konularda, ders çalışma ipuçlarında ve motivasyon konularında yardımcı olan, teşvik edici ve arkadaş canlısı bir yapay zeka asistansın. Cevaplarını kısa, anlaşılır ve pozitif bir dilde tut.",
                    },
                });
                 setMessages([{ sender: 'ai', text: "Merhaba! Ben Bilge, senin çalışma arkadaşınım. Dersler, ödevler veya motivasyon hakkında nasıl yardımcı olabilirim?" }]);
            } catch (error) {
                 console.error("Chat başlatılamadı:", error);
                 setMessages([{ sender: 'ai', text: "Üzgünüm, bir sorun oluştu ve şu an yardımcı olamıyorum." }]);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatRef.current.sendMessage({ message: input });
            const aiMessage: Message = { sender: 'ai', text: response.text };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Mesaj gönderilemedi:", error);
            const errorMessage: Message = { sender: 'ai', text: "Üzgünüm, bir hata oluştu. Lütfen tekrar dene." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-40 w-16 h-16 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-transform transform hover:scale-110"
                aria-label="AI Yardımcı'yı Aç"
            >
                <BotIcon className="w-8 h-8"/>
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 lg:bottom-28 lg:right-10 z-50 w-full max-w-sm h-[60vh] max-h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col border dark:border-gray-700 animate-fade-in-right">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <BotIcon className="w-6 h-6 text-primary-500"/>
                            <h3 className="font-bold text-lg">Çalışma Arkadaşım Bilge</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                {msg.sender === 'ai' && <BotIcon className="w-8 h-8 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"/>}
                                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-lg'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-end gap-2.5">
                                <BotIcon className="w-8 h-8 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"/>
                                <div className="px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-lg">
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t dark:border-gray-700 flex-shrink-0">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' ? handleSendMessage() : null}
                                placeholder="Bir soru sorun..."
                                className="flex-1 bg-transparent focus:outline-none"
                                disabled={isLoading}
                            />
                            <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-2 text-primary-500 disabled:text-gray-400">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatbot;