import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useDataContext } from '../contexts/DataContext';
import { ResourceCategory, Question, UserRole, QuestionDifficulty } from '../types';
import { HelpCircleIcon, CheckIcon, XIcon, DocumentIcon, SparklesIcon, PlusCircleIcon, EditIcon, TrashIcon, VideoIcon, MicIcon, ImageIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import { ResourceCategoryLabels, examCategories } from '../services/examCategories';
import Modal from '../components/Modal';
import { generateQuestion } from '../services/geminiService';
import { useUI } from '../contexts/UIContext';
import ConfirmationModal from '../components/ConfirmationModal';
import AudioRecorder from '../components/AudioRecorder';
import VideoRecorder from '../components/VideoRecorder';

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const StudentView = () => {
    const { questions } = useDataContext();
    const [filterCategory, setFilterCategory] = useState<ResourceCategory | 'all'>('all');
    const [filterTopic, setFilterTopic] = useState<string | 'all'>('all');
    
    // Quiz state
    const [quizState, setQuizState] = useState<'filtering' | 'start' | 'in-progress' | 'finished'>('filtering');
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [quizResults, setQuizResults] = useState({ correct: 0, incorrect: 0 });

    const topicsForCategory = useMemo(() => {
        if (filterCategory === 'all') return [];
        const categoryLabel = ResourceCategoryLabels[filterCategory as ResourceCategory];
        const categoryData = examCategories.find(c => c.name === categoryLabel);
        let topics = categoryData?.topics || [];
        if (categoryLabel === 'Matematik') {
            const geoCategoryData = examCategories.find(c => c.name === 'Geometri');
            if (geoCategoryData?.topics) {
                topics = [...topics, ...geoCategoryData.topics];
            }
        }
        return topics.sort();
    }, [filterCategory]);

    const displayedQuestions = useMemo(() => {
        let filtered = questions;
        if (filterCategory !== 'all') {
            filtered = filtered.filter(q => q.category === filterCategory);
        }
        if (filterTopic !== 'all') {
            filtered = filtered.filter(q => q.topic === filterTopic);
        }
        return filtered;
    }, [questions, filterCategory, filterTopic]);

     const mediaCounts = useMemo(() => {
        if (!filteredQuestions) return { image: 0, video: 0, audio: 0, document: 0 };
        return filteredQuestions.reduce((acc, q) => {
            if (q.imageUrl) acc.image++;
            if (q.videoUrl) acc.video++;
            if (q.audioUrl) acc.audio++;
            if (q.documentUrl) acc.document++;
            return acc;
        }, { image: 0, video: 0, audio: 0, document: 0 });
    }, [filteredQuestions]);

    const handleStartQuizSetup = () => {
        if (displayedQuestions.length === 0) return;
        setFilteredQuestions(shuffleArray(displayedQuestions));
        setQuizState('start');
    };

    const startQuiz = () => {
        setCurrentQuestionIndex(0);
        setQuizResults({ correct: 0, incorrect: 0 });
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
        setQuizState('in-progress');
    };

    const handleCheckAnswer = () => {
        if (selectedAnswer === null) return;
        const currentQuestion = filteredQuestions[currentQuestionIndex];
        if (selectedAnswer === currentQuestion.correctOptionIndex) {
            setQuizResults(prev => ({ ...prev, correct: prev.correct + 1 }));
        } else {
            setQuizResults(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        }
        setIsAnswerChecked(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < filteredQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswerChecked(false);
        } else {
            setQuizState('finished');
        }
    };

    const restartQuiz = () => {
        startQuiz();
    };

    const changeFilters = () => {
        setQuizState('filtering');
        setFilteredQuestions([]);
    };

    const renderMedia = (question: Question) => {
        if (question.imageUrl) {
            return <img src={question.imageUrl} alt="Soru görseli" className="max-w-full md:max-w-md mx-auto rounded-lg mb-4" />;
        }
        if (question.videoUrl) {
            return <VideoRecorder initialVideo={question.videoUrl} readOnly />;
        }
        if (question.audioUrl) {
            return <AudioRecorder initialAudio={question.audioUrl} readOnly />;
        }
        if (question.documentUrl) {
            return (
                <a href={question.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 mb-4">
                    <DocumentIcon className="w-6 h-6 text-primary-500" />
                    <span className="font-semibold">{question.documentName || 'İlgili Belge'}</span>
                </a>
            );
        }
        return null;
    };


    if (quizState === 'start') {
        const mediaSummaryItems = [
            mediaCounts.image > 0 && `${mediaCounts.image} görsel`,
            mediaCounts.video > 0 && `${mediaCounts.video} video`,
            mediaCounts.audio > 0 && `${mediaCounts.audio} ses`,
            mediaCounts.document > 0 && `${mediaCounts.document} belge`,
        ].filter(Boolean);

        return (
            <div className="flex items-center justify-center h-full">
                <Card className="text-center animate-fade-in max-w-lg">
                    <HelpCircleIcon className="w-16 h-16 text-primary-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold">Teste Hazır mısın?</h2>
                    <p className="text-slate-500 mt-2">Seçtiğin kriterlere göre bir test hazırlandı.</p>
                    
                    <div className="my-6 space-y-3 text-slate-700 dark:text-slate-200 text-left bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">Toplam Soru Sayısı:</span>
                            <span className="font-bold text-lg text-primary-600 dark:text-primary-400">{filteredQuestions.length}</span>
                        </div>
                        {mediaSummaryItems.length > 0 && (
                            <div className="flex justify-between items-center pt-3 border-t dark:border-slate-600">
                                <span className="font-semibold">Medya İçerikleri:</span>
                                <div className="text-right text-sm">
                                    {mediaSummaryItems.map(item => <div key={item}>{item}</div>)}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={changeFilters} className="px-6 py-3 font-semibold rounded-lg border dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Filtreleri Değiştir</button>
                        <button onClick={startQuiz} className="px-6 py-3 font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700">Teste Başla</button>
                    </div>
                </Card>
            </div>
        );
    }
    
    if (quizState === 'in-progress') {
        const currentQuestion = filteredQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / filteredQuestions.length) * 100;

        return (
            <Card className="max-w-3xl mx-auto animate-fade-in">
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-500">Soru {currentQuestionIndex + 1} / {filteredQuestions.length}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="text-center">
                    {renderMedia(currentQuestion)}
                    <p className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">{currentQuestion.questionText}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => {
                        const isCorrect = index === currentQuestion.correctOptionIndex;
                        const isSelected = index === selectedAnswer;
                        
                        let optionClass = "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600";
                        if (isAnswerChecked) {
                            if (isCorrect) {
                                optionClass = "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 ring-2 ring-green-500";
                            } else if (isSelected) {
                                optionClass = "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 ring-2 ring-red-500";
                            }
                        } else if (isSelected) {
                            optionClass = "bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500";
                        }
                        
                        return (
                             <button key={index} onClick={() => !isAnswerChecked && setSelectedAnswer(index)} disabled={isAnswerChecked} className={`p-4 rounded-lg text-left transition-all duration-200 ${optionClass}`}>
                                <div className="flex items-center justify-between">
                                    <span className="flex-1">{option}</span>
                                    {isAnswerChecked && isCorrect && <CheckIcon className="w-5 h-5 text-green-600" />}
                                    {isAnswerChecked && !isCorrect && isSelected && <XIcon className="w-5 h-5 text-red-600" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {currentQuestion.explanation && isAnswerChecked && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                        <strong>Açıklama:</strong> {currentQuestion.explanation}
                    </div>
                )}

                <div className="mt-6 text-center">
                    {isAnswerChecked ? (
                        <button onClick={handleNextQuestion} className="w-full md:w-auto px-8 py-3 font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                            {currentQuestionIndex === filteredQuestions.length - 1 ? 'Testi Bitir' : 'Sonraki Soru'}
                        </button>
                    ) : (
                        <button onClick={handleCheckAnswer} disabled={selectedAnswer === null} className="w-full md:w-auto px-8 py-3 font-semibold rounded-lg bg-slate-600 text-white hover:bg-slate-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Cevabı Kontrol Et
                        </button>
                    )}
                </div>
            </Card>
        );
    }
    
     if (quizState === 'finished') {
        const total = quizResults.correct + quizResults.incorrect;
        const percentage = total > 0 ? Math.round((quizResults.correct / total) * 100) : 0;
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="text-center animate-fade-in max-w-lg">
                    <h2 className="text-2xl font-bold">Test Bitti!</h2>
                    <p className="text-slate-500 mt-2">İşte sonuçların:</p>
                    <div className="my-6">
                        <div className="text-6xl font-bold text-primary-600">{percentage}%</div>
                        <p className="font-semibold">Başarı Oranı</p>
                    </div>
                    <div className="flex justify-around">
                        <div className="text-green-600">
                            <p className="text-3xl font-bold">{quizResults.correct}</p>
                            <p className="text-sm">Doğru</p>
                        </div>
                         <div className="text-red-600">
                            <p className="text-3xl font-bold">{quizResults.incorrect}</p>
                            <p className="text-sm">Yanlış</p>
                        </div>
                    </div>
                     <div className="mt-8 flex justify-center gap-4">
                        <button onClick={changeFilters} className="px-6 py-3 font-semibold rounded-lg border dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Filtreleri Değiştir</button>
                        <button onClick={restartQuiz} className="px-6 py-3 font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700">Yeniden Başla</button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2"><HelpCircleIcon className="w-8 h-8"/> Soru Bankası</h1>
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                        <select value={filterCategory} onChange={e => {setFilterCategory(e.target.value as any); setFilterTopic('all');}} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 w-full">
                             <option value="all">Tüm Dersler</option>
                            {Object.entries(ResourceCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                         <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 w-full" disabled={filterCategory === 'all'}>
                            <option value="all">Tüm Konular</option>
                            {topicsForCategory.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            {displayedQuestions.length > 0 ? (
                <div className="text-center">
                    <button onClick={handleStartQuizSetup} className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-lg">
                        Teste Başla ({displayedQuestions.length} Soru)
                    </button>
                </div>
            ) : (
                 <EmptyState 
                    icon={<HelpCircleIcon className="w-12 h-12"/>}
                    title="Soru Bulunamadı"
                    description="Seçtiğiniz kriterlerde henüz soru bulunmuyor. Farklı bir seçim yapmayı deneyin."
                />
            )}
        </div>
    );
};

const CoachView = () => {
    const { questions, deleteQuestion, students, addAssignment, currentUser } = useDataContext();
    const { addToast } = useUI();
    const [filterCategory, setFilterCategory] = useState<ResourceCategory | 'all'>('all');
    const [filterTopic, setFilterTopic] = useState<string | 'all'>('all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
    const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

    const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const topicsForCategory = useMemo(() => {
        if (filterCategory === 'all') return [];
        const categoryLabel = ResourceCategoryLabels[filterCategory as ResourceCategory];
        const categoryData = examCategories.find(c => c.name === categoryLabel);
        let topics = categoryData?.topics || [];
        if (categoryLabel === 'Matematik') {
            const geoCategoryData = examCategories.find(c => c.name === 'Geometri');
            if (geoCategoryData?.topics) {
                topics = [...topics, ...geoCategoryData.topics];
            }
        }
        return topics.sort();
    }, [filterCategory]);

    const displayedQuestions = useMemo(() => {
        let filtered = questions;
        if (filterCategory !== 'all') {
            filtered = filtered.filter(q => q.category === filterCategory);
        }
        if (filterTopic !== 'all') {
            filtered = filtered.filter(q => q.topic === filterTopic);
        }
        return filtered.sort((a, b) => (a.topic || '').localeCompare(b.topic || ''));
    }, [questions, filterCategory, filterTopic]);
    
    const handleEdit = (question: Question) => {
        setQuestionToEdit(question);
        setIsFormModalOpen(true);
    };
    
    const handleDeleteConfirm = () => {
        if (questionToDelete) {
            deleteQuestion(questionToDelete.id);
            addToast("Soru başarıyla silindi.", "success");
            setQuestionToDelete(null);
        }
    };
    
    const handleQuestionGenerated = (generatedData: Omit<Question, 'id' | 'creatorId' | 'category' | 'topic' | 'difficulty'> & { category: ResourceCategory, topic: string, difficulty: QuestionDifficulty }) => {
        setQuestionToEdit({
            ...generatedData,
            id: '', // Temporary
            creatorId: '',
        });
        setIsFormModalOpen(true);
    };

    const toggleQuestionSelection = (id: string) => {
        setSelectedQuestionIds(prev => 
            prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
        );
    };

    const handleAssignQuestions = async (studentIds: string[], dueDate: string) => {
        if (!currentUser) return;

        const description = selectedQuestionIds.map((id, index) => {
            const q = questions.find(q => q.id === id);
            return `${index + 1}. ${q?.questionText}`;
        }).join('\n');

        const assignmentBase = {
            title: "Soru Bankası Alıştırması",
            description: `Aşağıdaki ${selectedQuestionIds.length} soruyu çözünüz:\n\n${description}`,
            dueDate,
            status: 'pending' as any,
            grade: null,
            feedback: '',
            fileUrl: null,
            coachId: currentUser.id,
            submittedAt: null,
            submissionType: 'text' as any,
        };

        await addAssignment(assignmentBase, studentIds);
        addToast(`${selectedQuestionIds.length} soru ${studentIds.length} öğrenciye ödev olarak atandı.`, 'success');
        setSelectedQuestionIds([]);
        setIsAssignModalOpen(false);
    };

    return (
         <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2"><HelpCircleIcon className="w-8 h-8"/> Soru Yönetimi</h1>
                     <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-center">
                        <select value={filterCategory} onChange={e => {setFilterCategory(e.target.value as any); setFilterTopic('all');}} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex-grow">
                             <option value="all">Tüm Dersler</option>
                            {Object.entries(ResourceCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                         <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex-grow" disabled={filterCategory === 'all'}>
                            <option value="all">Tüm Konular</option>
                            {topicsForCategory.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={() => setIsAiModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5"/> AI ile Oluştur
                        </button>
                         <button onClick={() => { setQuestionToEdit(null); setIsFormModalOpen(true); }} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5"/> Yeni Soru Ekle
                        </button>
                    </div>
                </div>
            </Card>

            {displayedQuestions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {displayedQuestions.map(q => (
                        <Card key={q.id} className="flex flex-col justify-between relative">
                             <input 
                                type="checkbox"
                                className="absolute top-3 left-3 h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600"
                                checked={selectedQuestionIds.includes(q.id)}
                                onChange={() => toggleQuestionSelection(q.id)}
                            />
                            <div className="pl-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{ResourceCategoryLabels[q.category] || q.category}</p>
                                        <p className="text-xs text-slate-400">{q.topic}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(q)} className="p-1 text-gray-400 hover:text-blue-500"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => setQuestionToDelete(q)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <p className="mt-2 line-clamp-3">{q.questionText}</p>
                            </div>
                            <div className="mt-4 pt-2 border-t dark:border-slate-700 text-xs text-slate-500 flex justify-between items-center">
                                <p><strong>Doğru Cevap:</strong> {q.options[q.correctOptionIndex]}</p>
                                
                                <div className="flex items-center gap-2 text-slate-400">
                                    {q.imageUrl && <span title="Görsel içerir"><ImageIcon className="w-4 h-4" /></span>}
                                    {q.videoUrl && <span title="Video içerir"><VideoIcon className="w-4 h-4" /></span>}
                                    {q.audioUrl && <span title="Ses dosyası içerir"><MicIcon className="w-4 h-4" /></span>}
                                    {q.documentUrl && <span title="Belge içerir"><DocumentIcon className="w-4 h-4" /></span>}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState 
                    icon={<HelpCircleIcon className="w-12 h-12"/>}
                    title="Soru Bulunamadı"
                    description="Filtrelerinize uygun soru bulunamadı veya henüz soru eklenmedi."
                />
            )}

            {selectedQuestionIds.length > 0 && (
                <div className="fixed bottom-24 lg:bottom-10 right-10 z-40 animate-fade-in-right">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 flex items-center gap-4 border dark:border-slate-700">
                        <span className="text-sm font-semibold">{selectedQuestionIds.length} soru seçildi</span>
                        <button onClick={() => setIsAssignModalOpen(true)} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
                           Ödev Olarak Ata
                        </button>
                        <button onClick={() => setSelectedQuestionIds([])} className="p-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500" title="Seçimi Temizle">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            
            {isFormModalOpen && <QuestionFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} questionToEdit={questionToEdit} />}
            {isAiModalOpen && <AIQuestionGeneratorModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onQuestionGenerated={handleQuestionGenerated} />}
            {questionToDelete && <ConfirmationModal isOpen={!!questionToDelete} onClose={() => setQuestionToDelete(null)} onConfirm={handleDeleteConfirm} title="Soruyu Sil" message={`Bu soruyu kalıcı olarak silmek istediğinizden emin misiniz?`}/>}
            {isAssignModalOpen && <AssignQuestionsModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onAssign={handleAssignQuestions} questionCount={selectedQuestionIds.length} students={students} />}
        </div>
    );
};

const AssignQuestionsModal = ({ isOpen, onClose, onAssign, questionCount, students }: {
    isOpen: boolean; onClose: () => void; onAssign: (studentIds: string[], dueDate: string) => void; questionCount: number; students: any[];
}) => {
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [filterGrade, setFilterGrade] = useState('all');

    const availableStudents = useMemo(() => {
        if (filterGrade === 'all') return students;
        return students.filter(s => s.gradeLevel === filterGrade);
    }, [students, filterGrade]);

    const handleAssign = () => {
        if (selectedStudentIds.length === 0 || !dueDate) {
            alert("Lütfen en az bir öğrenci ve bir teslim tarihi seçin.");
            return;
        }
        onAssign(selectedStudentIds, dueDate);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${questionCount} Soruyu Ödev Olarak Ata`}>
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Teslim Tarihi</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Sınıf Filtresi</label>
                    <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setSelectedStudentIds([]); }} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="all">Tüm Sınıflar</option>
                        {['9','10','11','12','mezun'].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Öğrenciler</label>
                    <select multiple value={selectedStudentIds} onChange={e => setSelectedStudentIds(Array.from(e.target.selectedOptions, opt => opt.value))} className="w-full h-40 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2">İptal</button>
                <button onClick={handleAssign} className="px-4 py-2 bg-primary-600 text-white rounded-md">Ödevi Oluştur</button>
            </div>
        </Modal>
    );
};


const QuestionFormModal = ({ isOpen, onClose, questionToEdit }: { isOpen: boolean, onClose: () => void, questionToEdit: Question | null }) => {
    const { addQuestion, updateQuestion, currentUser, uploadFile } = useDataContext();
    const { addToast } = useUI();
    const [questionData, setQuestionData] = useState<Partial<Question>>({
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        difficulty: QuestionDifficulty.Medium,
        category: ResourceCategory.Matematik,
        topic: '',
        ...questionToEdit,
    });
    const [mediaType, setMediaType] = useState<'none' | 'image' | 'video' | 'audio' | 'document'>(() => {
        if (questionToEdit?.imageUrl) return 'image';
        if (questionToEdit?.videoUrl) return 'video';
        if (questionToEdit?.audioUrl) return 'audio';
        if (questionToEdit?.documentUrl) return 'document';
        return 'none';
    });
    const [isUploading, setIsUploading] = useState(false);

    const topicsForCategory = useMemo(() => {
        if (!questionData.category) return [];
        const categoryLabel = ResourceCategoryLabels[questionData.category as ResourceCategory];
        const categoryData = examCategories.find(c => c.name === categoryLabel);
        let topics = categoryData?.topics || [];
        if (categoryLabel === 'Matematik') {
            const geoCategoryData = examCategories.find(c => c.name === 'Geometri');
            if (geoCategoryData?.topics) {
                topics = [...topics, ...geoCategoryData.topics];
            }
        }
        return topics.sort();
    }, [questionData.category]);

    const handleFileForUpload = async (file: File | null) => {
        if (!file) {
            setQuestionData(prev => ({ ...prev, imageUrl: undefined, documentUrl: undefined, documentName: undefined }));
            return;
        }
        setIsUploading(true);
        try {
            // FIX: Removed the second argument from the uploadFile call
            const url = await uploadFile(file);
            if (mediaType === 'image') setQuestionData(prev => ({ ...prev, imageUrl: url, videoUrl: undefined, audioUrl: undefined, documentUrl: undefined }));
            if (mediaType === 'document') setQuestionData(prev => ({ ...prev, documentUrl: url, documentName: file.name, imageUrl: undefined, videoUrl: undefined, audioUrl: undefined }));
        } catch (e) {
            addToast("Dosya yüklenemedi", "error");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionData.questionText || !questionData.category || !questionData.topic || questionData.options?.some(o => !o)) {
            addToast("Lütfen tüm zorunlu alanları doldurun.", "error");
            return;
        }
        
        const finalData = {
            ...questionData,
            creatorId: currentUser!.id,
            options: questionData.options || [],
            correctOptionIndex: Number(questionData.correctOptionIndex) || 0,
        };

        if (questionToEdit && questionToEdit.id) {
            await updateQuestion(finalData as Question);
            addToast("Soru güncellendi.", "success");
        } else {
            await addQuestion(finalData as Omit<Question, 'id'>);
            addToast("Soru eklendi.", "success");
        }
        onClose();
    };

    const handleInputChange = (field: keyof Question, value: any) => {
        setQuestionData(prev => ({ ...prev, [field]: value }));
    };

     const handleCategoryChange = (newCategory: ResourceCategory) => {
        setQuestionData(prev => ({
            ...prev,
            category: newCategory,
            topic: '', // Reset topic when category changes
        }));
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(questionData.options || [])];
        newOptions[index] = value;
        handleInputChange('options', newOptions);
    };

    const handleMediaTypeChange = (type: typeof mediaType) => {
        setMediaType(type);
        setQuestionData(prev => ({
            ...prev,
            imageUrl: undefined, videoUrl: undefined, audioUrl: undefined, documentUrl: undefined, documentName: undefined
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={questionToEdit ? "Soruyu Düzenle" : "Yeni Soru Ekle"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={questionData.category} onChange={e => handleCategoryChange(e.target.value as ResourceCategory)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"><option value="" disabled>Ders Seçin</option>{Object.entries(ResourceCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                    <select value={questionData.topic || ''} onChange={e => handleInputChange('topic', e.target.value)} required className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" disabled={!questionData.category || topicsForCategory.length === 0}>
                        <option value="" disabled>Konu Seçin</option>
                        {topicsForCategory.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={questionData.difficulty} onChange={e => handleInputChange('difficulty', e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"><option value={QuestionDifficulty.Easy}>Kolay</option><option value={QuestionDifficulty.Medium}>Orta</option><option value={QuestionDifficulty.Hard}>Zor</option></select>
                </div>
                <textarea value={questionData.questionText} onChange={e => handleInputChange('questionText', e.target.value)} rows={4} placeholder="Soru metnini buraya yazın..." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                <div>
                    <label className="block text-sm font-medium mb-2">Medya Ekle (İsteğe Bağlı)</label>
                    <div className="flex flex-wrap gap-3 mb-3">{['none', 'image', 'video', 'audio', 'document'].map(type => <label key={type} className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="mediaType" value={type} checked={mediaType === type} onChange={() => handleMediaTypeChange(type as any)} className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>{ {none: 'Hiçbiri', image: 'Görsel', video: 'Video', audio: 'Ses', document: 'Belge'}[type] }</label>)}</div>
                    {mediaType === 'image' && <div><label className="text-sm font-medium">Görsel Yükle</label><input type="file" accept="image/*" onChange={e => handleFileForUpload(e.target.files ? e.target.files[0] : null)} className="w-full text-sm"/></div>}
                    {mediaType === 'video' && <div><label className="text-sm font-medium">Video Kaydet/Yükle</label><VideoRecorder onSave={url => handleInputChange('videoUrl', url)} initialVideo={questionData.videoUrl}/></div>}
                    {mediaType === 'audio' && <div><label className="text-sm font-medium">Ses Kaydet/Yükle</label><AudioRecorder onSave={url => handleInputChange('audioUrl', url)} initialAudio={questionData.audioUrl}/></div>}
                    {mediaType === 'document' && <div><label className="text-sm font-medium">Belge Yükle</label><input type="file" onChange={e => handleFileForUpload(e.target.files ? e.target.files[0] : null)} className="w-full text-sm"/></div>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questionData.options?.map((opt, i) => <div key={i} className="flex items-center gap-2"><input type="radio" name="correctOption" checked={questionData.correctOptionIndex === i} onChange={() => handleInputChange('correctOptionIndex', i)} className="h-5 w-5 text-primary-600 focus:ring-primary-500"/><input type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Seçenek ${i+1}`} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /></div>)}
                </div>
                <textarea value={questionData.explanation} onChange={e => handleInputChange('explanation', e.target.value)} rows={3} placeholder="Doğru cevabın açıklaması (isteğe bağlı)..." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                <div className="flex justify-end pt-4"><button onClick={onClose} type="button" className="px-4 py-2 mr-2">İptal</button><button type="submit" disabled={isUploading} className="px-4 py-2 bg-primary-600 text-white rounded-md disabled:opacity-50">{isUploading ? 'Yükleniyor...' : 'Kaydet'}</button></div>
            </form>
        </Modal>
    );
};

const AIQuestionGeneratorModal = ({ isOpen, onClose, onQuestionGenerated }: { isOpen: boolean, onClose: () => void, onQuestionGenerated: (q: any) => void }) => {
    const { addToast } = useUI();
    const [category, setCategory] = useState(ResourceCategory.Matematik);
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState(QuestionDifficulty.Easy);
    const [isLoading, setIsLoading] = useState(false);

    const topicsForCategory = useMemo(() => {
        const categoryLabel = ResourceCategoryLabels[category];
        const categoryData = examCategories.find(c => c.name === categoryLabel);
        let topics = categoryData?.topics || [];
        if (categoryLabel === 'Matematik') {
            const geoCategoryData = examCategories.find(c => c.name === 'Geometri');
            if (geoCategoryData?.topics) {
                topics = [...topics, ...geoCategoryData.topics];
            }
        }
        return topics.sort();
    }, [category]);

    const handleCategoryChange = (newCategory: ResourceCategory) => {
        setCategory(newCategory);
        setTopic('');
    };

    const handleGenerate = async () => {
        if (!topic) {
            addToast("Lütfen bir konu seçin.", "error");
            return;
        }
        setIsLoading(true);
        try {
            const result = await generateQuestion(ResourceCategoryLabels[category], topic, difficulty);
            if (result) {
                onQuestionGenerated({ ...result, category, topic, difficulty });
                addToast("Soru başarıyla oluşturuldu.", "success");
                onClose();
            } else {
                throw new Error("AI'dan geçerli bir yanıt alınamadı.");
            }
        } catch (error) {
            addToast("Soru oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI ile Soru Oluştur">
            <div className="space-y-4">
                <select value={category} onChange={e => handleCategoryChange(e.target.value as ResourceCategory)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">{Object.entries(ResourceCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                <select value={topic} onChange={e => setTopic(e.target.value)} required className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" disabled={topicsForCategory.length === 0}>
                    <option value="" disabled>Konu Seçin</option>
                    {topicsForCategory.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as QuestionDifficulty)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <option value={QuestionDifficulty.Easy}>Kolay</option>
                    <option value={QuestionDifficulty.Medium}>Orta</option>
                    <option value={QuestionDifficulty.Hard}>Zor</option>
                </select>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} disabled={isLoading}>İptal</button>
                <button onClick={handleGenerate} disabled={isLoading} className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50"><SparklesIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />{isLoading ? 'Oluşturuluyor...' : 'Oluştur'}</button>
            </div>
        </Modal>
    );
};


const SoruBankasi = () => {
    const { currentUser } = useDataContext();

    if (!currentUser) {
        return <EmptyState icon={<HelpCircleIcon className="w-12 h-12"/>} title="Yükleniyor..." description="Lütfen bekleyin." />;
    }

    if (currentUser.role === UserRole.Student) {
        return <StudentView />;
    } else {
        return <CoachView />;
    }
};

export default SoruBankasi;