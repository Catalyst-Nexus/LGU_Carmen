import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Supplier,
  ModeProcurement,
  DeliveryTerm,
  PaymentTerm,
  Abstract,
  Bidture,
  AbstractFormData,
  BidtureFormData,
  PurchaseRequest,
  PurchaseRequestLine,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderFormData,
} from "@/types/gse.types";

// ────────────────────────────────────────────────────────────
// LOOKUPS
// ────────────────────────────────────────────────────────────

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("supplier")
    .select("s_id, s_code, description, address, contact, tin, is_active")
    .eq("is_active", true)
    .order("description");
  if (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
  return data || [];
};

export const fetchModesProcurement = async (): Promise<ModeProcurement[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("mode_procurement")
    .select("mp_id, mp_code, description, is_active")
    .eq("is_active", true)
    .order("description");
  if (error) {
    console.error("Error fetching modes of procurement:", error);
    return [];
  }
  return data || [];
};

export const fetchDeliveryTerms = async (): Promise<DeliveryTerm[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_term")
    .select("dt_id, dt_code, description, is_active")
    .eq("is_active", true)
    .order("description");
  if (error) {
    console.error("Error fetching delivery terms:", error);
    return [];
  }
  return data || [];
};

export const fetchPaymentTerms = async (): Promise<PaymentTerm[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("payment_term")
    .select("pt_id, pt_code, description, is_active")
    .eq("is_active", true)
    .order("description");
  if (error) {
    console.error("Error fetching payment terms:", error);
    return [];
  }
  return data || [];
};

