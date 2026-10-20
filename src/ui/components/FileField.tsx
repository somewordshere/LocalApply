import { useState } from 'react';
import type { StoredFile } from '@/src/profile/schema';
import { useI18n } from '../I18nProvider';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function readFile(file: File): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 text-ink-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M4 1.75h5.25L12.5 5v9.25H4z" strokeLinejoin="round" />
      <path d="M9 1.75V5.25h3.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Picks a document and keeps it as a data URL so it can be attached to forms later. */
export function FileField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StoredFile | null;
  onChange: (file: StoredFile | null) => void;
}) {
  const { t } = useI18n();
  const [tooLarge, setTooLarge] = useState(false);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setTooLarge(file.size > MAX_FILE_BYTES);
    if (file.size > MAX_FILE_BYTES) return;
    onChange(await readFile(file));
  };
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-quiet">
          {value ? t('file.replace') : t('file.choose')}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.odt,.rtf,.txt"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        {value ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-md bg-paper px-2.5 py-1 text-sm text-ink">
              <FileIcon />
              {value.name}
            </span>
            <button
              className="cursor-pointer text-sm font-medium text-danger underline-offset-3 hover:underline"
              onClick={() => onChange(null)}
            >
              {t('remove')}
            </button>
          </>
        ) : (
          <span className="text-sm text-ink-faint">{t('file.none')}</span>
        )}
      </div>
      {tooLarge && <p className="mt-1.5 text-sm text-danger">{t('file.tooLarge')}</p>}
    </div>
  );
}
