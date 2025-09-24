
import React, { useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, Assignment, AssignmentStatus, User } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { SparklesIcon } from '../components/Icons';
import { useUI } from '../contexts/UIContext';
import { generateAssignmentDescription, generateSmartFeedback } from '../services/geminiService';

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


const AssignmentRow = ({ assignment, onSelect, studentName }: { assignment: Assignment, onSelect: (assignment: Assignment) => void, studentName: string }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => onSelect(assignment)}>
        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{assignment.title}</td>
        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{studentName}</td>
        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</td>
        <td className="py-3 px-4 text-center">{getStatusChip(assignment.status)}</td>
        <td className="py-3 px-4 text-sm font-semibold text-center hidden md:table-cell">{assignment.grade ?? '-'}</td>
    </tr>
);

const NewAssignmentModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { coach, students, addAssignment } = useDataContext();
    const { addToast } = useUI();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDescription = async () => {
        if (!title) {
            addToast("Lütfen önce bir ödev başlığı girin.", "error");
            return;
        }
        setIsGenerating(true);
        try {
            const generatedDesc = await generateAssignmentDescription(title);
            setDescription(generatedDesc);
        } catch(e) {
            addToast("Açıklama üretilemedi.", "error");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !dueDate || selectedStudents.length === 0 || !coach) {
            addToast("Lütfen tüm alanları doldurun ve en az bir öğrenci seçin.", "error");
            return;
        }
        const newAssignmentBase = {
            title,
            description,
            dueDate,
            status: AssignmentStatus.Pending,
            grade: null,
            feedback: '',
            fileUrl: null,
            coachId: coach.id,
            submittedAt: null
        };
        addAssignment(newAssignmentBase, selectedStudents);
        addToast("Ödev başarıyla oluşturuldu.", "success");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Yeni Ödev Oluştur">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Ödev Başlığı</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Açıklama</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50">
                        <SparklesIcon className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Oluşturuluyor...' : '✨ Açıklama Oluştur'}
                    </button>
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
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border">İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Oluştur</button>
                </div>
            </form>
        </Modal>
    );
};


const AssignmentDetailModal = ({ assignment, onClose, studentName }: { assignment: Assignment | null, onClose: () => void, studentName: string | undefined }) => {
    const { currentUser, updateAssignment } = useDataContext();
    const { addToast } = useUI();
    const [grade, setGrade] = useState<string>(assignment?.grade?.toString() || '');
    const [feedback, setFeedback] = useState(assignment?.feedback || '');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!assignment || !currentUser) return null;
    
    const isCoach = currentUser.role === UserRole.Coach;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files.length > 0) {
            updateAssignment({ ...assignment, status: AssignmentStatus.Submitted, fileUrl: e.target.files[0].name, submittedAt: new Date().toISOString() });
            addToast("Ödev dosyası başarıyla yüklendi.", "success");
            onClose();
        }
    };
    
    const handleGradeSubmit = () => {
        if (!grade) {
            addToast("Lütfen bir not girin.", "error");
            return;
        }
        updateAssignment({ ...assignment, status: AssignmentStatus.Graded, grade: parseInt(grade, 10), feedback });
        addToast("Ödev notlandırıldı.", "success");
        onClose();
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
    
    return (
        <Modal isOpen={!!assignment} onClose={onClose} title={assignment.title}>
            <div className="space-y-4">
                <p><strong className="font-semibold">Öğrenci:</strong> {studentName}</p>
                <p><strong className="font-semibold">Teslim Tarihi:</strong> {new Date(assignment.dueDate).toLocaleString('tr-TR')}</p>
                <p><strong className="font-semibold">Durum:</strong> {getStatusChip(assignment.status)}</p>
                <p className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md">{assignment.description}</p>
                {assignment.fileUrl && <p><strong className="font-semibold">Teslim Edilen Dosya:</strong> <a href="#" className="text-primary-500">{assignment.fileUrl}</a></p>}
                
                {/* Student View */}
                {!isCoach && assignment.status === AssignmentStatus.Pending && (
                    <div>
                        <label className="w-full text-center cursor-pointer bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 block">
                            Dosya Yükle
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                )}
                {!isCoach && assignment.status === AssignmentStatus.Graded && (
                    <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-md">
                        <h4 className="font-semibold text-lg">Notunuz: {assignment.grade}/100</h4>
                        <p className="mt-2 text-sm"><strong className="font-semibold">Koç Geri Bildirimi:</strong> {assignment.feedback}</p>
                    </div>
                )}

                {/* Coach View */}
                {isCoach && assignment.status === AssignmentStatus.Submitted && (
                    <div className="space-y-4 pt-4 border-t dark:border-gray-600">
                        <h4 className="font-semibold">Not ve Geri Bildirim</h4>
                        <div>
                            <label className="block text-sm font-medium mb-1">Not (0-100)</label>
                            <input type="number" min="0" max="100" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Geri Bildirim</label>
                             <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                             <button type="button" onClick={handleGenerateFeedback} disabled={isGenerating} className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50">
                                <SparklesIcon className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                                {isGenerating ? 'Oluşturuluyor...' : '✨ Akıllı Geri Bildirim'}
                             </button>
                        </div>
                        <div className="text-right">
                            <button onClick={handleGradeSubmit} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Kaydet</button>
                        </div>
                    </div>
                )}
                 {isCoach && assignment.status === AssignmentStatus.Graded && (
                    <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-md">
                        <h4 className="font-semibold text-lg">Not: {assignment.grade}/100</h4>
                        <p className="mt-2 text-sm"><strong className="font-semibold">Geri Bildirim:</strong> {assignment.feedback}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};


const Assignments = () => {
    const { currentUser, assignments, users, getAssignmentsForStudent } = useDataContext();
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [filterStatus, setFilterStatus] = useState<AssignmentStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
    
    const isCoach = currentUser?.role === UserRole.Coach;
    const displayedAssignments = isCoach
        ? assignments
        : (currentUser ? getAssignmentsForStudent(currentUser.id) : []);

    const filteredAssignments = useMemo(() => {
        return displayedAssignments
            .filter(a => filterStatus === 'all' || a.status === filterStatus)
            .filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [displayedAssignments, filterStatus, searchTerm]);

    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Bilinmiyor';

    return (
        <>
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex gap-2">
                        <input type="text" placeholder="Ödev ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as AssignmentStatus | 'all')} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <option value="all">Tüm Durumlar</option>
                            <option value={AssignmentStatus.Pending}>Bekliyor</option>
                            <option value={AssignmentStatus.Submitted}>Teslim Edildi</option>
                            <option value={AssignmentStatus.Graded}>Notlandırıldı</option>
                        </select>
                    </div>
                    {isCoach && <button onClick={() => setIsNewAssignmentModalOpen(true)} className="w-full md:w-auto px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Yeni Ödev Oluştur</button>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Başlık</th>
                                {isCoach && <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 hidden md:table-cell">Öğrenci</th>}
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
                </div>
            </Card>
            {isNewAssignmentModalOpen && <NewAssignmentModal isOpen={isNewAssignmentModalOpen} onClose={() => setIsNewAssignmentModalOpen(false)} />}
            {selectedAssignment && <AssignmentDetailModal assignment={selectedAssignment} onClose={() => setSelectedAssignment(null)} studentName={getUserName(selectedAssignment.studentId)} />}
        </>
    );
};

export default Assignments;
