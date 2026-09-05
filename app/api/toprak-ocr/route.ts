import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const IZIN_VERILEN_TIPLER = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BASE64_UZUNLUGU = 7_000_000; // ~5MB ham dosya

const alanlarSchema = {
  type: Type.OBJECT,
  properties: {
    bunye: { type: Type.STRING },
    ph: { type: Type.STRING },
    kirec: { type: Type.STRING },
    organikMadde: { type: Type.STRING },
    ec: { type: Type.STRING },
    fosfor: { type: Type.STRING },
    potasyum: { type: Type.STRING },
  },
  required: ['bunye', 'ph', 'kirec', 'organikMadde', 'ec', 'fosfor', 'potasyum'],
};

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY ortam değişkeni tanımlı değil.');
    return NextResponse.json(
      { success: false, error: 'Sunucu yapılandırma hatası. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Geçersiz istek gövdesi.' },
      { status: 400 }
    );
  }

  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
  const data = typeof body.data === 'string' ? body.data : '';

  if (!IZIN_VERILEN_TIPLER.includes(mimeType)) {
    return NextResponse.json(
      { success: false, error: 'Desteklenmeyen dosya türü. JPEG, PNG, WEBP veya PDF yükleyin.' },
      { status: 400 }
    );
  }

  if (!data || data.length > MAX_BASE64_UZUNLUGU) {
    return NextResponse.json(
      { success: false, error: 'Dosya boş veya çok büyük (maks. ~5MB).' },
      { status: 400 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        { inlineData: { mimeType, data } },
        'Bu bir toprak tahlil raporu görseli/PDF\'idir. İçindeki değerleri çıkar.',
      ],
      config: {
        systemInstruction: `Sen bir toprak tahlil raporu okuma asistanısın. Sağlanan görsel/PDF içindeki toprak tahlil değerlerini oku ve şemadaki alanlara yerleştir.
Bir değeri raporda bulamıyorsan veya okuyamıyorsan o alanı boş string ("") olarak bırak, asla tahmin veya uydurma değer üretme.
bunye alanı için sadece şu değerlerden birini kullan (en yakınını seç): Kumlu, Tınlı, Killi, Killi-Tınlı, Kumlu-Tınlı, Siltli. Eminsen değilsen boş bırak.
Sayısal alanlar (ph, kirec, organikMadde, ec, fosfor, potasyum) için sadece sayıyı yaz, birim ekleme.`,
        responseMimeType: 'application/json',
        responseSchema: alanlarSchema,
      },
    });

    const metin = response.text;
    if (!metin) {
      throw new Error('Modelden boş yanıt döndü.');
    }

    const alanlar = JSON.parse(metin);
    return NextResponse.json({ success: true, alanlar });
  } catch (error) {
    console.error('Toprak tahlil belgesi okunurken hata oluştu:', error);
    return NextResponse.json(
      { success: false, error: 'Belge okunamadı. Lütfen değerleri elle girin.' },
      { status: 500 }
    );
  }
}
