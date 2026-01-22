(function () {
  if (!window.injectedWeb3) {
    window.injectedWeb3 = {};
  }

  function postAndListen(data) {
    return new Promise((resolve) => {
      window.postMessage(
        {
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

      if (!requestApproval.approved) {
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
          subscribe: (cb) => {},
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
})();
