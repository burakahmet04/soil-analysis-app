'use client';

import { RefObject, useState } from 'react';
import type { Durum, GenelDurum, ToprakFormValues, ToprakKarnesi } from '../lib/types';

const GENEL_DURUM_STIL: Record<GenelDurum, string> = {
  iyi: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  orta: 'bg-amber-100 text-amber-800 border-amber-300',
  kritik: 'bg-red-100 text-red-800 border-red-300',
};

const GENEL_DURUM_ETIKET: Record<GenelDurum, string> = {
  iyi: 'İyi',
  orta: 'Orta',
  kritik: 'Kritik',
};

const DURUM_STIL: Record<Durum, string> = {
  düşük: 'bg-red-50 text-red-700 border-red-200',
  yeterli: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  yüksek: 'bg-amber-50 text-amber-700 border-amber-200',
  bilinmiyor: 'bg-slate-100 text-slate-600 border-slate-200',
};

function whatsappMetniOlustur(form: ToprakFormValues, rapor: ToprakKarnesi): string {
  const satirlar: string[] = [
    `*Toprak Tahlil Raporu* — ${form.urun}`,
    `Genel Durum: ${GENEL_DURUM_ETIKET[rapor.genelDurum]}`,
    '',
    rapor.ozet,
    '',
    '*Değerlendirme:*',
    ...rapor.degerlendirmeler.map(
      (d) => `- ${d.parametre}: ${d.deger || '—'} (${d.durum}) — ${d.yorum}`
    ),
  ];

  if (rapor.uyarilar.length > 0) {
    satirlar.push('', '*Uyarılar:*', ...rapor.uyarilar.map((u) => `⚠️ ${u}`));
  }

  if (rapor.gubrelemeTakvimi.length > 0) {
    satirlar.push(
      '',
      '*Gübreleme Takvimi:*',
      ...rapor.gubrelemeTakvimi.map(
        (g) => `- ${g.donem}: ${g.gubre} — ${g.dozKgDa} kg/da (${g.uygulamaSekli})`
      )
    );
  }

  if (rapor.ticariGubreKarsiliklari.length > 0) {
    satirlar.push(
      '',
      '*Ticari Gübre Karşılıkları:*',
      ...rapor.ticariGubreKarsiliklari.map(
        (t) => `- ${t.ihtiyac}: ${t.ticariUrunler.join(', ')}`
      )
    );
  }

  satirlar.push('', rapor.kaynakUyarisi);

  return satirlar.join('\n');
}

async function pdfIndir(eleman: HTMLElement) {
  const [{ toPng }, { jsPDF }] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
  ]);

  const imgData = await toPng(eleman, { pixelRatio: 2, backgroundColor: '#ffffff' });
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Görsel oluşturulamadı.'));
    img.src = imgData;
  });

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (img.height * imgWidth) / img.width;

  let kalanYukseklik = imgHeight;
  let pozisyon = 0;

  pdf.addImage(imgData, 'PNG', 0, pozisyon, imgWidth, imgHeight);
  kalanYukseklik -= pageHeight;

  while (kalanYukseklik > 0) {
    pozisyon = kalanYukseklik - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, pozisyon, imgWidth, imgHeight);
    kalanYukseklik -= pageHeight;
  }

  pdf.save(`toprak-karnesi-${Date.now()}.pdf`);
}

export default function ToprakKarnesiGorunumu({
  form,
  rapor,
  raporRef,
}: {
  form: ToprakFormValues;
  rapor: ToprakKarnesi;
  raporRef: RefObject<HTMLDivElement | null>;
}) {
  const [pdfOlusturuluyor, setPdfOlusturuluyor] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);

  const handlePdfIndir = async () => {
    if (!raporRef.current) return;
    setPdfOlusturuluyor(true);
    try {
      await pdfIndir(raporRef.current);
    } catch (err) {
      console.error('PDF oluşturulamadı:', err);
    } finally {
      setPdfOlusturuluyor(false);
    }
  };

  const handleWhatsappKopyala = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMetniOlustur(form, rapor));
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch (err) {
      console.error('Panoya kopyalanamadı:', err);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2 mb-4 print:hidden">
        <button
          type="button"
          onClick={handlePdfIndir}
          disabled={pdfOlusturuluyor}
          className="px-4 py-2 text-sm font-medium rounded bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {pdfOlusturuluyor ? 'PDF Hazırlanıyor...' : 'PDF İndir'}
        </button>
        <button
          type="button"
          onClick={handleWhatsappKopyala}
          className="px-4 py-2 text-sm font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {kopyalandi ? 'Kopyalandı ✓' : 'WhatsApp Metnini Kopyala'}
        </button>
      </div>

      <div ref={raporRef} className="bg-white p-6 rounded-xl border space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-slate-800">Toprak Karnesi — {form.urun}</h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${GENEL_DURUM_STIL[rapor.genelDurum]}`}
          >
            Genel Durum: {GENEL_DURUM_ETIKET[rapor.genelDurum]}
          </span>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">{rapor.ozet}</p>

        {rapor.degerlendirmeler.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Parametre Değerlendirmesi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rapor.degerlendirmeler.map((d, i) => (
                <div key={i} className={`p-3 rounded border text-xs ${DURUM_STIL[d.durum]}`}>
                  <div className="flex justify-between font-semibold">
                    <span>{d.parametre}</span>
                    <span>{d.deger || '—'}</span>
                  </div>
                  <div className="mt-1 opacity-90">{d.yorum}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {rapor.uyarilar.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Uyarılar</h3>
            <ul className="space-y-1">
              {rapor.uyarilar.map((u, i) => (
                <li key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  ⚠️ {u}
                </li>
              ))}
            </ul>
          </section>
        )}

        {rapor.gubrelemeTakvimi.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Gübreleme Takvimi</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="p-2 border">Dönem</th>
                    <th className="p-2 border">Gübre</th>
                    <th className="p-2 border">Doz (kg/da)</th>
                    <th className="p-2 border">Uygulama Şekli</th>
                  </tr>
                </thead>
                <tbody>
                  {rapor.gubrelemeTakvimi.map((g, i) => (
                    <tr key={i} className="odd:bg-white even:bg-slate-50">
                      <td className="p-2 border">{g.donem}</td>
                      <td className="p-2 border">{g.gubre}</td>
                      <td className="p-2 border">{g.dozKgDa}</td>
                      <td className="p-2 border">{g.uygulamaSekli}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {rapor.ticariGubreKarsiliklari.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Ticari Gübre Karşılıkları</h3>
            <div className="space-y-2">
              {rapor.ticariGubreKarsiliklari.map((t, i) => (
                <div key={i} className="text-xs border rounded p-3">
                  <div className="font-semibold text-slate-800">{t.ihtiyac}</div>
                  <div className="flex flex-wrap gap-1 my-1">
                    {t.ticariUrunler.map((urun, j) => (
                      <span key={j} className="px-2 py-0.5 rounded-full bg-slate-800 text-white">
                        {urun}
                      </span>
                    ))}
                  </div>
                  <div className="text-slate-600">{t.aciklama}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-[11px] text-slate-400 border-t pt-3">{rapor.kaynakUyarisi}</p>
      </div>
    </div>
  );
}
