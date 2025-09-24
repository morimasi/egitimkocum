
import { GoogleGenAI } from "@google/genai";

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
