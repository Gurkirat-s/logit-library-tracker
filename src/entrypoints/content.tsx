import {
  defineContentScript,
  createShadowRootUi,
  type ContentScriptContext,
} from '#imports';
import ReactDOM from 'react-dom/client';
import React from 'react';
import FloatingPanel from '../components/FloatingPanel';

// IMPORT THE CSS AS A RAW STRING USING ?inline
// Traditional CSS import does not import css into ShadowUI
import panelCss from '../components/FloatingPanel.css?inline';

export default defineContentScript({
  matches: ['<all_urls>'],

  async main(ctx: ContentScriptContext) {
    let ui: any = null;

    const mountPanel = async (location: string) => {
      if (ui) return;

      ui = await createShadowRootUi(ctx, {
        name: 'lib-tracker-host',
        position: 'inline',
        anchor: 'body',
        append: 'last',

        // Inject raw CSS string into Shadow ROOT
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

    // Initial Page Load Check
    const initialData = (await browser.storage.local.get([
      'showPanel',
      'location',
    ])) as {
      showPanel?: boolean;
      location?: string;
    };

    if (initialData.showPanel) {
      mountPanel(initialData.location || '');
    }

    // Watch for clicks from the Popup
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
