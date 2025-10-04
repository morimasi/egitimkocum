import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Assignment, AssignmentStatus, User, Exam } from "../types";

// Caching helper functions
const getFromCache = <T>(key: string, ttl: number): T | null => {
    try {
        const cachedItem = sessionStorage.getItem(key);
        if (!cachedItem) return null;

        const { data, timestamp } = JSON.parse(cachedItem);
        if (Date.now() - timestamp < ttl) {
            return data as T;
        }
        sessionStorage.removeItem(key);
        return null;
    } catch (e) {
        console.error("Failed to read from cache", e);
        return null;
    }
};

const setInCache = <T>(key: string, data: T) => {
    try {
        const item = { data, timestamp: Date.now() };
        sessionStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
        console.error("Failed to write to cache", e);
    }
};

const ONE_HOUR = 60 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Centralized AI instance and error handling
let ai: GoogleGenAI | null = null;
const getAi = () => {
    if (ai) return ai;
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai;
}

// Higher-order function for caching Gemini calls
const cachedGeminiCall = async <T>(
    cacheKey: string,
    ttl: number,
    apiCall: () => Promise<GenerateContentResponse>,
    processResponse: (response: GenerateContentResponse) => T,
    fallback: T
): Promise<T> => {
    const cached = getFromCache<T>(cacheKey, ttl);
    if (cached) return cached;
    try {
        const response = await apiCall();
        const result = processResponse(response);
        setInCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error(`Error during cached Gemini call for key "${cacheKey}":`, error);
        return fallback;
    }
};

// Fix: Centralized and improved subject keywords for better maintainability and accuracy across the app.
const SUBJECT_KEYWORDS: { [key: string]: string[] } = {
    'Matematik': ['matematik', 'türev', 'limit', 'problem', 'geometri'],
    'Fizik': ['fizik', 'deney', 'sarkaç', 'vektörler', 'optik', 'elektrik'],
    'Kimya': ['kimya', 'formül', 'organik', 'mol'],
    'Biyoloji': ['biyoloji', 'hücre', 'bölünme', 'çizim'],
    'Türkçe': ['türkçe', 'kompozisyon', 'paragraf', 'özet', 'makale', 'kitap', 'edebiyat'],
    'Tarih': ['tarih', 'ihtilal', 'araştırma', 'savaş'],
    'Coğrafya': ['coğrafya', 'iklim', 'sunum', 'göller'],
    'İngilizce': ['ingilizce', 'kelime', 'essay'],
    'Felsefe': ['felsefe']
};

// Helper to find subject from title, used by multiple functions
const getSubject = (title: string): string => {
    for (const subject in SUBJECT_KEYWORDS) {
        if (SUBJECT_KEYWORDS[subject].some(keyword => title.toLowerCase().includes(keyword))) {
            return subject;
        }
    }
    return 'Diğer';
};

