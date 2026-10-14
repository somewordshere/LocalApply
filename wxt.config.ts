import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'LocalApply – Private Job Application Autofill',
    short_name: 'LocalApply',
    description:
      'Fills job application forms from your saved profile in one click. Works offline; your data never leaves the browser.',
    permissions: ['storage', 'unlimitedStorage'],
    commands: {
      'fill-form': {
        suggested_key: { default: 'Alt+Shift+F' },
        description: 'Fill the application form on this page',
      },
    },
    browser_specific_settings: {
      gecko: {
        id: 'localapply@addon',
        // Firefox asks extensions to declare what they send out; this one sends nothing.
        data_collection_permissions: { required: ['none'] },
      },
    },
  },
  // The source zip is what addons.mozilla.org reviewers rebuild from; releases, store material and docs are not part of the build.
  zip: {
    excludeSources: ['releases/**', 'store/**', 'docs/**', 'scripts/store-assets.mjs', 'tests/e2e/**'],
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
