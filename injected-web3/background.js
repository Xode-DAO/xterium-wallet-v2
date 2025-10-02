chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    sendResponse(null);
    return true;
  }

  switch (message.type) {
    case "enable-request": {
      // TODO: show approval UI using chrome.action.openPopup or chrome.windows.create, etc.
      // For now we auto-approve. In production show a popup to allow user to approve.
      sendResponse(true);
      break;
    }

    case "get-accounts": {
      // Respond with InjectedAccountWithMeta[]
      chrome.storage.local.get(["accounts"], (results) => {
        if (results.accounts && results.accounts.length > 0) {
          const accounts = results.accounts.map((account) => ({
            address: account.address,
            name: account.name,
            type: "sr25519",
          }));

          sendResponse(accounts);
        } else {
          sendResponse([]);
        }
      });

      break;
    }

    case "subscribe-accounts": {
      // For subscribe we just return current accounts. If you later push updates,
      // use chrome.tabs.sendMessage to notify content scripts and they will forward to page.
      sendResponse(accounts);
      break;
    }

    case "sign-payload": {
      console.log("[Xterium Background] sign-payload", message.payload);

      // Replace with real signing flow. This is a fake signature for testing.
      const fakeSig = "0xFAKE_SIGNATURE_PAYLOAD";
      sendResponse({ signature: fakeSig });

      break;
    }

    case "sign-raw": {
      console.log("[Xterium Background] sign-raw", message.payload);

      const fakeSigRaw = "0xFAKE_SIGNATURE_RAW";
      sendResponse({ signature: fakeSigRaw });

      break;
    }

    default: {
      sendResponse(null);
    }
  }

  return true;
});