export const generateAssignmentDescription = (title: string): Promise<string> => {
    return cachedGeminiCall(
        `genDesc_${title}`,
        ONE_HOUR,
        () => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bir eğitim koçu olarak, "${title}" başlıklı bir ödev için öğrencilere yol gösterecek, motive edici ve net bir açıklama metni oluştur. Açıklama, ödevin amacını, beklentileri ve teslimat kriterlerini içermeli.`,
            config: { temperature: 0.7 },
        }),
        (response) => response.text,
        "Açıklama üretilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    );
};

export const generateSmartFeedback = (assignmentToGrade: Assignment, allStudentAssignments: Assignment[]): Promise<string> => {
    const { title, grade } = assignmentToGrade;

    const currentSubject = getSubject(title);
    
    // Calculate previous average for the same subject
    const previousAssignmentsInSubject = allStudentAssignments.filter(a => 
        a.id !== assignmentToGrade.id &&
        getSubject(a.title) === currentSubject &&
        a.status === AssignmentStatus.Graded && 
        a.grade !== null
    );

    let subjectContext = "";
    if (previousAssignmentsInSubject.length > 0) {
        const previousAvg = Math.round(previousAssignmentsInSubject.reduce((sum, a) => sum + a.grade!, 0) / previousAssignmentsInSubject.length);
        subjectContext = `Öğrencinin bu dersteki önceki not ortalaması yaklaşık ${previousAvg}.`;
        if (grade! > previousAvg + 5) {
            subjectContext += " Bu not, önceki performansına göre dikkate değer bir gelişim gösteriyor.";
        } else if (grade! < previousAvg - 5) {
            subjectContext += " Bu not, önceki performansına göre bir düşüş gösteriyor.";
        } else {
            subjectContext += " Bu not, önceki performansıyla tutarlı.";
        }
    } else {
        subjectContext = "Bu, öğrencinin bu derste notlandırılan ilk ödevi gibi görünüyor.";
    }

    const prompt = `Bir öğrencinin "${title}" ödevinden 100 üzerinden ${grade} aldığını varsayarak, hem yapıcı hem de motive edici bir geri bildirim yaz.
    
    Ek Bilgi: ${subjectContext}
    
    Bu ek bilgiyi kullanarak geri bildirimini kişiselleştir:
    - Eğer not yüksekse (85+): Öğrencinin güçlü yönlerini vurgula. Eğer bir gelişim varsa, bunu özellikle tebrik et. Gelecekte kendini nasıl daha da geliştirebileceğine dair bir ipucu ver.
    - Eğer not ortalamaysa (60-84): Hem iyi yaptığı noktaları belirt hem de geliştirmesi gereken alanlara odaklan. Eğer notu öncekilere göre düşmüşse cesaretlendirici ol, yükselmişse bu ivmeyi nasıl koruyacağını anlat.
    - Eğer not düşükse (<60): Öğrenciyi kırmadan, temel eksikliklere odaklan. Eğer bu bir düşüş ise, nedenlerini anlamaya yönelik bir adım at (örn: "Bu konuyu tekrar gözden geçirelim mi?"). Moralini bozmadan nasıl daha iyi olabileceğine dair somut adımlar öner ve yardım teklif et.
    
    Geri bildirimin tonu destekleyici, kişisel ve bağlama duyarlı olmalı.`;
    
    return cachedGeminiCall(
        `genFeedback_v2_${assignmentToGrade.id}`, // Use a more specific cache key
        ONE_HOUR,
        () => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.8 },
        }),
        (response) => response.text,
        "Akıllı geri bildirim üretilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    );
};


export const generateAssignmentChecklist = (title: string, description: string): Promise<{ text: string }[]> => {
    return cachedGeminiCall(
        `genChecklist_${title}_${description.substring(0, 50)}`,
        ONE_HOUR,
        () => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bir eğitim koçu olarak, "${title}" başlıklı ve "${description}" açıklamalı bir ödev için öğrencilerin takip etmesi gereken 3 ila 5 adımlık bir kontrol listesi oluştur.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { text: { type: Type.STRING } },
                        required: ['text'],
                    },
                },
            },
        }),
        (response) => JSON.parse(response.text.trim()),
        []
    );
};

export const getVisualAssignmentHelp = async (assignment: Assignment, image: { base64Data: string; mimeType: string }): Promise<string> => {
    try {
        const aiInstance = getAi();

        const textPart = {
            text: `Sen yardımsever bir öğretmen asistanısın. Bir öğrenci, "${assignment.title}" başlıklı ödevde zorlanıyor ve aşağıdaki resimle ilgili yardım istiyor. Ödevin açıklaması: "${assignment.description}". 
            
            Lütfen yüklenen görseli ve ödevin tanımını analiz ederek öğrenciye soruyu çözmesi için adım adım ipuçları ve yol gösterici bir kılavuz sun. Doğrudan son cevabı verme, bunun yerine öğrencinin çözüme kendi kendine ulaşmasını sağlayacak şekilde düşünme sürecini teşvik et. Örneğin, hangi formülü kullanması gerektiğini hatırlatabilir, ilk adımı gösterebilir veya sorudaki kilit noktaya dikkat çekebilirsin. Cevabın cesaretlendirici ve anlaşılır olsun.`
        };

        const imagePart = {
            inlineData: {
                mimeType: image.mimeType,
                data: image.base64Data,
            },
        };

        const response: GenerateContentResponse = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error getting visual assignment help:", error);
        return "Görsel analiz edilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    }
};

export const suggestStudentGoal = (studentName: string, averageGrade: number, overdueAssignments: number): Promise<string> => {
    const prompt = `Öğrenci ${studentName}'in mevcut durumu: Not ortalaması 100 üzerinden ${averageGrade} ve vadesi geçmiş ${overdueAssignments} ödevi var. Bu öğrenci için S.M.A.R.T. (Spesifik, Ölçülebilir, Ulaşılabilir, İlgili, Zaman-sınırlı) bir hedef öner. Hedef, öğrenciyi motive etmeli ve performansını artırmaya yönelik olmalı. Sadece tek cümlelik hedefin metnini döndür.`;
    return cachedGeminiCall(
        `suggestGoal_${studentName}_${averageGrade}_${overdueAssignments}`,
        ONE_HOUR,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } }),
        (response) => response.text,
        "Hedef önerisi üretilirken bir hata oluştu."
    );
};

