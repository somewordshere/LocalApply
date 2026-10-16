import { useState } from 'react';
import type { Profile } from '@/src/profile/schema';
import { joinPhone, splitPhone } from '@/src/profile/phone';

const MODES: [mode: Profile['phoneEntry'], label: string][] = [
  ['split', 'Country code + number'],
  ['full', 'Full number'],
];

/**
 * The phone number, entered either as country code and number in two boxes or as one
 * full international number. Either way the profile keeps code and number apart, since
 * forms ask both ways.
 */
export function PhoneField({ profile, update }: { profile: Profile; update: (patch: Partial<Profile>) => void }) {
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
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span id="phone-label" className="text-sm font-medium">
          Phone
        </span>
        <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-xs dark:border-slate-700">
          {MODES.map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={profile.phoneEntry === mode}
              // Moving to one box tidies a full number typed into the number box into its two parts.
              onClick={() =>
                update(mode === 'full' ? { phoneEntry: mode, ...splitPhone(joinPhone(profile)) } : { phoneEntry: mode })
              }
              className={`cursor-pointer rounded-md px-2.5 py-1 font-medium ${
                profile.phoneEntry === mode
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {full ? (
        <>
          <input
            className="field"
            type="tel"
            aria-label="Full phone number"
            placeholder="+48791532218"
            value={text}
            onChange={(e) => typeFull(e.target.value)}
          />
          {text.trim() && (
            <p
              className={`mt-1 text-xs ${
                parts.phoneCountryCode ? 'text-slate-500 dark:text-slate-400' : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {parts.phoneCountryCode
                ? `Read as country code ${parts.phoneCountryCode} and number ${parts.phoneNumber || '…'}`
                : 'Start with + and the country code (for example +48) so forms with a separate country code box can be filled.'}
            </p>
          )}
        </>
      ) : (
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <input
            className="field"
            aria-label="Phone country code"
            placeholder="+48"
            value={profile.phoneCountryCode}
            onChange={(e) => update({ phoneCountryCode: e.target.value })}
          />
          <input
            className="field"
            type="tel"
            aria-label="Phone number"
            placeholder="791532218"
            value={profile.phoneNumber}
            onChange={(e) => update({ phoneNumber: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
