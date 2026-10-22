import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';

/**
 * React DOM can write raw HTML into the page (`dangerouslySetInnerHTML`). The extension never
 * renders raw HTML, so both places that do it are replaced with an error: the capability is
 * gone rather than merely unused, and Mozilla's linter stops flagging the two `innerHTML`
 * assignments. If a React update changes that code, the build fails here instead of quietly
 * shipping the old path.
 */
function noRawHtml(): Plugin {
  const RAW_HTML = '(domElement.innerHTML = key)';
  const REFUSED = '(function () { throw Error("LocalApply does not render raw HTML (dangerouslySetInnerHTML)"); })()';
  return {
    name: 'localapply:no-raw-html',
    transform(code, id) {
      if (!/react-dom[\\/]cjs[\\/]react-dom-client\.production\.js$/.test(id)) return null;
      const found = code.split(RAW_HTML).length - 1;
      if (found !== 2) this.error(`Expected 2 raw-HTML assignments in ${id}, found ${found}; review the React update.`);
      return { code: code.split(RAW_HTML).join(REFUSED), map: null };
    },
  };
}

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    // Name, summary and the shortcut's name come from public/_locales/<language>/messages.json, so both stores
    // and the browser show them in the user's language.
    default_locale: 'en',
    name: '__MSG_extName__',
    short_name: 'LocalApply',
    description: '__MSG_extDescription__',
    permissions: ['storage', 'unlimitedStorage'],
    commands: {
      'fill-form': {
        suggested_key: { default: 'Alt+Shift+F' },
        description: '__MSG_fillCommand__',
      },
    },
    browser_specific_settings: {
      gecko: {
        // Must match the add-on's listing on addons.mozilla.org, which was created under this ID; it can never change.
        id: 'job-application-filler@local',
        // Firefox asks extensions to declare what they send out; this one sends nothing.
        data_collection_permissions: { required: ['none'] },
      },
    },
  },
  // The source zip is what addons.mozilla.org reviewers rebuild from; releases, store material and docs are not part of the build.
  zip: {
    excludeSources: ['releases/**', 'store/**', 'docs/**', 'scripts/store-assets.mjs', 'tests/e2e/**'],
  },
  vite: () => ({ plugins: [tailwindcss(), noRawHtml()] }),
});
