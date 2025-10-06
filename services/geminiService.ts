import { Assignment, Exam, Goal, Question } from "../types";

const geminiFetch = async (endpoint: string, body: object) => {
    try {
        const response = await fetch(`/api/gemini/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error(`Gemini API proxy error at ${endpoint}:`, error);
        throw error;
    }
};

const getSubject = (title: string): string => {
    const SUBJECT_KEYWORDS: { [key: string]: string[] } = {
        'Matematik': ['matematik', 'türev', 'limit', 'problem', 'geometri'], 'Fizik': ['fizik', 'deney', 'sarkaç', 'vektörler', 'optik', 'elektrik'], 'Kimya': ['kimya', 'formül', 'organik', 'mol'], 'Biyoloji': ['biyoloji', 'hücre', 'bölünme', 'çizim'], 'Türkçe': ['türkçe', 'kompozisyon', 'paragraf', 'özet', 'makale', 'kitap', 'edebiyat'], 'Tarih': ['tarih', 'ihtilal', 'araştırma', 'savaş'], 'Coğrafya': ['coğrafya', 'iklim', 'sunum', 'göller'], 'İngilizce': ['ingilizce', 'kelime', 'essay'], 'Felsefe': ['felsefe']
    };
    for (const subject in SUBJECT_KEYWORDS) {
        if (SUBJECT_KEYWORDS[subject].some(keyword => title.toLowerCase().includes(keyword))) {
            return subject;
        }
    }
    return 'Diğer';
};

// --- Functions returning text ---
export const generateAssignmentDescription = async (title: string): Promise<string> => {
    const prompt = `Bir eğitim koçu olarak, "${title}" başlıklı bir ödev için öğrencilere yol gösterecek, motive edici ve net bir açıklama metni oluştur. Açıklama, ödevin amacını, beklentileri ve teslimat kriterlerini içermeli.`;
    return geminiFetch('generateText', { prompt }).catch(() => "Açıklama üretilirken bir hata oluştu.");
};

export const generateSmartFeedback = async (assignmentToGrade: Assignment, allStudentAssignments: Assignment[]): Promise<string> => {
    const currentSubject = getSubject(assignmentToGrade.title);
    const previousAssignmentsInSubject = allStudentAssignments.filter(a => a.id !== assignmentToGrade.id && getSubject(a.title) === currentSubject && a.status === 'graded' && a.grade !== null);
    let subjectContext = "";
    if (previousAssignmentsInSubject.length > 0) {
        const previousAvg = Math.round(previousAssignmentsInSubject.reduce((sum, a) => sum + a.grade!, 0) / previousAssignmentsInSubject.length);
        subjectContext = `Öğrencinin bu dersteki önceki not ortalaması yaklaşık ${previousAvg}.`;
    }
    const prompt = `Bir öğrencinin "${assignmentToGrade.title}" ödevinden 100 üzerinden ${assignmentToGrade.grade} aldığını varsayarak, hem yapıcı hem de motive edici bir geri bildirim yaz. Ek Bilgi: ${subjectContext}. Bu ek bilgiyi kullanarak geri bildirimini kişiselleştir: Eğer not yüksekse (85+), öğrencinin güçlü yönlerini vurgula. Eğer not ortalamaysa (60-84), hem iyi yaptığı noktaları belirt hem de geliştirmesi gereken alanlara odaklan. Eğer not düşükse (<60), öğrenciyi kırmadan, temel eksikliklere odaklan.`;
    return geminiFetch('generateText', { prompt, temperature: 0.8 }).catch(() => "Akıllı geri bildirim üretilemedi.");
};

export const getVisualAssignmentHelp = async (assignment: Assignment, image: { base64Data: string; mimeType: string }): Promise<string> => {
     try {
        const textPart = { text: `Sen yardımsever bir öğretmen asistanısın. Bir öğrenci, "${assignment.title}" başlıklı ödevde zorlanıyor ve aşağıdaki resimle ilgili yardım istiyor. Ödevin açıklaması: "${assignment.description}". Lütfen görseli analiz ederek öğrenciye soruyu çözmesi için adım adım ipuçları ver. Cevabı doğrudan verme, düşünmesini sağla.` };
        // FIX: Use the correct model for multimodal input. 'gemini-pro-vision' is not a valid model name in the guidelines. 'gemini-2.5-flash' should be used.
        return geminiFetch('generateWithImage', { textPart, imagePart: { inlineData: { mimeType: image.mimeType, data: image.base64Data } }});
    } catch (error) {
        console.error("Error in getVisualAssignmentHelp:", error);
        return "Görsel analiz edilemedi.";
    }
};

export const suggestStudentGoal = async (studentName: string, averageGrade: number, overdueAssignments: number): Promise<string> => {
    const prompt = `Öğrenci ${studentName} için bir S.M.A.R.T. (Belirli, Ölçülebilir, Ulaşılabilir, İlgili, Zamanında) hedef öner. Mevcut durumu: Ortalama notu ${averageGrade}, teslimi gecikmiş ödev sayısı ${overdueAssignments}. Önerin tek bir cümlelik bir hedef başlığı olmalı.`;
    return geminiFetch('generateText', { prompt, temperature: 0.9 }).catch(() => "Hedef önerisi üretilemedi.");
};

export const generateWeeklySummary = async (studentName: string, stats: { completed: number, avgGrade: number | string, goals: number }): Promise<string> => {
    const prompt = `Öğrenci ${studentName} için bu haftaki performansını özetleyen kısa, motive edici bir mesaj yaz. İstatistikler: ${stats.completed} ödev tamamlandı, not ortalaması ${stats.avgGrade}, ${stats.goals} hedefe ulaşıldı. Başarılarını kutla ve bir sonraki hafta için küçük bir tavsiye ver.`;
    return geminiFetch('generateText', { prompt, temperature: 0.8 }).catch(() => "Haftalık özet oluşturulamadı.");
};

export const generateStudentFocusSuggestion = async (studentName: string, assignments: Assignment[]): Promise<string> => {
    const pending = assignments.filter(a => a.status === 'pending').length;
    const overdue = assignments.filter(a => a.status === 'pending' && new Date(a.dueDate) < new Date()).length;
    const prompt = `Öğrenci ${studentName}'e güne başlaması için kısa ve motive edici bir tavsiye ver. Şu an ${pending} bekleyen ödevi var ve bunlardan ${overdue} tanesinin tarihi geçmiş. Bu durumu göz önünde bulundurarak onu teşvik et.`;
    return geminiFetch('generateText', { prompt, temperature: 0.9 }).catch(() => "Odaklanma önerisi şu anda kullanılamıyor.");
};

export const suggestFocusAreas = async (studentName: string, assignments: Assignment[]): Promise<string> => {
    const subjects: { [key: string]: { grades: number[], count: number } } = {};
    assignments.forEach(a => {
        const subject = getSubject(a.title);
        if (!subjects[subject]) subjects[subject] = { grades: [], count: 0 };
        subjects[subject].count++;
        if (a.grade !== null) subjects[subject].grades.push(a.grade);
    });
    const subjectStats = Object.entries(subjects).map(([name, data]) => ({ name, avg: data.grades.length > 0 ? data.grades.reduce((s, g) => s + g, 0) / data.grades.length : null })).filter(s => s.avg !== null).sort((a, b) => a.avg! - b.avg!);
    const weakSubjects = subjectStats.slice(0, 2).map(s => s.name).join(', ');
    const prompt = `Öğrenci ${studentName} için bu haftaki odaklanması gereken 1-2 dersi veya konuyu öner. Düşük performans gösterdiği alanlar şunlar olabilir: ${weakSubjects || 'henüz yok'}. Önerini kısa ve eyleme geçirilebilir bir şekilde ifade et.`;
    return geminiFetch('generateText', { prompt }).catch(() => "Odak alanı önerisi şu anda kullanılamıyor.");
};

export const generatePersonalCoachSummary = async (coachName: string, students: any[], assignments: Assignment[]): Promise<string> => {
    const studentCount = students.length;
    const toGradeCount = assignments.filter(a => a.status === 'submitted').length;
    const overdueCount = assignments.filter(a => a.status === 'pending' && new Date(a.dueDate) < new Date()).length;
    const prompt = `Eğitim koçu ${coachName} için haftalık bir özet oluştur. Toplam ${studentCount} öğrencisi var. Şu an ${toGradeCount} ödevi notlandırmayı bekliyor ve öğrencilerinin toplam ${overdueCount} gecikmiş ödevi var. Bu bilgilere dayanarak ona önceliklerini belirlemesinde yardımcı olacak kısa bir özet ve teşvik edici bir mesaj yaz.`;
    return geminiFetch('generateText', { prompt }).catch(() => "Koç özeti şu anda kullanılamıyor.");
};

export const generateStudentAnalyticsInsight = async (studentName: string, data: { avgGrade: number | string; completionRate: number; topSubject: string; lowSubject: string }): Promise<string> => {
    const prompt = `Öğrenci ${studentName}'in analitik verilerini yorumla ve ona özel bir içgörü sun. Veriler: Not ortalaması ${data.avgGrade}, ödev tamamlama oranı %${data.completionRate.toFixed(0)}, en başarılı olduğu ders ${data.topSubject}, en çok zorlandığı ders ${data.lowSubject}. Güçlü yönlerini öv ve zayıf yönleri için somut bir tavsiye ver.`;
    return geminiFetch('generateText', { prompt }).catch(() => "Analiz özeti şu anda kullanılamıyor.");
};

export const generateCoachAnalyticsInsight = async (studentsData: { name: string, avgGrade: number, completionRate: number, overdue: number }[]): Promise<string> => {
    const statsSummary = `Toplam ${studentsData.length} öğrenci. Genel not ortalaması ${(studentsData.reduce((sum, s) => sum + s.avgGrade, 0) / studentsData.length).toFixed(1)}.`;
    const highAchievers = studentsData.filter(s => s.avgGrade > 85).map(s => s.name).join(', ');
    const needsAttention = studentsData.filter(s => s.avgGrade < 60 || s.overdue > 2).map(s => s.name).join(', ');
    const prompt = `Bir koçun sınıfının genel performansını analiz et ve stratejik bir özet sun. Veriler: ${statsSummary}. Yüksek başarılı öğrenciler: ${highAchievers || 'yok'}. İlgi gerektiren öğrenciler: ${needsAttention || 'yok'}. Koçun nelere odaklanması gerektiği konusunda 2-3 maddelik bir eylem planı öner.`;
    return geminiFetch('generateText', { prompt, temperature: 0.8 }).catch(() => "Koç analiz özeti şu anda kullanılamıyor.");
};

export const generateExamPerformanceInsight = async (studentName: string, performanceData: { overallAvg: number | string; subjectAvgs: { subject: string; average: number }[] }): Promise<string> => {
    const subjectAvgsText = performanceData.subjectAvgs.map(s => `${s.subject}: ${s.average}`).join(', ');
    const prompt = `Öğrenci ${studentName}'in sınav performansını analiz et. Genel ortalaması ${performanceData.overallAvg}. Ders bazında ortalamaları: ${subjectAvgsText}. Bu verilere göre öğrencinin güçlü ve zayıf yönlerini "### Güçlü Yönler" ve "### Geliştirilmesi Gereken Yönler" başlıkları altında madde madde listele. Son olarak "### Eylem Planı" başlığı altında 2-3 somut öneride bulun. Cevabını markdown formatında başlıklarla ver.`;
    return geminiFetch('generateText', { prompt, temperature: 0.5 }).catch(() => "Sınav analizi şu anda kullanılamıyor.");
};

export const generateExamAnalysis = async (exam: Exam, studentName: string): Promise<string> => {
    const subjectsSummary = exam.subjects.map(s => `${s.name}: ${s.netScore} net`).join(', ');
    const prompt = `Öğrenci ${studentName}'in "${exam.title}" sınav sonucunu analiz et. Genel net: ${exam.netScore}. Ders bazında netler: ${subjectsSummary}. Bu sonuçlara göre, öğrencinin performansını özetleyen, güçlü olduğu ve zorlandığı konuları belirten ve gelecek için 1-2 tavsiye veren bir analiz metni oluştur. Cevabını markdown formatında, ### başlıklar kullanarak ver.`;
    return geminiFetch('generateText', { prompt }).catch(() => "Sınav analizi oluşturulamadı.");
};

export const generateComprehensiveStudentReport = async (student: any, assignments: Assignment[], exams: Exam[], goals: Goal[]): Promise<string> => {
    const prompt = `Öğrenci ${student.name} için kapsamlı bir performans raporu oluştur. Raporu markdown formatında, aşağıdaki başlıkları kullanarak hazırla: ### Genel Durum, ### Akademik Performans (Ödevler ve Sınavlar), ### Hedeflere Ulaşma Durumu, ### Güçlü Yönler, ### Geliştirilmesi Gereken Yönler, ### Öneriler. Analizini aşağıdaki verilere dayandır: Ödevler: ${assignments.length} adet, Sınavlar: ${exams.length} adet, Hedefler: ${goals.length} adet.`;
    return geminiFetch('generateText', { prompt, temperature: 0.6 }).catch(() => "Kapsamlı rapor oluşturulamadı.");
};

// --- Functions returning JSON ---
export const generateAssignmentChecklist = async (title: string, description: string): Promise<{ text: string }[]> => {
    const prompt = `Bir eğitim koçu olarak, "${title}" başlıklı ve "${description}" açıklamalı bir ödev için öğrencilerin takip etmesi gereken 3 ila 5 adımlık bir kontrol listesi oluştur.`;
    return geminiFetch('generateJson', { prompt, schema: 'checklist' }).catch(() => []);
};

export const suggestGrade = async (assignment: Assignment): Promise<{ suggestedGrade: number, rationale: string } | null> => {
    const prompt = `Bir öğrencinin "${assignment.title}" başlıklı ödevine yaptığı teslimatı analiz et ve 100 üzerinden bir not öner. Ayrıca notu neden önerdiğini 'rationale' alanında kısaca açıkla. Teslimat içeriği: "${assignment.submissionType === 'text' ? assignment.textSubmission : 'Dosya yüklendi (içeriği analiz edilemiyor, başlığa ve açıklamaya göre tahmin yürüt)'}". Ödev açıklaması: "${assignment.description}".`;
    return geminiFetch('generateJson', { prompt, schema: 'gradeSuggestion' });
};

export const generateAiTemplate = async (topic: string, level: string, duration: string): Promise<{ title: string; description: string; checklist: { text: string }[] } | null> => {
    const prompt = `Bir ödev şablonu oluştur. Konu: "${topic}", seviye: "${level}", ve süresi: "${duration}". Şablon için uygun bir 'title', 'description' ve 3-5 adımlık bir 'checklist' oluştur. Checklist maddeleri 'text' alanına sahip objelerden oluşmalı.`;
    return geminiFetch('generateJson', { prompt, schema: 'assignmentTemplate' });
};

export const generateStudyPlan = async (params: any): Promise<any[] | null> => {
    const prompt = `Bir öğrenci için haftalık ders çalışma planı oluştur. Bilgiler: Hedef sınavlar: ${params.targetExams.join(', ')}. Odak dersler: ${params.focusSubjects.join(', ')}. Haftalık müsait zamanlar: ${JSON.stringify(params.weeklyAvailability)}. Bir ders süresi ${params.sessionDuration} dakika, mola süresi ${params.breakDuration} dakika. Bu bilgilere göre, önümüzdeki 7 gün için bir plan oluştur. Her plan öğesi için 'title', 'date' (YYYY-MM-DD formatında, bugünden başlayarak), 'startTime', 'endTime', ve 'description' alanlarını içeren bir JSON dizisi döndür.`;
    return geminiFetch('generateJson', { prompt, schema: 'studyPlan' });
};

export const generateGoalWithMilestones = async (goalTitle: string): Promise<{ description: string, milestones: { text: string }[] } | null> => {
    const prompt = `"${goalTitle}" hedefi için motive edici bir 'description' ve bu hedefe ulaşmayı sağlayacak 3-4 adımlık 'milestones' (kilometre taşları) oluştur. Kilometre taşları 'text' alanına sahip objelerden oluşmalı.`;
    return geminiFetch('generateJson', { prompt, schema: 'goalWithMilestones' });
};

export const generateExamDetails = async (category: string, topic: string, studentGrade: string): Promise<{ title: string; description: string; totalQuestions: number; dueDate: string } | null> => {
    const prompt = `${studentGrade}. sınıf öğrencisi için, "${category}" dersinin "${topic}" konusuyla ilgili bir konu tarama testi için AI tarafından oluşturulmuş bir başlık ('title'), kısa bir açıklama ('description'), toplam soru sayısı ('totalQuestions', 10 ile 25 arası) ve 1 hafta sonrası için teslim tarihi ('dueDate', YYYY-MM-DD formatında) oluştur.`;
    return geminiFetch('generateJson', { prompt, schema: 'examDetails' });
};

export const generateQuestion = async (category: string, topic: string, difficulty: string): Promise<Omit<Question, 'id' | 'creatorId' | 'category' | 'topic' | 'difficulty'> | null> => {
    const prompt = `"${category}" dersi ve "${topic}" konusu için, "${difficulty}" zorluk seviyesinde, 4 seçenekli bir çoktan seçmeli soru oluştur. Cevabı JSON formatında, 'questionText' (soru metni), 'options' (4 elemanlı string dizisi), 'correctOptionIndex' (0-3 arası sayı) ve 'explanation' (doğru cevabın açıklaması) alanlarını içerecek şekilde ver.`;
    return geminiFetch('generateJson', { prompt, schema: 'question' });
};