export const generateWeeklySummary = (studentName: string, stats: { completed: number, avgGrade: number | string, goals: number }): Promise<string> => {
    const prompt = `Sen bir eğitim koçusun. Öğrencin ${studentName} için geçen haftaki performansına dayanarak kısa, pozitif ve motive edici bir özet yaz.
    Geçen haftanın verileri:
    - Tamamlanan ödev sayısı: ${stats.completed}
    - Haftalık not ortalaması: ${stats.avgGrade}
    - Ulaşılan hedef sayısı: ${stats.goals}

    Özeti şu şekilde yapılandır:
    1.  Genel bir tebrik ve pozitif bir başlangıç yap.
    2.  Verilerden bir veya iki olumlu noktayı vurgula (örneğin, "Bu hafta ${stats.completed} ödev tamamlaman harika!").
    3.  Gelecek hafta için küçük ve yapıcı bir teşvikte bulun.
    
    Tonun samimi ve cesaretlendirici olsun. Sadece özet metnini döndür.`;
    return cachedGeminiCall(
        `weeklySummary_${studentName}_${stats.completed}_${stats.avgGrade}_${stats.goals}`,
        ONE_HOUR,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 } }),
        (response) => response.text,
        "Haftalık özet oluşturulurken bir hata oluştu."
    );
};

export const generateStudentFocusSuggestion = (studentName: string, assignments: Assignment[]): Promise<string> => {
    const pendingCount = assignments.filter(a => a.status === AssignmentStatus.Pending).length;
    const graded = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 'N/A';
    const prompt = `Öğrenci ${studentName}'in güncel durumu: ${pendingCount} bekleyen ödevi var ve not ortalaması ${avgGrade}. Bu öğrencinin başarılı olmak için bir sonraki adımda neye odaklanması gerektiği konusunda kısa (1-2 cümle), eyleme geçirilebilir ve motive edici bir tavsiye ver.`;

    return cachedGeminiCall(
        `studentFocus_${studentName}_${pendingCount}_${avgGrade}`,
        FIFTEEN_MINUTES,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 } }),
        (response) => response.text,
        "Önceliklerini belirlemeye ve ödevlerini zamanında yapmaya odaklanarak harika bir hafta geçirebilirsin!"
    );
};

export const suggestFocusAreas = (studentName: string, assignments: Assignment[]): Promise<string> => {
    const graded = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);

    if (graded.length < 3) {
        return Promise.resolve("Odaklanılacak bir alan önermek için henüz yeterli veri yok. Ödevlerini tamamlamaya devam et!");
    }

    const subjectGrades: { [key: string]: number[] } = {};
    graded.forEach(a => {
        const subject = getSubject(a.title);
        if (subject !== 'Diğer') {
            if (!subjectGrades[subject]) subjectGrades[subject] = [];
            subjectGrades[subject].push(a.grade!);
        }
    });

    const subjectAverages = Object.entries(subjectGrades).map(([subject, grades]) => ({
        subject,
        average: Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
    })).filter(s => subjectGrades[s.subject].length > 1); // Only consider subjects with more than one grade for a more reliable average

    if (subjectAverages.length < 2) {
        return Promise.resolve("Harika gidiyorsun! Tüm derslerde tutarlı bir performans sergiliyorsun. Böyle devam et.");
    }

    const performanceSummary = subjectAverages
        .sort((a, b) => a.average - b.average) // Sort by lowest average first
        .map(s => `${s.subject} (ortalama: ${s.average})`)
        .join(', ');

    const prompt = `Bir öğrencinin derslerdeki not ortalamaları şu şekilde: ${performanceSummary}. 
    Öğrencinin adı ${studentName}. 
    Bu verilere dayanarak, öğrencinin odaklanması gereken 1 veya 2 dersi belirle. 
    Neden bu derslere odaklanması gerektiğini açıklayan kısa, motive edici ve yapıcı bir tavsiye yaz. 
    Tavsiyen doğrudan öğrenciye hitap etmeli ve "Bu hafta..." veya "Önümüzdeki günlerde..." gibi zaman ifadeleriyle eyleme geçirilebilir olmalı.
    Sadece tavsiye metnini döndür.`;
    
    return cachedGeminiCall(
        `suggestFocusAreas_v2_${studentName}_${graded.length}`,
        ONE_HOUR,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } }),
        (response) => response.text,
        "Bu hafta tüm derslerine eşit derecede önem vererek dengeli bir çalışma programı izleyebilirsin."
    );
};


