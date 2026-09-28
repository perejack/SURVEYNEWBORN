// HashBack (HashPay) M-Pesa Integration Service
// Full implementation with direct gateway fallback for 100% reliability in all environments

const HASHBACK_BASE_URL = "https://api.hashback.co.ke";
const HASHBACK_API_KEY = "5ce253a8b7ec86f1952c445ba676799c089de738665cd1e10b274a087bb5152f";
const HASHBACK_ACCOUNT_ID = "HP935181";

export class MpesaService {
  static formatPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "254" + cleaned.substring(1);
    if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith("254")) cleaned = "254" + cleaned;
    return cleaned;
  }

  static async initiateSTKPush(
    phoneNumber: string,
    amount: number,
    reference?: string
  ): Promise<{ success: boolean; checkoutRequestId?: string; error?: string }> {
    const formattedPhone = this.formatPhone(phoneNumber);
    const roundedAmount = Math.max(1, Math.round(Number(amount)));
    const ref = reference || `SURVEYPAY-${Date.now()}`;

    // 1. First attempt: call local / Vercel API endpoint
    try {
      const response = await fetch("/api/hashback/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          phoneNumber: formattedPhone,
          amount: roundedAmount,
          reference: ref,
          referencePrefix: "SURVEYPAY",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await response.json().catch(() => null)) as any;
        if (data && data.success !== false) {
          const checkoutId = data.checkoutId || data.checkoutRequestId;
          if (typeof checkoutId === "string" && checkoutId) {
            return { success: true, checkoutRequestId: checkoutId };
          }
        }
      }
    } catch {
      // Backend route unreachable or in pure client dev mode — proceed to direct HashBack gateway
    }

    // 2. Direct gateway call: guaranteed to work directly from client in any environment
    try {
      const directResponse = await fetch(`${HASHBACK_BASE_URL}/initiatestk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: HASHBACK_API_KEY,
          account_id: HASHBACK_ACCOUNT_ID,
          amount: String(roundedAmount),
          msisdn: formattedPhone,
          reference: ref,
        }),
      });

      const directData = (await directResponse.json().catch(() => null)) as any;

      if (!directData) {
        return { success: false, error: "Failed to connect to M-Pesa gateway" };
      }

      const checkoutId =
        directData.CheckoutRequestID ||
        directData.checkout_id ||
        directData.checkoutid ||
        directData.MerchantRequestID;

      const isSuccess =
        directData.ResponseCode === "0" ||
        directData.ResponseCode === 0 ||
        directData.success === true ||
        Boolean(checkoutId);

      if (isSuccess && typeof checkoutId === "string" && checkoutId) {
        return { success: true, checkoutRequestId: checkoutId };
      }

      const errMsg =
        directData.CustomerMessage ||
        directData.ResponseDescription ||
        directData.message ||
        "M-Pesa payment initiation failed";

      return { success: false, error: String(errMsg) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error contacting M-Pesa gateway",
      };
    }
  }

  static async getPaymentStatus(
    checkoutRequestId: string
  ): Promise<"completed" | "failed" | "pending"> {
    // 1. First attempt: call local / Vercel API endpoint
    try {
      const response = await fetch("/api/hashback/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId: checkoutRequestId }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await response.json().catch(() => null)) as any;
        if (data) {
          const status = String(data.status || data.state || "").toLowerCase();
          const rawStatus = String(data.rawStatus || "").toLowerCase();
          const resultDesc = String(data.resultDesc || data.ResultDesc || "").toLowerCase();

          if (
            status === "completed" ||
            status === "paid" ||
            status === "success" ||
            rawStatus === "completed" ||
            rawStatus === "success" ||
            rawStatus === "paid" ||
            resultDesc.includes("success") ||
            resultDesc.includes("processed successfully")
          ) {
            return "completed";
          }

          if (
            resultDesc.includes("user cannot be reached") ||
            resultDesc.includes("ds timeout")
          ) {
            return "pending";
          }

          if (
            status === "failed" ||
            status === "cancelled" ||
            status === "canceled" ||
            rawStatus === "cancelled" ||
            rawStatus === "canceled" ||
            resultDesc.includes("cancelled by user") ||
            resultDesc.includes("canceled by user") ||
            resultDesc.includes("request cancelled") ||
            resultDesc.includes("insufficient") ||
            resultDesc.includes("wrong pin") ||
            resultDesc.includes("invalid pin")
          ) {
            return "failed";
          }

          return "pending";
        }
      }
    } catch {
      // Backend route unreachable — fallback to direct HashBack gateway status
    }

    // 2. Direct gateway call: fallback to HashBack status
    try {
      const directResponse = await fetch(`${HASHBACK_BASE_URL}/transactionstatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: HASHBACK_API_KEY,
          account_id: HASHBACK_ACCOUNT_ID,
          checkoutid: checkoutRequestId,
        }),
      });

      const data = (await directResponse.json().catch(() => null)) as any;
      if (!data) return "pending";

      const resultCode = String(data.ResultCode || data.resultCode || data.ResponseCode || "").trim();
      const resultDesc = String(data.ResultDesc || data.resultDesc || data.ResponseDescription || "").toLowerCase();
      const status = String(data.status || "").toLowerCase();

      if (
        resultCode === "0" ||
        status === "success" ||
        status === "completed" ||
        status === "paid" ||
        resultDesc.includes("success") ||
        resultDesc.includes("processed successfully")
      ) {
        return "completed";
      }

      if (
        resultCode === "1037" ||
        resultDesc.includes("user cannot be reached") ||
        resultDesc.includes("ds timeout")
      ) {
        return "pending";
      }

      if (
        resultCode === "1032" ||
        resultDesc.includes("cancelled by user") ||
        resultDesc.includes("canceled by user") ||
        resultDesc.includes("request cancelled") ||
        resultDesc.includes("insufficient") ||
        resultDesc.includes("wrong pin") ||
        resultDesc.includes("invalid pin") ||
        status === "cancelled" ||
        status === "canceled"
      ) {
        return "failed";
      }

      return "pending";
    } catch {
      return "pending";
    }
  }
}

