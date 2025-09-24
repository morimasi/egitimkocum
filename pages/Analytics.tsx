
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useDataContext } from '../contexts/DataContext';
import { AssignmentStatus, UserRole } from '../types';
import Card from '../components/Card';

const COLORS = {
    [AssignmentStatus.Pending]: '#facc15', // yellow-400
    [AssignmentStatus.Submitted]: '#3b82f6', // blue-500
    [AssignmentStatus.Graded]: '#22c55e', // green-500
};

const STATUS_NAMES = {
    [AssignmentStatus.Pending]: 'Bekliyor',
    [AssignmentStatus.Submitted]: 'Teslim Edildi',
    [AssignmentStatus.Graded]: 'Notlandırıldı',
};

const CoachAnalytics = () => {
    const { assignments, students } = useDataContext();

    const statusData = [
        { name: STATUS_NAMES[AssignmentStatus.Pending], value: assignments.filter(a => a.status === AssignmentStatus.Pending).length },
        { name: STATUS_NAMES[AssignmentStatus.Submitted], value: assignments.filter(a => a.status === AssignmentStatus.Submitted).length },
        { name: STATUS_NAMES[AssignmentStatus.Graded], value: assignments.filter(a => a.status === AssignmentStatus.Graded).length },
    ];
    
    const radarData = students.map(student => {
        const studentAssignments = assignments.filter(a => a.studentId === student.id);
        const graded = studentAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const averageGrade = graded.length > 0 ? graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length : 0;
        const completionRate = studentAssignments.length > 0 ? (studentAssignments.filter(a => a.status !== AssignmentStatus.Pending).length / studentAssignments.length) * 100 : 0;
        
        return {
            subject: student.name,
            A: averageGrade, // Not Ortalaması
            B: completionRate, // Tamamlama Oranı
            fullMark: 100
        };
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Tüm Ödevlerin Durum Dağılımı">
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}>
                                {statusData.map((entry, index) => {
                                    const statusKey = Object.keys(STATUS_NAMES).find(key => STATUS_NAMES[key as AssignmentStatus] === entry.name) as AssignmentStatus;
                                    return <Cell key={`cell-${index}`} fill={COLORS[statusKey]} />;
                                })}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card title="Öğrenci Performans Karşılaştırması">
                 <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]}/>
                            <Radar name="Not Ort." dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Radar name="Tamamlama %" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                            <Tooltip />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

const StudentAnalytics = () => {
    const { currentUser, getAssignmentsForStudent } = useDataContext();
    const myAssignments = currentUser ? getAssignmentsForStudent(currentUser.id) : [];

    const statusData = [
        { name: STATUS_NAMES[AssignmentStatus.Pending], value: myAssignments.filter(a => a.status === AssignmentStatus.Pending).length },
        { name: STATUS_NAMES[AssignmentStatus.Submitted], value: myAssignments.filter(a => a.status === AssignmentStatus.Submitted).length },
        { name: STATUS_NAMES[AssignmentStatus.Graded], value: myAssignments.filter(a => a.status === AssignmentStatus.Graded).length },
    ];
    
    const gradedAssignments = myAssignments.filter(a => a.status === AssignmentStatus.Graded);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Ödevlerimin Durum Dağılımı">
                <div style={{ width: '100%', height: 300 }}>
                     <ResponsiveContainer>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}>
                                {statusData.map((entry, index) => {
                                    const statusKey = Object.keys(STATUS_NAMES).find(key => STATUS_NAMES[key as AssignmentStatus] === entry.name) as AssignmentStatus;
                                    return <Cell key={`cell-${index}`} fill={COLORS[statusKey]} />;
                                })}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
             <Card title="Notlandırılmış Ödevlerim">
                <div className="overflow-y-auto max-h-72">
                    <ul className="space-y-2">
                        {gradedAssignments.map(a => (
                            <li key={a.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <span className="font-medium text-sm">{a.title}</span>
                                <span className="font-bold text-lg text-primary-500">{a.grade}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>
        </div>
    );
};


const Analytics = () => {
    const { currentUser } = useDataContext();
    if (!currentUser) return null;
    return currentUser.role === UserRole.Coach ? <CoachAnalytics /> : <StudentAnalytics />;
};

export default Analytics;