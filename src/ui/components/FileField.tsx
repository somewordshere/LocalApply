import { useState } from 'react';
import type { StoredFile } from '@/src/profile/schema';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function readFile(file: File): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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
  const [error, setError] = useState('');
  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return setError('File is larger than 10 MB.');
    setError('');
    onChange(await readFile(file));
  };
  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-quiet">
          {value ? 'Replace' : 'Choose file'}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.odt,.rtf,.txt"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        {value ? (
          <>
            <span className="text-sm">{value.name}</span>
            <button
              className="cursor-pointer text-sm text-red-600 hover:underline dark:text-red-400"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          </>
        ) : (
          <span className="text-sm text-slate-500 dark:text-slate-400">No file stored</span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
