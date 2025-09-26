import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, Assignment, AssignmentStatus, User, ChecklistItem, SubmissionType, AcademicTrack } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { SparklesIcon, XIcon, AssignmentsIcon as NoAssignmentsIcon, CheckIcon } from '../components/Icons';
import { useUI } from '../contexts/UIContext';
import { generateAssignmentDescription, generateSmartFeedback, generateAssignmentChecklist, suggestGrade } from '../services/geminiService';
import AudioRecorder from '../components/AudioRecorder';
import FileUpload from '../components/FileUpload';
import EmptyState from '../components/EmptyState';
import VideoRecorder from '../components/VideoRecorder';

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

const AssignmentCard = ({ assignment, onSelect, studentName, isCoach }: { assignment: Assignment; onSelect: (assignment: Assignment) => void; studentName: string; isCoach: boolean; }) => {
    const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === AssignmentStatus.Pending;

    return (
        <div
            onClick={() => onSelect(assignment)}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden border-l-4 ${isOverdue ? 'border-red-500' : 'border-transparent'} p-4`}
        >
            <div>
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white pr-2 leading-tight flex-1">{assignment.title}</h3>
                    {getStatusChip(assignment.status)}
                </div>

                {isCoach && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{studentName}</p>}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <div>
                    <span className="font-semibold">Teslim: </span>
                    <span className={isOverdue ? 'text-red-500 font-bold' : ''}>
                        {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                    </span>
                </div>
                <div>
                    <span className="font-semibold">Not: </span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">{assignment.grade ?? '-'}</span>
                </div>
            </div>
        </div>
    );
};
const MemoizedAssignmentCard = React.memo(AssignmentCard);

const getAcademicTrackLabel = (track: AcademicTrack): string => {
    switch (track) {
        case AcademicTrack.Sayisal: return 'Sayısal';
        case AcademicTrack.EsitAgirlik: return 'Eşit Ağırlık';
        case AcademicTrack.Sozel: return 'Sözel';
        case AcademicTrack.Dil: return 'Dil';
        default: return '';
    }
};

const NewAssignmentModal = ({ isOpen, onClose, preselectedStudentId }: { isOpen: boolean; onClose: () => void; preselectedStudentId?: string | null; }) => {
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
        if (isOpen && preselectedStudentId) {
            setSelectedStudents([preselectedStudentId]);
            const student = students.find(s => s.id === preselectedStudentId);
            if (student?.gradeLevel) {
                setFilterGrade(student.gradeLevel);
            }
        }
    }, [isOpen, preselectedStudentId, students]);

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
        const allStudentIdsInView = Object.values(availableStudents).flat().map(s => s.id);
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
            videoDescriptionUrl,
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
        setVideoDescriptionUrl(null);
        setFilterGrade('all');
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
                    <label className="block text-sm font-medium mb-1">Video Açıklaması (İsteğe Bağlı)</label>
                    <VideoRecorder onSave={setVideoDescriptionUrl} />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Teslimat Tipi</label>
                    <select value={submissionType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSubmissionType(e.target.value as SubmissionType)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
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
                    <label className="block text-sm font-medium mb-1">Sınıf Filtresi</label>
                    <select
                        value={filterGrade}
                        onChange={e => {
                            setFilterGrade(e.target.value);
                            setSelectedStudents([]); // Reset selection when filter changes
                        }}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
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
                    <select multiple value={selectedStudents} onChange={e => setSelectedStudents(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-2 border rounded-md h-32 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        {Object.entries(availableStudents).map(([track, studentGroup]) => (
                            <optgroup key={track} label={track}>
                                {studentGroup.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </optgroup>
                        ))}
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
    const { currentUser, updateAssignment, uploadFile, getAssignmentsForStudent } = useDataContext();
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

    useEffect(() => {
        if (assignment) {
            setGrade(assignment.grade?.toString() || '');
            setFeedback(assignment.feedback || '');
            setTextSubmission(assignment.textSubmission || '');
            setGradeRationale('');
            setStudentVideoSubmissionUrl(assignment.studentVideoSubmissionUrl || null);
            setVideoFeedbackUrl(assignment.videoFeedbackUrl || null);
        }
    }, [assignment]);

    if (!currentUser || !assignment) return null;
    
    const isCoach = currentUser.role === UserRole.Coach || currentUser.role === UserRole.SuperAdmin;

    const handleSubmission = async () => {
        let updatedAssignment: Assignment = { 
            ...assignment, 
            status: AssignmentStatus.Submitted, 
            submittedAt: new Date().toISOString(),
            studentVideoSubmissionUrl,
        };
        
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
                 // This case is handled by handleFileUpload now
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
                submittedAt: new Date().toISOString(),
                studentVideoSubmissionUrl,
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
            const allStudentAssignments = getAssignmentsForStudent(assignment.studentId);
            const assignmentWithGrade = { ...assignment, grade: parseInt(grade, 10) };
            const generatedFeedback = await generateSmartFeedback(assignmentWithGrade, allStudentAssignments);
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

    const handleVideoFeedbackSave = async (videoUrl: string | null) => {
        if (!videoUrl) return;
        await updateAssignment({ ...assignment, videoFeedbackUrl: videoUrl });
        addToast("Video geri bildirim kaydedildi.", "success");
    };
    
    const handleFeedbackReaction = async (reaction: '👍' | '🤔') => {
        await updateAssignment({ ...assignment, feedbackReaction: reaction });
        addToast("Geri bildiriminiz için teşekkürler!", "success");
    };

    const handleStudentAudioResponseSave = async (audioUrl: string) => {
        await updateAssignment({ ...assignment, studentAudioFeedbackResponseUrl: audioUrl });
        addToast("Sesli yanıtınız gönderildi.", "success");
    };

    const handleStudentVideoResponseSave = async (videoUrl: string | null) => {
        if (!videoUrl) return;
        await updateAssignment({ ...assignment, studentVideoFeedbackResponseUrl: videoUrl });
        addToast("Görüntülü yanıtınız gönderildi.", "success");
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
                
                 {assignment.videoDescriptionUrl && (
                    <div>
                        <strong className="font-semibold block mb-2">Video Açıklaması:</strong>
                        <VideoRecorder initialVideo={assignment.videoDescriptionUrl} readOnly />
                    </div>
                )}
                
                {assignment.checklist && assignment.checklist.length > 0 && (
                     <div>
                        <strong className="font-semibold block mb-2">Kontrol Listesi:</strong>
                        <ul className="space-y-2">
                           {assignment.checklist.map(item => (
                                <li key={item.id} className="flex items-center cursor-pointer group" onClick={() => isCoach ? null : handleChecklistToggle(item.id)}>
                                    <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={item.isCompleted}
                                        disabled={isCoach}
                                        className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 group-hover:border-primary-500 ${
                                            item.isCompleted
                                                ? 'bg-primary-500 border-primary-500'
                                                : 'bg-transparent border-gray-400 dark:border-gray-500'
                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                        {item.isCompleted && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                    </button>
                                    <label className={`ml-3 text-sm cursor-pointer ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{item.text}</label>
                                </li>
                           ))}
                        </ul>
                    </div>
                )}

                 {assignment.status !== AssignmentStatus.Pending && (
                    <div className="space-y-3">
                        <h4 className="font-semibold mb-2">Teslim Edilen Çalışma</h4>
                        {assignment.studentVideoSubmissionUrl && (
                            <div>
                                <strong className="font-semibold text-sm block mb-1">Öğrencinin Video Açıklaması:</strong>
                                <VideoRecorder initialVideo={assignment.studentVideoSubmissionUrl} readOnly />
                            </div>
                        )}
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
                    <div className="border-t dark:border-gray-600 pt-4 space-y-4">
                        <div>
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
                         <div>
                            <h4 className="font-semibold mb-2">Video Açıklaması Ekle (İsteğe Bağlı)</h4>
                            <VideoRecorder onSave={setStudentVideoSubmissionUrl} initialVideo={studentVideoSubmissionUrl} />
                        </div>
                    </div>
                )}

                {!isCoach && assignment.status === AssignmentStatus.Graded && (
                    <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-md space-y-3">
                        <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-semibold text-lg">Notunuz: {assignment.grade}/100</h4>
                                <p className="mt-2 text-sm"><strong className="font-semibold">Koç Geri Bildirimi:</strong> {assignment.feedback}</p>
                             </div>
                              {assignment.feedbackReaction && <span className="text-2xl p-1 bg-white dark:bg-gray-800 rounded-full">{assignment.feedbackReaction}</span>}
                        </div>
                         {assignment.audioFeedbackUrl && <AudioRecorder initialAudio={assignment.audioFeedbackUrl} readOnly={true} />}
                         {assignment.videoFeedbackUrl && (
                            <div>
                                <strong className="font-semibold block mb-1 text-sm">Video Geri Bildirim:</strong>
                                <VideoRecorder initialVideo={assignment.videoFeedbackUrl} readOnly={true} />
                            </div>
                        )}
                         {!assignment.feedbackReaction && (
                            <div className="mt-4 pt-3 border-t dark:border-gray-600 flex items-center gap-2">
                                <p className="text-sm font-medium">Geri bildirim faydalı oldu mu?</p>
                                <button onClick={() => handleFeedbackReaction('👍')} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Beğendim">👍</button>
                                <button onClick={() => handleFeedbackReaction('🤔')} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Anlamadım">🤔</button>
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t dark:border-gray-600 space-y-4">
                            <h5 className="font-semibold text-base">Geri Bildirime Yanıt Ver (İsteğe Bağlı)</h5>
                            {!assignment.studentAudioFeedbackResponseUrl && !assignment.studentVideoFeedbackResponseUrl ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Sesli Yanıt</label>
                                        <AudioRecorder onSave={handleStudentAudioResponseSave} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Görüntülü Yanıt</label>
                                        <VideoRecorder onSave={handleStudentVideoResponseSave} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {assignment.studentAudioFeedbackResponseUrl && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Gönderdiğiniz Sesli Yanıt</label>
                                            <AudioRecorder initialAudio={assignment.studentAudioFeedbackResponseUrl} readOnly />
                                        </div>
                                    )}
                                    {assignment.studentVideoFeedbackResponseUrl && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Gönderdiğiniz Görüntülü Yanıt</label>
                                            <VideoRecorder initialVideo={assignment.studentVideoFeedbackResponseUrl} readOnly />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
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
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Video Geri Bildirim</label>
                                        <VideoRecorder onSave={handleVideoFeedbackSave} initialVideo={videoFeedbackUrl} />
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
                                 {(assignment.studentAudioFeedbackResponseUrl || assignment.studentVideoFeedbackResponseUrl) && (
                                    <div className="mt-4 pt-4 border-t dark:border-gray-600 space-y-3">
                                        <h4 className="font-semibold">Öğrencinin Yanıtı</h4>
                                        {assignment.studentAudioFeedbackResponseUrl && (
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Sesli Yanıt</label>
                                                <AudioRecorder initialAudio={assignment.studentAudioFeedbackResponseUrl} readOnly />
                                            </div>
                                        )}
                                        {assignment.studentVideoFeedbackResponseUrl && (
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Görüntülü Yanıt</label>
                                                <VideoRecorder initialVideo={assignment.studentVideoFeedbackResponseUrl} readOnly />
                                            </div>
                                        )}
                                    </div>
                                )}
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
    const [preselectedStudentId, setPreselectedStudentId] = useState<string | null>(null);
    
    useEffect(() => {
        if (initialFilters.studentId) {
            setFilterStudent(initialFilters.studentId);
             if (initialFilters.openNewAssignmentModal) {
                setPreselectedStudentId(initialFilters.studentId);
                setIsNewAssignmentModalOpen(true);
            }
        }
        if (initialFilters.status) {
            setFilterStatus(initialFilters.status);
        }
        if (initialFilters.assignmentId) {
            const assignmentToOpen = assignments.find(a => a.id === initialFilters.assignmentId);
            if (assignmentToOpen) {
                setSelectedAssignment(assignmentToOpen);
            } else {
                addToast("İstenen ödev bulunamadı.", "error");
            }
        }
        if (Object.keys(initialFilters).length > 0) {
            setInitialFilters({});
        }
    }, [initialFilters, setInitialFilters, assignments, addToast]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);
    
    const isCoach = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;

    const displayedAssignments = useMemo(() => {
        if (!currentUser) return [];
    
        switch (currentUser.role) {
            case UserRole.Student:
                return getAssignmentsForStudent(currentUser.id);
            case UserRole.Coach:
            case UserRole.SuperAdmin:
                const studentIds = students.map(s => s.id);
                return assignments.filter(a => studentIds.includes(a.studentId));
            default:
                return [];
        }
    }, [currentUser, assignments, students, getAssignmentsForStudent]);

    const filteredAssignments = useMemo(() => {
        const filtered = displayedAssignments
            .filter(a => filterStatus === 'all' || a.status === filterStatus)
            .filter(a => filterStudent === 'all' || a.studentId === filterStudent)
            .filter(a => a.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

        return filtered.sort((a, b) => {
            const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            
            if (timeB !== timeA) {
                return timeB - timeA;
            }
            
            return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        });
    }, [displayedAssignments, filterStatus, filterStudent, debouncedSearchTerm]);

    const getUserName = useCallback((id: string) => users.find(u => u.id === id)?.name || 'Bilinmiyor', [users]);
    
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
    
    const handleSelectAssignment = useCallback((assignment: Assignment) => {
        setSelectedAssignment(assignment);
    }, []);

    return (
        <>
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex flex-wrap gap-2 w-full">
                        <input type="text" placeholder="Ödev ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex-grow" />
                        <select value={filterStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as any)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex-grow md:flex-grow-0">
                            <option value="all">Tüm Durumlar</option>
                            <option value={AssignmentStatus.Pending}>Bekliyor</option>
                            <option value={AssignmentStatus.Submitted}>Teslim Edildi</option>
                            <option value={AssignmentStatus.Graded}>Notlandırıldı</option>
                        </select>
                         {isCoach && (
                            <select value={filterStudent} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStudent(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex-grow md:flex-grow-0">
                                <option value="all">Tüm Öğrenciler</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                    </div>
                    {isCoach && (
                        <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
                             <button onClick={handleStartQuickGrade} className="w-full px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 whitespace-nowrap">Hızlı Değerlendir</button>
                            <button onClick={() => setIsNewAssignmentModalOpen(true)} className="w-full px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 whitespace-nowrap" id="tour-step-4">Yeni Ödev</button>
                        </div>
                    )}
                </div>
                
                {filteredAssignments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssignments.map(a => (
                            <MemoizedAssignmentCard 
                                key={a.id} 
                                assignment={a} 
                                onSelect={handleSelectAssignment} 
                                studentName={getUserName(a.studentId)}
                                isCoach={isCoach}
                            />
                        ))}
                    </div>
                ) : (
                     <EmptyState
                        icon={<NoAssignmentsIcon className="w-8 h-8"/>}
                        title={isCoach ? "Filtreye Uygun Ödev Yok" : "Harika! Henüz bir ödevin yok."}
                        description={isCoach ? "Farklı bir filtre deneyin veya yeni bir ödev oluşturun." : "Koçun yeni bir ödev atadığında burada görünecek."}
                        action={isCoach ? { label: "Yeni Ödev Oluştur", onClick: () => setIsNewAssignmentModalOpen(true) } : undefined}
                     />
                )}
            </Card>
            <NewAssignmentModal 
                isOpen={isNewAssignmentModalOpen} 
                onClose={() => {
                    setIsNewAssignmentModalOpen(false);
                    setPreselectedStudentId(null);
                }} 
                preselectedStudentId={preselectedStudentId}
            />
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