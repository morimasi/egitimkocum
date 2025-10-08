

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
        const mediaSummaryItems: string[] = [];
        if (mediaCounts.image > 0) mediaSummaryItems.push(`${mediaCounts.image} görsel`);
        if (mediaCounts.video > 0) mediaSummaryItems.push(`${mediaCounts.video} video`);
        if (mediaCounts.audio > 0) mediaSummaryItems.push(`${mediaCounts.audio} ses`);
        if (mediaCounts.document > 0) mediaSummaryItems.push(`${mediaCounts.document} doküman`);
        
        return (
             <Card className="text-center">
                <h2 className="text-2xl font-bold">Teste Hazır Mısın?</h2>
                <p className="text-slate-500 mt-2">Seçtiğin konu başlıklarına göre <strong className="text-primary-500">{filteredQuestions.length}</strong> soru bulundu.</p>
                {mediaSummaryItems.length > 0 && <p className="text-sm text-slate-400 mt-1">Bu test {mediaSummaryItems.join(', ')} içermektedir.</p>}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={changeFilters} className="px-6 py-3 border rounded-lg font-semibold">Filtreleri Değiştir</button>
                    <button onClick={startQuiz} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold">Teste Başla</button>
                </div>
            </Card>
        );
    }

    if (quizState === 'in-progress') {
        const currentQuestion = filteredQuestions[currentQuestionIndex];
        return (
             <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Soru {currentQuestionIndex + 1}/{filteredQuestions.length}</h2>
                    <div className="flex gap-4 text-sm">
                        <span className="font-semibold text-green-500">Doğru: {quizResults.correct}</span>
                        <span className="font-semibold text-red-500">Yanlış: {quizResults.incorrect}</span>
                    </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-6">
                    <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%` }}></div>
                </div>

                <div className="text-center mb-6">
                    {renderMedia(currentQuestion)}
                    <p className="text-lg leading-relaxed">{currentQuestion.questionText}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => {
                        const isCorrect = index === currentQuestion.correctOptionIndex;
                        let optionClass = 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600';
                        if (isAnswerChecked) {
                            if (isCorrect) optionClass = 'bg-green-500 text-white';
                            else if (selectedAnswer === index) optionClass = 'bg-red-500 text-white';
                        } else if (selectedAnswer === index) {
                            optionClass = 'bg-primary-500 text-white';
                        }
                        
                        return (
                            <button key={index} onClick={() => !isAnswerChecked && setSelectedAnswer(index)} disabled={isAnswerChecked} className={`p-4 rounded-lg text-left transition-colors ${optionClass}`}>
                                <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}:</span>
                                {option}
                            </button>
                        );
                    })}
                </div>

                {isAnswerChecked && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg animate-fade-in">
                        <h4 className="font-bold text-blue-800 dark:text-blue-200">Açıklama</h4>
                        <p className="text-sm mt-2">{currentQuestion.explanation}</p>
                    </div>
                )}

                <div className="mt-8 text-center">
                    {isAnswerChecked ? (
                        <button onClick={handleNextQuestion} className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold">
                            {currentQuestionIndex < filteredQuestions.length - 1 ? 'Sonraki Soru' : 'Testi Bitir'}
                        </button>
                    ) : (
                        <button onClick={handleCheckAnswer} disabled={selectedAnswer === null} className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold disabled:bg-slate-300 dark:disabled:bg-slate-600">
                            Cevabı Kontrol Et
                        </button>
                    )}
                </div>
             </Card>
        );
    }
    
    if (quizState === 'finished') {
        const score = quizResults.correct / filteredQuestions.length * 100;
        return (
             <Card className="text-center">
                 <h2 className="text-2xl font-bold">Test Tamamlandı!</h2>
                 <p className="text-5xl font-bold my-4">{score.toFixed(1)}%</p>
                 <div className="flex justify-center gap-8 text-lg">
                    <p><span className="font-bold text-green-500">{quizResults.correct}</span> Doğru</p>
                    <p><span className="font-bold text-red-500">{quizResults.incorrect}</span> Yanlış</p>
                 </div>
                 <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                     <button onClick={changeFilters} className="px-6 py-3 border rounded-lg font-semibold">Yeni Test</button>
                     <button onClick={restartQuiz} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold">Tekrar Çöz</button>
                 </div>
            </Card>
        );
    }


    return (
        <Card>
            <h2 className="text-2xl font-bold mb-4">Soru Çözme Modu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <select value={filterCategory} onChange={e => {setFilterCategory(e.target.value as ResourceCategory | 'all'); setFilterTopic('all');}} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <option value="all">Tüm Dersler</option>
                    {(Object.entries(ResourceCategoryLabels) as [string, string][]).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
                 <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" disabled={filterCategory === 'all'}>
                    <option value="all">Tüm Konular</option>
                    {topicsForCategory.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                </select>
            </div>
            <div className="mt-6 text-center">
                 <button onClick={handleStartQuizSetup} disabled={displayedQuestions.length === 0} className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold text-lg disabled:bg-slate-300 dark:disabled:bg-slate-600">
                    Teste Başla ({displayedQuestions.length} Soru)
                </button>
            </div>
        </Card>
    );
};

const CoachView = () => {
    // Coach/Admin view for managing questions
    return <Card><p>Soru Bankası Yönetim Paneli yakında burada olacak.</p></Card>;
};


const SoruBankasi = () => {
    const { currentUser } = useDataContext();

    return (
        <div className="space-y-6">
            <Card>
                <div className="text-center">
                    <HelpCircleIcon className="w-16 h-16 text-primary-500 mx-auto" />
                    <h1 className="text-3xl font-bold mt-2">Soru Bankası</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto mt-2">
                        {currentUser?.role === UserRole.Student 
                            ? "Ders ve konu seçerek hemen soru çözmeye başla, bilgilerini pekiştir!"
                            : "Öğrencileriniz için soru ekleyin, düzenleyin ve onların pratik yapmasını sağlayın."}
                    </p>
                </div>
            </Card>
            
            {currentUser?.role === UserRole.Student ? <StudentView /> : <CoachView />}
        </div>
    );
};

export default SoruBankasi;