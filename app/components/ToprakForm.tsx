'use client';

import { ChangeEvent } from 'react';
import { BUNYE_LISTESI, ToprakFormValues, URUN_LISTESI } from '../lib/types';

const SAYISAL_ALANLAR: { name: keyof ToprakFormValues; etiket: string }[] = [
  { name: 'ph', etiket: 'pH' },
  { name: 'kirec', etiket: 'Kireç (%)' },
  { name: 'organikMadde', etiket: 'Organik Madde (%)' },
  { name: 'ec', etiket: 'EC (dS/m)' },
  { name: 'fosfor', etiket: 'Fosfor (P₂O₅ ppm)' },
  { name: 'potasyum', etiket: 'Potasyum (K₂O ppm)' },
];

export default function ToprakForm({
  form,
  onChange,
  onSubmit,
  onDosyaSecildi,
  yukleniyor,
  ocrYukleniyor,
  ocrHata,
}: {
  form: ToprakFormValues;
  onChange: (alan: keyof ToprakFormValues, deger: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDosyaSecildi: (dosya: File) => void;
  yukleniyor: boolean;
  ocrYukleniyor: boolean;
  ocrHata: string;
}) {
  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.name as keyof ToprakFormValues, e.target.value);
  };

  const handleDosya = (e: ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    if (dosya) onDosyaSecildi(dosya);
    e.target.value = '';
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="border-2 border-dashed rounded-lg p-4 text-center bg-slate-50">
        <label className="block text-xs font-semibold mb-2 text-slate-600">
          Toprak Tahlil Raporu (Fotoğraf veya PDF) — Değerleri otomatik doldurmayı deneyelim
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleDosya}
          disabled={ocrYukleniyor}
          className="text-xs w-full"
        />
        {ocrYukleniyor && (
          <p className="text-xs text-slate-500 mt-2">Belge okunuyor, lütfen bekleyin...</p>
        )}
        {ocrHata && <p className="text-xs text-red-600 mt-2">{ocrHata}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1">
            Hedef Ürün <span className="text-red-500">*</span>
          </label>
          <select
            name="urun"
            value={form.urun}
            onChange={handleInput}
            required
            className="w-full border rounded p-2 text-sm bg-white"
          >
            <option value="" disabled>
              Seçiniz...
            </option>
            {URUN_LISTESI.map((urun) => (
              <option key={urun} value={urun}>
                {urun}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Toprak Bünyesi</label>
          <select
            name="bunye"
            value={form.bunye}
            onChange={handleInput}
            className="w-full border rounded p-2 text-sm bg-white"
          >
            <option value="">Bilinmiyor</option>
            {BUNYE_LISTESI.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {SAYISAL_ALANLAR.map(({ name, etiket }) => (
          <div key={name}>
            <label className="block text-xs font-semibold mb-1">{etiket}</label>
            <input
              type="number"
              step="0.1"
              name={name}
              value={form[name]}
              onChange={handleInput}
              placeholder="Bilinmiyor"
              className="w-full border rounded p-2 text-sm"
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Yalnızca Hedef Ürün zorunludur; elinizde olmayan değerleri boş bırakabilirsiniz.
      </p>

      <button
        type="submit"
        disabled={yukleniyor}
        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded transition disabled:opacity-50"
      >
        {yukleniyor ? 'Hesaplanıyor...' : 'Toprak Karnesini Oluştur'}
      </button>
    </form>
  );
}
