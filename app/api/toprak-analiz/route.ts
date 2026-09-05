import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { urun, bunye, ph, kirec, organikMadde, ec, fosfor, potasyum } = body;

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptInput,
      config: {
        systemInstruction: `Sen uzman bir Ziraat Mühendisisin.
Toprak analiz değerlerini değerlendir; kilitlenen elementleri, ıslah tavsiyelerini ve dönemsel gübreleme takvimini (kg/da) doğrudan, hap bilgilerle raporla.`
      }
    });

    return NextResponse.json({ success: true, rapor: response.text });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}