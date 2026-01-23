(function () {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.type = "text/javascript";
  script.id = "xterium-injected";
  (document.head || document.documentElement).appendChild(script);
})();

window.addEventListener("message", (event) => {
  if (!event || event.source !== window) return;
  if (!event.data || typeof event.data !== "object") return;
  if (event.data.source !== "xterium-extension") return;

  const methods = [
    "approval",
    "get-accounts",
    "subscribe-accounts",
    "sign-payload",
    "sign-raw",
  ];

  const msg = event.data;
  if (!msg.type || msg.type !== "request") return;

  let method = msg.method;
  let payload = msg.payload;

  if (methods.includes(method)) {
    chrome.runtime.sendMessage(
      {
        method: method,
        payload: payload,
      },
      (response) => {
        if (chrome.runtime.lastError) return;

        const responseMessage = {
          source: "xterium-extension",
          type: "response",
          method: method,
          response: response,
        };

        window.postMessage(responseMessage, "*");
      },
    );
  }
});
