
import React from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Assignment, AssignmentStatus } from '../types';
import Card from '../components/Card';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, MessagesIcon } from '../components/Icons';

const StudentCard = ({ student }: { student: any }) => {
    const { getAssignmentsForStudent } = useDataContext();
    const { setActivePage } = useUI();
    const assignments = getAssignmentsForStudent(student.id);
    const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const averageGrade = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
        : 0;
        
    return (
        <Card className="flex flex-col text-center items-center">
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
            <div className="mt-4 w-full flex gap-2">
                <button onClick={() => setActivePage('assignments')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <AssignmentsIcon className="w-4 h-4"/> Ödevler
                </button>
                 <button onClick={() => setActivePage('messages')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <MessagesIcon className="w-4 h-4"/> Mesaj
                </button>
            </div>
        </Card>
    );
}

const Students = () => {
    const { students } = useDataContext();

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                {students.map(student => (
                    <StudentCard key={student.id} student={student} />
                ))}
            </div>
        </div>
    );
};

export default Students;
