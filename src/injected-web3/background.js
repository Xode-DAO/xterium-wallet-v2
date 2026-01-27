const FIXED_WINDOW_WIDTH = 450;
const FIXED_WINDOW_HEIGHT = 600;

async function windowExists(windowId) {
  if (!windowId) return false;
  try {
    await chrome.windows.get(windowId);
    return true;
  } catch {
    return false;
  }
}

let connectWeb3AccountsWindowId = null;

async function createOrFocusConnectAccountsPopup(origin) {
  if (await windowExists(connectWeb3AccountsWindowId)) {
    chrome.windows.update(connectWeb3AccountsWindowId, { focused: true });
    return;
  }

  const newWindow = await chrome.windows.create({
    url: chrome.runtime.getURL(
      `index.html#/web3/connected-accounts?origin=${encodeURIComponent(origin)}`,
    ),
    type: "popup",
    width: FIXED_WINDOW_WIDTH,
    height: FIXED_WINDOW_HEIGHT,
  });

  connectWeb3AccountsWindowId = newWindow.id;
}

let signTransactionWindowId = null;
let pendingSignTransactionRequest = null;

async function createOrFocusSignTransactionPopup(
  signingType,
  payload,
  walletAddress,
) {
  if (await windowExists(signTransactionWindowId)) {
    chrome.windows.update(signTransactionWindowId, { focused: true });
    return;
  }

  const signingTypeParam = encodeURIComponent(signingType);
  const payloadParam = encodeURIComponent(JSON.stringify(payload));
  const addressParam = encodeURIComponent(walletAddress);

  const newWindow = await chrome.windows.create({
    url: chrome.runtime.getURL(
      `index.html#/web3/sign-transaction?signingType=${signingTypeParam}&payload=${payloadParam}&walletAddress=${addressParam}`,
    ),
    type: "popup",
    width: FIXED_WINDOW_WIDTH,
    height: FIXED_WINDOW_HEIGHT,
  });

  signTransactionWindowId = newWindow.id;
}

