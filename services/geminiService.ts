import { GoogleGenAI, Type } from "@google/genai";
import { Assignment, AssignmentStatus, User, Exam, Goal, Question, QuestionDifficulty } from "../types";

// Yönergelere uygun olarak process.env.API_KEY'nin mevcut olduğu varsayılır
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getSubject = (title: string): string => {
    const SUBJECT_KEYWORDS = {
        'Matematik': ['matematik', 'türev', 'limit', 'problem', 'geometri'], 'Fizik': ['fizik', 'deney', 'sarkaç', 'vektörler', 'optik', 'elektrik'], 'Kimya': ['kimya', 'formül', 'organik', 'mol'], 'Biyoloji': ['biyoloji', 'hücre', 'bölünme', 'çizim'], 'Türkçe': ['türkçe', 'kompozisyon', 'paragraf', 'özet', 'makale', 'kitap', 'edebiyat'], 'Tarih': ['tarih', 'ihtilal', 'araştırma', 'savaş'], 'Coğrafya': ['coğrafya', 'iklim', 'sunum', 'göller'], 'İngilizce': ['ingilizce', 'kelime', 'essay'], 'Felsefe': ['felsefe']
    };
    for (const subject in SUBJECT_KEYWORDS) {
        if (SUBJECT_KEYWORDS[subject as keyof typeof SUBJECT_KEYWORDS].some(keyword => title.toLowerCase().includes(keyword))) {
            return subject;
        }
    }
    return 'Diğer';
};

export const generateAssignmentDescription = async (title: string): Promise<string> => {
    try {
        const prompt = `Bir eğitim koçu olarak, "${title}" başlıklı bir ödev için öğrencilere yol gösterecek, motive edici ve net bir açıklama metni oluştur. Açıklama, ödevin amacını, beklentileri ve teslimat kriterlerini içermeli.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7 },
        });
        return response.text;
    } catch (error) {
        console.error("Error in generateAssignmentDescription:", error);
        return "Açıklama üretilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    }
};

export const generateSmartFeedback = async (assignmentToGrade: Assignment, allStudentAssignments: Assignment[]): Promise<string> => {
    try {
        const { title, grade } = assignmentToGrade;
        const currentSubject = getSubject(title);
        const previousAssignmentsInSubject = allStudentAssignments.filter(a => a.id !== assignmentToGrade.id && getSubject(a.title) === currentSubject && a.status === 'graded' && a.grade !== null);
        let subjectContext = "";
        if (previousAssignmentsInSubject.length > 0) {
            const previousAvg = Math.round(previousAssignmentsInSubject.reduce((sum, a) => sum + a.grade!, 0) / previousAssignmentsInSubject.length);
            subjectContext = `Öğrencinin bu dersteki önceki not ortalaması yaklaşık ${previousAvg}.`;
        }
        const prompt = `Bir öğrencinin "${title}" ödevinden 100 üzerinden ${grade} aldığını varsayarak, hem yapıcı hem de motive edici bir geri bildirim yaz. Ek Bilgi: ${subjectContext}. Bu ek bilgiyi kullanarak geri bildirimini kişiselleştir: Eğer not yüksekse (85+), öğrencinin güçlü yönlerini vurgula. Eğer not ortalamaysa (60-84), hem iyi yaptığı noktaları belirt hem de geliştirmesi gereken alanlara odaklan. Eğer not düşükse (<60), öğrenciyi kırmadan, temel eksikliklere odaklan.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } });
        return response.text;
    } catch (error) {
        console.error("Error in generateSmartFeedback:", error);
        return "Akıllı geri bildirim üretilemedi.";
    }
};

export const generateAssignmentChecklist = async (title: string, description: string): Promise<{ text: string }[]> => {
    try {
        const prompt = `Bir eğitim koçu olarak, "${title}" başlıklı ve "${description}" açıklamalı bir ödev için öğrencilerin takip etmesi gereken 3 ila 5 adımlık bir kontrol listesi oluştur.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } },
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error in generateAssignmentChecklist:", error);
        return [];
    }
};

export const getVisualAssignmentHelp = async (assignment: Assignment, image: { base64Data: string; mimeType: string }): Promise<string> => {
    try {
        const textPart = { text: `Sen yardımsever bir öğretmen asistanısın. Bir öğrenci, "${assignment.title}" başlıklı ödevde zorlanıyor ve aşağıdaki resimle ilgili yardım istiyor. Ödevin açıklaması: "${assignment.description}". Lütfen görseli analiz ederek öğrenciye soruyu çözmesi için adım adım ipuçları ver. Cevabı doğrudan verme, düşünmesini sağla.` };
        const imagePart = { inlineData: { mimeType: image.mimeType, data: image.base64Data } };
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [textPart, imagePart] } });
        return response.text;
    } catch (error) {
        console.error("Error in getVisualAssignmentHelp:", error);
        return "Görsel analiz edilemedi.";
    }
};

export const suggestStudentGoal = async (studentName: string, averageGrade: number, overdueAssignments: number): Promise<string> => {
    try {
        const prompt = `Öğrenci ${studentName} için bir S.M.A.R.T. (Belirli, Ölçülebilir, Ulaşılabilir, İlgili, Zamanında) hedef öner. Mevcut durumu: Ortalama notu ${averageGrade}, teslimi gecikmiş ödev sayısı ${overdueAssignments}. Önerin tek bir cümlelik bir hedef başlığı olmalı.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.9 } });
        return response.text;
    } catch (error) {
        console.error("Error in suggestStudentGoal:", error);
        return "Hedef önerisi üretilemedi.";
    }
}

