(function () {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.type = "text/javascript";
  script.id = "xterium-injected";
  (document.head || document.documentElement).appendChild(script);
})();

window.addEventListener("message", (event) => {
  if (!event || event.source !== window) return;
  if (!event.data) return;
  if (typeof event.data !== "object") return;

  const msg = event.data;
  if (!msg.xterium || !msg.type) return;

  const type = msg.type;
  const payload = msg.payload || {};
  const requestId = msg.request_id;

  const requestTypes = [
    "xterium-enable-request",
    "xterium-get-accounts",
    "xterium-subscribe-accounts",
    "xterium-sign-payload",
    "xterium-sign-raw",
  ];

  if (requestTypes.includes(type)) {
    chrome.runtime.sendMessage(
      {
        type: type.replace(/^xterium-/, ""),
        payload: payload,
      },
      (response) => {
        const responseMessage = {
          xterium: true,
          type: type + "-result",
          request_id: requestId,
          response: response,
        };

        window.postMessage(responseMessage, "*");
      }
    );
  }
});

// Also listen to messages from background directed to active tabs if you ever need to push updates from background
// (optional; background can use chrome.tabs.sendMessage if it needs to push)
// This listener is left intentionally minimal; the primary flow is request-response above.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Example: background can push "accounts-changed" broadcast:
  if (message && message.type === "accounts-changed") {
    const responseMessage = {
      xterium: true,
      type: type + "-result",
      request_id: requestId,
      response: response,
    };

    window.postMessage(
      {
        xterium: true,
        type: "xterium-accounts-changed",
        accounts: message.accounts || [],
      },
      "*"
    );
  }
});
