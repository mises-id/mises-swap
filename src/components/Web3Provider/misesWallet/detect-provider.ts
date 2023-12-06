/* eslint-disable @typescript-eslint/no-explicit-any */
interface MetaMaskEthereumProvider {
  isMetaMask?: boolean;
  request(args: {
    readonly method: string;
    readonly params?: readonly unknown[] | object}): Promise<unknown>;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
}

interface Window {
  misesEthereum?: MetaMaskEthereumProvider;
}

export default detectEthereumProvider;

/**
 * Returns a Promise that resolves to the value of window.ethereum if it is
 * set within the given timeout, or null.
 * The Promise will not reject, but an error will be thrown if invalid options
 * are provided.
 *
 * @param options - Options bag.
 * @param options.mustBeMetaMask - Whether to only look for MetaMask providers.
 * Default: false
 * @param options.silent - Whether to silence console errors. Does not affect
 * thrown errors. Default: false
 * @param options.timeout - Milliseconds to wait for 'ethereum#initialized' to
 * be dispatched. Default: 3000
 * @returns A Promise that resolves with the Provider if it is detected within
 * given timeout, otherwise null.
 */
function detectEthereumProvider<T = MetaMaskEthereumProvider>({
  mustBeMetaMask = false,
  silent = false,
  timeout = 3000,
} = {}): Promise<T | null> {

  _validateInputs();

  let handled = false;

  return new Promise((resolve) => {
    if ((window as Window).misesEthereum) {

      handleEthereum();

    } else {

      window.addEventListener(
        'misesEthereum#initialized',
        handleEthereum,
        { once: true },
      );

      setTimeout(() => {
        handleEthereum();
      }, timeout);
    }

    function handleEthereum() {

      if (handled) {
        return;
      }
      handled = true;

      window.removeEventListener('misesEthereum#initialized', handleEthereum);

      const { misesEthereum } = window as Window;

      if (misesEthereum && (!mustBeMetaMask || misesEthereum.isMetaMask)) {
        resolve(misesEthereum as unknown as T);
      } else {

        const message = mustBeMetaMask && misesEthereum
          ? 'Non-MetaMask window.misesEthereum detected.'
          : 'Unable to detect window.misesEthereum.';

        !silent && console.error('@metamask/detect-provider:', message);
        resolve(null);
      }
    }
  });

  function _validateInputs() {
    if (typeof mustBeMetaMask !== 'boolean') {
      throw new Error(`@metamask/detect-provider: Expected option 'mustBeMetaMask' to be a boolean.`);
    }
    if (typeof silent !== 'boolean') {
      throw new Error(`@metamask/detect-provider: Expected option 'silent' to be a boolean.`);
    }
    if (typeof timeout !== 'number') {
      throw new Error(`@metamask/detect-provider: Expected option 'timeout' to be a number.`);
    }
  }
}