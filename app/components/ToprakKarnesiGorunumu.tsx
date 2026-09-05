'use client';

import { RefObject, useState } from 'react';
import type { Durum, GenelDurum, ToprakFormValues, ToprakKarnesi } from '../lib/types';
import { EtiketIkonu, IndirIkonu, KontrolIkonu, PaylasIkonu, TakvimIkonu, UyariIkonu } from './icons';

const GENEL_DURUM_STIL: Record<GenelDurum, string> = {
  iyi: 'bg-brand-600 text-brand-50',
  orta: 'bg-earth-500 text-white',
  kritik: 'bg-red-600 text-white',
};

const GENEL_DURUM_ETIKET: Record<GenelDurum, string> = {
  iyi: 'İyi',
  orta: 'Orta',
  kritik: 'Kritik',
};

const DURUM_STIL: Record<Durum, string> = {
  düşük: 'bg-red-50 text-red-700 border-red-200',
  yeterli: 'bg-brand-50 text-brand-800 border-brand-200',
  yüksek: 'bg-earth-50 text-earth-800 border-earth-200',
  bilinmiyor: 'bg-surface-muted text-foreground/60 border-border-subtle',
};

const DURUM_NOKTA: Record<Durum, string> = {
  düşük: 'bg-red-500',
  yeterli: 'bg-brand-500',
  yüksek: 'bg-earth-500',
  bilinmiyor: 'bg-foreground/30',
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

  const imgData = await toPng(eleman, { pixelRatio: 2, backgroundColor: '#fffdf8' });
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

function BolumBasligi({ ikon: Ikon, children }: { ikon: (p: { className?: string }) => React.JSX.Element; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/45 mb-3">
      <Ikon className="h-3.5 w-3.5" />
      {children}
    </h3>
  );
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
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg
            bg-foreground text-surface hover:opacity-90 transition disabled:opacity-50"
        >
          <IndirIkonu className="h-4 w-4" />
          {pdfOlusturuluyor ? 'PDF Hazırlanıyor...' : 'PDF İndir'}
        </button>
        <button
          type="button"
          onClick={handleWhatsappKopyala}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg
            bg-brand-600 text-white hover:bg-brand-700 transition"
        >
          {kopyalandi ? <KontrolIkonu className="h-4 w-4" /> : <PaylasIkonu className="h-4 w-4" />}
          {kopyalandi ? 'Kopyalandı' : 'WhatsApp Metnini Kopyala'}
        </button>
      </div>

      <div ref={raporRef} className="bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
        <div className={`px-6 py-5 flex items-center justify-between flex-wrap gap-3 ${GENEL_DURUM_STIL[rapor.genelDurum]}`}>
          <h2 className="font-display text-lg font-semibold">Toprak Karnesi — {form.urun}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Genel Durum: {GENEL_DURUM_ETIKET[rapor.genelDurum]}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-foreground/75 leading-relaxed">{rapor.ozet}</p>

          {rapor.degerlendirmeler.length > 0 && (
            <section>
              <BolumBasligi ikon={KontrolIkonu}>Parametre Değerlendirmesi</BolumBasligi>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rapor.degerlendirmeler.map((d, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-xs ${DURUM_STIL[d.durum]}`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${DURUM_NOKTA[d.durum]}`} />
                        {d.parametre}
                      </span>
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
              <BolumBasligi ikon={UyariIkonu}>Uyarılar</BolumBasligi>
              <ul className="space-y-1.5">
                {rapor.uyarilar.map((u, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-earth-800 bg-earth-50 border border-earth-200 rounded-lg px-3 py-2.5"
                  >
                    <UyariIkonu className="h-3.5 w-3.5 mt-0.5 shrink-0 text-earth-600" />
                    {u}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rapor.gubrelemeTakvimi.length > 0 && (
            <section>
              <BolumBasligi ikon={TakvimIkonu}>Gübreleme Takvimi</BolumBasligi>

              {/* Mobilde geniş tablo yerine yığılmış kartlar; html-to-image PDF çıktısı
                  o an ekranda görünen (masaüstü ya da mobil) düzeni birebir yakalar. */}
              <div className="space-y-2 md:hidden">
                {rapor.gubrelemeTakvimi.map((g, i) => (
                  <div key={i} className="rounded-lg border border-border-subtle p-3 text-xs bg-surface">
                    <div className="font-semibold text-brand-800 mb-1.5">{g.donem}</div>
                    <dl className="space-y-1">
                      <div className="flex justify-between gap-3">
                        <dt className="text-foreground/50">Gübre</dt>
                        <dd className="text-right font-medium">{g.gubre}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-foreground/50">Doz</dt>
                        <dd className="text-right font-medium">{g.dozKgDa} kg/da</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-foreground/50 shrink-0">Uygulama</dt>
                        <dd className="text-right">{g.uygulamaSekli}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-lg border border-border-subtle">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-muted text-left text-foreground/60">
                      <th className="p-2.5 font-semibold">Dönem</th>
                      <th className="p-2.5 font-semibold">Gübre</th>
                      <th className="p-2.5 font-semibold">Doz (kg/da)</th>
                      <th className="p-2.5 font-semibold">Uygulama Şekli</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapor.gubrelemeTakvimi.map((g, i) => (
                      <tr key={i} className="odd:bg-surface even:bg-surface-muted/50 border-t border-border-subtle">
                        <td className="p-2.5 font-medium text-brand-800">{g.donem}</td>
                        <td className="p-2.5">{g.gubre}</td>
                        <td className="p-2.5">{g.dozKgDa}</td>
                        <td className="p-2.5">{g.uygulamaSekli}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {rapor.ticariGubreKarsiliklari.length > 0 && (
            <section>
              <BolumBasligi ikon={EtiketIkonu}>Ticari Gübre Karşılıkları</BolumBasligi>
              <div className="space-y-2">
                {rapor.ticariGubreKarsiliklari.map((t, i) => (
                  <div key={i} className="text-xs border border-border-subtle rounded-lg p-3.5 bg-surface">
                    <div className="font-semibold text-foreground/80">{t.ihtiyac}</div>
                    <div className="flex flex-wrap gap-1.5 my-2">
                      {t.ticariUrunler.map((urun, j) => (
                        <span
                          key={j}
                          className="px-2.5 py-1 rounded-full bg-brand-700 text-brand-50 font-medium"
                        >
                          {urun}
                        </span>
                      ))}
                    </div>
                    <div className="text-foreground/60">{t.aciklama}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="text-[11px] text-foreground/40 border-t border-border-subtle pt-4">
            {rapor.kaynakUyarisi}
          </p>
        </div>
      </div>
    </div>
  );
}
