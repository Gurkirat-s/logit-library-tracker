import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  srcDir: 'src',
  manifestVersion: 3,
  manifest: {
    name: 'LogIT Library Tracker',
    version: '1.0.5',
    description: 'Logs library transactions and manual services.',
    permissions: ['storage', 'downloads'],
    host_permissions: ['<all_urls>'],
    browser_specific_settings: {
      gecko: {
        id: 'logit@georgebrown.ca',
        strict_min_version: '140.0',
        update_url:
          'https://github.com/Gurkirat-s/logit-library-tracker/raw/refs/heads/main/updates.json',
      },
    },
  },
});
