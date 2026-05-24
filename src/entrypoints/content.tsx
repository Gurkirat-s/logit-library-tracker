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

export default defineContentScript({
  matches: ['<all_urls>'],

  async main(ctx: ContentScriptContext) {
    const currentHostname = window.location.hostname;
    const isAllowedAutoTracker =
      currentHostname.includes('alma.exlibrisgroup.com') ||
      currentHostname.includes('gbcllc02.gbc.local') ||
      currentHostname.includes('portal.azure.com') ||
      currentHostname.includes('portal.azure.net') ||
      currentHostname.includes('idm.georgebrown.ca') ||
      currentHostname.includes('llcprint.georgebrown.ca');

    if (!isAllowedAutoTracker) return;

    // Initialize background DOM listeners/EventHadlers for auto-tracking
    setupAutoTrackers(currentHostname);

    // Setup React UI Panel Injection
    let ui: any = null;

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

    // Mount Panel if needed on load
    const initialData = (await browser.storage.local.get([
      'showPanel',
      'location',
    ])) as {
      showPanel?: boolean;
      location?: string;
    };

    if (initialData.showPanel) mountPanel(initialData.location || '');

    // Listen for toggle changes from the popup
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.showPanel) {
        if (changes.showPanel.newValue) {
          browser.storage.local.get('location').then((data: any) => {
            mountPanel(data.location || '');
          });
        } else {
          unmountPanel();
        }
      }
    });
  },
});
