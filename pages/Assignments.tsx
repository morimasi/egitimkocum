import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, Assignment, AssignmentStatus, User, ChecklistItem, SubmissionType, AcademicTrack, AssignmentTemplate } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { SparklesIcon, XIcon, AssignmentsIcon as NoAssignmentsIcon, CheckIcon, TrashIcon, ArrowLeftIcon } from '../components/Icons';
import { useUI } from '../contexts/UIContext';
import { generateAssignmentDescription, generateSmartFeedback, generateAssignmentChecklist, suggestGrade } from '../services/geminiService';
import AudioRecorder from '../components/AudioRecorder';
import FileUpload from '../components/FileUpload';
import EmptyState from '../components/EmptyState';
import VideoRecorder from '../components/VideoRecorder';
import ConfirmationModal from '../components/ConfirmationModal';

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
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden border-l-4 p-4 ${isOverdue ? 'border-red-500' : 'border-transparent'} ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
        >
             {isCoach && (
                <input 
                    type="checkbox"
                    className="absolute top-3 left-3 h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 z-10"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelect(assignment.id);
                    }}
                    aria-label={`Select assignment ${assignment.title}`}
                />
            )}
            <div>
                <div className={`flex justify-between items-start gap-2 ${isCoach ? 'pl-8' : ''}`}>
                    <h3 className="font-bold text-gray-900 dark:text-white pr-2 leading-tight flex-1">{assignment.title}</h3>
                    {getStatusChip(assignment.status)}
                </div>

                {isCoach && <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${isCoach ? 'pl-8' : ''}`}>{studentName}</p>}
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
            checklist: checklist.map((item, index) => ({ ...item, id: `chk-${Date.now()}-${index}`, isCompleted: false })),
            feedbackReaction: null,
            submissionType,
            videoDescriptionUrl,
            videoFeedbackUrl: null,
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
                 {!preselectedStudentIds && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1">Sınıf Filtresi</label>
                            <select
                                value={filterGrade}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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
                            <select multiple value={selectedStudents} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStudents(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-2 border rounded-md h-32 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                {Object.entries(availableStudents).map(([track, studentGroup]) => (
                                    <optgroup key={track} label={track}>
                                        {studentGroup.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Oluştur</button>
                </div>
            </form>
        </Modal>
    );
};


const AssignmentDetailModal = ({ assignment, onClose, studentName, onNavigate, canNavigate }: { assignment: Assignment | null, onClose: () => void, studentName: string | undefined, onNavigate?: (direction: 'next' | 'prev') => void, canNavigate?: { next: boolean, prev: boolean } }) => {
    const { currentUser, updateAssignment, uploadFile, getAssignmentsForStudent, assignments: allAssignments } = useDataContext();
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
        await updateAssignment({ ...assignment, studentAudioFeedbackResponseUrl, studentVideoFeedbackResponseUrl });
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
                             <button onClick={() => onNavigate('prev')} disabled={!canNavigate?.prev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"><ArrowLeftIcon className="w-5 h-5"/></button>
                             <button onClick={() => onNavigate('next')} disabled={!canNavigate?.next} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"><ArrowLeftIcon className="w-5 h-5 transform rotate-180"/></button>
                        </div>
                     )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{assignment.description}</p>
                 <p className="text-xs text-gray-500">Teslim Tarihi: {new Date(assignment.dueDate).toLocaleString('tr-TR')}</p>
                 
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
                                    <input type="checkbox" id={`chk-${item.id}`} checked={item.isCompleted} onChange={() => handleChecklistToggle(item.id)} disabled={!isStudentViewing || isSubmitted} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50" />
                                    <label htmlFor={`chk-${item.id}`} className={`ml-3 text-sm ${item.isCompleted ? 'line-through text-gray-500' : ''} ${!isStudentViewing || isSubmitted ? 'cursor-default' : ''}`}>{item.text}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}

                <div className="pt-4 border-t dark:border-gray-700">
                    {isSubmitted ? (
                        <div>
                            <h4 className="font-semibold mb-2">Teslim Edilen Çalışma</h4>
                            {assignment.fileUrl && <p>Dosya: <a href={assignment.fileUrl} download={assignment.fileName} className="text-primary-500 underline">{assignment.fileName}</a></p>}
                            {assignment.textSubmission && <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded"><p className="text-sm italic whitespace-pre-wrap">"{assignment.textSubmission}"</p></div>}
                            {assignment.studentVideoSubmissionUrl && <VideoRecorder initialVideo={assignment.studentVideoSubmissionUrl} readOnly />}
                            {!assignment.fileUrl && !assignment.textSubmission && !assignment.studentVideoSubmissionUrl && <p className="text-sm italic">Bu ödev "Tamamlandı" olarak işaretlendi.</p>}
                        </div>
                    ) : isStudentViewing ? (
                        <div>
                             <h4 className="font-semibold mb-2">Ödevi Teslim Et</h4>
                             {assignment.submissionType === 'file' && <FileUpload onUpload={handleFileUpload} isUploading={isUploading}/>}
                             {assignment.submissionType === 'text' && <textarea value={textSubmission} onChange={e => setTextSubmission(e.target.value)} rows={5} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />}
                             <button onClick={handleSubmission} className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={isUploading}>
                                {isUploading ? 'Yükleniyor...' : 'Teslim Et'}
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* Grading Section */}
                {isCoach && isSubmitted && (
                    <div className="pt-4 border-t dark:border-gray-700">
                        <h4 className="font-semibold mb-2">Değerlendirme</h4>
                        <div className="flex items-center gap-2 mb-2">
                            <input type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="Not (0-100)" className="w-32 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                            <button type="button" onClick={handleSuggestGrade} disabled={isSuggestingGrade} className="flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50">
                                <SparklesIcon className={`w-4 h-4 mr-1 ${isSuggestingGrade ? 'animate-spin' : ''}`} />
                                {isSuggestingGrade ? 'Öneriliyor...' : '✨ Not Öner'}
                            </button>
                        </div>
                         {gradeRationale && <p className="text-xs text-gray-500 italic p-2 bg-gray-100 dark:bg-gray-700 rounded-md mb-2">Öneri: {gradeRationale}</p>}
                        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} placeholder="Geri bildirim yazın..." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
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
                     <div className="pt-4 border-t dark:border-gray-700 space-y-4">
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
                        </div>
                         {isStudentViewing && (
                             <div>
                                <h4 className="font-semibold mb-2">Geri Bildirime Yanıtın (İsteğe Bağlı)</h4>
                                 <div className="space-y-3">
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
                <p className="text-sm text-gray-500">Seçilen tüm ödevlere aynı not ve geri bildirim uygulanacaktır.</p>
                <div>
                    <label className="block text-sm font-medium mb-1">Not (0-100)</label>
                    <input type="number" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Geri Bildirim (İsteğe Bağlı)</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
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

    const isCoach = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    
    const displayedAssignments = useMemo(() => {
        let filtered = assignments;
        if (currentUser?.role === UserRole.Student) {
            filtered = assignments.filter(a => a.studentId === currentUser.id);
        }
        if (filterStatus !== 'all') {
            filtered = filtered.filter(a => a.status === filterStatus);
        }
        if (isCoach && filterStudent !== 'all') {
            filtered = filtered.filter(a => a.studentId === filterStudent);
        }
        if (searchTerm) {
            filtered = filtered.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [assignments, currentUser, filterStatus, isCoach, filterStudent, searchTerm]);

     useEffect(() => {
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
            setInitialFilters({});
        }
    }, [initialFilters, setInitialFilters, displayedAssignments]);

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


    const handleToggleSelect = (id: string) => {
        setSelectedAssignmentIds(prev => 
            prev.includes(id) ? prev.filter(prevId => prevId !== id) : [...prev, id]
        );
    };
    
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
            const assignment = assignments.find(a => a.id === id);
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
    
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <select value={filterStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as AssignmentStatus | 'all')} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <option value="all">Tüm Durumlar</option>
                            <option value={AssignmentStatus.Pending}>Bekleyen</option>
                            <option value={AssignmentStatus.Submitted}>Teslim Edilen</option>
                            <option value={AssignmentStatus.Graded}>Notlandırılan</option>
                        </select>
                        {isCoach && (
                            <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                <option value="all">Tüm Öğrenciler</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                         <input type="text" placeholder="Ödev ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex-grow" />
                          {isCoach && (
                            <div className="flex items-center">
                                <input 
                                    type="checkbox"
                                    id="select-all"
                                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
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
                    {displayedAssignments.map(assignment => (
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 flex items-center gap-4 border dark:border-gray-700">
                        <span className="text-sm font-semibold">{selectedAssignmentIds.length} ödev seçildi</span>
                        <button onClick={() => setIsBatchGradeModalOpen(true)} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
                           ✅ Notlandır
                        </button>
                        <button onClick={() => setIsConfirmDeleteOpen(true)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <NewAssignmentModal 
                isOpen={isNewAssignmentModalOpen} 
                onClose={() => setIsNewAssignmentModalOpen(false)} 
                preselectedStudentIds={filterStudent !== 'all' ? [filterStudent] : null}
            />

            {selectedAssignment && (
                <AssignmentDetailModal
                    assignment={selectedAssignment}
                    onClose={() => setSelectedAssignmentIndex(null)}
                    studentName={studentMap.get(selectedAssignment.studentId)}
                    onNavigate={handleNavigation}
                    canNavigate={navigationState}
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