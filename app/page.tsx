'use client';

import { useRef, useState } from 'react';
import ToprakForm from './components/ToprakForm';
import ToprakKarnesiGorunumu from './components/ToprakKarnesiGorunumu';
import { YaprakIkonu } from './components/icons';
import { BOS_FORM, TAHLIL_ALAN_ADLARI, ToprakFormValues, ToprakKarnesi } from './lib/types';

const MAX_DOSYA_BOYUTU = 5 * 1024 * 1024; // 5MB

function dosyayiBase64eCevir(dosya: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const sonuc = reader.result as string;
      const virgulIndeksi = sonuc.indexOf(',');
      resolve(virgulIndeksi >= 0 ? sonuc.slice(virgulIndeksi + 1) : sonuc);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(dosya);
  });
}

export default function Home() {
  const [form, setForm] = useState<ToprakFormValues>(BOS_FORM);
  const [rapor, setRapor] = useState<ToprakKarnesi | null>(null);
  const [raporHata, setRaporHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [ocrYukleniyor, setOcrYukleniyor] = useState(false);
  const [ocrHata, setOcrHata] = useState('');
  const [ocrBilgi, setOcrBilgi] = useState('');
  const raporRef = useRef<HTMLDivElement>(null);

  const handleChange = (alan: keyof ToprakFormValues, deger: string) => {
    setForm((onceki) => ({ ...onceki, [alan]: deger }));
  };

  const handleDosyaSecildi = async (dosya: File) => {
    setOcrHata('');
    setOcrBilgi('');

    if (dosya.size > MAX_DOSYA_BOYUTU) {
      setOcrHata('Dosya çok büyük (maks. 5MB).');
      return;
    }

    setOcrYukleniyor(true);
    try {
      const base64 = await dosyayiBase64eCevir(dosya);
      const res = await fetch('/api/toprak-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: dosya.type, data: base64 }),
      });
      const veri = await res.json();
      if (veri.success) {
        let doldurulanAlanSayisi = 0;
        setForm((onceki) => {
          const guncel = { ...onceki };
          for (const alan of TAHLIL_ALAN_ADLARI) {
            const deger = veri.alanlar?.[alan];
            if (typeof deger === 'string' && deger.trim()) {
              guncel[alan] = deger.trim();
              doldurulanAlanSayisi += 1;
            }
          }
          return guncel;
        });

        if (doldurulanAlanSayisi > 0) {
          setOcrBilgi(`Belgeden ${doldurulanAlanSayisi} alan otomatik dolduruldu, kontrol edip düzenleyebilirsiniz.`);
        } else {
          setOcrHata('Belgeden herhangi bir toprak tahlil değeri okunamadı. Değerleri elle girebilir veya daha net bir görsel/PDF deneyebilirsiniz.');
        }
      } else {
        setOcrHata(veri.error || 'Belge okunamadı.');
      }
    } catch {
      setOcrHata('Belge yüklenirken bağlantı hatası oluştu.');
    } finally {
      setOcrYukleniyor(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);
    setRaporHata('');
    setRapor(null);

    try {
      const res = await fetch('/api/toprak-analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setRapor(data.rapor);
      } else {
        setRaporHata(data.error || 'Rapor oluşturulamadı.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setRaporHata('Bağlantı hatası: ' + message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-3 mb-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-brand-50 shadow-sm shadow-brand-900/20">
            <YaprakIkonu className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Toprak Analiz Platformu
            </p>
            <h1 className="font-display text-2xl font-semibold text-brand-950 leading-tight">
              Toprak Tahlili ve Gübreleme Motoru
            </h1>
          </div>
        </header>

        <div className="bg-surface p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-950/5 border border-border-subtle">
          <p className="text-sm text-foreground/60 mb-6">
            Tahlil raporunuzu yükleyin veya değerleri girip butona basın; ürününüze özel bir toprak
            karnesi ve gübreleme takvimi hazırlayalım.
          </p>

          <ToprakForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onDosyaSecildi={handleDosyaSecildi}
            yukleniyor={yukleniyor}
            ocrYukleniyor={ocrYukleniyor}
            ocrHata={ocrHata}
            ocrBilgi={ocrBilgi}
          />

          {raporHata && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
              {raporHata}
            </div>
          )}

          {rapor && <ToprakKarnesiGorunumu form={form} rapor={rapor} raporRef={raporRef} />}
        </div>

        <p className="text-center text-xs text-foreground/40 mt-6">
          Yapay zeka destekli tavsiyeler, sertifikalı bir ziraat mühendisinin teşhisinin yerini tutmaz.
        </p>
      </div>
    </main>
  );
}
