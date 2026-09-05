import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { TAHLIL_ALAN_ADLARI } from '../../lib/types';

const IZIN_VERILEN_TIPLER = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BASE64_UZUNLUGU = 7_000_000; // ~5MB ham dosya

const alanlarSchema = {
  type: Type.OBJECT,
  properties: Object.fromEntries(TAHLIL_ALAN_ADLARI.map((alan) => [alan, { type: Type.STRING }])),
  required: [...TAHLIL_ALAN_ADLARI],
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
        systemInstruction: `Sen bir toprak tahlil raporu okuma asistanısın. Sağlanan görsel/PDF, Türkiye'deki akredite bir tarımsal analiz
laboratuvarının (örn. METALAB gibi) düzenlediği "Toprak Analiz Raporu" olabilir. Genelde "Analiz Sonuçları" başlıklı bir
tabloda parametre adı, birim, yöntem ve "Analiz Sonucu" sütunları bulunur — değerleri her zaman "Analiz Sonucu"
sütunundan al, sınır/referans değer sütunlarından değil.

Aranacak parametreler ve olası adları: pH, Kireç, Organik Madde, EC (iletkenlik), Azot (N), Fosfor (P), Potasyum (K),
Kalsiyum (Ca), Magnezyum (Mg), Sodyum (Na), Demir (Fe), Bakır (Cu), Çinko (Zn), Mangan (Mn), Bor (B).
Sayısal alanlar için şemadaki alanlara sadece sayıyı yaz (virgülü nokta yapabilirsin), birim ekleme.

bunye alanı için raporda "SATURASYON" veya "BÜNYE" satırının "Değerlendirme"/"Sonuç" sütununda genelde doğrudan yazan
sınıfı kullan (KUM, TINLI, KİLLİ TINLI, KİL veya AĞIR KİL) — bunlardan en yakınını seç. Emin değilsen boş bırak.

Bir değeri raporda bulamıyorsan veya net okuyamıyorsan o alanı boş string ("") olarak bırak, asla tahmin veya uydurma
değer üretme.`,
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
