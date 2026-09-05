import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const REQUIRED_FIELDS = [
  'urun',
  'bunye',
  'ph',
  'kirec',
  'organikMadde',
  'ec',
  'fosfor',
  'potasyum',
] as const;

const MAX_TEXT_LENGTH = 200;

function toSafeText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  if (!text || text.length > MAX_TEXT_LENGTH) return null;
  return text;
}

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

  const values: Record<string, string> = {};
  for (const field of REQUIRED_FIELDS) {
    const safe = toSafeText(body[field]);
    if (safe === null) {
      return NextResponse.json(
        { success: false, error: `Geçersiz veya eksik alan: ${field}` },
        { status: 400 }
      );
    }
    values[field] = safe;
  }

  const { urun, bunye, ph, kirec, organikMadde, ec, fosfor, potasyum } = values;

  const promptInput = `
Toprak tahlil değerleri:
- Hedef Ürün: ${urun}
- Bünye: ${bunye}
- pH: ${ph}
- Kireç (%): ${kirec}
- Organik Madde (%): ${organikMadde}
- EC: ${ec} dS/m
- Fosfor (P2O5): ${fosfor} ppm
- Potasyum (K2O): ${potasyum} ppm
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptInput,
      config: {
        systemInstruction: `Sen uzman bir Ziraat Mühendisisin.
Toprak analiz değerlerini değerlendir; kilitlenen elementleri, ıslah tavsiyelerini ve dönemsel gübreleme takvimini (kg/da) doğrudan, hap bilgilerle raporla.`
      }
    });

    return NextResponse.json({ success: true, rapor: response.text });
  } catch (error) {
    console.error('Toprak analiz raporu oluşturulurken hata oluştu:', error);
    return NextResponse.json(
      { success: false, error: 'Rapor oluşturulamadı. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}
