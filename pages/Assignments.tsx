import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, Assignment, AssignmentStatus, User, ChecklistItem, SubmissionType, AssignmentTemplate, getAcademicTrackLabel } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { SparklesIcon, XIcon, AssignmentsIcon as NoAssignmentsIcon, TrashIcon, ArrowLeftIcon, ImageIcon, BotIcon, SendIcon, AlertTriangleIcon, PaperclipIcon, VideoIcon, ClipboardListIcon, CheckCircleIcon } from '../components/Icons';
import { useUI } from '../contexts/UIContext';
import { generateAssignmentDescription, generateSmartFeedback, generateAssignmentChecklist, suggestGrade } from '../services/geminiService';
import AudioRecorder from '../components/AudioRecorder';
import FileUpload from '../components/FileUpload';
import EmptyState from '../components/EmptyState';
import VideoRecorder from '../components/VideoRecorder';
import ConfirmationModal from '../components/ConfirmationModal';
import { useDropzone } from 'react-dropzone';
import { SkeletonText } from '../components/SkeletonLoader';


type ChatPart = { text: string } | { inlineData: { mimeType: string; data: string }};
type ChatMessage = {
    sender: 'user' | 'ai';
    parts: ChatPart[];
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};


const AssignmentHelpChatModal = ({ isOpen, onClose, assignment, onUseAsSubmission }: { 
    isOpen: boolean; 
    onClose: () => void; 
    assignment: Assignment;
    onUseAsSubmission: (submissionText: string) => void;
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageToUpload, setImageToUpload] = useState<{ file: File; preview: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { addToast } = useUI();

    useEffect(() => {
        if (isOpen) {
            setMessages([{ sender: 'ai', parts: [{ text: "Bu ödevle ilgili aklına takılan ne varsa sorabilirsin. Bir görsel yükleyebilir veya sorunu yazabilirsin!" }] }]);
            setInput('');
            setImageToUpload(null);
        }
    }, [isOpen]);

     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToUpload({ file, preview: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    }, []);
    const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false, noClick: true, noKeyboard: true });

    const handleSendMessage = async () => {
        if ((!input.trim() && !imageToUpload) || isLoading) return;
        
        const userParts: ChatPart[] = [];
        
        if (imageToUpload) {
            try {
                const base64Data = await fileToBase64(imageToUpload.file);
                userParts.push({
                    inlineData: {
                        mimeType: imageToUpload.file.type,
                        data: base64Data,
                    },
                });
            } catch (error) {
                addToast("Görsel işlenirken bir hata oluştu.", "error");
                return;
            }
        }
        if (input.trim()) {
            userParts.push({ text: input });
        }

        const userMessage: ChatMessage = { sender: 'user', parts: userParts };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setImageToUpload(null);
        setIsLoading(true);

        try {
            const history = newMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: msg.parts
            }));

            const response = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history,
                    systemInstruction: `Senin adın Mahmut Hoca. Sen bir 'Çalışma Arkadaşı'sın. Bir öğrenciye "${assignment.title}" başlıklı ödevde yardımcı oluyorsun. Ödevin açıklaması: "${assignment.description}". Öğrenci sana bu ödevle ilgili sorular soracak, bazen de çözemediği bir sorunun resmini gönderecek. Ona doğrudan cevapları verme, bunun yerine düşünmesini sağlayacak ipuçları ver, yol göster ve konuyu anlamasına yardımcı ol. Cesaretlendirici ve samimi bir dil kullan.`
                })
            });

            if (!response.ok) {
                throw new Error("API isteği başarısız oldu");
            }
            
            const data = await response.json();
            setMessages(prev => [...prev, { sender: 'ai', parts: [{ text: data.text }] }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'ai', parts: [{ text: "Üzgünüm, bir hata oluştu." }] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUseAsSubmission = () => {
        const aiResponses = messages
            .filter(msg => msg.sender === 'ai')
            .map(msg => msg.parts.filter((p): p is { text: string } => 'text' in p).map(p => p.text).join('\n'))
            .join('\n\n---\n\n')
            .replace("Bu ödevle ilgili aklına takılan ne varsa sorabilirsin. Bir görsel yükleyebilir veya sorunu yazabilirsin!", "") // remove initial message
            .trim();
        
        if (!aiResponses.trim()) {
            addToast("Aktarılacak bir yapay zeka yanıtı bulunmuyor.", "info");
            return;
        }
        
        const submissionText = `--- Mahmut Hoca'dan Alınan Yardımla Hazırlanmıştır ---\n\n${aiResponses}`;
        onUseAsSubmission(submissionText);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Yardım: ${assignment.title}`}>
            <div {...getRootProps({ className: "flex flex-col h-[60vh]" })}>
                <input {...getInputProps()} />
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.sender === 'ai' && <BotIcon className="w-8 h-8 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"/>}
                            <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-lg'}`}>
                                {msg.parts.map((part, partIndex) => {
                                    if ('inlineData' in part) {
                                        return <img key={partIndex} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="Uploaded content" className="max-w-full rounded-lg mb-2" />;
                                    }
                                    return null;
                                })}
                                {msg.parts.map((part, partIndex) => {
                                    if ('text' in part) {
                                        return <p key={partIndex} className="text-sm whitespace-pre-wrap">{part.text}</p>;
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2.5">
                            <BotIcon className="w-8 h-8 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"/>
                            <div className="px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-lg">
                                <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div></div>
                            </div>
                        </div>
                    )}
                    {isDragActive && (
                        <div className="absolute inset-0 bg-primary-500/20 backdrop-blur-sm border-4 border-dashed border-primary-500 rounded-lg flex items-center justify-center pointer-events-none z-10">
                            <p className="text-primary-800 dark:text-primary-100 font-bold text-xl">Görseli buraya bırakın</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t dark:border-gray-700 flex-shrink-0">
                    <button 
                        onClick={handleUseAsSubmission}
                        className="w-full mb-2 px-4 py-2 text-sm font-semibold bg-green-100 text-green-800 rounded-md hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 transition-colors"
                    >
                        Bu Bilgileri Ödev Metni Olarak Kullan
                    </button>
                    {imageToUpload && (
                        <div className="relative mb-2 w-24">
                            <img src={imageToUpload.preview} alt="Preview" className="rounded-lg" />
                            <button onClick={() => setImageToUpload(null)} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5"><XIcon className="w-4 h-4" /></button>
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                        <button onClick={open} className="p-2 text-gray-500 hover:text-primary-500"><PaperclipIcon className="w-5 h-5"/></button>
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' ? handleSendMessage() : null} placeholder="Bir soru sorun..." className="flex-1 bg-transparent focus:outline-none" disabled={isLoading}/>
                        <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !imageToUpload)} className="p-2 text-primary-500 disabled:text-gray-400"><SendIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


const getStatusChip = (status: AssignmentStatus) => {
    const styles = {
        [AssignmentStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        [AssignmentStatus.Submitted]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        [AssignmentStatus.Graded]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    const text = {
        [AssignmentStatus.Pending]: 'Bekliyor',
        [AssignmentStatus.Submitted]: 'Teslim Edildi',
        [AssignmentStatus.Graded]: 'Notlandırıldı',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{text[status]}</span>;
};

const SubmissionTypeIcon = ({ assignment }: { assignment: Assignment }) => {
    if (assignment.videoDescriptionUrl) {
        return <span title="Video Ödevi"><VideoIcon className="w-4 h-4 text-purple-500" /></span>;
    }
    switch (assignment.submissionType) {
        case 'text':
            return <span title="Metin Teslimi"><ClipboardListIcon className="w-4 h-4 text-blue-500" /></span>;
        case 'completed':
            return <span title="Tamamlama Ödevi"><CheckCircleIcon className="w-4 h-4 text-green-500" /></span>;
        case 'file':
        default:
            return <span title="Dosya Teslimi"><PaperclipIcon className="w-4 h-4 text-gray-500" /></span>;
    }
};

const AssignmentCard = ({ assignment, onSelect, studentName, isCoach, onToggleSelect, isSelected }: { 
    assignment: Assignment; 
    onSelect: (assignment: Assignment) => void; 
    studentName: string; 
    isCoach: boolean;
    onToggleSelect: (id: string) => void;
    isSelected: boolean;
}) => {
    const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === AssignmentStatus.Pending;

    return (
        <div
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('input[type="checkbox"]')) return;
                onSelect(assignment);
            }}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden border-l-4 p-4 ${isOverdue ? 'border-red-500' : 'border-transparent'} ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-slate-700/50' : ''}`}
        >
             {isCoach && (
                <input 
                    type="checkbox"
                    className="absolute top-3 left-3 h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 z-10"
                    checked={isSelected}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        e.stopPropagation();
                        onToggleSelect(assignment.id);
                    }}
                    aria-label={`Select assignment ${assignment.title}`}
                />
            )}
            <div>
                <div className={`flex justify-between items-start gap-2 ${isCoach ? 'pl-8' : ''}`}>
                    <h3 className="font-bold text-slate-900 dark:text-white pr-2 leading-tight flex-1">{assignment.title}</h3>
                    {getStatusChip(assignment.status)}
                </div>

                {isCoach && <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${isCoach ? 'pl-8' : ''}`}>{studentName}</p>}
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <SubmissionTypeIcon assignment={assignment} />
                    <div>
                        <span className="font-semibold">Teslim: </span>
                        <span className={isOverdue ? 'text-red-500 font-bold' : ''}>
                            {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                </div>
                <div>
                    <span className="font-semibold">Not: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{assignment.grade ?? '-'}</span>
                </div>
            </div>
        </div>
    );
};
const MemoizedAssignmentCard = React.memo(AssignmentCard);

const NewAssignmentModal = ({ isOpen, onClose, preselectedStudentIds }: { isOpen: boolean; onClose: () => void; preselectedStudentIds?: string[] | null; }) => {
    const { coach, students, addAssignment, templates } = useDataContext();
    const { addToast } = useUI();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [checklist, setChecklist] = useState<Omit<ChecklistItem, 'id'|'isCompleted'>[]>([]);
    const [submissionType, setSubmissionType] = useState<SubmissionType>('file');
    const [videoDescriptionUrl, setVideoDescriptionUrl] = useState<string | null>(null);
    const [filterGrade, setFilterGrade] = useState<string>('all');

    useEffect(() => {
        if (isOpen && preselectedStudentIds) {
            setSelectedStudents(preselectedStudentIds);
             if (preselectedStudentIds.length === 1) {
                const student = students.find(s => s.id === preselectedStudentIds[0]);
                if (student?.gradeLevel) setFilterGrade(student.gradeLevel);
            }
        }
    }, [isOpen, preselectedStudentIds, students]);

    const availableStudents = useMemo(() => {
        const gradeFiltered = filterGrade === 'all'
            ? students
            : students.filter(s => s.gradeLevel === filterGrade);

        return gradeFiltered.reduce((acc, student) => {
            const track = student.academicTrack ? getAcademicTrackLabel(student.academicTrack) : 'Diğer';
            if (!acc[track]) {
                acc[track] = [];
            }
            acc[track].push(student);
            return acc;
        }, {} as Record<string, User[]>);
    }, [students, filterGrade]);

    const handleSelectAll = () => {
        // FIX: Explicitly type `s` as `User` to help TypeScript infer the correct type after `flat()`.
        const allStudentIdsInView = Object.values(availableStudents).flat().map((s: User) => s.id);
        if (selectedStudents.length === allStudentIdsInView.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(allStudentIdsInView);
        }
    };


    const handleGenerateDescription = async () => {
        if (!title) {
            addToast("Lütfen önce bir ödev başlığı girin.", "error");
            return;
        }
        setIsGeneratingDesc(true);
        try {
            const generatedDesc = await generateAssignmentDescription(title);
            setDescription(generatedDesc);
        } catch(e) {
            addToast("Açıklama üretilemedi.", "error");
        } finally {
            setIsGeneratingDesc(false);
        }
    };
    
    const handleGenerateChecklist = async () => {
        if (!title) {
            addToast("Lütfen önce bir ödev başlığı girin.", "error");
            return;
        }
        setIsGeneratingChecklist(true);
        try {
            const generatedItems = await generateAssignmentChecklist(title, description);
            if (Array.isArray(generatedItems)) {
                setChecklist(prev => [...prev, ...generatedItems]);
            }
        } catch (e) {
            addToast("Kontrol listesi üretilemedi.", "error");
        } finally {
            setIsGeneratingChecklist(false);
        }
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        setSelectedTemplate(templateId);
        const template = templates.find((t: AssignmentTemplate) => t.id === templateId);
        if (template) {
            setTitle(template.title);
            setDescription(template.description);
            setChecklist(template.checklist);
        } else {
            setTitle('');
            setDescription('');
            setChecklist([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !dueDate || selectedStudents.length === 0 || !coach) {
            addToast("Lütfen tüm alanları doldurun ve en az bir öğrenci seçin.", "error");
            return;
        }
        const newAssignmentBase: Omit<Assignment, 'id' | 'studentId'> = {
            title,
            description,
            dueDate,
            status: AssignmentStatus.Pending,
            grade: null,
            feedback: '',
            fileUrl: null,
            coachId: coach.id,
            submittedAt: null,
            coachAttachments: [],
            checklist: checklist.map((item: { text: string }, index) => ({ ...item, id: `chk-${Date.now()}-${index}`, isCompleted: false })),
            feedbackReaction: null,
            submissionType,
            videoDescriptionUrl,
            videoFeedbackUrl: null,
        };
        await addAssignment(newAssignmentBase, selectedStudents);
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setDueDate('');
        setSelectedStudents([]);
        setSelectedTemplate('');
        setChecklist([]);
        setSubmissionType('file');
        setVideoDescriptionUrl(null);
        setFilterGrade('all');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Yeni Ödev Oluştur" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Şablondan Seç</label>
                    <select value={selectedTemplate} onChange={handleTemplateChange} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                        <option value="">Şablon Yok</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Ödev Başlığı</label>
                    <input type="text" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Açıklama</label>
                    <textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} rows={5} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                        <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc} className="flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className={`w-4 h-4 mr-1 ${isGeneratingDesc ? 'animate-spin' : ''}`} />
                            {isGeneratingDesc ? 'Oluşturuluyor...' : '✨ Açıklama Oluştur'}
                        </button>
                         <button type="button" onClick={handleGenerateChecklist} disabled={isGeneratingChecklist} className="flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className={`w-4 h-4 mr-1 ${isGeneratingChecklist ? 'animate-spin' : ''}`} />
                            {isGeneratingChecklist ? 'Oluşturuluyor...' : '✨ Kontrol Listesi Oluştur'}
                        </button>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Kontrol Listesi</label>
                    <div className="space-y-2">
                        {checklist.map((item: { text: string }, index) => (
                            <div key={index} className="flex items-center">
                                <input type="text" value={item.text} 
                                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                           const newChecklist = [...checklist];
                                           newChecklist[index].text = e.target.value;
                                           setChecklist(newChecklist);
                                       }} 
                                       className="w-full p-2 border rounded-md bg-slate-100 dark:bg-slate-900 dark:border-slate-600"/>
                                <button type="button" onClick={() => setChecklist(checklist.filter((_, i) => i !== index))} className="ml-2 text-red-500 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => setChecklist([...checklist, { text: '' }])} className="mt-2 text-sm text-primary-600 font-semibold hover:text-primary-800">+ Madde Ekle</button>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Video Açıklaması (İsteğe Bağlı)</label>
                    <VideoRecorder onSave={setVideoDescriptionUrl} />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Teslimat Tipi</label>
                    <select value={submissionType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSubmissionType(e.target.value as SubmissionType)} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                        <option value="file">Dosya Yükleme</option>
                        <option value="text">Metin Cevabı</option>
                        <option value="completed">Sadece Tamamlandı İşareti</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Teslim Tarihi</label>
                    <input type="date" value={dueDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"/>
                </div>
                 {preselectedStudentIds && preselectedStudentIds.length > 0 ? (
                    <div>
                        <label className="block text-sm font-medium mb-1">Atanan Öğrenciler</label>
                        <div className="p-2 border rounded-md bg-slate-100 dark:bg-slate-900 dark:border-slate-600">
                             {preselectedStudentIds.length} öğrenci seçildi.
                        </div>
                    </div>
                 ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1">Sınıf Filtresi</label>
                            <select
                                value={filterGrade}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    setFilterGrade(e.target.value);
                                    setSelectedStudents([]); // Reset selection when filter changes
                                }}
                                className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                            >
                                <option value="all">Tüm Sınıflar</option>
                                <option value="9">9. Sınıf</option>
                                <option value="10">10. Sınıf</option>
                                <option value="11">11. Sınıf</option>
                                <option value="12">12. Sınıf</option>
                                <option value="mezun">Mezun</option>
                            </select>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium">Öğrenciler</label>
                                <button type="button" onClick={handleSelectAll} className="text-sm font-medium text-primary-600 hover:text-primary-800">
                                    {selectedStudents.length === Object.values(availableStudents).flat().length ? 'Tümünü Bırak' : 'Tümünü Seç'}
                                </button>
                            </div>
                            <select multiple value={selectedStudents} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStudents(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))} className="w-full p-2 border rounded-md h-32 bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                                {Object.entries(availableStudents).map(([track, studentGroup]: [string, User[]]) => (
                                    <optgroup key={track} label={track}>
                                        {studentGroup.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-slate-600 hover:bg-slate-700">İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Oluştur</button>
                </div>
            </form>
        </Modal>
    );
};


const AssignmentDetailModal = ({ assignment, onClose, studentName, onNavigate, canNavigate, onOpenHelpChat }: { assignment: Assignment | null, onClose: () => void, studentName: string | undefined, onNavigate?: (direction: 'next' | 'prev') => void, canNavigate?: { next: boolean, prev: boolean }, onOpenHelpChat: () => void }) => {
    const { currentUser, updateAssignment, uploadFile, assignments: allAssignments } = useDataContext();
    const { addToast } = useUI();
    const [grade, setGrade] = useState<string>('');
    const [feedback, setFeedback] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [textSubmission, setTextSubmission] = useState('');
    const [isSuggestingGrade, setIsSuggestingGrade] = useState(false);
    const [gradeRationale, setGradeRationale] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [studentVideoSubmissionUrl, setStudentVideoSubmissionUrl] = useState<string | null>(null);
    const [videoFeedbackUrl, setVideoFeedbackUrl] = useState<string | null>(null);
    const [studentAudioFeedbackResponseUrl, setStudentAudioFeedbackResponseUrl] = useState<string | null>(null);
    const [studentVideoFeedbackResponseUrl, setStudentVideoFeedbackResponseUrl] = useState<string | null>(null);
    const [studentTextFeedbackResponse, setStudentTextFeedbackResponse] = useState('');
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);

    useEffect(() => {
        if (assignment) {
            setGrade(assignment.grade?.toString() || '');
            setFeedback(assignment.feedback || '');
            setTextSubmission(assignment.textSubmission || '');
            setGradeRationale('');
            setStudentVideoSubmissionUrl(assignment.studentVideoSubmissionUrl || null);
            setVideoFeedbackUrl(assignment.videoFeedbackUrl || null);
            setStudentAudioFeedbackResponseUrl(assignment.studentAudioFeedbackResponseUrl || null);
            setStudentVideoFeedbackResponseUrl(assignment.studentVideoFeedbackResponseUrl || null);
            setStudentTextFeedbackResponse(assignment.studentTextFeedbackResponse || '');
            setSubmissionFile(null);
        }
    }, [assignment]);

    if (!currentUser || !assignment) return null;
    
    const isCoach = currentUser.role === UserRole.Coach || currentUser.role === UserRole.SuperAdmin;

    const handleSubmission = async () => {
        if (assignment.submissionType === 'file' && !submissionFile && textSubmission.trim() === '') {
            addToast("Lütfen bir dosya yükleyin veya bir not bırakarak teslim edin.", "error");
            return;
        }
        if (assignment.submissionType === 'text' && textSubmission.trim() === '') {
            addToast("Lütfen metin cevabınızı girin.", "error");
            return;
        }
    
        setIsUploading(true);
        try {
            const updatedAssignment: Assignment = {
                ...assignment,
                status: AssignmentStatus.Submitted,
                submittedAt: new Date().toISOString(),
                textSubmission: textSubmission.trim() || null,
                studentVideoSubmissionUrl,
            };
    
            if (submissionFile) {
                const fileUrl = await uploadFile(submissionFile);
                updatedAssignment.fileUrl = fileUrl;
                updatedAssignment.fileName = submissionFile.name;
            }
    
            if (assignment.submissionType === 'completed') {
                updatedAssignment.textSubmission = null;
            }
    
            await updateAssignment(updatedAssignment);
            addToast("Ödev başarıyla teslim edildi.", "success");
            onClose();
    
        } catch (error) {
            console.error("Submission error:", error);
            addToast("Ödev teslim edilirken bir hata oluştu.", "error");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleGradeSubmit = async () => {
        if (!grade) {
            addToast("Lütfen bir not girin.", "error");
            return;
        }
        await updateAssignment({ ...assignment, status: AssignmentStatus.Graded, grade: parseInt(grade, 10), feedback, gradedAt: new Date().toISOString(), videoFeedbackUrl });
        addToast("Ödev notlandırıldı.", "success");
        if (onNavigate && canNavigate?.next) {
            onNavigate('next');
        } else {
            onClose();
        }
    };

    const handleGenerateFeedback = async () => {
        if (!grade) {
            addToast("Lütfen önce bir not girin.", "error");
            return;
        }
        setIsGenerating(true);
        try {
            const studentAssignments = allAssignments.filter(a => a.studentId === assignment.studentId);
            const generatedFeedback = await generateSmartFeedback({ ...assignment, grade: parseInt(grade, 10) }, studentAssignments);
            setFeedback(generatedFeedback);
        } catch(e) {
            addToast("Geri bildirim üretilemedi.", "error");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSuggestGrade = async () => {
        setIsSuggestingGrade(true);
        setGradeRationale('');
        try {
            const result = await suggestGrade(assignment);
            if (result) {
                setGrade(result.suggestedGrade.toString());
                setGradeRationale(result.rationale);
                addToast("Not önerisi oluşturuldu.", "info");
            } else {
                 throw new Error("AI'dan geçerli bir yanıt alınamadı.");
            }
        } catch(e) {
            addToast("Not önerisi alınamadı.", "error");
        } finally {
            setIsSuggestingGrade(false);
        }
    };

    const handleChecklistToggle = (itemId: string) => {
        const updatedChecklist = assignment.checklist?.map(item =>
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        updateAssignment({ ...assignment, checklist: updatedChecklist });
    };

    const handleSaveStudentResponse = async () => {
        await updateAssignment({ ...assignment, studentAudioFeedbackResponseUrl, studentVideoFeedbackResponseUrl, studentTextFeedbackResponse });
        addToast("Yanıtınız koçunuza gönderildi.", "success");
    };

    const isStudentViewing = currentUser.role === UserRole.Student;
    const isSubmitted = assignment.status === AssignmentStatus.Submitted || assignment.status === AssignmentStatus.Graded;

    return (
        <Modal isOpen={!!assignment} onClose={onClose} title={assignment.title} size="lg">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                     {isCoach && <p className="font-semibold">Öğrenci: {studentName}</p>}
                     {isCoach && onNavigate && (
                        <div className="flex gap-2">
                             <button onClick={() => onNavigate('prev')} disabled={!canNavigate?.prev} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"><ArrowLeftIcon className="w-5 h-5"/></button>
                             <button onClick={() => onNavigate('next')} disabled={!canNavigate?.next} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"><ArrowLeftIcon className="w-5 h-5 transform rotate-180"/></button>
                        </div>
                     )}
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{assignment.description}</p>
                 <p className="text-xs text-slate-500">Teslim Tarihi: {new Date(assignment.dueDate).toLocaleString('tr-TR')}</p>
                 
                {assignment.videoDescriptionUrl && (
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Video Açıklama</h4>
                        <VideoRecorder initialVideo={assignment.videoDescriptionUrl} readOnly />
                    </div>
                )}
                 
                 {assignment.checklist && assignment.checklist.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Kontrol Listesi</h4>
                        <ul className="space-y-2">
                            {assignment.checklist.map(item => (
                                <li key={item.id} className="flex items-center">
                                    <input type="checkbox" id={`chk-${item.id}`} checked={item.isCompleted} onChange={() => handleChecklistToggle(item.id)} disabled={!isStudentViewing || isSubmitted} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50" />
                                    <label htmlFor={`chk-${item.id}`} className={`ml-3 text-sm ${item.isCompleted ? 'line-through text-slate-500' : ''} ${!isStudentViewing || isSubmitted ? 'cursor-default' : ''}`}>{item.text}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}

                {isStudentViewing && !isSubmitted && (
                    <div className="pt-4 border-t dark:border-slate-700">
                        <button
                            onClick={onOpenHelpChat}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900"
                        >
                            <SparklesIcon className="w-5 h-5"/> Bu ödev hakkında AI'a soru sor
                        </button>
                    </div>
                )}


                <div className="pt-4 border-t dark:border-slate-700">
                    {isSubmitted ? (
                        <div>
                            <h4 className="font-semibold mb-2">Teslim Edilen Çalışma</h4>
                            {assignment.fileUrl && <p>Dosya: <a href={assignment.fileUrl} download={assignment.fileName} className="text-primary-500 underline">{assignment.fileName}</a></p>}
                            {assignment.textSubmission && <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded"><p className="text-sm italic whitespace-pre-wrap">"{assignment.textSubmission}"</p></div>}
                            {assignment.studentVideoSubmissionUrl && <VideoRecorder initialVideo={assignment.studentVideoSubmissionUrl} readOnly />}
                            {!assignment.fileUrl && !assignment.textSubmission && !assignment.studentVideoSubmissionUrl && <p className="text-sm italic">Bu ödev "Tamamlandı" olarak işaretlendi.</p>}
                        </div>
                    ) : isStudentViewing ? (
                        <div>
                            <h4 className="font-semibold mb-2">Ödevi Teslim Et</h4>
                            
                            {assignment.submissionType === 'file' && (
                                <FileUpload onFileChange={setSubmissionFile} isUploading={isUploading}/>
                            )}
                    
                            {(assignment.submissionType === 'text' || assignment.submissionType === 'file') && (
                                <div className="mt-4">
                                    <label htmlFor="submission-note" className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">
                                        {assignment.submissionType === 'file' ? 'Not Bırak (Dosya yerine veya ek olarak):' : 'Cevabını Buraya Yaz:'}
                                    </label>
                                    <textarea
                                        id="submission-note"
                                        value={textSubmission}
                                        onChange={e => setTextSubmission(e.target.value)}
                                        rows={4}
                                        className="w-full p-2 mt-1 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                                        placeholder={assignment.submissionType === 'file' ? "Örn: Ödevi defterime yaptım, kontrol edebilirsiniz." : "Metin cevabınız..."}
                                    />
                                </div>
                            )}
                    
                            {assignment.submissionType === 'completed' && (
                                <p className="text-sm text-gray-500 mt-4">Bu ödevi tamamladığını bildirmek için "Teslim Et" butonuna tıkla.</p>
                            )}
                    
                            <button
                                onClick={handleSubmission}
                                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                                disabled={isUploading}
                            >
                                {isUploading ? 'Gönderiliyor...' : 'Teslim Et'}
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* Grading Section */}
                {isCoach && isSubmitted && (
                    <div className="pt-4 border-t dark:border-slate-700">
                        <h4 className="font-semibold mb-2">Değerlendirme</h4>
                        <div className="flex items-center gap-2 mb-2">
                            <input type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="Not (0-100)" className="w-32 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600" />
                            <button type="button" onClick={handleSuggestGrade} disabled={isSuggestingGrade} className="flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50">
                                <SparklesIcon className={`w-4 h-4 mr-1 ${isSuggestingGrade ? 'animate-spin' : ''}`} />
                                {isSuggestingGrade ? 'Öneriliyor...' : '✨ Not Öner'}
                            </button>
                        </div>
                         {gradeRationale && <p className="text-xs text-slate-500 italic p-2 bg-slate-100 dark:bg-slate-700 rounded-md mb-2">Öneri: {gradeRationale}</p>}
                        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} placeholder="Geri bildirim yazın..." className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600" />
                        <button type="button" onClick={handleGenerateFeedback} disabled={isGenerating} className="flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 mt-2">
                             <SparklesIcon className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                             {isGenerating ? 'Oluşturuluyor...' : '✨ Akıllı Geri Bildirim Oluştur'}
                        </button>
                        <div className="mt-2">
                             <h4 className="font-semibold text-sm mb-1">Video Geri Bildirim (İsteğe Bağlı)</h4>
                            <VideoRecorder onSave={setVideoFeedbackUrl} initialVideo={videoFeedbackUrl}/>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={handleGradeSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Notu Kaydet</button>
                        </div>
                    </div>
                )}
                
                {assignment.status === AssignmentStatus.Graded && (
                     <div className="pt-4 border-t dark:border-slate-700 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Sonuç</h4>
                            <p><strong>Not:</strong> {assignment.grade}</p>
                            <p><strong>Geri Bildirim:</strong> {assignment.feedback || "Geri bildirim yok."}</p>
                            {assignment.videoFeedbackUrl && (
                                <div className="mt-2">
                                    <h5 className="font-semibold text-sm mb-1">Video Geri Bildirim</h5>
                                    <VideoRecorder initialVideo={assignment.videoFeedbackUrl} readOnly />
                                </div>
                            )}
                            {isCoach && assignment.studentAudioFeedbackResponseUrl && (
                                <div className="mt-2">
                                    <h5 className="font-semibold text-sm mb-1">Öğrencinin Sesli Yanıtı</h5>
                                    <AudioRecorder initialAudio={assignment.studentAudioFeedbackResponseUrl} readOnly />
                                </div>
                            )}
                             {isCoach && assignment.studentVideoFeedbackResponseUrl && (
                                <div className="mt-2">
                                    <h5 className="font-semibold text-sm mb-1">Öğrencinin Görüntülü Yanıtı</h5>
                                    <VideoRecorder initialVideo={assignment.studentVideoFeedbackResponseUrl} readOnly />
                                </div>
                            )}
                             {isCoach && assignment.studentTextFeedbackResponse && (
                                <div className="mt-2">
                                    <h5 className="font-semibold text-sm mb-1">Öğrencinin Yazılı Yanıtı</h5>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap italic">"{assignment.studentTextFeedbackResponse}"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                         {isStudentViewing && (
                             <div>
                                <h4 className="font-semibold mb-2">Geri Bildirime Yanıtın (İsteğe Bağlı)</h4>
                                 <div className="space-y-3">
                                    <div>
                                        <h5 className="text-sm font-medium mb-1">Yazılı Yanıt Gönder</h5>
                                        <textarea
                                            value={studentTextFeedbackResponse}
                                            onChange={e => setStudentTextFeedbackResponse(e.target.value)}
                                            rows={3}
                                            className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                                            placeholder="Koçunuza bir not yazın..."
                                        />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium mb-1">Sesli Yanıt Gönder</h5>
                                        <AudioRecorder onSave={setStudentAudioFeedbackResponseUrl} initialAudio={studentAudioFeedbackResponseUrl} />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium mb-1">Görüntülü Yanıt Gönder</h5>
                                        <VideoRecorder onSave={setStudentVideoFeedbackResponseUrl} initialVideo={studentVideoFeedbackResponseUrl} />
                                    </div>
                                     <button onClick={handleSaveStudentResponse} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">
                                        Yanıtı Gönder
                                    </button>
                                </div>
                            </div>
                         )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

const BatchGradeModal = ({ isOpen, onClose, onBatchGrade, assignmentCount }: { isOpen: boolean, onClose: () => void, onBatchGrade: (grade: number, feedback: string) => void, assignmentCount: number }) => {
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (!grade) {
            alert("Lütfen bir not girin.");
            return;
        }
        onBatchGrade(parseInt(grade, 10), feedback);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Toplu Notlandırma (${assignmentCount} Ödev)`}>
            <div className="space-y-4">
                <p className="text-sm text-slate-500">Seçilen tüm ödevlere aynı not ve geri bildirim uygulanacaktır.</p>
                <div>
                    <label className="block text-sm font-medium mb-1">Not (0-100)</label>
                    <input type="number" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Geri Bildirim (İsteğe Bağlı)</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600" />
                </div>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-slate-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">İptal</button>
                <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Notlandır</button>
            </div>
        </Modal>
    );
};

export default function Assignments() {
    const { currentUser, assignments, students, updateAssignment, deleteAssignments } = useDataContext();
    const { addToast, initialFilters, setInitialFilters } = useUI();
    const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(initialFilters.openNewAssignmentModal || false);
    const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<AssignmentStatus | 'all'>(initialFilters.status || 'all');
    const [filterStudent, setFilterStudent] = useState<string>(initialFilters.studentId || 'all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isBatchGradeModalOpen, setIsBatchGradeModalOpen] = useState(false);
    const [isHelpChatOpen, setIsHelpChatOpen] = useState(false);
    const [isShowingOverdue, setIsShowingOverdue] = useState(false);

    const isCoach = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;
    const studentMap = useMemo(() => new Map(students.map((s: User) => [s.id, s.name])), [students]);
    
    useEffect(() => {
        if (initialFilters.filterOverdue) {
            setIsShowingOverdue(true);
            setFilterStatus('all');
            setFilterStudent('all');
            setSearchTerm('');
        }
        if (initialFilters.assignmentId) {
            const index = displayedAssignments.findIndex(a => a.id === initialFilters.assignmentId);
            if (index !== -1) {
                setSelectedAssignmentIndex(index);
            }
        }
        if (initialFilters.openNewAssignmentModal) {
            setIsNewAssignmentModalOpen(true);
        }
        if (Object.keys(initialFilters).length > 0) {
            if (initialFilters.preselectedStudentIds || initialFilters.filterOverdue) {
                 const { preselectedStudentIds, filterOverdue, ...rest } = initialFilters;
                 setInitialFilters(rest);
            } else {
                 setInitialFilters({});
            }
        }
    }, [initialFilters]);

    const displayedAssignments = useMemo(() => {
        let filtered = assignments;
        if (currentUser?.role === UserRole.Student) {
            filtered = assignments.filter(a => a.studentId === currentUser.id);
        }

        if (isShowingOverdue) {
             filtered = filtered.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date());
        } else {
             if (filterStatus !== 'all') {
                filtered = filtered.filter(a => a.status === filterStatus);
            }
        }
       
        if (isCoach && filterStudent !== 'all') {
            filtered = filtered.filter(a => a.studentId === filterStudent);
        }
        if (searchTerm) {
            filtered = filtered.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [assignments, currentUser, filterStatus, isCoach, filterStudent, searchTerm, isShowingOverdue]);

    const selectedAssignment = selectedAssignmentIndex !== null ? displayedAssignments[selectedAssignmentIndex] : null;

    const handleSelectAssignment = (assignment: Assignment) => {
        const index = displayedAssignments.findIndex(a => a.id === assignment.id);
        if (index !== -1) setSelectedAssignmentIndex(index);
    };

    const handleNavigation = (direction: 'next' | 'prev') => {
        if (selectedAssignmentIndex === null) return;
        const newIndex = direction === 'next' ? selectedAssignmentIndex + 1 : selectedAssignmentIndex - 1;
        if (newIndex >= 0 && newIndex < displayedAssignments.length) {
            setSelectedAssignmentIndex(newIndex);
        }
    };
    
    const navigationState = useMemo(() => ({
        prev: selectedAssignmentIndex !== null && selectedAssignmentIndex > 0,
        next: selectedAssignmentIndex !== null && selectedAssignmentIndex < displayedAssignments.length - 1
    }), [selectedAssignmentIndex, displayedAssignments.length]);


    const handleToggleSelect = useCallback((id: string) => {
        setSelectedAssignmentIds(prev => 
            prev.includes(id) ? prev.filter(prevId => prevId !== id) : [...prev, id]
        );
    }, []);
    
    const handleSelectAll = () => {
        if (selectedAssignmentIds.length === displayedAssignments.length) {
            setSelectedAssignmentIds([]);
        } else {
            setSelectedAssignmentIds(displayedAssignments.map(a => a.id));
        }
    };

    const handleBatchDelete = async () => {
        await deleteAssignments(selectedAssignmentIds);
        addToast(`${selectedAssignmentIds.length} ödev başarıyla silindi.`, "success");
        setSelectedAssignmentIds([]);
        setIsConfirmDeleteOpen(false);
    };
    
    const handleBatchGrade = async (grade: number, feedback: string) => {
        const promises = selectedAssignmentIds.map(id => {
            const assignment = assignments.find((a: Assignment) => a.id === id);
            if (assignment) {
                return updateAssignment({
                    ...assignment,
                    grade,
                    feedback,
                    status: AssignmentStatus.Graded,
                    gradedAt: new Date().toISOString(),
                });
            }
            return Promise.resolve();
        });
        await Promise.all(promises);
        addToast(`${selectedAssignmentIds.length} ödev başarıyla notlandırıldı.`, "success");
        setSelectedAssignmentIds([]);
    };
    
    const handleUseAiHelpAsSubmission = async (generatedText: string) => {
        if (!selectedAssignment) return;
        
        await updateAssignment({ 
            ...selectedAssignment, 
            textSubmission: generatedText 
        });
        
        addToast("Yapay zeka yardımı ödev metni olarak eklendi.", "success");
        setIsHelpChatOpen(false);
    };
    
    const preselectedIdsForNewModal = initialFilters.preselectedStudentIds || (filterStudent !== 'all' ? [filterStudent] : null);

    return (
        <div className="space-y-6">
            {isShowingOverdue && (
                <Card className="bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-500 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangleIcon className="h-5 w-5 text-yellow-500 mr-3" />
                            <p className="font-semibold text-yellow-800 dark:text-yellow-200">Sadece teslim tarihi geçmiş ve bekleyen ödevler gösteriliyor.</p>
                        </div>
                        <button
                            onClick={() => setIsShowingOverdue(false)}
                            className="inline-flex rounded-md p-1.5 text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                        >
                            <span className="sr-only">Filtreyi Temizle</span>
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </Card>
            )}
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <select value={filterStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFilterStatus(e.target.value as AssignmentStatus | 'all'); setIsShowingOverdue(false); }} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                            <option value="all">Tüm Durumlar</option>
                            <option value={AssignmentStatus.Pending}>Bekleyen</option>
                            <option value={AssignmentStatus.Submitted}>Teslim Edilen</option>
                            <option value={AssignmentStatus.Graded}>Notlandırılan</option>
                        </select>
                        {isCoach && (
                            <select value={filterStudent} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFilterStudent(e.target.value); setIsShowingOverdue(false); }} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                                <option value="all">Tüm Öğrenciler</option>
                                {students.map((s: User) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                         <input type="text" placeholder="Ödev ara..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600 flex-grow" />
                          {isCoach && (
                            <div className="flex items-center">
                                <input 
                                    type="checkbox"
                                    id="select-all"
                                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600"
                                    checked={displayedAssignments.length > 0 && selectedAssignmentIds.length === displayedAssignments.length}
                                    onChange={handleSelectAll}
                                />
                                <label htmlFor="select-all" className="ml-2 text-sm">Tümünü Seç</label>
                            </div>
                         )}
                    </div>
                     {isCoach && (
                         <button onClick={() => setIsNewAssignmentModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold w-full sm:w-auto">
                            + Yeni Ödev
                        </button>
                     )}
                </div>
            </Card>

            {displayedAssignments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedAssignments.map((assignment: Assignment) => (
                        <MemoizedAssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                            onSelect={handleSelectAssignment}
                            studentName={studentMap.get(assignment.studentId) || ''}
                            isCoach={isCoach}
                            isSelected={selectedAssignmentIds.includes(assignment.id)}
                            onToggleSelect={handleToggleSelect}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState 
                    icon={<NoAssignmentsIcon className="w-10 h-10"/>}
                    title="Ödev Bulunamadı"
                    description="Bu filtrelerde gösterilecek bir ödev yok. Yeni bir ödev oluşturmayı deneyin."
                />
            )}
             {isCoach && selectedAssignmentIds.length > 0 && (
                <div className="fixed bottom-24 lg:bottom-10 right-10 z-40 animate-fade-in-right">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 flex items-center gap-4 border dark:border-slate-700">
                        <span className="text-sm font-semibold">{selectedAssignmentIds.length} ödev seçildi</span>
                        <button onClick={() => setIsBatchGradeModalOpen(true)} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
                           ✅ Notlandır
                        </button>
                        <button onClick={() => setIsConfirmDeleteOpen(true)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setSelectedAssignmentIds([])} className="p-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500" title="Seçimi Temizle">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <NewAssignmentModal 
                isOpen={isNewAssignmentModalOpen} 
                onClose={() => setIsNewAssignmentModalOpen(false)} 
                preselectedStudentIds={preselectedIdsForNewModal}
            />

            {selectedAssignment && (
                <AssignmentDetailModal
                    assignment={selectedAssignment}
                    onClose={() => setSelectedAssignmentIndex(null)}
                    studentName={studentMap.get(selectedAssignment.studentId)}
                    onNavigate={handleNavigation}
                    canNavigate={navigationState}
                    onOpenHelpChat={() => setIsHelpChatOpen(true)}
                />
            )}
            
            {isHelpChatOpen && selectedAssignment && (
                <AssignmentHelpChatModal
                    isOpen={isHelpChatOpen}
                    onClose={() => setIsHelpChatOpen(false)}
                    assignment={selectedAssignment}
                    onUseAsSubmission={handleUseAiHelpAsSubmission}
                />
            )}


            {isConfirmDeleteOpen && (
                <ConfirmationModal
                    isOpen={isConfirmDeleteOpen}
                    onClose={() => setIsConfirmDeleteOpen(false)}
                    onConfirm={handleBatchDelete}
                    title="Ödevleri Sil"
                    message={`${selectedAssignmentIds.length} ödevi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                />
            )}
            
            {isBatchGradeModalOpen && (
                 <BatchGradeModal
                    isOpen={isBatchGradeModalOpen}
                    onClose={() => setIsBatchGradeModalOpen(false)}
                    onBatchGrade={handleBatchGrade}
                    assignmentCount={selectedAssignmentIds.length}
                />
            )}

        </div>
    );
}