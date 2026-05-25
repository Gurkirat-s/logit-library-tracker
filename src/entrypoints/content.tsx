import {
  defineContentScript,
  createShadowRootUi,
  type ContentScriptContext,
} from '#imports';
import ReactDOM from 'react-dom/client';
import React from 'react';
import FloatingPanel from '../components/FloatingPanel';
import panelCss from '../components/FloatingPanel.css?inline';
import { setupAutoTrackers } from '../utils/trackers';

interface LocalStorageData {
  showPanel?: boolean;
  location?: string;
}

export default defineContentScript({
  // The script loads on every single page
  matches: ['<all_urls>'],

  async main(ctx: ContentScriptContext) {
    const currentHostname = window.location.hostname;

    // Only fire up the barcode/DOM listeners on authorized  sites
    const isAllowedAutoTracker =
      currentHostname.includes('alma.exlibrisgroup.com') ||
      currentHostname.includes('gbcllc02.gbc.local') ||
      currentHostname.includes('portal.azure.com') ||
      currentHostname.includes('portal.azure.net') ||
      currentHostname.includes('idm.georgebrown.ca') ||
      currentHostname.includes('llcprint.georgebrown.ca');

    if (isAllowedAutoTracker) {
      setupAutoTrackers(currentHostname);
    }

    let ui: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;

    const mountPanel = async (location: string) => {
      if (ui) return;
      ui = await createShadowRootUi(ctx, {
        name: 'lib-tracker-host',
        position: 'inline',
        anchor: 'body',
        append: 'last',
        css: panelCss,
        onMount: (container: HTMLElement) => {
          const root = ReactDOM.createRoot(container);
          root.render(
            <React.StrictMode>
              <FloatingPanel userLocation={location} />
            </React.StrictMode>,
          );
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
        },
      });
      ui.mount();
    };

    const unmountPanel = () => {
      if (ui) {
        ui.remove();
        ui = null;
      }
    };

    const initialData = (await browser.storage.local.get([
      'showPanel',
      'location',
    ])) as LocalStorageData;

    if (initialData.showPanel) {
      mountPanel(initialData.location || '');
    }

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.showPanel) {
        if (changes.showPanel.newValue) {
          browser.storage.local.get('location').then((data) => {
            const typedData = data as LocalStorageData;
            mountPanel(typedData.location || '');
          });
        } else {
          unmountPanel();
        }
      }
    });
  },
});
