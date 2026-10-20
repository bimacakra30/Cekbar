//   GOPAY_API_URL  — Base URL API Gateway (https://api.bima.my.id)

import crypto from "crypto";

function getConfig() {
  return {
    apiUrl: process.env.GOPAY_API_URL ?? "https://api.bima.my.id",
    apiKey: process.env.GOPAY_API_KEY ?? "",
  };
}

/**
 * Dapatkan base URL GoPay API (untuk SSE endpoint di frontend)
 */
export function getGopayApiUrl(): string {
  return process.env.GOPAY_API_URL ?? "https://api.bima.my.id";
}

export interface CreateQrisParams {
  amount: number;
  callbackUrl?: string;
  expiresIn?: number;
}

export interface CreateQrisResult {
  qrisId: string;
  trxId: string;
  qrisUrl: string;
  qrisCode: string;
  qrImage: string;
  amount: number;
  expiresAt: string;
}

/**
 * Buat QRIS dinamis via GoPay Partner API
 * Dipanggil server-side saat user submit order
 *
 * @returns { qrisId, trxId, qrisUrl, qrImage, amount, expiresAt }
 */
export async function createQrisPayment(
  params: CreateQrisParams
): Promise<CreateQrisResult> {
  const config = getConfig();

  if (!config.apiKey) {
    throw new Error("GOPAY_API_KEY belum dikonfigurasi di .env");
  }

  const body: Record<string, unknown> = {
    amount: params.amount,
  };

  if (params.callbackUrl) {
    body.callback_url = params.callbackUrl;
  }

  if (params.expiresIn) {
    body.expires_in = params.expiresIn;
  }

  const res = await fetch(`${config.apiUrl}/create-qris`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("[GoPay] Create QRIS error:", res.status, errorData);
    throw new Error(
      `GoPay QRIS error: ${errorData.message ?? res.statusText}`
    );
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error(`GoPay QRIS error: ${data.message ?? "Unknown error"}`);
  }

  return {
    qrisId: data.data.qris_id,
    trxId: data.data.trx_id,
    qrisUrl: data.data.qris_url,
    qrisCode: data.data.qris_code,
    qrImage: data.data.qr_image,
    amount: data.data.amount,
    expiresAt: data.data.expires_at,
  };
}

export interface CheckPaymentResult {
  paid: boolean;
  transaction?: {
    transactionId: string;
    orderId: string;
    amount: number;
    payerIssuer: string;
    paymentType: string;
    transactionTime: string;
  };
}

/**
 * Cek status pembayaran via GoPay Partner API
 * Menggunakan trx_id untuk scope klaim (anti double-claim)
 *
 * @param amount - Nominal yang dicek
 * @param trxId - Transaction ID (scope klaim)
 * @returns { paid, transaction? }
 */
export async function checkPayment(
  amount: number,
  trxId: string
): Promise<CheckPaymentResult> {
  const config = getConfig();

  const res = await fetch(`${config.apiUrl}/check-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey,
    },
    body: JSON.stringify({
      amount: Math.round(amount),
      trx_id: trxId,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      `GoPay check-payment error: ${errorData.message ?? res.statusText}`
    );
  }

  const data = await res.json();

  console.log(`[GoPay] check-payment response:`, JSON.stringify(data));

  if (data.paid) {
    return {
      paid: true,
      transaction: data.transaction
        ? {
            transactionId: data.transaction.transaction_id ?? "",
            orderId: data.transaction.order_id ?? "",
            amount: data.transaction.amount ?? amount,
            payerIssuer: data.transaction.payer_issuer ?? "",
            paymentType: data.transaction.payment_type ?? "QRIS",
            transactionTime: data.transaction.transaction_time ?? new Date().toISOString(),
          }
        : undefined,
    };
  }

  return { paid: false };
}

export type QrStatus = "PENDING" | "PAID" | "EXPIRED" | "NOT_FOUND";

export interface QrStatusResult {
  paid: boolean;
  status: QrStatus;
  message: string;
}

/**
 * Cek status QRIS (public endpoint, tanpa API key)
 * Untuk polling dari server — ini memicu verifyPayment() di gateway
 */
export async function checkQrStatus(qrisId: string): Promise<QrStatusResult> {
  const config = getConfig();
  const url = `${config.apiUrl}/api/qr-status/${qrisId}`;

  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    console.log(`[GoPay] qr-status ${qrisId}: HTTP ${res.status}`);
    return { paid: false, status: "NOT_FOUND", message: "QRIS tidak ditemukan" };
  }

  const data = await res.json();
  console.log(`[GoPay] qr-status ${qrisId}:`, JSON.stringify(data));

  return {
    paid: data.paid ?? false,
    status: data.status ?? "NOT_FOUND",
    message: data.message ?? "",
  };
}

/**
 * Verifikasi HMAC-SHA256 signature dari webhook callback GoPay
 *
 * Signature dihitung: HMAC-SHA256(payload, API_KEY)
 * Header: X-Webhook-Signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const config = getConfig();

  const expectedSignature = crypto
    .createHmac("sha256", config.apiKey)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}

/**
 * Map status QR dari GoPay ke status payment DB kita
 */
export function mapGopayQrStatus(
  qrStatus: QrStatus
): "LUNAS" | "MENUNGGU" | "KADALUARSA" | "GAGAL" {
  switch (qrStatus) {
    case "PAID":
      return "LUNAS";
    case "PENDING":
      return "MENUNGGU";
    case "EXPIRED":
      return "KADALUARSA";
    case "NOT_FOUND":
      return "GAGAL";
    default:
      return "MENUNGGU";
  }
}

/**
 * Helper: map payment status ke order status
 */
export function mapPaymentToOrderStatus(
  paymentStatus: "LUNAS" | "MENUNGGU" | "KADALUARSA" | "GAGAL"
): "PENDING" | "PENDING_PAYMENT" | "EXPIRED" | "FAILED" {
  switch (paymentStatus) {
    case "LUNAS":
      return "PENDING";
    case "MENUNGGU":
      return "PENDING_PAYMENT";
    case "KADALUARSA":
      return "EXPIRED";
    case "GAGAL":
      return "FAILED";
  }
}
