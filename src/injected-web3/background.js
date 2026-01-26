const FIXED_WINDOW_WIDTH = 450;
const FIXED_WINDOW_HEIGHT = 600;

let approvalWindowId = null;

function createApprovalPopup(origin) {
  chrome.windows.create(
    {
      url: chrome.runtime.getURL(
        `index.html#/web3/approval?origin=${encodeURIComponent(origin)}`,
      ),
      type: "popup",
      width: FIXED_WINDOW_WIDTH,
      height: FIXED_WINDOW_HEIGHT,
    },
    (newWindow) => {
      approvalWindowId = newWindow.id;

      chrome.windows.onRemoved.addListener((closedId) => {
        if (closedId === approvalWindowId) {
          approvalWindowId = null;
        }
      });
    },
  );
}

let signTransactionWindowId = null;
let pendingSignRequest = null;

function createSignTransactionPopup(signingType, payload, walletAddress) {
  const signingTypeParam = encodeURIComponent(signingType);
  const payloadParam = encodeURIComponent(JSON.stringify(payload));
  const addressParam = encodeURIComponent(walletAddress);

  chrome.windows.create(
    {
      url: chrome.runtime.getURL(
        `index.html#/web3/sign-transaction?signingType=${signingTypeParam}&payload=${payloadParam}&walletAddress=${addressParam}`,
      ),
      type: "popup",
      width: FIXED_WINDOW_WIDTH,
      height: FIXED_WINDOW_HEIGHT,
    },
    (newWindow) => {
      signTransactionWindowId = newWindow.id;

      chrome.windows.onRemoved.addListener((closedId) => {
        if (closedId === signTransactionWindowId) {
          signTransactionWindowId = null;

          // User closed window without signing - reject the pending request
          if (pendingSignRequest) {
            pendingSignRequest.sendResponse({
              error: "User cancelled signing",
            });
            pendingSignRequest = null;
          }
        }
      });
    },
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === "approval") {
    const origin = sender.origin || sender.url;

    chrome.storage.local.get(["origins"], (results) => {
      let origins = results.origins || [];

      const existingOrigin = origins.find((o) => o.origin === origin);
      if (existingOrigin) {
        if (existingOrigin.approved) {
          sendResponse(existingOrigin);
          return;
        }
      } else {
        const newOrigin = {
          origin: origin,
          approved: false,
        };
        origins.push(newOrigin);

        chrome.storage.local.set({ origins: origins });
      }

      if (approvalWindowId !== null) {
        chrome.windows.get(approvalWindowId, (win) => {
          if (chrome.runtime.lastError || !win) {
            createApprovalPopup(origin);
          } else {
            chrome.windows.update(approvalWindowId, { focused: true });
          }
        });
      } else {
        createApprovalPopup(origin);
      }

      sendResponse({ origin: origin, approved: false, pending: true });
    });

    return true;
  }

  if (message.method === "connection-approval") {
    const origin = message.payload.origin;
    const selectedAccounts = message.payload.selected_accounts || [];

    chrome.storage.local.get(["origins"], (results) => {
      let origins = results.origins || [];

      const existingOrigin = origins.find((o) => o.origin === origin);
      if (existingOrigin) {
        existingOrigin.approved = message.payload.approved;

        chrome.storage.local.set({ origins: origins }, () => {
          if (selectedAccounts.length > 0) {
            const connectedAccounts = selectedAccounts.map((account) => ({
              address: account.address,
              name: account.name,
              type: "sr25519",
            }));

            chrome.storage.local.set({ accounts: connectedAccounts });
          }

          sendResponse(existingOrigin);

          if (approvalWindowId !== null) {
            chrome.windows.remove(approvalWindowId);
            approvalWindowId = null;
          }
        });
      } else {
        sendResponse({ error: "Origin not found" });
      }
    });

    return true;
  }

  if (message.method === "get-accounts") {
    chrome.storage.local.get(["accounts"], (results) => {
      let accounts = [];

      if (results.accounts && results.accounts.length > 0) {
        accounts = results.accounts.map((account) => ({
          address: account.address,
          name: account.name,
          type: "sr25519",
        }));
      }

      sendResponse(accounts);
    });

    return true;
  }

  if (message.method === "sign-payload") {
    const payload = message.payload;

    if (!payload) {
      sendResponse({ error: "Invalid payload" });
      return false;
    }

    pendingSignRequest = {
      sendResponse: sendResponse,
      payload: payload,
    };

    if (signTransactionWindowId !== null) {
      chrome.windows.get(signTransactionWindowId, (win) => {
        if (chrome.runtime.lastError || !win) {
          createSignTransactionPopup("signPayload", payload, payload.address);
        } else {
          chrome.windows.update(signTransactionWindowId, { focused: true });
        }
      });
    } else {
      createSignTransactionPopup("signPayload", payload, payload.address);
    }

    return true;
  }

  if (message.method === "sign-raw") {
    const payload = message.payload;

    if (!payload) {
      sendResponse({ error: "Invalid payload" });
      return false;
    }

    pendingSignRequest = {
      sendResponse: sendResponse,
      payload: payload,
    };

    if (signTransactionWindowId !== null) {
      chrome.windows.get(signTransactionWindowId, (win) => {
        if (chrome.runtime.lastError || !win) {
          createSignTransactionPopup("signRaw", payload, payload.address);
        } else {
          chrome.windows.update(signTransactionWindowId, { focused: true });
        }
      });
    } else {
      createSignTransactionPopup("signRaw", payload, payload.address);
    }

    return true;
  }

  if (message.method === "signed-transaction") {
    const signedResult = message.payload;

    if (!signedResult) {
      return false;
    }

    if (pendingSignRequest) {
      pendingSignRequest.sendResponse(signedResult);
      pendingSignRequest = null;

      setTimeout(() => {
        if (signTransactionWindowId !== null) {
          chrome.windows.remove(signTransactionWindowId);
          signTransactionWindowId = null;
        }
      }, 1500);
    }

    return false;
  }

  if (message.method === "cancel-signing") {
    if (pendingSignRequest) {
      pendingSignRequest.sendResponse({
        error: "User cancelled signing",
      });
      pendingSignRequest = null;
    }

    if (signTransactionWindowId !== null) {
      chrome.windows.remove(signTransactionWindowId);
      signTransactionWindowId = null;
    }

    return false;
  }

  return false;
});
