import { useState } from 'react';
import type { Profile } from '@/src/profile/schema';
import { joinPhone, splitPhone } from '@/src/profile/phone';
import { useI18n } from '@/src/ui/I18nProvider';
import type { MessageKey } from '@/src/ui/i18n';

const MODES: [mode: Profile['phoneEntry'], label: MessageKey][] = [
  ['split', 'phone.split'],
  ['full', 'phone.full'],
];

/**
 * The phone number, entered either as country code and number in two boxes or as one
 * full international number. Either way the profile keeps code and number apart, since
 * forms ask both ways.
 */
export function PhoneField({ profile, update }: { profile: Profile; update: (patch: Partial<Profile>) => void }) {
  const { t } = useI18n();
  const full = profile.phoneEntry === 'full';
  // What the person typed into the single box, spaces and all; the profile only keeps the two parts.
  const [text, setText] = useState(() => joinPhone(profile));
  const parts = splitPhone(text);

  // Take over changes made elsewhere (the two boxes, an imported profile). While typing here the
  // two always agree, so this never fights the cursor.
  if (parts.phoneCountryCode !== profile.phoneCountryCode || parts.phoneNumber !== profile.phoneNumber) {
    const current = joinPhone(profile);
    if (current !== text) setText(current);
  }

  const typeFull = (value: string) => {
    setText(value);
    update(splitPhone(value));
  };

  return (
    <div role="group" aria-labelledby="phone-label">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span id="phone-label" className="text-sm font-medium text-ink">
          {t('phone.label')}
        </span>
        {/* One control with two halves; the chosen half is solid ink, so neither depends on colour. */}
        <div className="inline-flex divide-x divide-line-strong overflow-hidden rounded-md border border-line-strong text-xs">
          {MODES.map(([mode, label]) => {
            const chosen = profile.phoneEntry === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={chosen}
                // Moving to one box tidies a full number typed into the number box into its two parts.
                onClick={() =>
                  update(
                    mode === 'full' ? { phoneEntry: mode, ...splitPhone(joinPhone(profile)) } : { phoneEntry: mode },
                  )
                }
                className={`cursor-pointer px-3 py-1.5 font-medium transition ${
                  chosen ? 'bg-ink text-paper' : 'bg-sheet text-ink-soft hover:bg-paper hover:text-ink'
                }`}
              >
                {t(label)}
              </button>
            );
          })}
        </div>
      </div>

      {full ? (
        <>
          <input
            className="field"
            type="tel"
            aria-label={t('phone.fullLabel')}
            placeholder="+442079460123"
            value={text}
            onChange={(e) => typeFull(e.target.value)}
          />
          {text.trim() && (
            <p className={`mt-1.5 text-xs ${parts.phoneCountryCode ? 'text-ink-faint' : 'text-warn'}`}>
              {parts.phoneCountryCode
                ? t('phone.readAs', { code: parts.phoneCountryCode, number: parts.phoneNumber || '…' })
                : t('phone.noCode')}
            </p>
          )}
        </>
      ) : (
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <input
            className="field"
            aria-label={t('phone.codeLabel')}
            placeholder="+44"
            value={profile.phoneCountryCode}
            onChange={(e) => update({ phoneCountryCode: e.target.value })}
          />
          <input
            className="field"
            type="tel"
            aria-label={t('phone.numberLabel')}
            placeholder="20 7946 0123"
            value={profile.phoneNumber}
            onChange={(e) => update({ phoneNumber: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
