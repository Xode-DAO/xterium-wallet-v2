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

  const methods = ["approval", "get-accounts", "subscribe-accounts"];

  const msg = event.data;
  if (!msg.type) return;

  let type = msg.type;
  let method = msg.method;
  let payload = msg.payload;

  if (type === "request") {
    if (methods.includes(method)) {
      chrome.runtime.sendMessage(
        {
          method: method,
          payload: payload,
        },
        (response) => {
          const responseMessage = {
            type: "response",
            method: method,
            response: response,
          };

          window.postMessage(responseMessage, "*");
        },
      );
    }
  }

  if (method === "response") {
    window.removeEventListener("message", this);
    resolve(event.data.response);
  }
});
