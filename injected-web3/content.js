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

  const requestTypes = [
    "xterium-request-approval",
    "xterium-get-accounts",
    "xterium-subscribe-accounts",
    "xterium-sign-payload",
    "xterium-sign-raw",
  ];

  if (requestTypes.includes(type)) {
    chrome.runtime.sendMessage(
      {
        xterium: true,
        type: type,
        payload: payload,
      },
      (response) => {
        const responseMessage = {
          xterium: true,
          type: type + "-results",
          response: response,
        };

        window.postMessage(responseMessage, "*");
      }
    );
  }
});