export const generatePersonalCoachSummary = (coachName: string, students: User[], assignments: Assignment[]): Promise<string> => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const submittedThisWeek = assignments.filter(a => a.submittedAt && new Date(a.submittedAt) > oneWeekAgo).length;
    const toGradeCount = assignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const highPerformersCount = students.filter(s => {
        const studentAssignments = assignments.filter(a => a.studentId === s.id && a.status === AssignmentStatus.Graded && a.grade !== null);
        if (studentAssignments.length === 0) return false;
        const avg = studentAssignments.reduce((sum, a) => sum + a.grade!, 0) / studentAssignments.length;
        return avg >= 90;
    }).length;
    const needsAttentionCount = students.filter(s => {
         const overdueCount = assignments.filter(a => a.studentId === s.id && a.status === AssignmentStatus.Pending && new Date(a.dueDate) < now).length;
         return overdueCount > 1;
    }).length;
    
    const prompt = `Merhaba ${coachName}, sen bir eğitim koçusun. Öğrencilerinin bu haftaki performansını özetleyen ve sana özel eyleme geçirilebilir tavsiyeler sunan kısa bir analiz yaz. Öğrenci isimlerini KESİNLİKLE kullanma. Genel trendlere ve sayılara odaklan.
        
        İşte bu haftanın verileri:
        - Bu hafta teslim edilen toplam ödev: ${submittedThisWeek}
        - Değerlendirilmeyi bekleyen ödev: ${toGradeCount}
        - Gecikmiş ödevi olan öğrenci sayısı: ${needsAttentionCount}
        - Yüksek performans gösteren (Not ort. 90+) öğrenci sayısı: ${highPerformersCount}

        Bu verilere dayanarak, şu konularda kısa ve yapıcı tavsiyeler ver:
        1. Genel bir değerlendirme ve motivasyon cümlesi.
        2. Bu hafta nelere odaklanman gerektiği (örn: "Değerlendirilmeyi bekleyen ödevlere öncelik verebilirsin.").
        3. Öğrenci gruplarına yönelik genel stratejiler (örn: "Yüksek performans gösteren öğrencilere ek kaynaklar önerebilirsin." veya "Gecikmesi olan öğrencilerle birebir görüşmek faydalı olabilir.").
        
        Tonun profesyonel, destekleyici ve kişisel asistanın gibi olmalı.`;
    
    return cachedGeminiCall(
        `coachSummary_${coachName}_${submittedThisWeek}_${toGradeCount}_${needsAttentionCount}_${highPerformersCount}`,
        FIFTEEN_MINUTES,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 } }),
        (response) => response.text,
        "Bu haftaki koçluk özetin analiz edilirken bir sorun oluştu. Lütfen öğrenci detaylarını manuel olarak kontrol edin."
    );
};

