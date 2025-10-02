(function () {
  if (!window.injectedWeb3) {
    window.injectedWeb3 = {};
  }

  let currentRequestId = 1;
  function nextRequestId() {
    return String(currentRequestId++);
  }

  function postAndWait(type, payload) {
    return new Promise((resolve) => {
      const requestId = nextRequestId();

      window.addEventListener("message", (event) => {
        if (!event || event.source !== window) return;

        if (!event.data) return;
        if (event.data.xterium !== true) return;
        if (event.data.type !== type + "-result") return;
        if (event.data.request_id !== requestId) return;

        window.removeEventListener("message", this);
        resolve(event.data.response);
      });

      window.postMessage(
        {
          xterium: true,
          type: type,
          payload: payload,
          request_id: requestId,
        },
        "*"
      );
    });
  }

  window.injectedWeb3["xterium"] = {
    version: "2.0.0",
    enable: async (origin) => {
      const approved = await postAndWait("xterium-enable-request", {
        origin: origin,
      });

      if (!approved) throw new Error("User rejected Xterium connection");

      return {
        accounts: {
          get: async (anyType) => {
            const accounts = await postAndWait("xterium-get-accounts", {
              anyType,
            });

            return accounts || [];
          },
          subscribe: (cb) => {
            postAndWait("xterium-subscribe-accounts", {}).then((accounts) => {
              try {
                cb(accounts || []);
              } catch (e) {}
            });

            function handler(event) {
              if (!event || event.source !== window) return;
              if (!event.data) return;
              if (event.data.xterium !== true) return;
              if (event.data.type !== "xterium-accounts-changed") return;

              cb(event.data.response || []);
            }
            window.addEventListener("message", handler);

            return () => window.removeEventListener("message", handler);
          },
        },
        signer: {
          signPayload: async (payload) => {
            const signature = await postAndWait("xterium-sign-payload", {
              payload: payload,
            });

            return signature;
          },
          signRaw: async ({ address, data }) => {
            const signature = await postAndWait("xterium-sign-raw", {
              address: address,
              data: data,
            });

            return signature;
          },
        },
        metadata: {
          get: async () => [],
          provide: async () => true,
        },
      };
    },
  };
})();