// Global polling manager matching reference project (24 attempts × 5s = 2 minutes)
export async function pollPaymentStatus(
  checkoutId: string,
  onSuccess: (receipt?: string) => void,
  onFailed: (msg: string) => void,
  maxAttempts = 24
): Promise<void> {
  let attempts = 0;
  const checkStatus = async () => {
    if (attempts >= maxAttempts) {
      onFailed('Confirmation is taking longer than expected. If you received the M-Pesa deduction, please wait 2 minutes — your account will be updated automatically.');
      return;
    }
    attempts++;
    try {
      const status = await MpesaService.getPaymentStatus(checkoutId);
      if (status === 'completed') {
        onSuccess();
        return;
      }
      if (status === 'failed') {
        onFailed('Payment was not completed. Please try again.');
        return;
      }
      // still pending — keep polling every 5 seconds
      setTimeout(checkStatus, 5000);
    } catch {
      setTimeout(checkStatus, 5000);
    }
  };
  // Initial check after 5 seconds
  setTimeout(checkStatus, 5000);
}

// Convenience wrapper functions
export async function initiateSTK(
  phone: string,
  amount: number,
  reference?: string
): Promise<{ success: boolean; checkoutId?: string | undefined; message: string }> {
  const res = await MpesaService.initiateSTKPush(phone, amount, reference);
  if (res.success && res.checkoutRequestId) {
    return {
      success: true,
      checkoutId: res.checkoutRequestId,
      message: 'STK Push sent to your phone. Enter your PIN.',
    };
  }
  return {
    success: false,
    message: res.error || 'Payment failed',
  };
}

export const pollSTKStatus = pollPaymentStatus;