export const suggestGrade = (assignment: Assignment): Promise<{ suggestedGrade: number, rationale: string } | null> => {
    let submissionContent = '';
    if (assignment.submissionType === 'text' && assignment.textSubmission) {
      submissionContent = `Öğrencinin metin cevabı aşağıdadır:\n\n"${assignment.textSubmission}"`;
    } else if (assignment.submissionType === 'file' && assignment.fileName) {
      submissionContent = `Öğrenci "${assignment.fileName}" adında bir dosya yükledi. Dosya içeriğini analiz edemediğini varsayarak, sadece başlık ve açıklamaya göre ideal bir teslimat için not öner.`;
    } else if (assignment.submissionType === 'completed') {
        submissionContent = `Öğrenci bu görevi "Tamamlandı" olarak işaretledi. Bu tür görevler için genellikle tam puan verilir.`;
    }

    const prompt = `Sen bir eğitim koçunun asistanısın. Aşağıdaki ödevi değerlendirerek 100 üzerinden bir not ve notun için tek cümlelik kısa bir gerekçe öner.
    
    Ödev Başlığı: "${assignment.title}"
    Ödev Açıklaması: "${assignment.description}"
    Öğrenci Teslimatı: ${submissionContent}
    
    Cevabını JSON formatında, 'suggestedGrade' (bir sayı) ve 'rationale' (bir string) anahtarlarıyla ver.`;

    return cachedGeminiCall(
        `suggestGrade_${assignment.id}`,
        ONE_HOUR,
        () => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedGrade: { type: Type.INTEGER },
                        rationale: { type: Type.STRING },
                    },
                    required: ['suggestedGrade', 'rationale'],
                },
                temperature: 0.5,
            },
        }),
        (response) => JSON.parse(response.text.trim()),
        null
    );
};

export const generateStudentAnalyticsInsight = (studentName: string, data: { avgGrade: number | string; completionRate: number; topSubject: string; lowSubject: string }): Promise<string> => {
    const prompt = `Sen bir motive edici ve eğlenceli bir oyun koçusun. Öğrencin ${studentName} için aşağıdaki performans verilerini analiz et ve ona özel, oyunlaştırılmış bir dille kısa bir analiz ve teşvik mesajı yaz.

        Veriler:
        - Genel Not Ortalaması: ${data.avgGrade}/100
        - Ödev Tamamlama Oranı: %${data.completionRate.toFixed(0)}
        - En Güçlü Olduğu Ders: ${data.topSubject || 'Henüz Belirlenmedi'}
        - Geliştirebileceği Ders: ${data.lowSubject || 'Henüz Belirlenmedi'}

        Mesajın şu formatta olsun:
        1.  Coşkulu bir selamlama ve genel performansına "level" veya "puan" gibi oyun terimleriyle değin.
        2.  En güçlü olduğu dersteki başarısını öv ("${data.topSubject} alanında tam bir ustasın!").
        3.  Geliştirebileceği derse yönelik nazik bir "yeni görev" veya "meydan okuma" önerisinde bulun.
        4.  Gelecek hafta için motive edici bir "bonus görev" vererek bitir.

        Tonun pozitif, enerjik ve cesaretlendirici olsun. Sadece metni döndür.`;
    
    return cachedGeminiCall(
        `studentInsight_${studentName}_${data.avgGrade}_${data.completionRate}`,
        FIFTEEN_MINUTES,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } }),
        (response) => response.text,
        "Bu hafta harika bir ilerleme kaydettin! Potansiyelini en üst seviyeye çıkarmak için sıkı çalışmaya devam et!"
    );
};

