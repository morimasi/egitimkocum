import { Assignment, AssignmentStatus, User, Exam, Goal, Question, QuestionDifficulty } from "../types";

const callGeminiApi = async (task: string, payload: any) => {
    const response = await fetch('/backend/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, payload }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Gemini API isteği başarısız oldu' }));
        throw new Error(error.message);
    }
    return response.json();
};

export const generateAssignmentDescription = async (title: string): Promise<string> => {
    try {
        const response = await callGeminiApi('generateAssignmentDescription', { title });
        return response.text;
    } catch (error) {
        console.error("Error in generateAssignmentDescription:", error);
        return "Açıklama üretilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    }
};

export const generateSmartFeedback = async (assignmentToGrade: Assignment, allStudentAssignments: Assignment[]): Promise<string> => {
    try {
        const response = await callGeminiApi('generateSmartFeedback', { assignmentToGrade, allStudentAssignments });
        return response.text;
    } catch (error) {
        console.error("Error in generateSmartFeedback:", error);
        return "Akıllı geri bildirim üretilemedi.";
    }
};

export const generateAssignmentChecklist = async (title: string, description: string): Promise<{ text: string }[]> => {
    try {
        return await callGeminiApi('generateAssignmentChecklist', { title, description });
    } catch (error) {
        console.error("Error in generateAssignmentChecklist:", error);
        return [];
    }
};

export const getVisualAssignmentHelp = async (assignment: Assignment, image: { base64Data: string; mimeType: string }): Promise<string> => {
    try {
        const response = await callGeminiApi('getVisualAssignmentHelp', { assignment, image });
        return response.text;
    } catch (error) {
        console.error("Error in getVisualAssignmentHelp:", error);
        return "Görsel analiz edilemedi.";
    }
};

export const suggestStudentGoal = async (studentName: string, averageGrade: number, overdueAssignments: number): Promise<string> => {
    try {
        const response = await callGeminiApi('suggestStudentGoal', { studentName, averageGrade, overdueAssignments });
        return response.text;
    } catch (error) {
        console.error("Error in suggestStudentGoal:", error);
        return "Hedef önerisi üretilemedi.";
    }
}

export const generateWeeklySummary = async (studentName: string, stats: { completed: number, avgGrade: number | string, goals: number }): Promise<string> => {
    try {
        const response = await callGeminiApi('generateWeeklySummary', { studentName, stats });
        return response.text;
    } catch (error) {
        console.error("Error in generateWeeklySummary:", error);
        return "Haftalık özet oluşturulamadı.";
    }
}

export const generateStudentFocusSuggestion = async (studentName: string, assignments: Assignment[]): Promise<string> => {
    try {
        const response = await callGeminiApi('generateStudentFocusSuggestion', { studentName, assignments });
        return response.text;
    } catch (error) {
        console.error("Error in generateStudentFocusSuggestion:", error);
        return "Odaklanma önerisi şu anda kullanılamıyor.";
    }
};

export const suggestFocusAreas = async (studentName: string, assignments: Assignment[]): Promise<string> => {
    try {
        const response = await callGeminiApi('suggestFocusAreas', { studentName, assignments });
        return response.text;
    } catch (error) {
        console.error("Error in suggestFocusAreas:", error);
        return "Odak alanı önerisi şu anda kullanılamıyor.";
    }
};

export const generatePersonalCoachSummary = async (coachName: string, students: User[], assignments: Assignment[]): Promise<string> => {
    try {
        const response = await callGeminiApi('generatePersonalCoachSummary', { coachName, students, assignments });
        return response.text;
    } catch (error) {
        console.error("Error in generatePersonalCoachSummary:", error);
        return "Koç özeti şu anda kullanılamıyor.";
    }
};

export const suggestGrade = async (assignment: Assignment): Promise<{ suggestedGrade: number, rationale: string } | null> => {
    try {
        return await callGeminiApi('suggestGrade', { assignment });
    } catch (error) {
        console.error("Error in suggestGrade:", error);
        return null;
    }
};

export const generateStudentAnalyticsInsight = async (studentName: string, data: { avgGrade: number | string; completionRate: number; topSubject: string; lowSubject: string }): Promise<string> => {
    try {
        const response = await callGeminiApi('generateStudentAnalyticsInsight', { studentName, data });
        return response.text;
    } catch (error) {
        console.error("Error in generateStudentAnalyticsInsight:", error);
        return "Analiz özeti şu anda kullanılamıyor.";
    }
};

export const generateCoachAnalyticsInsight = async (studentsData: { name: string, avgGrade: number, completionRate: number, overdue: number }[]): Promise<string> => {
    try {
        const response = await callGeminiApi('generateCoachAnalyticsInsight', { studentsData });
        return response.text;
    } catch (error) {
        console.error("Error in generateCoachAnalyticsInsight:", error);
        return "Koç analiz özeti şu anda kullanılamıyor.";
    }
};

export const generateAiTemplate = async (topic: string, level: string, duration: string): Promise<{ title: string; description: string; checklist: { text: string }[] } | null> => {
    try {
        return await callGeminiApi('generateAiTemplate', { topic, level, duration });
    } catch (error) {
        console.error("Error in generateAiTemplate:", error);
        return null;
    }
};

export const generateExamPerformanceInsight = async (studentName: string, performanceData: { overallAvg: number | string; subjectAvgs: { subject: string; average: number }[] }): Promise<string> => {
    try {
        const response = await callGeminiApi('generateExamPerformanceInsight', { studentName, performanceData });
        return response.text;
    } catch (error) {
        console.error("Error in generateExamPerformanceInsight:", error);
        return "Sınav analizi şu anda kullanılamıyor.";
    }
};

export const generateStudyPlan = async (params: any): Promise<any[] | null> => {
    try {
        return await callGeminiApi('generateStudyPlan', { params });
    } catch (error) {
        console.error("Error in generateStudyPlan:", error);
        return null;
    }
};

export const generateGoalWithMilestones = async (goalTitle: string): Promise<{ description: string, milestones: { text: string }[] } | null> => {
    try {
        return await callGeminiApi('generateGoalWithMilestones', { goalTitle });
    } catch (error) {
        console.error("Error in generateGoalWithMilestones:", error);
        return null;
    }
};

export const generateExamAnalysis = async (exam: Exam, studentName: string): Promise<string> => {
    try {
        const response = await callGeminiApi('generateExamAnalysis', { exam, studentName });
        return response.text;
    } catch (error) {
        console.error("Error in generateExamAnalysis:", error);
        return "Sınav analizi oluşturulamadı.";
    }
};

export const generateExamDetails = async (category: string, topic: string, studentGrade: string): Promise<{ title: string; description: string; totalQuestions: number; dueDate: string } | null> => {
    try {
        return await callGeminiApi('generateExamDetails', { category, topic, studentGrade });
    } catch (error) {
        console.error("Error in generateExamDetails:", error);
        return null;
    }
};

export const generateComprehensiveStudentReport = async (student: User, assignments: Assignment[], exams: Exam[], goals: Goal[]): Promise<string> => {
    try {
        const response = await callGeminiApi('generateComprehensiveStudentReport', { student, assignments, exams, goals });
        return response.text;
    } catch (error) {
        console.error("Error in generateComprehensiveStudentReport:", error);
        return "Kapsamlı rapor oluşturulamadı.";
    }
};

export const generateQuestion = async (
    category: string,
    topic: string,
    difficulty: string
): Promise<Omit<Question, 'id' | 'creatorId' | 'category' | 'topic' | 'difficulty'> | null> => {
    try {
        return await callGeminiApi('generateQuestion', { category, topic, difficulty });
    } catch (error) {
        console.error("Error in generateQuestion:", error);
        return null;
    }
};