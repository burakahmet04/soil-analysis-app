import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { TAHLIL_ALAN_ADLARI, TahlilAlanAdi } from '../../lib/types';

const ALAN_ETIKETLERI: Record<TahlilAlanAdi, string> = {
  bunye: 'Bünye (saturasyon sınıfı)',
  ph: 'pH',
  kirec: 'Kireç (%)',
  organikMadde: 'Organik Madde (%)',
  ec: 'EC (dS/m)',
  azot: 'Azot - N (%)',
  fosfor: 'Fosfor - P (ppm, Olsen/Bray-Kurtz)',
  potasyum: 'Potasyum - K (ppm)',
  kalsiyum: 'Kalsiyum - Ca (ppm)',
  magnezyum: 'Magnezyum - Mg (ppm)',
  sodyum: 'Sodyum - Na (ppm)',
  demir: 'Demir - Fe (ppm)',
  bakir: 'Bakır - Cu (ppm)',
  cinko: 'Çinko - Zn (ppm)',
  mangan: 'Mangan - Mn (ppm)',
  bor: 'Bor - B (ppm)',
};

const MAX_TEXT_LENGTH = 200;

function toSafeText(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const text = String(value).trim();
  if (text.length > MAX_TEXT_LENGTH) return '';
  return text;
}

const raporSchema = {
  type: Type.OBJECT,
  properties: {
    genelDurum: { type: Type.STRING, enum: ['iyi', 'orta', 'kritik'] },
    ozet: { type: Type.STRING },
    degerlendirmeler: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          parametre: { type: Type.STRING },
          deger: { type: Type.STRING },
          durum: { type: Type.STRING, enum: ['düşük', 'yeterli', 'yüksek', 'bilinmiyor'] },
          yorum: { type: Type.STRING },
        },
        required: ['parametre', 'deger', 'durum', 'yorum'],
      },
    },
    uyarilar: { type: Type.ARRAY, items: { type: Type.STRING } },
    gubrelemeTakvimi: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          donem: { type: Type.STRING },
          gubre: { type: Type.STRING },
          dozKgDa: { type: Type.STRING },
          uygulamaSekli: { type: Type.STRING },
        },
        required: ['donem', 'gubre', 'dozKgDa', 'uygulamaSekli'],
      },
    },
    ticariGubreKarsiliklari: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ihtiyac: { type: Type.STRING },
          ticariUrunler: { type: Type.ARRAY, items: { type: Type.STRING } },
          aciklama: { type: Type.STRING },
        },
        required: ['ihtiyac', 'ticariUrunler', 'aciklama'],
      },
    },
    kaynakUyarisi: { type: Type.STRING },
  },
  required: [
    'genelDurum',
    'ozet',
    'degerlendirmeler',
    'uyarilar',
    'gubrelemeTakvimi',
    'ticariGubreKarsiliklari',
    'kaynakUyarisi',
  ],
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

  const urun = toSafeText(body.urun);
  if (!urun) {
    return NextResponse.json(
      { success: false, error: 'Hedef ürün seçilmesi zorunludur.' },
      { status: 400 }
    );
  }

  const degerSatirlari: string[] = [];
  const eksikAlanlar: string[] = [];
  for (const alan of TAHLIL_ALAN_ADLARI) {
    const deger = toSafeText(body[alan]);
    if (deger) {
      degerSatirlari.push(`- ${ALAN_ETIKETLERI[alan]}: ${deger}`);
    } else {
      eksikAlanlar.push(ALAN_ETIKETLERI[alan]);
    }
  }

  const promptInput = `
Hedef Ürün: ${urun}

Mevcut toprak tahlil değerleri:
${degerSatirlari.length > 0 ? degerSatirlari.join('\n') : '(Hiçbir değer girilmedi)'}

Girilmeyen/eksik değerler: ${eksikAlanlar.length > 0 ? eksikAlanlar.join(', ') : 'Yok'}

Eksik değerler için varsayım yapıp uydurma rakam üretme; bunun yerine genel bölge/ürün bilgisiyle temkinli bir değerlendirme yap ve bu eksikliği uyarılar bölümünde açıkça belirt.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptInput,
      config: {
        systemInstruction: `Sen uzman bir Ziraat Mühendisisin. Türkiye'deki akredite toprak laboratuvarlarının standart "ANALİZ-3" paketine
benzer bir makro+mikro besin element paneli (pH, kireç, organik madde, EC, azot, fosfor, potasyum, kalsiyum, magnezyum,
sodyum, demir, bakır, çinko, mangan, bor) değerlendirip bir "Toprak Karnesi" hazırlıyorsun.
Element etkileşimlerini dikkate al: örn. yüksek kireç/pH fosfor ve mikro elementleri (Fe, Zn, Mn) kilitleyebilir; yüksek
sodyum/EC tuzluluk-alkalilik riskine işaret eder; kalsiyum/magnezyum dengesizliği potasyum/magnezyum alımını etkileyebilir.
Kilitlenen elementleri, ıslah tavsiyelerini, dönemsel gübreleme takvimini (kg/da) ve önerilen gübrelerin Türkiye
piyasasında bilinen ticari/tecimsel karşılıklarını (örn. "Amonyum Sülfat %21", "DAP (18-46-0)", "Potasyum Sülfat %50",
"20-20-0 Kompoze", çinko/demir şelatları gibi mikro element gübreleri) somut biçimde raporla. Sadece değeri girilen
parametreleri değerlendir; girilmeyenler için uydurma rakam üretme. kaynakUyarisi alanına bu raporun yapay zeka
tarafından üretildiğini, kesin bir agronomi/laboratuvar teşhisinin yerine geçmeyeceğini belirten kısa bir not yaz.`,
        responseMimeType: 'application/json',
        responseSchema: raporSchema,
      },
    });

    const metin = response.text;
    if (!metin) {
      throw new Error('Modelden boş yanıt döndü.');
    }

    const rapor = JSON.parse(metin);
    return NextResponse.json({ success: true, rapor });
  } catch (error) {
    console.error('Toprak analiz raporu oluşturulurken hata oluştu:', error);
    return NextResponse.json(
      { success: false, error: 'Rapor oluşturulamadı. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}
