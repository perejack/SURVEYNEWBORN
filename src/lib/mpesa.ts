// M-Pesa STK Push via HashBack API
// In local dev, calls go to /api/hashback/initiate (needs a server)
// In production (Vercel), the serverless functions handle it

export async function initiateSTK(
  phone: string,
  amount: number,
  reference?: string
): Promise<{ success: boolean; checkoutId?: string; message: string }> {
  try {
    const res = await fetch('/api/hashback/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        amount,
        reference: reference || `SURVEYPAY-${Date.now()}`,
        referencePrefix: 'SPK',
      }),
    });
    const data = await res.json();
    if (data.success === true) {
      return {
        success: true,
        checkoutId: data.checkoutId || data.checkoutRequestId,
        message: data.message || 'STK push sent to your phone. Enter your M-Pesa PIN.',
      };
    }
    return { success: false, message: data.message || 'Payment initiation failed.' };
  } catch (err) {
    // In local dev, the API routes don't exist — return a simulated success for testing
    if (import.meta.env.DEV) {
      console.warn('[DEV] M-Pesa API not available in local dev. Simulating STK push.');
      return {
        success: true,
        checkoutId: `DEV-SIMULATED-${Date.now()}`,
        message: '[DEV MODE] Simulated STK push — no real M-Pesa charge.',
      };
    }
    return { success: false, message: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function pollSTKStatus(
  checkoutId: string,
  onSuccess: (receipt?: string) => void,
  onFailed: (msg: string) => void,
  maxAttempts = 18
): Promise<void> {
  // In DEV mode, simulate a successful payment after 3 seconds
  if (import.meta.env.DEV || checkoutId.startsWith('DEV-SIMULATED')) {
    setTimeout(() => {
      console.warn('[DEV] Simulated payment success.');
      onSuccess(`DEV-RECEIPT-${Date.now()}`);
    }, 3000);
    return;
  }

  let attempts = 0;
  const poll = async () => {
    if (attempts >= maxAttempts) {
      onFailed('Payment confirmation timed out. If you were charged, contact support.');
      return;
    }
    attempts++;
    try {
      const res = await fetch('/api/hashback/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutId }),
      });
      const data = await res.json();
      if (data.status === 'paid' || data.success === true) {
        onSuccess(data.receiptNumber || undefined);
        return;
      }
      if (data.status === 'failed') {
        onFailed(data.rawStatus || 'Payment was not completed. Please try again.');
        return;
      }
      // Still pending — poll again
      setTimeout(poll, 5000);
    } catch {
      // Network glitch — keep polling
      setTimeout(poll, 5000);
    }
  };
  setTimeout(poll, 5000);
}
