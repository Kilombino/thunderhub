/**
 * navigator.clipboard only exists in a secure context (https or localhost). ThunderHub is
 * often opened over plain http on the LAN (e.g. http://192.168.0.14:3021), where every
 * "copy" button would throw. Fall back to the old textarea + execCommand('copy') there.
 */
const fallbackWriteText = (text: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      if (ok) resolve();
      else reject(new Error('Copy failed'));
    } catch (error) {
      document.body.removeChild(area);
      reject(error);
    }
  });

export const installClipboardFallback = (): void => {
  if (typeof navigator === 'undefined') return;
  if (navigator.clipboard?.writeText) return;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { ...(navigator.clipboard ?? {}), writeText: fallbackWriteText },
  });
};
