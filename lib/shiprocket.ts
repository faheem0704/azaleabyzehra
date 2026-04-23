const BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error("Shiprocket auth failed");
  const data = await res.json();
  cachedToken = data.token as string;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

async function sr<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shiprocket ${path} failed: ${err}`);
  }
  return res.json() as Promise<T>;
}

export interface PickupLocation {
  pickup_location: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  phone: string;
}

export async function getPickupLocations(): Promise<PickupLocation[]> {
  const data = await sr<{ data: { shipping_address: PickupLocation[] } }>("/settings/company/pickup");
  return data.data.shipping_address;
}

export interface CreateShipmentParams {
  orderId: string;
  orderDate: string;
  pickupLocation: string;
  customerName: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  phone: string;
  email: string;
  items: { name: string; sku: string; units: number; selling_price: number }[];
  paymentMethod: "Prepaid" | "COD";
  subTotal: number;
  weight: number;
  length?: number;
  breadth?: number;
  height?: number;
}

export async function createShipment(params: CreateShipmentParams): Promise<{ order_id: number; shipment_id: number }> {
  return sr("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: params.orderId,
      order_date: params.orderDate,
      pickup_location: params.pickupLocation,
      billing_customer_name: params.customerName,
      billing_last_name: "",
      billing_address: params.address,
      billing_address_2: "",
      billing_city: params.city,
      billing_pincode: params.pincode,
      billing_state: params.state,
      billing_country: "India",
      billing_email: params.email,
      billing_phone: params.phone,
      shipping_is_billing: true,
      order_items: params.items.map((i) => ({
        name: i.name,
        sku: i.sku || i.name.slice(0, 20),
        units: i.units,
        selling_price: i.selling_price,
        discount: 0,
        tax: 0,
        hsn: 0,
      })),
      payment_method: params.paymentMethod,
      sub_total: params.subTotal,
      length: params.length ?? 20,
      breadth: params.breadth ?? 15,
      height: params.height ?? 10,
      weight: params.weight,
    }),
  });
}

export async function generateAWB(shipmentId: number): Promise<{ awb_code: string; courier_name: string }> {
  const data = await sr<{
    awb_assign_status: number;
    response: { data: { awb_code: string; courier_name: string } };
  }>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: String(shipmentId), courier_id: null }),
  });
  if (!data.awb_assign_status) throw new Error("AWB assignment failed");
  return { awb_code: data.response.data.awb_code, courier_name: data.response.data.courier_name };
}

export async function requestPickup(shipmentId: number): Promise<void> {
  await sr("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

export async function cancelShipment(awbCodes: string[]): Promise<void> {
  await sr("/orders/cancel/shipment/awbs", {
    method: "POST",
    body: JSON.stringify({ awbs: awbCodes }),
  });
}