export const generateCoachAnalyticsInsight = (studentsData: { name: string, avgGrade: number, completionRate: number, overdue: number }[]): Promise<string> => {
    const classAvgGrade = studentsData.reduce((sum, s) => sum + s.avgGrade, 0) / (studentsData.length || 1);
    const highPerformers = studentsData.filter(s => s.avgGrade >= 90).length;
    const needsAttention = studentsData.filter(s => s.avgGrade < 70 || s.overdue > 1).length;
    const totalStudents = studentsData.length;
    const prompt = `Sen profesyonel bir eğitim analistisin. Bir koç için aşağıdaki sınıf verilerini analiz ederek kısa, net ve eyleme geçirilebilir bir stratejik özet raporu hazırla. Raporda öğrenci isimleri KESİNLİKLE KULLANILMAMALIDIR.

        Sınıf Verileri:
        - Toplam Öğrenci Sayısı: ${totalStudents}
        - Sınıfın Genel Not Ortalaması: ${classAvgGrade.toFixed(1)}/100
        - Yüksek Performanslı (Ort. > 90) Öğrenci Sayısı: ${highPerformers}
        - Yakından İlgilenilmesi Gereken (Ort. < 70 veya Gecikmiş ödevi olan) Öğrenci Sayısı: ${needsAttention}

        Rapor şu 3 bölümden oluşsun:
        1.  **Genel Durum:** Sınıfın genel performansına dair bir cümlelik bir özet.
        2.  **Öne Çıkan Noktalar:** Verilerdeki pozitif ve dikkat edilmesi gereken trendleri (örneğin, "Sınıfın %${((highPerformers / totalStudents) * 100).toFixed(0)}'ı yüksek performans gösteriyor, bu harika bir başarı.") bir veya iki madde halinde belirt.
        3.  **Stratejik Öneriler:** Koçun bu hafta odaklanabileceği 1-2 somut eylem önerisi sun. (Örn: "Düşük ortalamalı öğrenci grubuyla birebir görüşmeler planlayarak temel eksiklikleri tespit edebilirsin." veya "Yüksek performanslı gruba ek kaynaklar sunarak onları daha da ileri taşıyabilirsin.")

        Tonun profesyonel,sıcak,samimi, birazdaespirili ama gerçekçi, veri odaklı ve destekleyici olsun. Sadece rapor metnini döndür.`;
    
    return cachedGeminiCall(
        `coachInsight_${studentsData.length}_${studentsData.reduce((acc, s) => acc + s.avgGrade, 0)}`,
        FIFTEEN_MINUTES,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.6 } }),
        (response) => response.text,
        "Sınıf verileri analiz edilirken bir sorun oluştu. Lütfen öğrenci performansını manuel olarak gözden geçirin ve ihtiyaç duyan öğrencilerle iletişime geçin."
    );
};

