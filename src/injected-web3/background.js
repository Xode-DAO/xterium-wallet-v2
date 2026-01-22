const FIXED_WINDOW_WIDTH = 450;
const FIXED_WINDOW_HEIGHT = 600;

let approvalWindowId = null;
let signTransactionWindowId = null;

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

function createSignTransactionPopup(encodedHex) {
  chrome.windows.create(
    {
      url: chrome.runtime.getURL(
        `index.html#/web3/sign-transaction?encodedCallDataHex=${encodedHex}`,
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

        chrome.storage.local.set({ origins: origins }, () => {
          sendResponse(newOrigin);
        });
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
    });
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
            const connectedAccounts = [];

            for (let i = 0; i < selectedAccounts.length; i++) {
              connectedAccounts.push({
                address: selectedAccounts[i].address,
                name: selectedAccounts[i].name,
                type: "sr25519",
              });
            }

            chrome.storage.local.set({ accounts: connectedAccounts });
          }

          sendResponse(existingOrigin);

          if (approvalWindowId !== null) {
            chrome.windows.remove(approvalWindowId);
            approvalWindowId = null;
          }
        });
      }
    });
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
  }

  return true;
});
