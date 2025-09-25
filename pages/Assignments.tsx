

import React, { useState, useMemo, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, Assignment, AssignmentStatus, User, ChecklistItem, SubmissionType } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { SparklesIcon, XIcon, AssignmentsIcon as NoAssignmentsIcon } from '../components/Icons';
import { useUI } from '../contexts/UIContext';
import { generateAssignmentDescription, generateSmartFeedback, generateAssignmentChecklist, suggestGrade } from '../services/geminiService';
import AudioRecorder from '../components/AudioRecorder';
import FileUpload from '../components/FileUpload';
import EmptyState from '../components/EmptyState';

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


const AssignmentRow = React.memo(({ assignment, onSelect, studentName }: { assignment: Assignment, onSelect: (assignment: Assignment) => void, studentName: string }) => {
    const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === AssignmentStatus.Pending;
    
    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => onSelect(assignment)}>
            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{assignment.title}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{studentName}</td>
            <td className={`py-3 px-4 text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</td>
            <td className="py-3 px-4 text-center">{getStatusChip(assignment.status)}</td>
            <td className="py-3 px-4 text-sm font-semibold text-center hidden md:table-cell">{assignment.grade ?? '-'}</td>
        </tr>
    );
});

const NewAssignmentModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
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
            setChecklist(prev => [...prev, ...generatedItems]);
        } catch (e) {
            addToast("Kontrol listesi üretilemedi.", "error");
        } finally {
            setIsGeneratingChecklist(false);
        }
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        setSelectedTemplate(templateId);
        const template = templates.find(t => t.id === templateId);
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
            checklist: checklist.map((item, index) => ({ ...item, id: `chk-${Date.now()}-${index}`, isCompleted: false })),
            feedbackReaction: null,
            submissionType,
        };
        await addAssignment(newAssignmentBase, selectedStudents);
        addToast("Ödev başarıyla oluşturuldu.", "success");
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setDueDate('');
        setSelectedStudents([]);
        setSelectedTemplate('');
        setChecklist([]);
        setSubmissionType('file');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Yeni Ödev Oluştur" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Şablondan Seç</label>
                    <select value={selectedTemplate} onChange={handleTemplateChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="">Şablon Yok</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Ödev Başlığı</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Açıklama</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
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
                        {checklist.map((item, index) => (
                            <div key={index} className="flex items-center">
                                <input type="text" value={item.text} 
                                       onChange={(e) => {
                                           const newChecklist = [...checklist];
                                           newChecklist[index].text = e.target.value;
                                           setChecklist(newChecklist);
                                       }} 
                                       className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600"/>
                                <button type="button" onClick={() => setChecklist(checklist.filter((_, i) => i !== index))} className="ml-2 text-red-500 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => setChecklist([...checklist, { text: '' }])} className="mt-2 text-sm text-primary-600 font-semibold hover:text-primary-800">+ Madde Ekle</button>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Teslimat Tipi</label>
                    <select value={submissionType} onChange={(e) => setSubmissionType((e.target as HTMLSelectElement).value as SubmissionType)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="file">Dosya Yükleme</option>
                        <option value="text">Metin Cevabı</option>
                        <option value="completed">Sadece Tamamlandı İşareti</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Teslim Tarihi</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Öğrenciler</label>
                    <select multiple value={selectedStudents} onChange={e => setSelectedStudents(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-2 border rounded-md h-32 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Oluştur</button>
                </div>
            </form>
        </Modal>
    );
};


const AssignmentDetailModal = ({ assignment, onClose, studentName, onNavigate }: { assignment: Assignment | null, onClose: () => void, studentName: string | undefined, onNavigate?: (next: boolean) => void }) => {
    const { currentUser, updateAssignment, uploadFile } = useDataContext();
    const { addToast } = useUI();
    const [grade, setGrade] = useState<string>('');
    const [feedback, setFeedback] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [textSubmission, setTextSubmission] = useState('');
    const [isSuggestingGrade, setIsSuggestingGrade] = useState(false);
    const [gradeRationale, setGradeRationale] = useState('');
    const [isUploading, setIsUploading] = useState(false);


    useEffect(() => {
        if (assignment) {
            setGrade(assignment.grade?.toString() || '');
            setFeedback(assignment.feedback || '');
            setTextSubmission(assignment.textSubmission || '');
            setGradeRationale('');
        }
    }, [assignment]);

    if (!currentUser || !assignment) return null;
    
    const isCoach = currentUser.role === UserRole.Coach || currentUser.role === UserRole.SuperAdmin;

    const handleSubmission = async () => {
        let updatedAssignment: Assignment = { ...assignment, status: AssignmentStatus.Submitted, submittedAt: new Date().toISOString() };
        
        switch(assignment.submissionType) {
            case 'text':
                if (textSubmission.trim() === '') {
                    addToast("Lütfen metin cevabınızı girin.", "error");
                    return;
                }
                updatedAssignment.textSubmission = textSubmission;
                break;
            case 'completed':
                break;
            default:
                addToast("Lütfen dosya yükleme alanını kullanın.", "error");
                return;
        }

        await updateAssignment(updatedAssignment);
        addToast("Ödev başarıyla teslim edildi.", "success");
        onClose();
    };

    const handleFileUpload = async (file: File) => {
        if (!currentUser) return;
        setIsUploading(true);
        try {
            const fileUrl = await uploadFile(file, `submissions/${currentUser.id}`);
            await updateAssignment({ 
                ...assignment, 
                status: AssignmentStatus.Submitted, 
                fileUrl: fileUrl, 
                fileName: file.name,
                submittedAt: new Date().toISOString() 
            });
            addToast("Ödev dosyası başarıyla yüklendi.", "success");
            onClose();
        } catch (error) {
            console.error("File upload error:", error);
            addToast("Dosya yüklenirken bir hata oluştu.", "error");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleGradeSubmit = async () => {
        if (!grade) {
            addToast("Lütfen bir not girin.", "error");
            return;
        }
        await updateAssignment({ ...assignment, status: AssignmentStatus.Graded, grade: parseInt(grade, 10), feedback });
        addToast("Ödev notlandırıldı.", "success");
        if (onNavigate) {
            onNavigate(true);
        } else {
            onClose();
        }
    };

    const handleGenerateFeedback = async () => {
        if (!grade) {
            addToast("Akıllı geri bildirim için önce not girmelisiniz.", "error");
            return;
        }
        setIsGenerating(true);
        try {
            const generatedFeedback = await generateSmartFeedback(parseInt(grade, 10), assignment.title);
            setFeedback(generatedFeedback);
        } catch (e) {
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
                addToast("Not önerisi başarıyla alındı.", "success");
            } else {
                throw new Error("API'den geçerli bir sonuç alınamadı.");
            }
        } catch (e) {
            addToast("Not önerisi oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsSuggestingGrade(false);
        }
    };

    const handleCoachFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const url = await uploadFile(file, `coach-attachments/${currentUser.id}`);
                const newAttachment = { name: file.name, url };
                const updatedAttachments = [...(assignment.coachAttachments || []), newAttachment];
                await updateAssignment({ ...assignment, coachAttachments: updatedAttachments });
                addToast("Dosya başarıyla eklendi.", "success");
            } catch(error) {
                addToast("Dosya eklenirken hata oluştu.", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleChecklistToggle = async (itemId: string) => {
        const updatedChecklist = assignment.checklist?.map(item => 
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        await updateAssignment({ ...assignment, checklist: updatedChecklist });
    };

    const handleAudioSave = async (audioUrl: string) => {
        await updateAssignment({ ...assignment, audioFeedbackUrl: audioUrl });
        addToast("Sesli geri bildirim kaydedildi.", "success");
    };
    
    const handleFeedbackReaction = async (reaction: '👍' | '🤔') => {
        await updateAssignment({ ...assignment, feedbackReaction: reaction });
        addToast("Geri bildiriminiz için teşekkürler!", "success");
    };

    return (
        <Modal isOpen={!!assignment} onClose={onClose} title={assignment.title}>
            <div className="space-y-4">
                 {onNavigate && (
                    <div className="flex justify-between">
                        <button onClick={() => onNavigate(false)} className="text-sm font-semibold text-primary-500 hover:underline">{"< Önceki"}</button>
                        <button onClick={() => onNavigate(true)} className="text-sm font-semibold text-primary-500 hover:underline">{"Sonraki >"}</button>
                    </div>
                )}
                <p><strong className="font-semibold">Öğrenci:</strong> {studentName}</p>
                <p><strong className="font-semibold">Teslim Tarihi:</strong> {new Date(assignment.dueDate).toLocaleString('tr-TR')}</p>
                <p><strong className="font-semibold">Durum:</strong> {getStatusChip(assignment.status)}</p>
                <p className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md">{assignment.description}</p>
                
                {assignment.checklist && assignment.checklist.length > 0 && (
                     <div>
                        <strong className="font-semibold block mb-2">Kontrol Listesi:</strong>
                        <ul className="space-y-2">
                           {assignment.checklist.map(item => (
                                <li key={item.id} className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id={item.id}
                                        checked={item.isCompleted} 
                                        onChange={() => isCoach ? null : handleChecklistToggle(item.id)}
                                        disabled={isCoach}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <label htmlFor={item.id} className={`ml-2 text-sm ${item.isCompleted ? 'line-through text-gray-500' : ''}`}>{item.text}</label>
                                </li>
                           ))}
                        </ul>
                    </div>
                )}

                {assignment.status !== AssignmentStatus.Pending && (
                    <div>
                        <h4 className="font-semibold mb-2">Teslim Edilen Çalışma</h4>
                        {assignment.submissionType === 'file' && assignment.fileUrl && <p><strong className="font-semibold">Dosya:</strong> <a href={assignment.fileUrl} download={assignment.fileName} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{assignment.fileName || 'Dosyayı Görüntüle'}</a></p>}
                        {assignment.submissionType === 'text' && assignment.textSubmission && <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md whitespace-pre-wrap">{assignment.textSubmission}</div>}
                        {assignment.submissionType === 'completed' && <p className="text-sm text-gray-500">Öğrenci bu görevi 'Tamamlandı' olarak işaretledi.</p>}
                    </div>
                )}
                

                <div>
                    <strong className="font-semibold block mb-1">Koçun Eklediği Dosyalar:</strong>
                    {assignment.coachAttachments && assignment.coachAttachments.length > 0 ? (
                        <ul className="space-y-1">
                            {assignment.coachAttachments.map((file, index) => (
                                <li key={index} className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-md flex items-center justify-between">
                                    <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{file.name}</a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">Ek dosya bulunmuyor.</p>
                    )}
                </div>
                
                {!isCoach && assignment.status === AssignmentStatus.Pending && (
                    <div className="border-t dark:border-gray-600 pt-4">
                        <h4 className="font-semibold mb-2">Ödevi Teslim Et</h4>
                         {assignment.submissionType === 'file' && (
                            <FileUpload onUpload={handleFileUpload} isUploading={isUploading} />
                        )}
                         {assignment.submissionType === 'text' && (
                             <div>
                                <textarea value={textSubmission} onChange={(e) => setTextSubmission(e.target.value)} rows={6} placeholder="Cevabınızı buraya yazın..." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                                <button onClick={handleSubmission} className="w-full mt-2 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600">Metin Olarak Gönder</button>
                            </div>
                        )}
                        {assignment.submissionType === 'completed' && (
                            <button onClick={handleSubmission} className="w-full bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600">Tamamlandı Olarak İşaretle</button>
                        )}
                    </div>
                )}

                {!isCoach && assignment.status === AssignmentStatus.Graded && (
                    <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-md">
                        <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-semibold text-lg">Notunuz: {assignment.grade}/100</h4>
                                <p className="mt-2 text-sm"><strong className="font-semibold">Koç Geri Bildirimi:</strong> {assignment.feedback}</p>
                                {assignment.audioFeedbackUrl && <AudioRecorder initialAudio={assignment.audioFeedbackUrl} readOnly={true} />}
                             </div>
                              {assignment.feedbackReaction && <span className="text-2xl p-1 bg-white dark:bg-gray-800 rounded-full">{assignment.feedbackReaction}</span>}
                        </div>
                         {!assignment.feedbackReaction && (
                            <div className="mt-4 pt-3 border-t dark:border-gray-600 flex items-center gap-2">
                                <p className="text-sm font-medium">Geri bildirim faydalı oldu mu?</p>
                                <button onClick={() => handleFeedbackReaction('👍')} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Beğendim">👍</button>
                                <button onClick={() => handleFeedbackReaction('🤔')} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Anlamadım">🤔</button>
                            </div>
                        )}
                    </div>
                )}

                {isCoach && (
                     <div className="mt-6">
                        {assignment.status === AssignmentStatus.Submitted ? (
                             <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 rounded-t-lg border-b dark:border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold" id="degerlendirme-paneli">Değerlendirme</h3>
                                </div>
                                <div className="p-4 space-y-5" role="region" aria-labelledby="degerlendirme-paneli">
                                    <div>
                                        <label htmlFor="grade-input" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Not (0-100)</label>
                                        <div className="flex items-center gap-2">
                                            <input id="grade-input" type="number" min="0" max="100" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"/>
                                            <button type="button" onClick={handleSuggestGrade} disabled={isSuggestingGrade} className="flex-shrink-0 flex items-center px-3 py-2 text-sm rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/50 dark:text-primary-300 dark:hover:bg-primary-900 disabled:opacity-50 transition-colors">
                                                <SparklesIcon className={`w-4 h-4 mr-1.5 ${isSuggestingGrade ? 'animate-spin' : ''}`} />
                                                {isSuggestingGrade ? '...' : 'Not Öner'}
                                            </button>
                                        </div>
                                        {gradeRationale && <p className="text-xs text-gray-500 mt-1.5 pl-1">✨ {gradeRationale}</p>}
                                    </div>
                                    <div>
                                         <label htmlFor="feedback-textarea" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Geri Bildirim</label>
                                         <textarea id="feedback-textarea" value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"/>
                                         <button type="button" onClick={handleGenerateFeedback} disabled={isGenerating} className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <SparklesIcon className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                                            {isGenerating ? 'Oluşturuluyor...' : '✨ Akıllı Geri Bildirim Oluştur'}
                                         </button>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Sesli Geri Bildirim</label>
                                        <AudioRecorder onSave={handleAudioSave} initialAudio={assignment.audioFeedbackUrl} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Dosya Ekle</label>
                                        <p className="text-xs text-gray-500 mb-2">Öğrenciyle paylaşmak için bir dosya (ör. notlandırma anahtarı, örnek çözüm) ekleyin.</p>
                                        <label className={`cursor-pointer bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1.5 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 inline-block transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {isUploading ? 'Yükleniyor...' : 'Dosya Seç...'}
                                            <input type="file" className="hidden" onChange={handleCoachFileUpload} disabled={isUploading}/>
                                        </label>
                                    </div>
                                    <div className="text-right pt-4 border-t dark:border-gray-600">
                                        <button onClick={handleGradeSubmit} className="px-6 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors">Notu Kaydet</button>
                                    </div>
                                </div>
                            </div>
                        ) : assignment.status === AssignmentStatus.Graded ? (
                            <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-lg">Not: {assignment.grade}/100</h4>
                                        <p className="mt-2 text-sm"><strong className="font-semibold">Geri Bildirim:</strong> {assignment.feedback}</p>
                                    </div>
                                    {assignment.feedbackReaction && <span className="text-2xl p-1 bg-white dark:bg-gray-800 rounded-full" title={`Öğrenci reaksiyonu: ${assignment.feedbackReaction}`}>{assignment.feedbackReaction}</span>}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </Modal>
    );
};


