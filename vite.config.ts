import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        name: "hashback-dev-api",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith("/api/hashback/initiate") && req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => (body += chunk));
              req.on("end", async () => {
                try {
                  const parsed = JSON.parse(body || "{}");
                  const rawPhone = String(parsed.phone || parsed.phoneNumber || parsed.msisdn || "");
                  const cleaned = rawPhone.replace(/\D/g, "");
                  const normalizedPhone = cleaned.startsWith("0")
                    ? "254" + cleaned.slice(1)
                    : cleaned.startsWith("254")
                    ? cleaned
                    : "254" + cleaned;
                  const amount = Math.max(1, Math.round(Number(parsed.amount) || 50));
                  const ref = parsed.reference || `SURVEYPAY-${Date.now()}`;

                  const hashbackRes = await fetch("https://api.hashback.co.ke/initiatestk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      api_key: "5ce253a8b7ec86f1952c445ba676799c089de738665cd1e10b274a087bb5152f",
                      account_id: "HP935181",
                      amount: String(amount),
                      msisdn: normalizedPhone,
                      reference: ref,
                    }),
                  });
                  const data = await hashbackRes.json();
                  const checkoutId = data.checkout_id || data.CheckoutRequestID;
                  res.setHeader("Content-Type", "application/json");
                  res.end(
                    JSON.stringify({
                      success: data.ResponseCode === "0" || data.success === true || Boolean(checkoutId),
                      checkoutId,
                      checkoutRequestId: checkoutId,
                      message: data.CustomerMessage || data.message || "STK push initiated",
                      raw: data,
                    })
                  );
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: false, message: e.message }));
                }
              });
              return;
            }

            if (req.url?.startsWith("/api/hashback/status") && req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => (body += chunk));
              req.on("end", async () => {
                try {
                  const parsed = JSON.parse(body || "{}");
                  const checkoutId = parsed.checkoutId || parsed.checkoutRequestId;
                  const hashbackRes = await fetch("https://api.hashback.co.ke/transactionstatus", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      api_key: "5ce253a8b7ec86f1952c445ba676799c089de738665cd1e10b274a087bb5152f",
                      account_id: "HP935181",
                      checkoutid: checkoutId,
                    }),
                  });
                  const data = await hashbackRes.json();
                  const resultCode = String(data.ResultCode ?? data.ResponseCode ?? "").trim();
                  const resultDesc = String(data.ResultDesc ?? data.ResponseDescription ?? "").toLowerCase();

                  let status = "pending";
                  if (resultCode === "0" || resultDesc.includes("success") || resultDesc.includes("processed successfully")) {
                    status = "paid";
                  } else if (
                    resultCode === "1032" ||
                    resultDesc.includes("cancelled") ||
                    resultDesc.includes("insufficient") ||
                    resultDesc.includes("wrong pin")
                  ) {
                    status = "failed";
                  }

                  res.setHeader("Content-Type", "application/json");
                  res.end(
                    JSON.stringify({
                      success: status === "paid",
                      status,
                      state: status === "paid" ? "success" : status,
                      rawStatus: resultDesc,
                      receiptNumber: data.TransactionReceipt || data.TransactionID,
                      raw: data,
                    })
                  );
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: false, message: e.message }));
                }
              });
              return;
            }

            next();
          });
        },
      },
    ],
  },
});