export const generateWeeklySummary = async (studentName: string, stats: { completed: number, avgGrade: number | string, goals: number }): Promise<string> => {
    try {
        const prompt = `Öğrenci ${studentName} için bu haftaki performansını özetleyen kısa, motive edici bir mesaj yaz. İstatistikler: ${stats.completed} ödev tamamlandı, not ortalaması ${stats.avgGrade}, ${stats.goals} hedefe ulaşıldı. Başarılarını kutla ve bir sonraki hafta için küçük bir tavsiye ver.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } });
        return response.text;
    } catch (error) {
        console.error("Error in generateWeeklySummary:", error);
        return "Haftalık özet oluşturulamadı.";
    }
}

export const generateStudentFocusSuggestion = async (studentName: string, assignments: Assignment[]): Promise<string> => {
    try {
        const pending = assignments.filter(a => a.status === 'pending').length;
        const overdue = assignments.filter(a => a.status === 'pending' && new Date(a.dueDate) < new Date()).length;
        const prompt = `Öğrenci ${studentName}'e güne başlaması için kısa ve motive edici bir tavsiye ver. Şu an ${pending} bekleyen ödevi var ve bunlardan ${overdue} tanesinin tarihi geçmiş. Bu durumu göz önünde bulundurarak onu teşvik et.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.9 } });
        return response.text;
    } catch (error) {
        console.error("Error in generateStudentFocusSuggestion:", error);
        return "Odaklanma önerisi şu anda kullanılamıyor.";
    }
};

export const suggestFocusAreas = async (studentName: string, assignments: Assignment[]): Promise<string> => {
    try {
        const subjects: { [key: string]: { grades: number[], count: number } } = {};
        assignments.forEach(a => {
            const subject = getSubject(a.title);
            if (!subjects[subject]) subjects[subject] = { grades: [], count: 0 };
            subjects[subject].count++;
            if (a.grade !== null) subjects[subject].grades.push(a.grade);
        });
        const subjectStats = Object.entries(subjects).map(([name, data]) => ({
            name,
            avg: data.grades.length > 0 ? data.grades.reduce((s, g) => s + g, 0) / data.grades.length : null
        })).filter(s => s.avg !== null).sort((a, b) => a.avg! - b.avg!);
        const weakSubjects = subjectStats.slice(0, 2).map(s => s.name).join(', ');

        const prompt = `Öğrenci ${studentName} için bu haftaki odaklanması gereken 1-2 dersi veya konuyu öner. Düşük performans gösterdiği alanlar şunlar olabilir: ${weakSubjects || 'henüz yok'}. Önerini kısa ve eyleme geçirilebilir bir şekilde ifade et.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error in suggestFocusAreas:", error);
        return "Odak alanı önerisi şu anda kullanılamıyor.";
    }
};

export const generatePersonalCoachSummary = async (coachName: string, students: User[], assignments: Assignment[]): Promise<string> => {
    try {
        const studentCount = students.length;
        const toGradeCount = assignments.filter(a => a.status === 'submitted').length;
        const overdueCount = assignments.filter(a => a.status === 'pending' && new Date(a.dueDate) < new Date()).length;
        const prompt = `Eğitim koçu ${coachName} için haftalık bir özet oluştur. Toplam ${studentCount} öğrencisi var. Şu an ${toGradeCount} ödevi notlandırmayı bekliyor ve öğrencilerinin toplam ${overdueCount} gecikmiş ödevi var. Bu bilgilere dayanarak ona önceliklerini belirlemesinde yardımcı olacak kısa bir özet ve teşvik edici bir mesaj yaz.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 } });
        return response.text;
    } catch (error) {
        console.error("Error in generatePersonalCoachSummary:", error);
        return "Koç özeti şu anda kullanılamıyor.";
    }
};

