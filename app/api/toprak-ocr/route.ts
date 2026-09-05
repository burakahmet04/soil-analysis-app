import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { TAHLIL_ALAN_ADLARI } from '../../lib/types';

const IZIN_VERILEN_TIPLER = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BASE64_UZUNLUGU = 7_000_000; // ~5MB ham dosya

const ALAN_ACIKLAMALARI: Record<(typeof TAHLIL_ALAN_ADLARI)[number], string> = {
  bunye: `Toprağın bünye/tekstür SINIFI — bir SAYI DEĞİL, bir metin sınıfı. Raporda genelde "SATURASYON" veya "BÜNYE"
satırının "Değerlendirme" ya da "Sonuç" sütununda doğrudan yazılı olur (örn. "KİL", "KİLLİ TINLI"). Sadece şu 5
değerden birini yaz: "Kum", "Tınlı", "Killi Tınlı", "Kil", "Ağır Kil". Bulamazsan boş string ("") bırak.`,
  ph: 'pH parametresinin ÖLÇÜLEN SONUÇ değeri (örn. 7.82) — sınır/referans/aralık değerleri değil. Birim ekleme.',
  kirec: 'KİREÇ (%) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  organikMadde: 'ORGANİK MADDE (%) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  ec: 'EC (iletkenlik, ms/cm veya dS/m) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  azot: 'AZOT / N (%) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  fosfor: 'FOSFOR / P (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  potasyum: 'POTASYUM / K (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  kalsiyum: 'KALSİYUM / Ca (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  magnezyum: 'MAGNEZYUM / Mg (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  sodyum: 'SODYUM / Na (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  demir: 'DEMİR / Fe (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  bakir: 'BAKIR / Cu (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  cinko: 'ÇİNKO / Zn (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  mangan: 'MANGAN / Mn (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
  bor: 'BOR / B (ppm) parametresinin ÖLÇÜLEN SONUÇ değeri — sınır/referans/aralık değerleri değil. Birim ekleme.',
};

const alanlarSchema = {
  type: Type.OBJECT,
  properties: Object.fromEntries(
    TAHLIL_ALAN_ADLARI.map((alan) => [
      alan,
      { type: Type.STRING, description: ALAN_ACIKLAMALARI[alan] },
    ])
  ),
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
laboratuvarının (örn. METALAB gibi) düzenlediği "Toprak Analiz Raporu" olabilir. Bu raporlarda her parametre için genelde
birden fazla sayı görürsün: gerçekte ÖLÇÜLEN sonuç, ve ayrıca sınır/referans/karşılaştırma aralığı değerleri (örn. "Çok
Düşük 2,5 Düşük 8 Orta 25 Yüksek 80" gibi bir ölçek). Her zaman gerçekte ÖLÇÜLEN sonucu al — genelde tablodaki en
belirgin/kalın yazılan tekil sayıdır, satırın başında veya kendine ait bir sütunda durur; ölçek/eşik listesindeki sayıları
asla alma. Rapor tek bir sayfa/tablo değil, birden fazla sayfa halinde gelebilir; her parametreyi tüm sayfalarda ara.

Her alanın tam olarak ne aradığı şemadaki açıklamasında (description) belirtilmiştir, buna sadık kal — özellikle "bunye"
diğerlerinden farklı olarak bir SAYI değil, bir METİN SINIFIdır.

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
