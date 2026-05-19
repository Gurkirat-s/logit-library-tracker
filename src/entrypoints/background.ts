export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
  console.log('Background is running for sure. Because I say so.');
});
