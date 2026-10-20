//   CEIRID_API_URL  — Base URL (https://ceirid.com/api/v1)

export interface CeiridAuthData {
  username: string;
  credit: number;
  level: string;
  pricing: string;
}

export interface CeiridService {
  service_id: number;
  name: string;
  cost: number;
  type: "ceir" | "roamer";
  months?: number;
  process_time?: string;
}

export interface CeiridBalanceData {
  credit: number;
}

export type CeirStatusResult = { [status: string]: string[] };

export interface CeirHistoryEntry {
  no: number;
  date: string;
  imei: string;
  imsi: string;
  action: string;
  note: string;
}
export interface CeirHistoryItem {
  imei: string;
  history: CeirHistoryEntry[];
}
export type CeirHistoryResult = CeirHistoryItem[];

export interface CeirValidityItem {
  imei: string;
  status: string;
  valid_until: string;
}
export type CeirValidityResult = CeirValidityItem[];

export interface CeirBeaCukaiItem {
  imei: string;
  status: "REGISTERED" | "UNREGISTERED" | "UNKNOWN" | "ERROR";
  registered_at: string | null;
  checked_at: string;
}
export type CeirBeaCukaiResult = CeirBeaCukaiItem[];

export type CeirResult = CeirStatusResult | CeirHistoryResult | CeirValidityResult | CeirBeaCukaiResult;

export interface CeiridOrderData {
  order_id: string;
  result: CeirResult;
  processed?: number;
  total_potong?: number;
  transaction_id?: string;
}

export interface CeiridRoamerOrderItem {
  imei: string;
  ok: boolean;
  order_id: string;
  numeric_id: number;
  order_status: "pending" | "processing" | "success" | "failed";
  status_note: string;
}

export interface CeiridRoamerOrderData {
  service_id: number;
  service_name: string;
  months: number;
  process_time: string;
  cost: number;
  balance_after: number;
  created: number;
  orders: CeiridRoamerOrderItem[];
  order_id: string;
  imei: string;
  numeric_id?: number;
  order_status: "pending" | "processing" | "success" | "failed";
  status_note: string;
}

export interface CeiridRoamerStatusData {
  order_id: string;
  numeric_id: number;
  imei: string;
  service_id: number;
  service_name: string;
  months: number;
  cost: number;
  order_status: "pending" | "processing" | "success" | "failed";
  status_note: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface CeiridResponse<T = unknown> {
  status?: boolean;
  success?: boolean;
  message: string;
  data?: T;
  error_code?: string;
}

function getConfig() {
  return {
    apiUrl: (process.env.CEIRID_API_URL ?? "").replace(/\/+$/, ""),
    apiKey: process.env.CEIRID_API_KEY ?? "",
  };
}

async function ceiridFetch<T>(
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<CeiridResponse<T>> {
  const config = getConfig();
  const { method = "GET", body } = options;

  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      "X-Api-Key": config.apiKey,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json() as CeiridResponse<T>;

  if (!res.ok) {
    const errMsg = json.message || `CEIRID API error: ${res.status} ${res.statusText}`;
    const err = new Error(errMsg) as Error & { errorCode?: string; httpStatus?: number; payload?: unknown };
    err.errorCode = json.error_code;
    err.httpStatus = res.status;
    err.payload = json;
    throw err;
  }

  return json;
}

export async function getApiInfo(): Promise<CeiridResponse> {
  const config = getConfig();
  const res = await fetch(`${config.apiUrl}/`, { method: "GET" });
  return res.json();
}

export async function validateApiKey(): Promise<CeiridAuthData> {
  const resp = await ceiridFetch<CeiridAuthData>("/auth", { method: "POST" });
  return resp.data!;
}

export async function getBalance(): Promise<CeiridBalanceData> {
  const resp = await ceiridFetch<CeiridBalanceData>("/balance", { method: "POST" });
  return resp.data!;
}

export async function fetchServiceList(): Promise<CeiridService[]> {
  const resp = await ceiridFetch<CeiridService[]>("/services", { method: "POST" });
  return resp.data ?? [];
}

export interface CeiridOrderParams {
  service_id: number;
  imeis: string[];
}

export async function createCeirOrder(params: CeiridOrderParams): Promise<CeiridOrderData> {
  const resp = await ceiridFetch<CeiridOrderData>("/order", {
    method: "POST",
    body: params as unknown as Record<string, unknown>,
  });
  return resp.data!;
}

export async function getCeirOrderStatus(orderId: string): Promise<CeiridOrderData & { status: string }> {
  const resp = await ceiridFetch<CeiridOrderData & { status: string }>(
    `/status?order_id=${encodeURIComponent(orderId)}`
  );
  return resp.data!;
}

export interface CeiridRoamerAddParams {
  imei?: string;
  imeis?: string[];
  service_id?: number;
  months?: number;
  expected_price?: number;
}

export async function addRoamer(params: CeiridRoamerAddParams): Promise<CeiridRoamerOrderData> {
  const resp = await ceiridFetch<CeiridRoamerOrderData>("/roamer/add", {
    method: "POST",
    body: params as unknown as Record<string, unknown>,
  });
  return resp.data!;
}

export async function getRoamerOrderStatus(orderId: string): Promise<CeiridRoamerStatusData> {
  const resp = await ceiridFetch<CeiridRoamerStatusData>(
    `/roamer/status?order_id=${encodeURIComponent(orderId)}`
  );
  return resp.data!;
}

export function mapCeiridOrderStatus(
  ceiridStatus: string
): "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" {
  switch (ceiridStatus.toLowerCase()) {
    case "pending":
      return "PENDING";
    case "processing":
    case "inprogress":
      return "PROCESSING";
    case "completed":
    case "complete":
    case "success":
      return "SUCCESS";
    case "rejected":
    case "cancelled":
    case "canceled":
    case "error":
    case "failed":
      return "FAILED";
    default:
      return "PROCESSING";
  }
}

export interface FlatService {
  serviceId: string;
  serviceName: string;
  groupName: string;
  apiType: string;
  buyPrice: number;
  timeInfo: string;
  minQty: number;
  maxQty: string;
  customFieldName: string;
  customFieldRegex: string;
  customFieldMaxlen: string;
  allowBulk: boolean;
}

export function flattenServices(services: CeiridService[]): FlatService[] {
  return services.map((svc) => {
    const isRoamer = svc.type === "roamer";

    const groupName = isRoamer ? "Unblock IMEI" : "CEIR Services";

    const timeInfo = isRoamer
      ? (svc.process_time ?? "Proses manual")
      : "Instan";

    return {
      serviceId: String(svc.service_id),
      serviceName: svc.name,
      groupName,
      apiType: svc.type,
      buyPrice: svc.cost,
      timeInfo,
      minQty: 1,
      maxQty: isRoamer ? "5" : "10",
      customFieldName: "IMEI",
      customFieldRegex: "^\\d{15}$",
      customFieldMaxlen: "15",
      allowBulk: !isRoamer,
    };
  });
}
