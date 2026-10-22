import { useState, type ReactNode } from 'react';
import type { Profile } from '@/src/profile/schema';
import { joinPhone, splitPhone } from '@/src/profile/phone';
import { useI18n } from '@/src/ui/I18nProvider';

/**
 * The phone number in three linked boxes: country code, number, and the full international
 * number. Typing the full number splits it into the other two; typing either part rebuilds it.
 * The profile keeps only code and number, since forms ask both ways.
 */
export function PhoneField({ profile, update }: { profile: Profile; update: (patch: Partial<Profile>) => void }) {
  const { t } = useI18n();
  // What the person typed into the full box, spaces and all; the profile only keeps the two parts.
  const [text, setText] = useState(() => joinPhone(profile));
  const parts = splitPhone(text);

  // Take over changes made elsewhere (the two part boxes, an imported profile). While typing in the
  // full box the two always agree, so this never fights the cursor.
  if (parts.phoneCountryCode !== profile.phoneCountryCode || parts.phoneNumber !== profile.phoneNumber) {
    const current = joinPhone(profile);
    if (current !== text) setText(current);
  }

  const typeFull = (value: string) => {
    setText(value);
    update(splitPhone(value));
  };

  const box = (label: string, input: ReactNode, className = '') => (
    <label className={className}>
      <span className="mb-1 block text-xs text-ink-soft">{label}</span>
      {input}
    </label>
  );

  return (
    <div role="group" aria-labelledby="phone-label">
      <span id="phone-label" className="mb-1.5 block text-sm font-medium text-ink">
        {t('phone.label')}
      </span>
      <div className="grid grid-cols-[7rem_1fr] gap-3 sm:grid-cols-[7rem_1fr_1.25fr]">
        {box(
          t('phone.codeLabel'),
          <input
            className="field"
            placeholder="+44"
            value={profile.phoneCountryCode}
            onChange={(e) => update({ phoneCountryCode: e.target.value })}
          />,
        )}
        {box(
          t('phone.numberLabel'),
          <input
            className="field"
            type="tel"
            placeholder="20 7946 0123"
            value={profile.phoneNumber}
            onChange={(e) => update({ phoneNumber: e.target.value })}
          />,
        )}
        {box(
          t('phone.full'),
          <input
            className="field"
            type="tel"
            placeholder="+442079460123"
            value={text}
            onChange={(e) => typeFull(e.target.value)}
          />,
          'col-span-2 sm:col-span-1',
        )}
      </div>
      {text.trim() && !parts.phoneCountryCode && <p className="mt-1.5 text-xs text-warn">{t('phone.noCode')}</p>}
    </div>
  );
}
