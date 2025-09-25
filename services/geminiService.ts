import { GoogleGenAI, Type } from "@google/genai";
import { Assignment, AssignmentStatus, User } from "../types";

// Ensure API_KEY is available in the environment.
if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateAssignmentDescription = async (title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Bir eğitim koçu olarak, "${title}" başlıklı bir ödev için öğrencilere yol gösterecek, motive edici ve net bir açıklama metni oluştur. Açıklama, ödevin amacını, beklentileri ve teslimat kriterlerini içermeli.`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating assignment description:", error);
    return "Açıklama üretilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
  }
};

export const generateSmartFeedback = async (grade: number, assignmentTitle: string): Promise<string> => {
  try {
    const prompt = `Bir öğrencinin "${assignmentTitle}" ödevinden 100 üzerinden ${grade} aldığını varsayarak, hem yapıcı hem de motive edici bir geri bildirim yaz.
    - Eğer not yüksekse (85+): Öğrencinin güçlü yönlerini vurgula ve onu tebrik et. Gelecekte kendini nasıl daha da geliştirebileceğine dair bir ipucu ver.
    - Eğer not ortalamaysa (60-84): Hem iyi yaptığı noktaları hem de geliştirmesi gereken alanları belirt. Cesaretlendirici bir dil kullan.
    - Eğer not düşükse (<60): Öğrenciyi kırmadan, temel eksikliklere odaklan. Moralini bozmadan nasıl daha iyi olabileceğine dair somut adımlar öner ve yardım teklif et.
    Geri bildirimin tonu destekleyici ve kişisel olmalı.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
       config: {
        temperature: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating smart feedback:", error);
    return "Akıllı geri bildirim üretilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
  }
};

export const generateAssignmentChecklist = async (title: string, description: string): Promise<{ text: string }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Bir eğitim koçu olarak, "${title}" başlıklı ve "${description}" açıklamalı bir ödev için öğrencilerin takip etmesi gereken 3 ila 5 adımlık bir kontrol listesi oluştur.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'Kontrol listesi maddesinin metni.',
              },
            },
            propertyOrdering: ["text"],
            required: ['text'],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating assignment checklist:", error);
    return [];
  }
};

export const suggestStudentGoal = async (studentName: string, averageGrade: number, overdueAssignments: number): Promise<string> => {
  try {
    const prompt = `Öğrenci ${studentName}'in mevcut durumu: Not ortalaması 100 üzerinden ${averageGrade} ve vadesi geçmiş ${overdueAssignments} ödevi var. Bu öğrenci için S.M.A.R.T. (Spesifik, Ölçülebilir, Ulaşılabilir, İlgili, Zaman-sınırlı) bir hedef öner. Hedef, öğrenciyi motive etmeli ve performansını artırmaya yönelik olmalı. Sadece tek cümlelik hedefin metnini döndür.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error suggesting student goal:", error);
    return "Hedef önerisi üretilirken bir hata oluştu.";
  }
};

export const generateWeeklySummary = async (studentName: string, stats: { completed: number, avgGrade: number | string, goals: number }): Promise<string> => {
  try {
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
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
        },
    });

    return response.text;
  } catch(error) {
    console.error("Error generating weekly summary:", error);
    return "Haftalık özet oluşturulurken bir hata oluştu.";
  }
};

export const generateStudentFocusSuggestion = async (studentName: string, assignments: Assignment[]): Promise<string> => {
    try {
        const pendingCount = assignments.filter(a => a.status === AssignmentStatus.Pending).length;
        const graded = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 'N/A';

        const prompt = `Öğrenci ${studentName}'in güncel durumu: ${pendingCount} bekleyen ödevi var ve not ortalaması ${avgGrade}. Bu öğrencinin başarılı olmak için bir sonraki adımda neye odaklanması gerektiği konusunda kısa (1-2 cümle), eyleme geçirilebilir ve motive edici bir tavsiye ver.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7 },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating student focus suggestion:", error);
        return "Önceliklerini belirlemeye ve ödevlerini zamanında yapmaya odaklanarak harika bir hafta geçirebilirsin!";
    }
};

export const generatePersonalCoachSummary = async (coachName: string, students: User[], assignments: Assignment[]): Promise<string> => {
    try {
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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7 },
        });

        return response.text;
    } catch (error) {
        console.error("Error generating personal coach summary:", error);
        return "Bu haftaki koçluk özetin analiz edilirken bir sorun oluştu. Lütfen öğrenci detaylarını manuel olarak kontrol edin.";
    }
};


export const suggestGrade = async (assignment: Assignment): Promise<{ suggestedGrade: number, rationale: string } | null> => {
  try {
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
    
    const response = await ai.models.generateContent({
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
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error suggesting grade:", error);
    return null;
  }
};

export const generateStudentAnalyticsInsight = async (studentName: string, data: { avgGrade: number | string; completionRate: number; topSubject: string; lowSubject: string }): Promise<string> => {
    try {
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
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.8 },
        });

        return response.text;
    } catch (error) {
        console.error("Error generating student analytics insight:", error);
        return "Bu hafta harika bir ilerleme kaydettin! Potansiyelini en üst seviyeye çıkarmak için sıkı çalışmaya devam et!";
    }
};


export const generateCoachAnalyticsInsight = async (studentsData: { name: string, avgGrade: number, completionRate: number, overdue: number }[]): Promise<string> => {
    try {
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

        Tonun profesyonel, veri odaklı ve destekleyici olsun. Sadece rapor metnini döndür.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.6 },
        });

        return response.text;
    } catch (error) {
        console.error("Error generating coach analytics insight:", error);
        return "Sınıf verileri analiz edilirken bir sorun oluştu. Lütfen öğrenci performansını manuel olarak gözden geçirin ve ihtiyaç duyan öğrencilerle iletişime geçin.";
    }
};