export const suggestGrade = async (assignment: Assignment): Promise<{ suggestedGrade: number, rationale: string } | null> => {
    try {
        const prompt = `Bir öğrencinin "${assignment.title}" başlıklı ödevine yaptığı teslimatı analiz et ve 100 üzerinden bir not öner. Ayrıca notu neden önerdiğini 'rationale' alanında kısaca açıkla. Teslimat içeriği: "${assignment.submissionType === 'text' ? assignment.textSubmission : 'Dosya yüklendi (içeriği analiz edilemiyor, başlığa ve açıklamaya göre tahmin yürüt)'}". Ödev açıklaması: "${assignment.description}".`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { suggestedGrade: { type: Type.INTEGER }, rationale: { type: Type.STRING } }, required: ['suggestedGrade', 'rationale'] }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error in suggestGrade:", error);
        return null;
    }
};

export const generateStudentAnalyticsInsight = async (studentName: string, data: { avgGrade: number | string; completionRate: number; topSubject: string; lowSubject: string }): Promise<string> => {
    try {
        const prompt = `Öğrenci ${studentName}'in analitik verilerini yorumla ve ona özel bir içgörü sun. Veriler: Not ortalaması ${data.avgGrade}, ödev tamamlama oranı %${data.completionRate.toFixed(0)}, en başarılı olduğu ders ${data.topSubject}, en çok zorlandığı ders ${data.lowSubject}. Güçlü yönlerini öv ve zayıf yönleri için somut bir tavsiye ver.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error in generateStudentAnalyticsInsight:", error);
        return "Analiz özeti şu anda kullanılamıyor.";
    }
};

export const generateCoachAnalyticsInsight = async (studentsData: { name: string, avgGrade: number, completionRate: number, overdue: number }[]): Promise<string> => {
    try {
        const statsSummary = `Toplam ${studentsData.length} öğrenci. Genel not ortalaması ${ (studentsData.reduce((sum, s) => sum + s.avgGrade, 0) / studentsData.length).toFixed(1) }.`;
        const highAchievers = studentsData.filter(s => s.avgGrade > 85).map(s => s.name).join(', ');
        const needsAttention = studentsData.filter(s => s.avgGrade < 60 || s.overdue > 2).map(s => s.name).join(', ');
        const prompt = `Bir koçun sınıfının genel performansını analiz et ve stratejik bir özet sun. Veriler: ${statsSummary}. Yüksek başarılı öğrenciler: ${highAchievers || 'yok'}. İlgi gerektiren öğrenciler: ${needsAttention || 'yok'}. Koçun nelere odaklanması gerektiği konusunda 2-3 maddelik bir eylem planı öner.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } });
        return response.text;
    } catch (error) {
        console.error("Error in generateCoachAnalyticsInsight:", error);
        return "Koç analiz özeti şu anda kullanılamıyor.";
    }
};

export const generateAiTemplate = async (topic: string, level: string, duration: string): Promise<{ title: string; description: string; checklist: { text: string }[] } | null> => {
    try {
        const prompt = `Bir ödev şablonu oluştur. Konu: "${topic}", seviye: "${level}", ve süresi: "${duration}". Şablon için uygun bir 'title', 'description' ve 3-5 adımlık bir 'checklist' oluştur. Checklist maddeleri 'text' alanına sahip objelerden oluşmalı.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, checklist: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }, required: ['title', 'description', 'checklist']
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error in generateAiTemplate:", error);
        return null;
    }
};

export const generateExamPerformanceInsight = async (studentName: string, performanceData: { overallAvg: number | string; subjectAvgs: { subject: string; average: number }[] }): Promise<string> => {
    try {
        const subjects = performanceData.subjectAvgs.map(s => `${s.subject}: ${s.average}`).join(', ');
        const prompt = `Öğrenci ${studentName}'in sınav performansını analiz et. Genel ortalaması ${performanceData.overallAvg}. Ders bazında ortalamaları: ${subjects}. Bu verilere göre öğrencinin güçlü ve zayıf yönlerini "### Güçlü Yönler" ve "### Geliştirilmesi Gereken Yönler" başlıkları altında madde madde listele. Son olarak "### Eylem Planı" başlığı altında 2-3 somut öneride bulun. Cevabını markdown formatında başlıklarla ver.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.5 } });
        return response.text;
    } catch (error) {
        console.error("Error in generateExamPerformanceInsight:", error);
        return "Sınav analizi şu anda kullanılamıyor.";
    }
};