export const generateAiTemplate = async (topic: string, level: string, duration: string): Promise<{ title: string; description: string; checklist: { text: string }[] } | null> => {
    const prompt = `Bir eğitim koçu olarak, YKS/AYT sınavına hazırlanan öğrenciler için bir ödev şablonu taslağı oluştur.
    
    Konu: "${topic}"
    Seviye: "${level}"
    Önerilen Tamamlanma Süresi: "${duration}"

    Bu bilgilere dayanarak, aşağıdaki JSON formatında bir yanıt oluştur:
    - title: Konuyla ilgili, dikkat çekici ve seviyeye uygun bir başlık. Örneğin: "Matematik: Türev Alma Kuralları (${level})".
    - description: Ödevin amacını, kapsamını ve beklentileri açıklayan detaylı bir metin. Metin, seçilen '${level}' seviyesine ve ödevin '${duration}' içinde tamamlanması beklentisine uygun olmalıdır.
    - checklist: Öğrencinin ödevi tamamlarken takip etmesi gereken 3 ila 5 adımlık bir kontrol listesi. Adımlar, öğrencinin ödevi '${duration}' içinde tamamlayabileceği şekilde mantıklı ve uygulanabilir olmalıdır.
    
    Cevabın sadece JSON objesi içermelidir. Başka hiçbir metin ekleme.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            checklist: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING }
                    },
                    required: ['text']
                }
            }
        },
        required: ['title', 'description', 'checklist']
    };
    
    return cachedGeminiCall(
        `genTemplate_${topic}_${level}_${duration}`,
        ONE_HOUR,
        () => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            },
        }),
        (response) => JSON.parse(response.text.trim()),
        null
    );
};

export const generateExamPerformanceInsight = (
    studentName: string, 
    performanceData: { 
        overallAvg: number | string; 
        subjectAvgs: { subject: string; average: number }[] 
    }
): Promise<string> => {
    const { overallAvg, subjectAvgs } = performanceData;
    
    const performanceSummary = subjectAvgs
        .sort((a, b) => a.average - b.average) // Sort by lowest average first
        .map(s => `${s.subject} (ortalama: ${s.average.toFixed(1)})`)
        .join(', ');

    const prompt = `Sen bir uzman YKS (TYT/AYT) eğitim koçusun. Öğrencinin adı ${studentName}. Aşağıdaki performans verilerini analiz et:
    - Genel Not Ortalaması: ${overallAvg}/100
    - Ders Bazında Performans: ${performanceSummary}

    Bu verilere dayanarak, öğrenci için detaylı, yapıcı ve motive edici bir sınav performansı analizi hazırla. Analiz metnini Markdown formatında, başlıklar kullanarak ve her bölüme en az bir emoji ekleyerek oluştur. Analiz şu bölümleri içermeli:
    
    ### 📊 Genel Değerlendirme
    Öğrencinin genel durumu hakkında kısa bir yorum yap.
    
    ### ✨ Güçlü Yönler
    En başarılı olduğu 2-3 dersi ve nedenlerini vurgula.
    
    ### 🔬 Geliştirilmesi Gereken Alanlar
    En düşük performans gösterdiği 2-3 dersi belirle. Bu derslerdeki olası eksik konuları tahmin et.
    
    ### 🚀 Kişiselleştirilmiş Eylem Planı
    Geliştirilmesi gereken alanlara yönelik 3-4 maddelik somut, haftalık ve eyleme geçirilebilir tavsiyeler sun (Örn: - **Fizik:** Bu hafta 'Elektrik' konusunu tekrar et ve en az 50 soru çöz.).
    
    ### ⭐ Motivasyon Mesajı
    Öğrenciyi teşvik eden pozitif bir kapanış cümlesi.

    Tonun profesyonel, destekleyici ve yol gösterici olmalı. Sadece analiz metnini döndür.`;
    
    const cacheKey = `examInsight_${studentName}_${overallAvg}_${subjectAvgs.length}`;
    
    return cachedGeminiCall(
        cacheKey,
        FIFTEEN_MINUTES,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 } }),
        (response) => response.text,
        "Performans analizi oluşturulurken bir hata oluştu. Lütfen derslerine odaklanmaya devam et, harika gidiyorsun!"
    );
};

type StudyPlanParams = {
    targetExams: string[];
    focusSubjects: string[];
    weeklyAvailability: Record<string, boolean[]>;
    sessionDuration: number;
    breakDuration: number;
};

type StudyPlanEvent = {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description: string;
};

export const generateStudyPlan = async (params: StudyPlanParams): Promise<StudyPlanEvent[] | null> => {
    const { targetExams, focusSubjects, weeklyAvailability, sessionDuration, breakDuration } = params;
    
    const availabilityString = Object.entries(weeklyAvailability)
        .map(([day, slots]) => {
            const availableSlots = slots.map((s, i) => s ? ['Sabah (08:00-12:00)', 'Öğlen (13:00-17:00)', 'Akşam (18:00-22:00)'][i] : null).filter(Boolean);
            return availableSlots.length > 0 ? `${day}: ${availableSlots.join(', ')}` : null;
        })
        .filter(Boolean)
        .join('\n');

    const prompt = `Bir öğrenci için önümüzdeki 7 günü kapsayan kişiselleştirilmiş bir haftalık çalışma planı oluştur. Planı, verimli çalışma ve dinlenme sürelerini dengeleyecek şekilde Pomodoro tekniğine benzer bir yapıda hazırla.

    Öğrenci Bilgileri:
    - Hedef Sınavlar: ${targetExams.join(', ')}
    - Odaklanılacak Dersler: ${focusSubjects.join(', ')}
    - Bir Ders Seansı Süresi: ${sessionDuration} dakika
    - Molalar: ${breakDuration} dakika
    - Haftalık Müsait Zamanlar:
    ${availabilityString}

    Lütfen bu bilgilere dayanarak, müsaİt zaman dilimlerini kullanarak bir çalışma planı oluştur. Her çalışma bloğu için başlık, tarih (YYYY-MM-DD formatında, bugünden başlayarak), başlangıç saati (HH:mm), bitiş saati (HH:mm) ve kısa bir açıklama (ne çalışılacağı) içeren bir JSON dizisi döndür. Dersleri ve konuları odak derslere ve hedef sınavlara göre çeşitlendir. Sadece JSON dizisini döndür.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                description: { type: Type.STRING },
            },
            required: ['title', 'date', 'startTime', 'endTime', 'description'],
        },
    };

    const cacheKey = `studyPlan_${focusSubjects.join('_')}_${sessionDuration}`;
    
    return cachedGeminiCall(
        cacheKey,
        ONE_HOUR,
        () => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            },
        }),
        (response) => JSON.parse(response.text.trim()) as StudyPlanEvent[],
        null
    );
};