export const createDeliveryTerm = async (
  description: string,
): Promise<{ success: boolean; dt_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const dt_code = "DT-" + Date.now().toString().slice(-6);
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_term")
    .insert({ dt_code, description: description.trim(), is_active: true })
    .select("dt_id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, dt_id: data.dt_id };
};

export const createPaymentTerm = async (
  description: string,
): Promise<{ success: boolean; pt_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const pt_code = "PT-" + Date.now().toString().slice(-6);
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("payment_term")
    .insert({ pt_code, description: description.trim(), is_active: true })
    .select("pt_id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, pt_id: data.pt_id };
};

/** Fetch SUBMITTED PRs that can be linked to an abstract */
export const fetchSubmittedPRs = async (): Promise<PurchaseRequest[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .select("pr_id, pr_no, pr_date, rc_id, purpose, pr_total_amount, status")
    .in("status", ["SUBMITTED", "APPROVED"])
    .order("pr_no", { ascending: false });
  if (error) {
    console.error("Error fetching submitted PRs:", error);
    return [];
  }
  return (data || []).map((r: any) => ({
    ...r,
    id: r.pr_id,
  })) as PurchaseRequest[];
};

/** Fetch line items for a given PR */
export const fetchPRLinesForAbstract = async (
  prId: string,
): Promise<PurchaseRequestLine[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .select(
      `prl_id, pr_id, i_id, u_id, qty, unit_price_estimated,
       prl_total_amount_estimated, specifications, created_at, updated_at,
       items:i_id ( i_code, description ),
       unit:u_id  ( u_code )`,
    )
    .eq("pr_id", prId)
    .order("created_at");
  if (error) {
    console.error("Error fetching PR lines:", error);
    return [];
  }
  return ((data as any[]) || []).map((row) => {
    const item = Array.isArray(row.items) ? row.items[0] : row.items;
    const unit = Array.isArray(row.unit) ? row.unit[0] : row.unit;
    return {
      ...row,
      id: row.prl_id,
      item_code: item?.i_code ?? "",
      item_description: item?.description ?? "",
      unit_code: unit?.u_code ?? "",
    };
  });
};

// ────────────────────────────────────────────────────────────
// ABSTRACTS — CRUD
// ────────────────────────────────────────────────────────────

export const fetchAbstracts = async (): Promise<Abstract[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("abstract")
    .select(
      `a_id, a_no, a_date, mp_id, pr_id, approved_budget,
       dt_id, pt_id, winning_b_id, status, remarks, created_at, updated_at`,
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching abstracts:", error);
    return [];
  }
  return (data || []).map((r: any) => ({ ...r, id: r.a_id }));
};

export const createAbstract = async (
  formData: AbstractFormData,
): Promise<{ success: boolean; a_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("abstract")
    .insert([
      {
        a_no: formData.a_no || null,
        a_date: formData.a_date,
        mp_id: formData.mp_id,
        pr_id: formData.pr_id,
        approved_budget: formData.approved_budget,
        dt_id: formData.dt_id || null,
        pt_id: formData.pt_id || null,
        status: formData.status || "DRAFT",
        remarks: formData.remarks || null,
      },
    ])
    .select("a_id")
    .single();
  if (error) {
    console.error("Error creating abstract:", error);
    return { success: false, error: error.message };
  }
  return { success: true, a_id: data?.a_id };
};

export const updateAbstract = async (
  aId: string,
  formData: Partial<
    AbstractFormData & { status: string; winning_b_id: string | null }
  >,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("abstract")
    .update(formData)
    .eq("a_id", aId);
  if (error) {
    console.error("Error updating abstract:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const deleteAbstract = async (
  aId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  // Delete all bidture rows first
  await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("bidture")
    .delete()
    .eq("a_id", aId);

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("abstract")
    .delete()
    .eq("a_id", aId);
  if (error) {
    console.error("Error deleting abstract:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

// ────────────────────────────────────────────────────────────
// BIDTURE — CRUD
// ────────────────────────────────────────────────────────────

export const fetchBidtures = async (aId: string): Promise<Bidture[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("bidture")
    .select(
      `b_id, a_id, s_id, prl_id, unit_price_bid, unit_total_amount_bid,
       winner_status, created_at, updated_at`,
    )
    .eq("a_id", aId);
  if (error) {
    console.error("Error fetching bidtures:", error);
    return [];
  }
  return data || [];
};

export const upsertBidtures = async (
  rows: BidtureFormData[],
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  // Insert in batch
  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("bidture")
    .insert(rows);
  if (error) {
    console.error("Error inserting bidtures:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const deleteBidturesByAbstract = async (
  aId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("bidture")
    .delete()
    .eq("a_id", aId);
  if (error) {
    console.error("Error deleting bidtures:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

// ────────────────────────────────────────────────────────────
// AUTO-GENERATE ABSTRACT NUMBER
// ────────────────────────────────────────────────────────────

export const generateNextAbstractNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `ABS-${year}-`;

  if (!isSupabaseConfigured() || !supabase) return `${prefix}0001`;

  const { data } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("abstract")
    .select("a_no")
    .like("a_no", `${prefix}%`)
    .order("a_no", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0 && data[0].a_no) {
    const lastNum = parseInt(data[0].a_no.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
};

// ────────────────────────────────────────────────────────────
// MODE OF PROCUREMENT — QUICK CREATE
// ────────────────────────────────────────────────────────────

export const createModeProcurement = async (
  description: string,
): Promise<{ success: boolean; mp_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const mp_code = "MP-" + Date.now().toString().slice(-6);
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("mode_procurement")
    .insert({ mp_code, description: description.trim(), is_active: true })
    .select("mp_id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, mp_id: data.mp_id };
};

// ────────────────────────────────────────────────────────────
// SUPPLIER — QUICK CREATE
// ────────────────────────────────────────────────────────────

export const createSupplier = async (
  description: string,
  address?: string,
  contact?: string,
  tin?: string,
): Promise<{ success: boolean; s_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const s_code = "SUP-" + Date.now().toString().slice(-6);
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("supplier")
    .insert({
      s_code,
      description: description.trim(),
      address: address?.trim() || null,
      contact: contact?.trim() || null,
      tin: tin?.trim() || null,
      is_active: true,
    })
    .select("s_id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, s_id: data.s_id };
};

// ────────────────────────────────────────────────────────────
// PURCHASE ORDER — CRUD
// ────────────────────────────────────────────────────────────

/** Fetch abstracts that have been awarded (winning supplier selected) */
export const fetchAwardedAbstracts = async (): Promise<Abstract[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("abstract")
    .select(
      `a_id, a_no, a_date, mp_id, pr_id, approved_budget,
       dt_id, pt_id, winning_b_id, status, remarks, created_at, updated_at`,
    )
    .not("winning_b_id", "is", null)
    .order("a_date", { ascending: false });
  if (error) {
    console.error("Error fetching awarded abstracts:", error);
    return [];
  }
  return (data || []).map((r: any) => ({ ...r, id: r.a_id }));
};

/** Fetch winning bidture rows for a given abstract (winner_status = true) */
export const fetchWinningBidtures = async (aId: string): Promise<Bidture[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("bidture")
    .select(
      `b_id, a_id, s_id, prl_id, unit_price_bid, unit_total_amount_bid,
       winner_status, created_at, updated_at`,
    )
    .eq("a_id", aId)
    .eq("winner_status", true);
  if (error) {
    console.error("Error fetching winning bidtures:", error);
    return [];
  }
  return data || [];
};

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order")
    .select(
      `po_id, po_no, po_date, a_id, place_of_delivery, date_of_delivery,
       days_to_deliver, pt_id, dt_id, po_total_amount, status, remarks,
       issued_by, received_by, created_at, updated_at`,
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
  return (data || []).map((r: any) => ({ ...r, id: r.po_id }));
};

export const createPurchaseOrder = async (
  formData: PurchaseOrderFormData,
): Promise<{ success: boolean; po_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order")
    .insert([
      {
        po_no: formData.po_no || null,
        po_date: formData.po_date,
        a_id: formData.a_id,
        place_of_delivery: formData.place_of_delivery || null,
        date_of_delivery: formData.date_of_delivery || null,
        days_to_deliver: formData.days_to_deliver ?? null,
        pt_id: formData.pt_id || null,
        dt_id: formData.dt_id || null,
        po_total_amount: formData.po_total_amount || 0,
        status: formData.status || "DRAFT",
        remarks: formData.remarks || null,
        issued_by: formData.issued_by || null,
        received_by: formData.received_by || null,
      },
    ])
    .select("po_id")
    .single();
  if (error) {
    console.error("Error creating purchase order:", error);
    return { success: false, error: error.message };
  }
  return { success: true, po_id: data?.po_id };
};

export const updatePurchaseOrder = async (
  poId: string,
  formData: Partial<PurchaseOrderFormData & { status: string }>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order")
    .update(formData)
    .eq("po_id", poId);
  if (error) {
    console.error("Error updating purchase order:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const deletePurchaseOrder = async (
  poId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  // Delete PO lines first
  await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order_list")
    .delete()
    .eq("po_id", poId);

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order")
    .delete()
    .eq("po_id", poId);
  if (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

// ────────────────────────────────────────────────────────────
// PURCHASE ORDER LIST (LINE ITEMS) — CRUD
// ────────────────────────────────────────────────────────────

export const fetchPOLines = async (
  poId: string,
): Promise<PurchaseOrderLine[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order_list")
    .select(
      `pol_id, po_id, b_id, prl_id, qty_ordered, unit_price,
       pol_total_amount, qty_delivered, delivery_status, created_at, updated_at`,
    )
    .eq("po_id", poId)
    .order("created_at");
  if (error) {
    console.error("Error fetching PO lines:", error);
    return [];
  }
  return data || [];
};

export const upsertPOLines = async (
  rows: {
    po_id: string;
    b_id: string;
    prl_id: string;
    qty_ordered: number;
    unit_price: number;
    pol_total_amount: number;
  }[],
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order_list")
    .insert(rows);
  if (error) {
    console.error("Error inserting PO lines:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const deletePOLinesByOrder = async (
  poId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order_list")
    .delete()
    .eq("po_id", poId);
  if (error) {
    console.error("Error deleting PO lines:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

// ────────────────────────────────────────────────────────────
// AUTO-GENERATE PO NUMBER
// ────────────────────────────────────────────────────────────

export const generateNextPONumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;

  if (!isSupabaseConfigured() || !supabase) return `${prefix}0001`;

  const { data } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order")
    .select("po_no")
    .like("po_no", `${prefix}%`)
    .order("po_no", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0 && data[0].po_no) {
    const lastNum = parseInt(data[0].po_no.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
};
