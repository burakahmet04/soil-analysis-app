'use client';

import { ChangeEvent } from 'react';
import { BUNYE_LISTESI, ToprakFormValues, URUN_LISTESI } from '../lib/types';
import { BelgeIkonu, YukleIkonu } from './icons';

const TEMEL_ALANLAR: { name: keyof ToprakFormValues; etiket: React.ReactNode }[] = [
  { name: 'ph', etiket: 'pH' },
  { name: 'kirec', etiket: 'Kireç (%)' },
  { name: 'organikMadde', etiket: 'Organik Madde (%)' },
  { name: 'ec', etiket: 'EC (dS/m)' },
];

const MAKRO_ALANLAR: { name: keyof ToprakFormValues; etiket: React.ReactNode }[] = [
  { name: 'azot', etiket: 'Azot - N (%)' },
  { name: 'fosfor', etiket: 'Fosfor - P (ppm)' },
  { name: 'potasyum', etiket: 'Potasyum - K (ppm)' },
  { name: 'kalsiyum', etiket: 'Kalsiyum - Ca (ppm)' },
  { name: 'magnezyum', etiket: 'Magnezyum - Mg (ppm)' },
  { name: 'sodyum', etiket: 'Sodyum - Na (ppm)' },
];

const MIKRO_ALANLAR: { name: keyof ToprakFormValues; etiket: React.ReactNode }[] = [
  { name: 'demir', etiket: 'Demir - Fe (ppm)' },
  { name: 'bakir', etiket: 'Bakır - Cu (ppm)' },
  { name: 'cinko', etiket: 'Çinko - Zn (ppm)' },
  { name: 'mangan', etiket: 'Mangan - Mn (ppm)' },
  { name: 'bor', etiket: 'Bor - B (ppm)' },
];

const girdiSinifi =
  'w-full border border-border-subtle rounded-lg px-3 py-2.5 text-sm bg-surface text-foreground ' +
  'placeholder:text-foreground/35 transition focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500';

function AltBaslik({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40 mb-2 mt-4 first:mt-0">
      {children}
    </p>
  );
}

function SayisalAlanGrubu({
  alanlar,
  form,
  onInput,
}: {
  alanlar: { name: keyof ToprakFormValues; etiket: React.ReactNode }[];
  form: ToprakFormValues;
  onInput: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {alanlar.map(({ name, etiket }) => (
        <div key={name}>
          <label className="block text-xs font-semibold mb-1.5 text-foreground/70">{etiket}</label>
          <input
            type="number"
            step="0.01"
            name={name}
            value={form[name]}
            onChange={onInput}
            placeholder="—"
            className={girdiSinifi}
          />
        </div>
      ))}
    </div>
  );
}

export default function ToprakForm({
  form,
  onChange,
  onSubmit,
  onDosyaSecildi,
  yukleniyor,
  ocrYukleniyor,
  ocrHata,
  ocrBilgi,
}: {
  form: ToprakFormValues;
  onChange: (alan: keyof ToprakFormValues, deger: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDosyaSecildi: (dosya: File) => void;
  yukleniyor: boolean;
  ocrYukleniyor: boolean;
  ocrHata: string;
  ocrBilgi: string;
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
    <form onSubmit={onSubmit} className="space-y-6">
      <label
        htmlFor="tahlil-dosyasi"
        className="group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed
          border-brand-300 bg-brand-50/60 px-4 py-6 text-center transition
          hover:border-brand-400 hover:bg-brand-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 transition group-hover:bg-brand-200">
          {ocrYukleniyor ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
          ) : (
            <YukleIkonu className="h-5 w-5" />
          )}
        </span>
        <span className="text-sm font-semibold text-brand-800">
          Toprak tahlil raporunuzu yükleyin
        </span>
        <span className="text-xs text-foreground/50">
          Fotoğraf veya PDF — değerleri sizin için otomatik dolduralım
        </span>
        <input
          id="tahlil-dosyasi"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleDosya}
          disabled={ocrYukleniyor}
          className="sr-only"
        />
      </label>
      {ocrHata && (
        <p className="-mt-3 text-xs text-red-600" role="alert">
          {ocrHata}
        </p>
      )}
      {ocrBilgi && (
        <p className="-mt-3 text-xs text-brand-700" role="status">
          {ocrBilgi}
        </p>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
          <BelgeIkonu className="h-4 w-4" />
          Toprak Bilgileri
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-foreground/70">
              Hedef Ürün <span className="text-earth-500">*</span>
            </label>
            <select
              name="urun"
              value={form.urun}
              onChange={handleInput}
              required
              className={`${girdiSinifi} appearance-none`}
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
            <label className="block text-xs font-semibold mb-1.5 text-foreground/70">Toprak Bünyesi</label>
            <select
              name="bunye"
              value={form.bunye}
              onChange={handleInput}
              className={`${girdiSinifi} appearance-none`}
            >
              <option value="">Bilinmiyor</option>
              {BUNYE_LISTESI.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AltBaslik>Temel Özellikler</AltBaslik>
        <SayisalAlanGrubu alanlar={TEMEL_ALANLAR} form={form} onInput={handleInput} />

        <AltBaslik>Makro Besin Elementleri</AltBaslik>
        <SayisalAlanGrubu alanlar={MAKRO_ALANLAR} form={form} onInput={handleInput} />

        <AltBaslik>Mikro Besin Elementleri</AltBaslik>
        <SayisalAlanGrubu alanlar={MIKRO_ALANLAR} form={form} onInput={handleInput} />
      </div>

      <p className="text-xs text-foreground/40">
        Yalnızca Hedef Ürün zorunludur; elinizde olmayan değerleri boş bırakabilirsiniz.
      </p>

      <button
        type="submit"
        disabled={yukleniyor}
        className="w-full bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-medium py-3 rounded-lg
          transition shadow-sm shadow-brand-900/20 disabled:opacity-50 disabled:pointer-events-none
          flex items-center justify-center gap-2"
      >
        {yukleniyor && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />}
        {yukleniyor ? 'Hesaplanıyor...' : 'Toprak Karnesini Oluştur'}
      </button>
    </form>
  );
}
