/** Bentuk paket unduh "data saya" — hanya field milik pengguna, tanpa rahasia. */

export interface ExportProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
}

export interface ExportOrder {
  id: string;
  status: string;
  quantity: number;
  discount_price_snapshot: number;
}

export interface ExportTenant {
  name: string;
  menus: Array<{ name: string; normal_price: number }>;
}

export interface DataExport {
  exportedAt: string;
  profile: ExportProfile;
  orders: ExportOrder[];
  tenant: ExportTenant | null;
}

export function buildDataExport(input: {
  profile: ExportProfile;
  orders: ExportOrder[];
  tenant: ExportTenant | null;
}): DataExport {
  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: input.profile.id,
      email: input.profile.email,
      full_name: input.profile.full_name,
      role: input.profile.role,
    },
    orders: input.orders.map((o) => ({
      id: o.id,
      status: o.status,
      quantity: o.quantity,
      discount_price_snapshot: o.discount_price_snapshot,
    })),
    tenant: input.tenant
      ? {
          name: input.tenant.name,
          menus: input.tenant.menus.map((m) => ({ name: m.name, normal_price: m.normal_price })),
        }
      : null,
  };
}
