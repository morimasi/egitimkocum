import React, { useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Assignment, AssignmentStatus } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, MessagesIcon } from '../components/Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const StudentDetailModal = ({ student, onClose }: { student: User | null; onClose: () => void; }) => {
    const { getAssignmentsForStudent } = useDataContext();
    if (!student) return null;

    const assignments = getAssignmentsForStudent(student.id);
    const pendingCount = assignments.filter(a => a.status === AssignmentStatus.Pending).length;
    const submittedCount = assignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const gradedCount = assignments.filter(a => a.status === AssignmentStatus.Graded).length;
    const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    
    const averageGrade = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
        : 0;

    const gradeHistory = gradedAssignments
        .sort((a,b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime())
        .map((a, index) => ({
            name: `Ödev ${index + 1}`,
            "Not": a.grade,
        }));

    return (
        <Modal isOpen={!!student} onClose={onClose} title={`${student.name} - Performans Detayları`} size="lg">
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <img src={student.profilePicture} alt={student.name} className="w-20 h-20 rounded-full" />
                    <div>
                        <h3 className="text-2xl font-bold">{student.name}</h3>
                        <p className="text-gray-500">{student.email}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-2xl font-bold">{assignments.length}</p>
                        <p className="text-sm text-gray-500">Toplam Ödev</p>
                    </div>
                     <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-300">{averageGrade}</p>
                        <p className="text-sm text-green-700 dark:text-green-400">Not Ort.</p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{pendingCount}</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">Bekleyen</p>
                    </div>
                     <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{submittedCount + gradedCount}</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">Tamamlanan</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Not Gelişim Grafiği</h4>
                     <Card>
                        <div style={{ width: '100%', height: 250 }}>
                           <ResponsiveContainer>
                                <LineChart data={gradeHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }}/>
                                    <Line type="monotone" dataKey="Not" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        </Modal>
    );
};

const StudentCard = ({ student, onSelect }: { student: User; onSelect: (student: User) => void }) => {
    const { getAssignmentsForStudent } = useDataContext();
    
    const assignments = getAssignmentsForStudent(student.id);
    const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const averageGrade = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
        : 0;
        
    return (
        <Card className="flex flex-col text-center items-center cursor-pointer" onClick={() => onSelect(student)}>
            <img src={student.profilePicture} alt={student.name} className="w-24 h-24 rounded-full -mt-12 border-4 border-white dark:border-gray-800" />
            <h4 className="text-xl font-bold mt-4">{student.name}</h4>
            <p className="text-sm text-gray-500">{student.email}</p>
            <div className="flex justify-around w-full mt-6 border-t dark:border-gray-700 pt-4">
                <div className="text-center">
                    <p className="font-bold text-lg">{assignments.length}</p>
                    <p className="text-xs text-gray-500">Toplam Ödev</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg text-primary-500">{averageGrade}</p>
                    <p className="text-xs text-gray-500">Not Ort.</p>
                </div>
            </div>
        </Card>
    );
}

const Students = () => {
    const { students } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    return (
        <>
        <div className="space-y-6">
            <div className="flex justify-end">
                <input
                    type="text"
                    placeholder="Öğrenci ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 w-full sm:w-64"
                />
            </div>

            {students.length === 0 ? (
                 <Card>
                    <div className="text-center py-10">
                        <h3 className="text-lg font-semibold">Henüz öğrenciniz yok.</h3>
                        <p className="text-gray-500 mt-2">Süper Admin panelinden yeni öğrenciler ekleyebilirsiniz.</p>
                    </div>
                </Card>
            ) : filteredStudents.length === 0 ? (
                 <Card>
                    <div className="text-center py-10">
                        <h3 className="text-lg font-semibold">Öğrenci bulunamadı.</h3>
                        <p className="text-gray-500 mt-2">Arama kriterlerinizi değiştirmeyi deneyin.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                    {filteredStudents.map(student => (
                        <StudentCard key={student.id} student={student} onSelect={setSelectedStudent} />
                    ))}
                </div>
            )}
        </div>
        {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
        </>
    );
};

export default Students;