export const generateStudyPlan = async (params: any): Promise<any[] | null> => {
    try {
        const prompt = `Bir öğrenci için haftalık ders çalışma planı oluştur. Bilgiler: Hedef sınavlar: ${params.targetExams.join(', ')}. Odak dersler: ${params.focusSubjects.join(', ')}. Haftalık müsait zamanlar: ${JSON.stringify(params.weeklyAvailability)}. Bir ders süresi ${params.sessionDuration} dakika, mola süresi ${params.breakDuration} dakika. Bu bilgilere göre, önümüzdeki 7 gün için bir plan oluştur. Her plan öğesi için 'title', 'date' (YYYY-MM-DD formatında, bugünden başlayarak), 'startTime', 'endTime', ve 'description' alanlarını içeren bir JSON dizisi döndür.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT, properties: { title: { type: Type.STRING }, date: { type: Type.STRING }, startTime: { type: Type.STRING }, endTime: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'date', 'startTime', 'endTime']
                    }
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error in generateStudyPlan:", error);
        return null;
    }
};

export const generateGoalWithMilestones = async (goalTitle: string): Promise<{ description: string, milestones: { text: string }[] } | null> => {
    try {
        const prompt = `"${goalTitle}" hedefi için motive edici bir 'description' ve bu hedefe ulaşmayı sağlayacak 3-4 adımlık 'milestones' (kilometre taşları) oluştur. Kilometre taşları 'text' alanına sahip objelerden oluşmalı.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: { description: { type: Type.STRING }, milestones: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }, required: ['description', 'milestones']
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error in generateGoalWithMilestones:", error);
        return null;
    }
};

export const generateExamAnalysis = async (exam: Exam, studentName: string): Promise<string> => {
    try {
        const subjectsSummary = exam.subjects.map(s => `${s.name}: ${s.netScore} net`).join(', ');
        const prompt = `Öğrenci ${studentName}'in "${exam.title}" sınav sonucunu analiz et. Genel net: ${exam.netScore}. Ders bazında netler: ${subjectsSummary}. Bu sonuçlara göre, öğrencinin performansını özetleyen, güçlü olduğu ve zorlandığı konuları belirten ve gelecek için 1-2 tavsiye veren bir analiz metni oluştur. Cevabını markdown formatında, ### başlıklar kullanarak ver.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error in generateExamAnalysis:", error);
        return "Sınav analizi oluşturulamadı.";
    }
};

export const generateExamDetails = async (category: string, topic: string, studentGrade: string): Promise<{ title: string; description: string; totalQuestions: number; dueDate: string } | null> => {
    try {
        const prompt = `${studentGrade}. sınıf öğrencisi için, "${category}" dersinin "${topic}" konusuyla ilgili bir konu tarama testi için AI tarafından oluşturulmuş bir başlık ('title'), kısa bir açıklama ('description'), toplam soru sayısı ('totalQuestions', 10 ile 25 arası) ve 1 hafta sonrası için teslim tarihi ('dueDate', YYYY-MM-DD formatında) oluştur.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, totalQuestions: { type: Type.INTEGER }, dueDate: { type: Type.STRING } }, required: ['title', 'description', 'totalQuestions', 'dueDate']
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error in generateExamDetails:", error);
        return null;
    }
};

export const generateComprehensiveStudentReport = async (student: User, assignments: Assignment[], exams: Exam[], goals: Goal[]): Promise<string> => {
    try {
        const prompt = `Öğrenci ${student.name} için kapsamlı bir performans raporu oluştur. Raporu markdown formatında, aşağıdaki başlıkları kullanarak hazırla: ### Genel Durum, ### Akademik Performans (Ödevler ve Sınavlar), ### Hedeflere Ulaşma Durumu, ### Güçlü Yönler, ### Geliştirilmesi Gereken Yönler, ### Öneriler. Analizini aşağıdaki verilere dayandır: Ödevler: ${assignments.length} adet, Sınavlar: ${exams.length} adet, Hedefler: ${goals.length} adet.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.6 } });
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
        const prompt = `"${category}" dersi ve "${topic}" konusu için, "${difficulty}" zorluk seviyesinde, 4 seçenekli bir çoktan seçmeli soru oluştur. Cevabı JSON formatında, 'questionText' (soru metni), 'options' (4 elemanlı string dizisi), 'correctOptionIndex' (0-3 arası sayı) ve 'explanation' (doğru cevabın açıklaması) alanlarını içerecek şekilde ver.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questionText: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctOptionIndex: { type: Type.INTEGER },
                        explanation: { type: Type.STRING }
                    },
                    required: ['questionText', 'options', 'correctOptionIndex', 'explanation']
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error in generateQuestion:", error);
        return null;
    }
};
