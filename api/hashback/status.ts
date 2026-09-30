const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const HASHBACK_BASE_URL = process.env.HASHBACK_BASE_URL || "https://api.hashback.co.ke";
const HASHBACK_API_KEY = process.env.HASHBACK_API_KEY || "9851f07892796e5ab74e04b89e6d623e15363438b39213ec4224fa2805c746f5";
const HASHBACK_ACCOUNT_ID = process.env.HASHBACK_ACCOUNT_ID || "HP464530";

function parseBody(req: { body?: unknown }): Record<string, unknown> {
  const raw = req.body;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string" && raw.trim()) {
    try { const p = JSON.parse(raw); if (p && typeof p === "object") return p; } catch { return {}; }
  }
  return {};
}

function mapHashbackStatus(data: Record<string, unknown>): "paid" | "failed" | "pending" {
  const resultCode = String(data.ResultCode ?? data.resultCode ?? data.result_code ?? "").trim();
  const resultDesc = String(data.ResultDesc ?? data.resultDesc ?? data.message ?? "").toLowerCase();
  const status = String(data.status ?? data.Status ?? "").toLowerCase();

  if (
    resultCode === "0" ||
    status === "success" ||
    status === "completed" ||
    status === "paid" ||
    resultDesc.includes("success") ||
    resultDesc.includes("processed successfully") ||
    resultDesc.includes("accepted for processing")
  ) {
    return "paid";
  }

  if (resultCode === "1037" || resultDesc.includes("user cannot be reached") || resultDesc.includes("ds timeout")) {
    return "pending";
  }

  const isFailed =
    resultCode === "1032" ||
    resultDesc.includes("cancelled by user") ||
    resultDesc.includes("canceled by user") ||
    resultDesc.includes("request cancelled") ||
    resultDesc.includes("insufficient") ||
    resultDesc.includes("wrong pin") ||
    resultDesc.includes("invalid pin") ||
    status === "cancelled" ||
    status === "canceled";

  if (isFailed) return "failed";
  return "pending";
}

export default async function handler(req: any, res: any) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const body = parseBody(req);
    const checkoutId =
      (typeof body.checkoutId === "string" ? body.checkoutId : undefined) ??
      (typeof body.checkoutid === "string" ? body.checkoutid : undefined) ??
      (typeof body.checkoutRequestId === "string" ? body.checkoutRequestId : undefined) ??
      (typeof body.reference === "string" ? body.reference : undefined);

    if (!checkoutId) return res.status(400).json({ status: "error", message: "Missing checkoutId" });

    const hashbackRes = await fetch(`${HASHBACK_BASE_URL}/transactionstatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: HASHBACK_API_KEY,
        account_id: HASHBACK_ACCOUNT_ID,
        checkoutid: checkoutId,
      }),
    });

    const data = (await hashbackRes.json().catch(() => null)) as Record<string, unknown> | null;
    if (!hashbackRes.ok || !data) return res.status(200).json({ status: "pending", message: "Status check pending" });

    const mappedStatus = mapHashbackStatus(data);
    return res.status(200).json({
      success: mappedStatus === "paid",
      status: mappedStatus,
      state: mappedStatus === "paid" ? "success" : mappedStatus === "failed" ? "failed" : "pending",
      rawStatus: String(data.ResultDesc ?? data.status ?? data.ResponseDescription ?? ""),
      resultDesc:
        (typeof data.ResultDesc === "string" ? data.ResultDesc : "") ||
        (typeof data.ResponseDescription === "string" ? data.ResponseDescription : "") ||
        (typeof data.message === "string" ? data.message : ""),
      receiptNumber:
        (typeof data.TransactionReceipt === "string" ? data.TransactionReceipt : null) ??
        (typeof data.TransactionID === "string" ? data.TransactionID : null) ??
        (typeof data.receipt === "string" ? data.receipt : null),
      raw: data,
    });
  } catch (err) {
    return res.status(200).json({ status: "pending", message: err instanceof Error ? err.message : "Status check failed" });
  }
}
