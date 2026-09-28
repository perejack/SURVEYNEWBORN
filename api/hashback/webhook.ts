import crypto from "crypto";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Hashpay-Signature",
};

export default async function handler(req: any, res: any) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const webhookSecret = process.env.HASHBACK_WEBHOOK_SECRET;
  const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const json = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  if (webhookSecret && webhookSecret.trim()) {
    const sig = (req.headers["x-hashpay-signature"] as string) || "";
    if (!sig) return res.status(401).json({ message: "Missing X-Hashpay-Signature" });
    const expected = "sha256=" + crypto.createHmac("sha256", webhookSecret).update(raw).digest("hex");
    try {
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return res.status(401).json({ message: "Invalid signature" });
      }
    } catch {
      return res.status(401).json({ message: "Signature verification failed" });
    }
  }

  const isSuccess = json.event === "payment.success" && (json.ResponseCode === 0 || json.ResponseCode === "0");
  const checkoutRequestId =
    (typeof json.CheckoutRequestID === "string" ? json.CheckoutRequestID : null) ??
    (typeof json.checkoutid === "string" ? json.checkoutid : null);
  const receipt =
    (typeof json.TransactionReceipt === "string" ? json.TransactionReceipt : null) ??
    (typeof json.TransactionID === "string" ? json.TransactionID : null);

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://nplwoopouwvgpwbmkint.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbHdvb3BvdXd2Z3B3Ym1raW50Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDU2MTQ4NCwiZXhwIjoyMTA2MTM3NDg0fQ.YQquS6sz5QVv0pSKMqqYqYO6qze_Bgq5AEI0aUqidY0";

  if (supabaseUrl && supabaseKey && isSuccess && checkoutRequestId) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/withdrawals?checkout_request_id=eq.${encodeURIComponent(checkoutRequestId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ status: "completed", mpesa_receipt: receipt }),
      });
    } catch (err) {
      console.error("Webhook DB update failed:", err);
    }
  }

  return res.status(200).json({ received: true, success: isSuccess, checkoutRequestId, receipt });
}