// Fix: Add the missing 'generateGoalWithMilestones' function.
export const generateGoalWithMilestones = async (goalTitle: string): Promise<{ description: string, milestones: { text: string }[] } | null> => {
    const prompt = `Bir öğrencinin ana hedefi "${goalTitle}". Bu hedefe ulaşmak için onu motive edecek kısa bir açıklama ve 3 ila 5 adımlık uygulanabilir kilometre taşları (milestones) oluştur. Cevabını JSON formatında, 'description' (string) ve 'milestones' (her biri 'text' anahtarına sahip objelerden oluşan bir dizi) anahtarlarıyla ver.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            description: { type: Type.STRING },
            milestones: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING }
                    },
                    required: ['text']
                }
            }
        },
        required: ['description', 'milestones']
    };

    return cachedGeminiCall(
        `genGoalMilestones_${goalTitle}`,
        ONE_HOUR,
        () => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            },
        }),
        (response) => JSON.parse(response.text.trim()),
        null
    );
};

export const generateExamAnalysis = (exam: Exam, studentName: string): Promise<string> => {
    const prompt = `Sen uzman bir YKS (TYT/AYT) sınav koçusun. Öğrencin ${studentName}'in aşağıdaki sınav sonucunu analiz et ve ona özel, yapıcı ve motive edici bir performans raporu hazırla.

Sınav Sonuçları (JSON formatında):
${JSON.stringify(exam, null, 2)}

Raporu Markdown formatında, aşağıdaki başlıkları kullanarak ve her bölüme en az bir emoji ekleyerek oluştur:

### 📊 Genel Değerlendirme
Öğrencinin genel netini ve toplam puana göre durumunu yorumla. Başarılı bulduğun ve geliştirilmesi gereken genel noktaları belirt.

### 📚 Ders Bazında Analiz
Her bir ders için ayrı ayrı yorum yap.
- **Güçlü Dersler:** En yüksek net yaptığı 1-2 dersi belirle, bu başarıyı öv ve bu performansı nasıl koruyabileceğine dair ipuçları ver.
- **Geliştirilmesi Gereken Dersler:** En düşük net yaptığı 1-2 dersi belirle. Bu derslerdeki olası temel eksikliklere dikkat çek ve cesaretlendirici bir dille nasıl daha iyi olabileceğini anlat.

### 🚀 Eylem Planı ve Öneriler
Analizlerine dayanarak öğrenci için 3 maddelik somut, eyleme geçirilebilir bir sonraki adım listesi oluştur. (Örn: "- **Fizik:** 'Elektrik' konusunda eksiklerin görünüyor. Bu hafta konu tekrarı yapıp en az 50 soru çözmeye ne dersin?").

### ⭐ Motivasyon Mesajı
Öğrenciyi teşvik eden, genel durumu özetleyen ve geleceğe yönelik umut veren pozitif bir kapanış cümlesi yaz.

Tonun profesyonel, destekleyici ve yol gösterici olmalı. Sadece analiz metnini döndür.`;

    return cachedGeminiCall(
        `examAnalysis_v2_${exam.id}`,
        ONE_HOUR,
        () => getAi().models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 } }),
        (response) => response.text,
        "Sınav analizi oluşturulurken bir hata oluştu. Lütfen netlerini ve ders performansını manuel olarak gözden geçir."
    );
};

export const generateExamDetails = async (category: string, topic: string, studentGrade: string): Promise<{ title: string; description: string; totalQuestions: number; dueDate: string } | null> => {
    const prompt = `Bir eğitim koçu olarak, YKS'ye hazırlanan ${studentGrade}. sınıf öğrencisi için bir sınav taslağı oluştur.
    
    Ders: "${category}"
    Konu: "${topic}"

    Bu bilgilere dayanarak, aşağıdaki JSON formatında bir yanıt oluştur:
    - title: Konuyla ilgili, öğrencinin seviyesine uygun, ilgi çekici bir sınav başlığı. Örn: "${topic} Konu Tarama Testi".
    - description: Sınavın amacını ve kapsamını açıklayan kısa bir metin.
    - totalQuestions: Bu konu için makul bir soru sayısı (20 ile 50 arasında).
    - dueDate: Bugünden itibaren 7 gün sonrası için önerilen bir teslim tarihi (YYYY-MM-DD formatında).
    
    Cevabın sadece JSON objesi içermelidir. Başka hiçbir metin ekleme.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            totalQuestions: { type: Type.INTEGER },
            dueDate: { type: Type.STRING }
        },
        required: ['title', 'description', 'totalQuestions', 'dueDate']
    };

    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.6,
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating exam details with AI:", error);
        return null;
    }
};