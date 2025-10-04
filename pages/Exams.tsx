import React, { useState, useMemo, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Exam, ExamSubjectPerformance, UserRole } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { ClipboardCheckIcon, PlusCircleIcon, EditIcon, TrashIcon, SparklesIcon, XIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import ConfirmationModal from '../components/ConfirmationModal';
import { generateExamAnalysis, generateExamDetails } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SkeletonText } from '../components/SkeletonLoader';
import { examCategories } from '../services/examCategories';

const AddExamModal = ({ isOpen, onClose, examToEdit, studentId: preselectedStudentId, category, topic }: { 
    isOpen: boolean; 
    onClose: () => void; 
    examToEdit: Exam | null; 
    studentId?: string | null,
    category?: string | null,
    topic?: string | null
}) => {
    const { addExam, updateExam, students, currentUser } = useDataContext();
    const { addToast } = useUI();

    const [studentId, setStudentId] = useState(examToEdit?.studentId || preselectedStudentId || '');
    const [title, setTitle] = useState(examToEdit?.title || '');
    const [description, setDescription] = useState(''); // New field for AI
    const [totalQuestions, setTotalQuestions] = useState(examToEdit?.totalQuestions.toString() || '');
    const [date, setDate] = useState(examToEdit?.date ? examToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [correct, setCorrect] = useState(examToEdit?.correct.toString() || '');
    const [incorrect, setIncorrect] = useState(examToEdit?.incorrect.toString() || '');
    const [empty, setEmpty] = useState(examToEdit?.empty.toString() || '');
    const [subjects, setSubjects] = useState<Partial<ExamSubjectPerformance>[]>(examToEdit?.subjects || [{ name: topic || 'Genel' }]);
    const [examCategory, setExamCategory] = useState(examToEdit?.category || category || '');
    const [examTopic, setExamTopic] = useState(examToEdit?.topic || topic || '');
    const [examType, setExamType] = useState<'deneme' | 'konu-tarama'>(examToEdit?.type || (category === 'Genel Deneme Sınavları' ? 'deneme' : 'konu-tarama'));
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDetails = async () => {
        const student = students.find(s => s.id === studentId);
        if (!examCategory || !examTopic || !student?.gradeLevel) {
            addToast("Lütfen önce öğrenci, ders ve konu seçin.", "error");
            return;
        }
        setIsGenerating(true);
        try {
            const details = await generateExamDetails(examCategory, examTopic, student.gradeLevel);
            if (details) {
                setTitle(details.title);
                setDescription(details.description);
                setTotalQuestions(details.totalQuestions.toString());
                setDate(details.dueDate);
                addToast("Sınav bilgileri AI tarafından oluşturuldu!", "success");
            }
        } finally {
            setIsGenerating(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validation...
        const numCorrect = parseInt(correct) || 0;
        const numIncorrect = parseInt(incorrect) || 0;
        const numEmpty = parseInt(empty) || 0;
        const totalQ = numCorrect + numIncorrect + numEmpty;

        const processedSubjects = subjects.map(s => {
            const sCorrect = Number(s.correct) || 0;
            const sIncorrect = Number(s.incorrect) || 0;
            const sEmpty = Number(s.empty) || 0;
            return {
                name: s.name || examTopic || 'Genel', correct: sCorrect, incorrect: sIncorrect, empty: sEmpty,
                totalQuestions: sCorrect + sIncorrect + sEmpty, netScore: sCorrect - (sIncorrect / 4)
            };
        }).filter(s => s.name && s.totalQuestions > 0);
        
        const examData = {
            studentId, title, date, correct: numCorrect, incorrect: numIncorrect, empty: numEmpty, totalQuestions: totalQ,
            netScore: numCorrect - (numIncorrect / 4), subjects: processedSubjects, category: examCategory, topic: examTopic, type: examType,
        };

        if (examToEdit) {
            await updateExam({ ...examToEdit, ...examData });
            addToast("Sınav güncellendi.", "success");
        } else {
            await addExam(examData);
            addToast("Sınav eklendi.", "success");
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={examToEdit ? "Sınavı Düzenle" : "Yeni Sınav Sonucu Ekle"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <select value={examCategory} onChange={e => {setExamCategory(e.target.value); setExamTopic('')}} required className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="" disabled>Ders Seçin</option>
                        {examCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                     <select value={examTopic} onChange={e => setExamTopic(e.target.value)} required className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" disabled={!examCategory}>
                        <option value="" disabled>Konu Seçin</option>
                        {examCategories.find(c => c.name === examCategory)?.topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="p-3 border border-dashed rounded-lg bg-primary-50 dark:bg-primary-900/20">
                    <button type="button" onClick={handleGenerateDetails} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800 disabled:opacity-50">
                        <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Oluşturuluyor...' : 'AI ile Sınav Bilgilerini Doldur'}
                    </button>
                </div>

                 <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Sınav Adı (örn: TYT Deneme - 2)" required className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama (AI tarafından doldurulur)" rows={2} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={studentId} onChange={e => setStudentId(e.target.value)} required className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="" disabled>Öğrenci Seçin</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div>
                    <h4 className="font-semibold text-center mb-2">Genel Sonuç</h4>
                    <div className="grid grid-cols-4 gap-2">
                        <input type="number" value={totalQuestions} onChange={e => setTotalQuestions(e.target.value)} placeholder="Toplam Soru" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="number" value={correct} onChange={e => setCorrect(e.target.value)} placeholder="Doğru" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="number" value={incorrect} onChange={e => setIncorrect(e.target.value)} placeholder="Yanlış" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="number" value={empty} onChange={e => setEmpty(e.target.value)} placeholder="Boş" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </div>
                {/* Subject performance inputs could go here if needed */}
                <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} disabled={isGenerating}>İptal</button>
                    <button type="submit" disabled={isGenerating} className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                        {isGenerating ? 'Lütfen Bekleyin...' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ... Rest of the file remains similar to previous turn but with the new modal ...
const ExamDetailModal = ({ exam, onClose }: { exam: Exam | null; onClose: () => void; }) => {
    const { currentUser, updateExam, users } = useDataContext();
    const [analysis, setAnalysis] = useState('');
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
    const [coachNotes, setCoachNotes] = useState(exam?.coachNotes || '');
    const [studentReflections, setStudentReflections] = useState(exam?.studentReflections || '');

    const student = useMemo(() => users.find(u => u.id === exam?.studentId), [users, exam]);

    useEffect(() => {
        if (exam && student) {
            setIsLoadingAnalysis(true);
            generateExamAnalysis(exam, student.name)
                .then(setAnalysis)
                .finally(() => setIsLoadingAnalysis(false));
            setCoachNotes(exam.coachNotes || '');
            setStudentReflections(exam.studentReflections || '');
        }
    }, [exam, student]);

    if (!exam || !student) return null;

    const handleNotesSave = async () => {
        await updateExam({ ...exam, coachNotes, studentReflections });
    };

    return (
        <Modal isOpen={!!exam} onClose={onClose} title={exam.title} size="lg">
             <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500">Öğrenci</p>
                            <p className="font-semibold">{student.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tarih</p>
                            <p className="font-semibold">{new Date(exam.date).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Net</p>
                            <p className="font-bold text-2xl text-primary-600 dark:text-primary-400">{exam.netScore.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <h4 className="font-semibold mb-2">Ders Bazında Performans</h4>
                         <div className="w-full h-80">
                             <ResponsiveContainer>
                                <BarChart data={exam.subjects} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12}}/>
                                    <Tooltip />
                                    <Bar dataKey="netScore" name="Net" barSize={20}>
                                        {exam.subjects.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.netScore > (entry.totalQuestions * 0.7) ? '#22c55e' : entry.netScore > (entry.totalQuestions * 0.4) ? '#3b82f6' : '#ef4444'}/>
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                         <h4 className="font-semibold mb-2 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-primary-500"/> AI Performans Analizi</h4>
                        {isLoadingAnalysis ? (
                            <div className="space-y-3"><SkeletonText className="h-24 w-full" /><SkeletonText className="h-16 w-full" /></div>
                        ) : (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-sm max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />').replace(/### (.*?)<br \/>/g, '<h5 class="font-bold text-base mt-3 mb-1">$1</h5>') }} />
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Koç Notları</label>
                        <textarea value={coachNotes} onChange={e => setCoachNotes(e.target.value)} onBlur={handleNotesSave} rows={4} className="w-full p-2 border rounded-md bg-yellow-50 dark:bg-gray-900 dark:border-gray-600" disabled={currentUser?.role === UserRole.Student} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Öğrenci Yansımaları</label>
                        <textarea value={studentReflections} onChange={e => setStudentReflections(e.target.value)} onBlur={handleNotesSave} rows={4} className="w-full p-2 border rounded-md bg-green-50 dark:bg-gray-900 dark:border-gray-600" disabled={currentUser?.role !== UserRole.Student} />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const Exams = () => {
    const { currentUser, exams, students, deleteExam } = useDataContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
    const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    const isCoachOrAdmin = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, {name: s.name, profilePicture: s.profilePicture}])), [students]);

    const examsByStudent = useMemo(() => {
        const map = new Map<string, Exam[]>();
        exams.forEach(exam => {
            const studentExams = map.get(exam.studentId) || [];
            studentExams.push(exam);
            map.set(exam.studentId, studentExams);
        });
        for (const studentExams of map.values()) {
            studentExams.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return map;
    }, [exams]);
    
    const studentIdsWithExams = useMemo(() => Array.from(examsByStudent.keys()), [examsByStudent]);


    const categoryCounts = useMemo(() => {
        const counts = new Map<string, number>();
        exams.forEach(exam => {
            counts.set(exam.category, (counts.get(exam.category) || 0) + 1);
        });
        return counts;
    }, [exams]);
    
    const topicCounts = useMemo(() => {
        const counts = new Map<string, number>();
        exams.forEach(exam => {
            const key = `${exam.category}|${exam.topic}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return counts;
    }, [exams]);


    const filteredExams = useMemo(() => {
        let userExams = exams;
        if (currentUser?.role === UserRole.Student) {
            userExams = exams.filter(e => e.studentId === currentUser.id);
        } else if (currentUser?.role === UserRole.Parent) {
            userExams = exams.filter(e => currentUser.childIds?.includes(e.studentId));
        }

        if (selectedTopic) {
             return userExams.filter(e => e.category === selectedCategory && e.topic === selectedTopic);
        }
        if (selectedCategory) {
            return userExams.filter(e => e.category === selectedCategory);
        }
        return userExams;

    }, [exams, currentUser, selectedCategory, selectedTopic]);

    const handleSelectFilter = (category: string | null, topic: string | null) => {
        setSelectedCategory(category);
        setSelectedTopic(topic);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-1/4 xl:w-1/5 flex-shrink-0">
                <Card className="p-4">
                    {isCoachOrAdmin && (
                         <button onClick={() => { setExamToEdit(null); setIsModalOpen(true); }} className="w-full mb-4 px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-500 hover:border-primary-500 transition-colors flex items-center justify-center gap-2">
                            <PlusCircleIcon className="w-5 h-5"/>
                            <span>Yeni Sınav Ekle</span>
                        </button>
                    )}
                    <h2 className="font-bold mb-3 px-2">Kategoriler</h2>
                    <ul className="space-y-1">
                        <li>
                            <button onClick={() => handleSelectFilter(null, null)} className={`w-full text-left flex justify-between items-center p-2 rounded-md font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 ${!selectedCategory ? 'bg-primary-100 dark:bg-primary-900/50' : ''}`}>
                                Tüm Sınava Girenler
                            </button>
                        </li>
                        {examCategories.map(cat => (
                            <li key={cat.name}>
                                <button onClick={() => setOpenCategory(openCategory === cat.name ? null : cat.name)} className="w-full text-left flex justify-between items-center p-2 rounded-md font-semibold hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <span>{cat.name}</span>
                                    {categoryCounts.get(cat.name) && (
                                        <span className="ml-auto mr-2 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5">
                                            {categoryCounts.get(cat.name)}
                                        </span>
                                    )}
                                    <span className={`transform transition-transform ${openCategory === cat.name ? 'rotate-90' : 'rotate-0'}`}>{'>'}</span>
                                </button>
                                {openCategory === cat.name && (
                                     <ul className="pl-4 mt-1 space-y-1">
                                         <li><button onClick={() => handleSelectFilter(cat.name, null)} className={`w-full text-left p-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center ${selectedCategory === cat.name && !selectedTopic ? 'bg-primary-100 dark:bg-primary-900/50' : ''}`}><span>Tümünü Göster</span></button></li>
                                        {cat.topics.map(topic => (
                                            <li key={topic}>
                                                <button onClick={() => handleSelectFilter(cat.name, topic)} className={`w-full text-left p-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center ${selectedTopic === topic ? 'bg-primary-100 dark:bg-primary-900/50' : ''}`}>
                                                    <span>{topic}</span>
                                                    {topicCounts.get(`${cat.name}|${topic}`) && (
                                                        <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-full px-1.5 py-0.5">
                                                            {topicCounts.get(`${cat.name}|${topic}`)}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </Card>
            </aside>
            <main className="flex-1">
                <Card>
                    <h1 className="text-xl font-bold mb-4">{selectedTopic || selectedCategory || 'Tüm Sınava Girenler'}</h1>
                    
                    {selectedCategory === null ? (
                        // Student-centric view
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {studentIdsWithExams.map(studentId => {
                                const studentInfo = studentMap.get(studentId);
                                const studentExams = examsByStudent.get(studentId) || [];
                                if (!studentInfo) return null;
                                return (
                                    <Card key={studentId} className="p-0">
                                        <div className="p-4 border-b dark:border-slate-700 flex items-center gap-3">
                                            <img src={studentInfo.profilePicture} alt={studentInfo.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <h3 className="font-semibold">{studentInfo.name}</h3>
                                                <p className="text-sm text-slate-500">Toplam Sınav: {studentExams.length}</p>
                                            </div>
                                        </div>
                                        <ul className="p-2 max-h-48 overflow-y-auto">
                                            {studentExams.map(exam => (
                                                <li key={exam.id} onClick={() => setSelectedExam(exam)} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                                    <span className="text-sm truncate pr-2">{exam.title}</span>
                                                    <span className="text-sm font-bold text-primary-500 flex-shrink-0">{exam.netScore.toFixed(2)} Net</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : filteredExams.length > 0 ? (
                        <div className="overflow-x-auto">
                           {/* Exam List Table */}
                             <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        {isCoachOrAdmin && <th scope="col" className="px-4 py-3">Öğrenci</th>}
                                        <th scope="col" className="px-4 py-3">Sınav Adı</th>
                                        <th scope="col" className="px-4 py-3">Tarih</th>
                                        <th scope="col" className="px-4 py-3 text-center">Net</th>
                                        {isCoachOrAdmin && <th scope="col" className="px-4 py-3 text-right">Eylemler</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExams.map(exam => (
                                        <tr key={exam.id} onClick={() => setSelectedExam(exam)} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                                            {isCoachOrAdmin && <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{studentMap.get(exam.studentId)?.name}</td>}
                                            <td className="px-4 py-3 font-semibold">{exam.title}</td>
                                            <td className="px-4 py-3">{new Date(exam.date).toLocaleDateString('tr-TR')}</td>
                                            <td className="px-4 py-3 text-center font-bold text-lg text-primary-600 dark:text-primary-400">{exam.netScore.toFixed(2)}</td>
                                            {isCoachOrAdmin && (
                                                <td className="px-4 py-3 text-right space-x-2">
                                                    <button onClick={(e) => { e.stopPropagation(); setExamToEdit(exam); setIsModalOpen(true); }} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Düzenle</button>
                                                    <button onClick={(e) => { e.stopPropagation(); setExamToDelete(exam); }} className="font-medium text-red-600 dark:text-red-500 hover:underline">Sil</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState 
                            icon={<ClipboardCheckIcon className="w-12 h-12"/>}
                            title="Sınav Sonucu Bulunamadı"
                            description="Bu kategoride bir sınav sonucu yok. Yeni bir tane ekleyebilirsiniz."
                        />
                    )}
                </Card>
            </main>
            {isModalOpen && <AddExamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} examToEdit={examToEdit} category={selectedCategory} topic={selectedTopic} />}
            {selectedExam && <ExamDetailModal exam={selectedExam} onClose={() => setSelectedExam(null)} />}
            {examToDelete && <ConfirmationModal isOpen={true} onClose={() => setExamToDelete(null)} onConfirm={() => { if(examToDelete) deleteExam(examToDelete.id); setExamToDelete(null); }} title="Sınavı Sil" message={`'${examToDelete.title}' sınavını silmek istediğinizden emin misiniz?`}/>}
        </div>
    );
};

// Fix: Add default export to the component
export default Exams;