chrome.windows.onRemoved.addListener((closedId) => {
  if (closedId === connectWeb3AccountsWindowId) {
    connectWeb3AccountsWindowId = null;
  }

  if (closedId === signTransactionWindowId) {
    signTransactionWindowId = null;

    if (pendingSignTransactionRequest) {
      pendingSignTransactionRequest.sendResponse({
        error: "User cancelled signing",
      });
      pendingSignTransactionRequest = null;
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true;
});

async function handleMessage(message, sender, sendResponse) {
  try {
    console.log("[Xterium Background] Received message:", message.method);

    switch (message.method) {
      case "request-web3-connection":
        await handleRequestWeb3Connection(message, sendResponse);
        break;

      case "connect-web3-accounts":
        await handleConnectWeb3Accounts(message, sendResponse);
        break;

      case "reject-connection":
        await handleRejectConnection(sendResponse);
        break;

      case "get-web3-accounts":
        await handleGetWeb3Accounts(message, sendResponse);
        break;

      case "sign-payload":
        await handleSignPayload(message, sendResponse);
        break;

      case "sign-raw":
        await handleSignRaw(message, sendResponse);
        break;

      case "signed-transaction":
        handleSignedTransaction(message);
        break;

      case "cancel-signing":
        handleCancelSigning();
        break;

      default:
        console.warn("[Xterium Background] Unknown method:", message.method);
        sendResponse({ error: "Unknown method" });
    }
  } catch (error) {
    console.error("[Xterium Background] Error handling message:", error);
    sendResponse({ error: error.message });
  }
}

async function handleRequestWeb3Connection(message, sendResponse) {
  const origin = message.payload?.origin;

  if (!origin) {
    sendResponse({ error: "Missing origin" });
    return;
  }

  const result = await chrome.storage.local.get(["web3_accounts"]);
  const web3Accounts = result.web3_accounts || [];

  const existingConnection = web3Accounts.find((o) => o.origin === origin);

  if (existingConnection) {
    const accounts = existingConnection.wallet_accounts.map((account) => ({
      address: account.address,
      name: account.name,
      type: "sr25519",
    }));

    console.log("[Xterium] Found existing connection:", origin);
    sendResponse(accounts);
    return;
  }

  await createOrFocusConnectAccountsPopup(origin);
}

async function handleConnectWeb3Accounts(message, sendResponse) {
  const origin = message.payload?.origin;

  if (!origin) {
    sendResponse({ error: "Missing origin" });
    return;
  }

  const result = await chrome.storage.local.get(["web3_accounts"]);
  const web3Accounts = result.web3_accounts || [];

  const updatedAccounts = [...web3Accounts, message.payload];

  await chrome.storage.local.set({ web3_accounts: updatedAccounts });

  const connectedAccount = updatedAccounts.find((o) => o.origin === origin);

  if (connectedAccount) {
    const accounts = connectedAccount.wallet_accounts.map((account) => ({
      address: account.address,
      name: account.name,
      type: "sr25519",
    }));

    sendResponse(accounts);
  } else {
    sendResponse({ error: "Failed to connect accounts" });
  }

  if (connectWeb3AccountsWindowId) {
    try {
      await chrome.windows.remove(connectWeb3AccountsWindowId);
    } catch (error) {
      console.warn("[Xterium] Failed to close window:", error);
    }
    connectWeb3AccountsWindowId = null;
  }
}

async function handleRejectConnection(sendResponse) {
  if (connectWeb3AccountsWindowId) {
    try {
      await chrome.windows.remove(connectWeb3AccountsWindowId);
    } catch (error) {
      console.warn("[Xterium] Failed to close window:", error);
    }
    connectWeb3AccountsWindowId = null;
  }

  sendResponse({ error: "User rejected connection" });
}

async function handleGetWeb3Accounts(message, sendResponse) {
  const origin = message.payload?.origin;

  if (!origin) {
    sendResponse({ error: "Missing origin" });
    return;
  }

  const result = await chrome.storage.local.get(["web3_accounts"]);
  const web3Accounts = result.web3_accounts || [];

  const existingConnection = web3Accounts.find((o) => o.origin === origin);

  if (existingConnection) {
    const accounts = existingConnection.wallet_accounts.map((account) => ({
      address: account.address,
      name: account.name,
      type: "sr25519",
    }));

    sendResponse(accounts);
  } else {
    sendResponse([]);
  }
}

async function handleSignPayload(message, sendResponse) {
  const payload = message.payload;

  if (!payload || !payload.address) {
    sendResponse({ error: "Invalid payload" });
    return;
  }

  pendingSignTransactionRequest = {
    sendResponse: sendResponse,
    payload: payload,
  };

  await createOrFocusSignTransactionPopup(
    "signPayload",
    payload,
    payload.address,
  );
}

async function handleSignRaw(message, sendResponse) {
  const payload = message.payload;

  if (!payload || !payload.address) {
    sendResponse({ error: "Invalid payload" });
    return;
  }

  pendingSignTransactionRequest = {
    sendResponse: sendResponse,
    payload: payload,
  };

  await createOrFocusSignTransactionPopup("signRaw", payload, payload.address);
}

function handleSignedTransaction(message) {
  const signedResult = message.payload;

  if (!signedResult) {
    console.error("[Xterium] Missing signed result");
    return;
  }

  if (pendingSignTransactionRequest) {
    pendingSignTransactionRequest.sendResponse(signedResult);
    pendingSignTransactionRequest = null;

    setTimeout(async () => {
      if (signTransactionWindowId) {
        try {
          await chrome.windows.remove(signTransactionWindowId);
        } catch (error) {
          console.warn("[Xterium] Failed to close signing window:", error);
        }
        signTransactionWindowId = null;
      }
    }, 1500);
  }
}

function handleCancelSigning() {
  if (pendingSignTransactionRequest) {
    pendingSignTransactionRequest.sendResponse({
      error: "User cancelled signing",
    });
    pendingSignTransactionRequest = null;
  }

  if (signTransactionWindowId) {
    chrome.windows.remove(signTransactionWindowId).catch(console.warn);
    signTransactionWindowId = null;
  }
}

console.log("[Xterium Background] Service worker initialized");
