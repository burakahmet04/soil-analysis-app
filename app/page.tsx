'use client';

import { useRef, useState } from 'react';
import ToprakForm from './components/ToprakForm';
import ToprakKarnesiGorunumu from './components/ToprakKarnesiGorunumu';
import { BOS_FORM, ToprakFormValues, ToprakKarnesi } from './lib/types';

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
  const raporRef = useRef<HTMLDivElement>(null);

  const handleChange = (alan: keyof ToprakFormValues, deger: string) => {
    setForm((onceki) => ({ ...onceki, [alan]: deger }));
  };

  const handleDosyaSecildi = async (dosya: File) => {
    setOcrHata('');

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
        setForm((onceki) => {
          const guncel = { ...onceki };
          for (const alan of ['bunye', 'ph', 'kirec', 'organikMadde', 'ec', 'fosfor', 'potasyum'] as const) {
            const deger = veri.alanlar?.[alan];
            if (typeof deger === 'string' && deger.trim()) {
              guncel[alan] = deger.trim();
            }
          }
          return guncel;
        });
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
    <main className="min-h-screen bg-slate-100 p-6 md:p-12 text-slate-900">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border">
        <h1 className="text-2xl font-bold text-emerald-800 mb-2">Toprak Tahlili ve Gübreleme Motoru</h1>
        <p className="text-sm text-slate-500 mb-6">
          Tahlil raporunuzu yükleyin veya değerleri girip butona basın.
        </p>

        <ToprakForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onDosyaSecildi={handleDosyaSecildi}
          yukleniyor={yukleniyor}
          ocrYukleniyor={ocrYukleniyor}
          ocrHata={ocrHata}
        />

        {raporHata && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
            {raporHata}
          </div>
        )}

        {rapor && <ToprakKarnesiGorunumu form={form} rapor={rapor} raporRef={raporRef} />}
      </div>
    </main>
  );
}
