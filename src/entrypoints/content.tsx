import {
  defineContentScript,
  createShadowRootUi,
  type ContentScriptContext,
} from '#imports';
import ReactDOM from 'react-dom/client';
import React from 'react';
import FloatingPanel from '../components/FloatingPanel';

export default defineContentScript({
  matches: ['<all_urls>'],

  async main(ctx: ContentScriptContext) {
    // 1. Fetch initial state from storage
    const data = (await browser.storage.local.get([
      'showPanel',
      'location',
    ])) as {
      showPanel?: boolean;
      location?: string;
    };

    // If the panel is toggled off, don't mount it yet
    if (!data.showPanel) return;

    // 2. Create the Shadow DOM and mount React inside it
    const ui = await createShadowRootUi(ctx, {
      name: 'lib-tracker-host',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container: HTMLElement) => {
        const root = ReactDOM.createRoot(container);
        root.render(
          <React.StrictMode>
            <FloatingPanel userLocation={data.location || ''} />
          </React.StrictMode>
        );
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    // 3. Inject it into the page
    ui.mount();
  },
});