const Assignments = () => {
    const { currentUser, assignments, users, students, getAssignmentsForStudent } = useDataContext();
    const { initialFilters, setInitialFilters, addToast } = useUI();
    
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [filterStatus, setFilterStatus] = useState<AssignmentStatus | 'all'>('all');
    const [filterStudent, setFilterStudent] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
    
    useEffect(() => {
        if (initialFilters.studentId) {
            setFilterStudent(initialFilters.studentId);
        }
        if (initialFilters.status) {
            setFilterStatus(initialFilters.status);
        }
        if (initialFilters.studentId || initialFilters.status) {
            setInitialFilters({});
        }
    }, [initialFilters, setInitialFilters]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);
    
    const isCoach = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

    const displayedAssignments = useMemo(() => {
        if (!currentUser) return [];
    
        switch (currentUser.role) {
            case UserRole.Student:
                return getAssignmentsForStudent(currentUser.id);
            case UserRole.Coach:
                const studentIds = students.map(s => s.id); // `students` is pre-filtered by context for a coach
                return assignments.filter(a => studentIds.includes(a.studentId));
            case UserRole.SuperAdmin:
                return assignments; // Super Admin sees all assignments
            default:
                return [];
        }
    }, [currentUser, assignments, students, getAssignmentsForStudent]);

    const filteredAssignments = useMemo(() => {
        return displayedAssignments
            .filter(a => filterStatus === 'all' || a.status === filterStatus)
            .filter(a => filterStudent === 'all' || a.studentId === filterStudent)
            .filter(a => a.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    }, [displayedAssignments, filterStatus, filterStudent, debouncedSearchTerm]);

    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Bilinmiyor';
    
    const [quickGradeAssignments, setQuickGradeAssignments] = useState<Assignment[]>([]);
    const [quickGradeIndex, setQuickGradeIndex] = useState(0);

    const handleStartQuickGrade = () => {
        const submitted = filteredAssignments.filter(a => a.status === AssignmentStatus.Submitted);
        if (submitted.length > 0) {
            setQuickGradeAssignments(submitted);
            setQuickGradeIndex(0);
        } else {
            addToast("Değerlendirilecek ödev bulunmuyor.", "info");
        }
    };
    
    const handleQuickGradeClose = () => {
        setQuickGradeAssignments([]);
    };

    const handleQuickGradeNavigation = (next: boolean) => {
        const newIndex = next ? quickGradeIndex + 1 : quickGradeIndex - 1;
        if (newIndex >= 0 && newIndex < quickGradeAssignments.length) {
            setQuickGradeIndex(newIndex);
        } else {
            handleQuickGradeClose();
            addToast("Tüm ödevler değerlendirildi!", "success");
        }
    };
    
    const allStudents = useMemo(() => users.filter(u => u.role === UserRole.Student), [users]);

    return (
        <>
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex flex-wrap gap-2">
                        <input type="text" placeholder="Ödev ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                        <select value={filterStatus} onChange={e => setFilterStatus((e.target as HTMLSelectElement).value as any)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <option value="all">Tüm Durumlar</option>
                            <option value={AssignmentStatus.Pending}>Bekliyor</option>
                            <option value={AssignmentStatus.Submitted}>Teslim Edildi</option>
                            <option value={AssignmentStatus.Graded}>Notlandırıldı</option>
                        </select>
                         {(isCoach || isSuperAdmin) && (
                            <select value={filterStudent} onChange={e => setFilterStudent((e.target as HTMLSelectElement).value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                <option value="all">Tüm Öğrenciler</option>
                                {(isSuperAdmin ? allStudents : students).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                    </div>
                    {isCoach && (
                        <div className="flex gap-2 w-full md:w-auto">
                             <button onClick={handleStartQuickGrade} className="w-full px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 whitespace-nowrap">Hızlı Değerlendir</button>
                            <button onClick={() => setIsNewAssignmentModalOpen(true)} className="w-full px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 whitespace-nowrap" id="tour-step-4">Yeni Ödev</button>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    {filteredAssignments.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Başlık</th>
                                    {(isCoach || isSuperAdmin) && <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 hidden md:table-cell">Öğrenci</th>}
                                    <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Teslim Tarihi</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 text-center">Durum</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 text-center hidden md:table-cell">Not</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.map(a => (
                                    <AssignmentRow key={a.id} assignment={a} onSelect={setSelectedAssignment} studentName={getUserName(a.studentId)} />
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <EmptyState
                            icon={<NoAssignmentsIcon className="w-8 h-8"/>}
                            title={isCoach ? "Filtreye Uygun Ödev Yok" : "Harika! Henüz bir ödevin yok."}
                            description={isCoach ? "Farklı bir filtre deneyin veya yeni bir ödev oluşturun." : "Koçun yeni bir ödev atadığında burada görünecek."}
                            action={isCoach ? { label: "Yeni Ödev Oluştur", onClick: () => setIsNewAssignmentModalOpen(true) } : undefined}
                         />
                    )}
                </div>
            </Card>
            {isNewAssignmentModalOpen && <NewAssignmentModal isOpen={isNewAssignmentModalOpen} onClose={() => setIsNewAssignmentModalOpen(false)} />}
            {selectedAssignment && <AssignmentDetailModal assignment={selectedAssignment} onClose={() => setSelectedAssignment(null)} studentName={getUserName(selectedAssignment.studentId)} />}
            {quickGradeAssignments.length > 0 && 
                <AssignmentDetailModal 
                    assignment={quickGradeAssignments[quickGradeIndex]}
                    onClose={handleQuickGradeClose}
                    studentName={getUserName(quickGradeAssignments[quickGradeIndex].studentId)}
                    onNavigate={handleQuickGradeNavigation}
                />
            }
        </>
    );
};

export default Assignments;
