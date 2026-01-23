(function () {
  if (!window.injectedWeb3) {
    window.injectedWeb3 = {};
  }

  function postAndListen(data) {
    return new Promise((resolve) => {
      const messageHandler = (event) => {
        if (!event || event.source !== window) return;
        if (!event.data || typeof event.data !== "object") return;

        if (
          event.data.type === "response" &&
          event.data.method === data.method
        ) {
          window.removeEventListener("message", messageHandler);
          resolve(event.data.response);
        }
      };

      window.addEventListener("message", messageHandler);

      window.postMessage(
        {
          source: "xterium-extension",
          type: "request",
          method: data.method,
          payload: data.payload,
        },
        "*",
      );
    });
  }

  window.injectedWeb3["xterium"] = {
    version: "2.3.0",
    enable: async (originName) => {
      const requestApproval = await postAndListen({
        method: "approval",
        payload: {
          origin: originName,
        },
      });

      if (!requestApproval || !requestApproval.approved) {
        throw new Error("User rejected Xterium connection");
      }

      return {
        accounts: {
          get: async (anyType) => {
            const accounts = await postAndListen({
              method: "get-accounts",
              payload: {
                anyType,
              },
            });

            return accounts || [];
          },
          subscribe: (cb) => {
            // TODO: Implement account subscription
            return () => {}; // Return unsubscribe function
          },
        },
        signer: {
          signPayload: async (payload) => {
            const signature = await postAndListen({
              method: "sign-payload",
              payload: payload,
            });

            return signature;
          },
          signRaw: async ({ address, data }) => {
            const signature = await postAndListen({
              method: "sign-raw",
              payload: {
                address: address,
                data: data,
              },
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

  window.dispatchEvent(new Event("web3-injected"));
})();
