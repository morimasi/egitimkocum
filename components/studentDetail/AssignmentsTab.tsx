import { useState } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { User, AssignmentStatus, Assignment } from '../../types';

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
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>{text[status]}</span>;
};

const AssignmentsTab = ({ student, onClose }: { student: User; onClose: () => void; }) => {
    const { getAssignmentsForStudent, updateAssignment } = useDataContext();
    const { setActivePage, addToast } = useUI();
    const [quickGradeValues, setQuickGradeValues] = useState<Record<string, string>>({});

    const assignments = getAssignmentsForStudent(student.id)
        .sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    const handleQuickGradeChange = (assignmentId: string, grade: string) => {
        setQuickGradeValues(prev => ({ ...prev, [assignmentId]: grade }));
    };

    const handleQuickGradeSubmit = async (assignment: Assignment) => {
        const gradeStr = quickGradeValues[assignment.id];
        if (!gradeStr || isNaN(parseInt(gradeStr, 10))) {
            addToast("Lütfen geçerli bir not girin.", "error");
            return;
        }
        const grade = parseInt(gradeStr, 10);
        if (grade < 0 || grade > 100) {
            addToast("Not 0 ile 100 arasında olmalıdır.", "error");
            return;
        }

        try {
            await updateAssignment({
                ...assignment,
                grade,
                status: AssignmentStatus.Graded,
                gradedAt: new Date().toISOString(),
                feedback: assignment.feedback || "Hızlı notlandırma ile değerlendirildi.",
            });
            addToast(`${student.name} adlı öğrencinin "${assignment.title}" ödevi notlandırıldı.`, "success");
            setQuickGradeValues(prev => {
                const newValues = { ...prev };
                delete newValues[assignment.id];
                return newValues;
            });
        } catch (e) {
            addToast("Not kaydedilirken bir hata oluştu.", "error");
        }
    };
    
    return (
        <div className="animate-fade-in">
            <h4 className="font-semibold mb-2">Ödev Listesi</h4>
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {assignments.length > 0 ? assignments.map(a => (
                    <li key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="flex-1 cursor-pointer hover:opacity-80" onClick={() => { onClose(); setActivePage('assignments', { assignmentId: a.id }); }}>
                            <p className="font-semibold">{a.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Teslim: {new Date(a.dueDate).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                           {a.status === AssignmentStatus.Submitted ? (
                               <div className="flex items-center gap-2">
                                   <input
                                       type="number"
                                       placeholder="Not"
                                       value={quickGradeValues[a.id] || ''}
                                       onChange={(e) => handleQuickGradeChange(a.id, e.target.value)}
                                       onClick={(e) => e.stopPropagation()}
                                       className="w-20 p-1 text-sm border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                                    />
                                    <button onClick={() => handleQuickGradeSubmit(a)} className="px-2 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700">Not Ver</button>
                               </div>
                           ) : (
                               <div className="flex items-center gap-4">
                                   {getStatusChip(a.status)}
                                   <p className="text-sm font-semibold w-12 text-center">Not: {a.grade ?? '-'}</p>
                               </div>
                           )}
                        </div>
                    </li>
                )) : <p className="text-sm text-gray-500 text-center py-4">Bu öğrenciye atanmış ödev bulunmuyor.</p>}
            </ul>
        </div>
    );
};
export default AssignmentsTab;
