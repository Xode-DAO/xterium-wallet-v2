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
      `index.html#/web3/connect-accounts?origin=${encodeURIComponent(origin)}`,
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
        await handleRequestWeb3Connection(sender, sendResponse);
        break;

      case "connect-web3-accounts":
        await handleConnectWeb3Accounts(message, sendResponse);
        break;

      case "reject-connection":
        await handleRejectConnection(sendResponse);
        break;

      case "get-web3-accounts":
        await handleGetWeb3Accounts(sender, sendResponse);
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

async function handleRequestWeb3Connection(sender, sendResponse) {
  const origin = sender.origin;

  if (!origin) {
    sendResponse({ error: "Missing origin" });
    return;
  }

  let originsResult = await chrome.storage.local.get(["origins"]);
  const origins = originsResult.origins || [];

  const existingOrigin = origins.find((o) => o.origin === origin);
  if (!existingOrigin) {
    const newOrigin = {
      origin: origin,
      approved: false,
    };
    origins.push(newOrigin);

    await chrome.storage.local.set({ origins: origins });
  }

  const web3AccountsResult = await chrome.storage.local.get(["web3_accounts"]);
  const web3Accounts = web3AccountsResult.web3_accounts || [];

  const existingConnection = web3Accounts.find((o) => o.origin === origin);

  if (existingConnection) {
    const accounts = existingConnection.wallet_accounts.map((account) => ({
      address: account.address,
      name: account.name,
      type: "sr25519",
    }));

    console.log("[Xterium Background] Found existing connection:", origin);
    sendResponse(accounts);
    return;
  }

  await createOrFocusConnectAccountsPopup(origin);
}

async function handleConnectWeb3Accounts(message, sendResponse) {
  const origin = message.payload.origin;

  if (!origin) {
    sendResponse({ error: "Missing origin" });
    return;
  }

  let originsResult = await chrome.storage.local.get(["origins"]);
  const origins = originsResult.origins || [];

  if (origins.length > 0) {
    const updatedOrigins = origins.map((o) =>
      o.origin === origin ? { approved: true, origin } : o,
    );

    await chrome.storage.local.set({ origins: updatedOrigins });
  } else {
    const newOrigin = {
      origin: origin,
      approved: true,
    };

    await chrome.storage.local.set({ origins: [newOrigin] });
  }

  const result = await chrome.storage.local.get(["web3_accounts"]);
  const web3Accounts = result.web3_accounts || [];

  let updatedWeb3Accounts = null;

  const existingWeb3Accounts = web3Accounts.find((o) => o.origin === origin);
  if (!existingWeb3Accounts) {
    const newWeb3Account = message.payload;
    web3Accounts.push(newWeb3Account);

    await chrome.storage.local.set({ web3_accounts: web3Accounts });
    updatedWeb3Accounts = web3Accounts;
  } else {
    if (web3Accounts.length > 0) {
      const newWeb3Account = web3Accounts.map((o) =>
        o.origin === origin ? { ...message.payload, origin } : o,
      );

      await chrome.storage.local.set({ web3_accounts: newWeb3Account });
      updatedWeb3Accounts = newWeb3Account;
    } else {
      const newWeb3Account = message.payload;

      await chrome.storage.local.set({ web3_accounts: [newWeb3Account] });
      updatedWeb3Accounts = [newWeb3Account];
    }
  }

  const connectedAccount = updatedWeb3Accounts.find((o) => o.origin === origin);
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
      console.warn("[Xterium Background] Failed to close window:", error);
    }
    connectWeb3AccountsWindowId = null;
  }
}

async function handleRejectConnection(sendResponse) {
  if (connectWeb3AccountsWindowId) {
    try {
      await chrome.windows.remove(connectWeb3AccountsWindowId);
    } catch (error) {
      console.warn("[Xterium Background] Failed to close window:", error);
    }
    connectWeb3AccountsWindowId = null;
  }

  sendResponse({ error: "User rejected connection" });
}

async function handleGetWeb3Accounts(sender, sendResponse) {
  const origin = sender.origin;

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
    console.error("[Xterium Background] Missing signed result");
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
          console.warn(
            "[Xterium Background] Failed to close signing window:",
            error,
          );
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
    chrome.windows.remove(signTransactionWindowId).catch((error) => {
      console.warn(
        "[Xterium Background] Failed to close signing window:",
        error,
      );
    });
    signTransactionWindowId = null;
  }
}

console.log("[Xterium Background] Service worker initialized");
