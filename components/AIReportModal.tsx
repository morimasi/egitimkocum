import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { User, Assignment, Exam, Goal } from '../types';
import { useDataContext } from '../contexts/DataContext';
import { generateComprehensiveStudentReport } from '../services/geminiService';
import { SkeletonText } from './SkeletonLoader';
import { BrainCircuitIcon } from './Icons';

interface AIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: User;
}

const ReportSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
            <div key={i}>
                <SkeletonText className="h-6 w-1/3 mb-2" />
                <SkeletonText className="h-4 w-full" />
                <SkeletonText className="h-4 w-full mt-2" />
                <SkeletonText className="h-4 w-2/3 mt-2" />
            </div>
        ))}
    </div>
);

const AIReportModal = ({ isOpen, onClose, student }: AIReportModalProps) => {
    const { getAssignmentsForStudent, getGoalsForStudent, exams } = useDataContext();
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && student) {
            const fetchReport = async () => {
                setIsLoading(true);
                setReport('');
                try {
                    const studentAssignments = getAssignmentsForStudent(student.id);
                    const studentGoals = getGoalsForStudent(student.id);
                    const studentExams = exams.filter(e => e.studentId === student.id);
                    const generatedReport = await generateComprehensiveStudentReport(student, studentAssignments, studentExams, studentGoals);
                    setReport(generatedReport);
                } catch (error) {
                    console.error("Error generating student report:", error);
                    setReport("Rapor oluşturulurken bir hata oluştu.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchReport();
        }
    }, [isOpen, student, getAssignmentsForStudent, getGoalsForStudent, exams]);
    
    const handlePrint = () => {
        const printContent = printRef.current;
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>${student.name} - Performans Raporu</title>
                            <style>
                                body { font-family: sans-serif; line-height: 1.6; color: #333; }
                                h1, h2, h3 { color: #db2777; }
                                h1 { font-size: 24px; }
                                h2, h3 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 1.5em;}
                                ul { padding-left: 20px; }
                                li { margin-bottom: 5px; }
                                strong { color: #555; }
                            </style>
                        </head>
                        <body>
                            <h1>${student.name} - Performans Raporu</h1>
                            <p>Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
                            <hr />
                            ${printContent.innerHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    const formattedReport = report
        .replace(/### (.*?)\n/g, '<h3 class="font-semibold text-lg mt-4 mb-2">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/\n/g, '<br />')
        .replace(/<br \/>(<li)/g, '$1') 
        .replace(/(<\/li>)<br \/>/g, '$1'); 

    const footer = (
        <div className="flex justify-between items-center w-full">
            <span className="text-xs text-slate-400">Rapor Gemini AI tarafından oluşturulmuştur.</span>
            <div>
                 <button onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Kapat</button>
                 <button onClick={handlePrint} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Yazdır</button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Destekli Öğrenci Raporu" size="lg" footer={footer}>
            <div className="flex items-center gap-4 mb-4 pb-4 border-b dark:border-slate-700">
                <img src={student.profilePicture} alt={student.name} className="w-16 h-16 rounded-full" />
                <div>
                    <h3 className="text-xl font-bold">{student.name}</h3>
                    <p className="text-slate-500">{student.email}</p>
                </div>
            </div>
            {isLoading ? (
                <ReportSkeleton />
            ) : (
                <div ref={printRef} className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formattedReport }} />
            )}
        </Modal>
    );
};

export default AIReportModal;
