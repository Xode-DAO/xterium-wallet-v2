(function () {
  if (document.getElementById("xterium-injected")) {
    return;
  }

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.type = "text/javascript";
  script.id = "xterium-injected";

  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
})();

window.addEventListener("message", (event) => {
  if (!event || event.source !== window) return;
  if (!event.data || typeof event.data !== "object") return;

  if (event.data.source !== "xterium-extension") return;

  const methods = [
    "request-web3-connection",
    "get-web3-accounts",
    "sign-payload",
    "sign-raw",
  ];

  const msg = event.data;
  if (!msg.type || msg.type !== "request") return;
  if (!methods.includes(msg.method)) return;

  const messageId = msg.id;
  const method = msg.method;
  const payload = msg.payload;

  chrome.runtime.sendMessage(
    {
      method: method,
      payload: payload,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("[Xterium] Runtime error:", chrome.runtime.lastError);

        window.postMessage(
          {
            id: messageId,
            source: "xterium-extension",
            type: "response",
            method: method,
            error: chrome.runtime.lastError.message,
          },
          "*",
        );
        return;
      }

      window.postMessage(
        {
          id: messageId,
          source: "xterium-extension",
          type: "response",
          method: method,
          response: response,
        },
        "*",
      );
    },
  );
});
