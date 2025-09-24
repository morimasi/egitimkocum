import { GoogleGenAI, Type } from "@google/genai";

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