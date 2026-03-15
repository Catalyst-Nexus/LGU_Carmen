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
  DeliveryReceipt,
  DeliveryReceiptLine,
  DeliveryReceiptFormData,
  WorkflowLog,
  ProcurementDashboardStats,
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

/** Fetch APPROVED PRs that can be linked to an abstract */
export const fetchSubmittedPRs = async (): Promise<PurchaseRequest[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .select(
      "pr_id, pr_no, pr_date, rc_id, rcs_id, purpose, pr_total_amount, status",
    )
    .eq("status", "APPROVED")
    .order("pr_no", { ascending: false });
  if (error) {
    console.error("Error fetching approved PRs:", error);
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
    pol_total_amount?: number;
  }[],
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const payload = rows.map(({ pol_total_amount: _, ...rest }) => rest);

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order_list")
    .insert(payload);
  if (error) {
    console.error("Error upserting PO lines:", error);
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

// ────────────────────────────────────────────────────────────
// PR LINE SPECIFICATIONS — UPDATE (for Abstract editing)
// ────────────────────────────────────────────────────────────

/** Update specifications for a PR line item */
export const updatePRLineSpecifications = async (
  prlId: string,
  specifications: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .update({ specifications })
    .eq("prl_id", prlId);
  if (error) {
    console.error("Error updating PR line specifications:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

// ────────────────────────────────────────────────────────────
// PR BUDGET TRACKING — Calculate remaining budget from abstracts
// ────────────────────────────────────────────────────────────

/** Get total awarded (consumed) amount for a PR from all awarded abstracts */
export const getPRConsumedAmount = async (prId: string): Promise<number> => {
  if (!isSupabaseConfigured() || !supabase) return 0;

  // Get all abstracts for this PR that have a winner
  const { data: abstracts, error } = await (
    supabase as NonNullable<typeof supabase>
  )
    .schema("bac")
    .from("abstract")
    .select("a_id, winning_b_id")
    .eq("pr_id", prId)
    .not("winning_b_id", "is", null);

  if (error || !abstracts || abstracts.length === 0) return 0;

  // Sum up the winning bidture amounts for each abstract
  let totalConsumed = 0;
  for (const abs of abstracts) {
    const { data: bidtures } = await (supabase as NonNullable<typeof supabase>)
      .schema("bac")
      .from("bidture")
      .select("unit_total_amount_bid")
      .eq("a_id", abs.a_id)
      .eq("winner_status", true);

    if (bidtures) {
      for (const b of bidtures) {
        totalConsumed += b.unit_total_amount_bid || 0;
      }
    }
  }

  return totalConsumed;
};

/** Get remaining budget for a PR (approved budget - consumed from abstracts) */
export const getPRRemainingBudget = async (
  prId: string,
  approvedBudget: number,
): Promise<number> => {
  const consumed = await getPRConsumedAmount(prId);
  return Math.max(0, approvedBudget - consumed);
};

/** Get PR IDs that already have at least one winner-declared abstract */
export const getPRsWithWinnerDeclared = async (): Promise<string[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("abstract")
    .select("pr_id")
    .not("winning_b_id", "is", null);

  if (error) {
    console.error("Error fetching PRs with declared winners:", error);
    return [];
  }

  // Return unique PR IDs
  const prIds = [...new Set((data || []).map((row) => row.pr_id))];
  return prIds;
};

/** Fetch APPROVED PRs that have remaining budget (not fully consumed by abstracts) */
export const fetchPRsWithRemainingBudget = async (
  rcId?: string,
  rcsId?: string,
): Promise<
  Array<PurchaseRequest & { consumed_amount: number; remaining_budget: number }>
> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  // First get all approved PRs
  let query = (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .select(
      "pr_id, pr_no, pr_date, rc_id, rcs_id, purpose, pr_total_amount, status",
    )
    .eq("status", "APPROVED");

  if (rcId) {
    query = query.eq("rc_id", rcId);
  }
  if (rcsId) {
    query = query.eq("rcs_id", rcsId);
  }

  const { data, error } = await query.order("pr_no", { ascending: false });

  if (error) {
    console.error("Error fetching approved PRs:", error);
    return [];
  }

  // Calculate remaining budget for each PR
  const result: Array<
    PurchaseRequest & { consumed_amount: number; remaining_budget: number }
  > = [];

  for (const pr of data || []) {
    const consumed = await getPRConsumedAmount(pr.pr_id);
    const remaining = Math.max(0, (pr.pr_total_amount || 0) - consumed);

    // Only include PRs that have remaining budget
    if (remaining > 0) {
      result.push({
        ...pr,
        id: pr.pr_id,
        consumed_amount: consumed,
        remaining_budget: remaining,
      } as PurchaseRequest & {
        consumed_amount: number;
        remaining_budget: number;
      });
    }
  }

  return result;
};

// ────────────────────────────────────────────────────────────
// DELIVERY RECEIPT
// ────────────────────────────────────────────────────────────

export const fetchDeliveryReceipts = async (): Promise<DeliveryReceipt[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt")
    .select("*")
    .order("dr_date", { ascending: false });
  if (error) {
    console.error("Error fetching delivery receipts:", error);
    return [];
  }
  return data || [];
};

export const fetchDeliveryReceiptsByPO = async (
  poId: string,
): Promise<DeliveryReceipt[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt")
    .select("*")
    .eq("po_id", poId)
    .order("dr_date", { ascending: false });
  if (error) {
    console.error("Error fetching delivery receipts for PO:", error);
    return [];
  }
  return data || [];
};

export const fetchDeliveryReceiptLines = async (
  drId: string,
): Promise<DeliveryReceiptLine[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt_line")
    .select("*")
    .eq("dr_id", drId);
  if (error) {
    console.error("Error fetching delivery receipt lines:", error);
    return [];
  }
  return data || [];
};

export const generateNextDRNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `DR-${year}-`;

  if (!isSupabaseConfigured() || !supabase) return `${prefix}0001`;

  const { data } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt")
    .select("dr_no")
    .like("dr_no", `${prefix}%`)
    .order("dr_no", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0 && data[0].dr_no) {
    const lastNum = parseInt(data[0].dr_no.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
};

export const createDeliveryReceipt = async (
  formData: DeliveryReceiptFormData,
): Promise<{ success: boolean; dr_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt")
    .insert(formData)
    .select("dr_id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, dr_id: data.dr_id };
};

export const updateDeliveryReceipt = async (
  drId: string,
  formData: Partial<DeliveryReceiptFormData>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt")
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq("dr_id", drId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteDeliveryReceipt = async (
  drId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt")
    .delete()
    .eq("dr_id", drId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const upsertDeliveryReceiptLines = async (
  lines: Array<{
    dr_id: string;
    pol_id: string;
    qty_delivered: number;
    qty_accepted: number;
    qty_rejected?: number;
    rejection_reason?: string;
    inspection_notes?: string;
  }>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt_line")
    .upsert(lines, { onConflict: "drl_id" });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteDeliveryReceiptLinesByDR = async (
  drId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("delivery_receipt_line")
    .delete()
    .eq("dr_id", drId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// Update PO line delivery tracking
export const updatePOLineDelivery = async (
  polId: string,
  qtyDelivered: number,
  deliveryStatus: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order_list")
    .update({
      qty_delivered: qtyDelivered,
      delivery_status: deliveryStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("pol_id", polId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ────────────────────────────────────────────────────────────
// WORKFLOW LOG
// ────────────────────────────────────────────────────────────

export const logWorkflowChange = async (
  entityType: "PR" | "ABSTRACT" | "PO" | "DR",
  entityId: string,
  entityNo: string,
  fromStatus: string | null,
  toStatus: string,
  changedBy?: string,
  remarks?: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("workflow_log")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      entity_no: entityNo,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      remarks,
    });
  if (error) {
    console.error("Error logging workflow change:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const fetchWorkflowLogs = async (
  entityType?: string,
  entityId?: string,
): Promise<WorkflowLog[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  let query = (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("workflow_log")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(100);

  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching workflow logs:", error);
    return [];
  }
  return data || [];
};

// ────────────────────────────────────────────────────────────
// PROCUREMENT DASHBOARD
// ────────────────────────────────────────────────────────────

export const fetchProcurementDashboardStats =
  async (): Promise<ProcurementDashboardStats | null> => {
    if (!isSupabaseConfigured() || !supabase) return null;

    // Fetch stats in parallel
    const [prStats, absStats, poStats, drStats] = await Promise.all([
      // PR Stats
      (supabase as NonNullable<typeof supabase>)
        .schema("gse")
        .from("purchase_request")
        .select("status, pr_total_amount"),
      // Abstract Stats
      (supabase as NonNullable<typeof supabase>)
        .schema("bac")
        .from("abstract")
        .select("status"),
      // PO Stats
      (supabase as NonNullable<typeof supabase>)
        .schema("bac")
        .from("purchase_order")
        .select("status, po_total_amount"),
      // DR Stats
      (supabase as NonNullable<typeof supabase>)
        .schema("bac")
        .from("delivery_receipt")
        .select("status"),
    ]);

    const prData = prStats.data || [];
    const absData = absStats.data || [];
    const poData = poStats.data || [];
    const drData = drStats.data || [];

    return {
      pr_draft: prData.filter((p) => p.status === "DRAFT").length,
      pr_pending: prData.filter((p) => p.status === "SUBMITTED").length,
      pr_approved: prData.filter((p) => p.status === "APPROVED").length,
      pr_rejected: prData.filter((p) => p.status === "REJECTED").length,
      pr_total_approved_amount: prData
        .filter((p) => p.status === "APPROVED")
        .reduce((sum, p) => sum + (p.pr_total_amount || 0), 0),
      abs_draft: absData.filter((a) => a.status === "DRAFT").length,
      abs_evaluated: absData.filter((a) => a.status === "EVALUATED").length,
      abs_awarded: absData.filter((a) => a.status === "AWARDED").length,
      po_draft: poData.filter((p) => p.status === "DRAFT").length,
      po_issued: poData.filter((p) => p.status === "ISSUED").length,
      po_received: poData.filter((p) => p.status === "RECEIVED").length,
      po_total_issued_amount: poData
        .filter((p) => p.status === "ISSUED")
        .reduce((sum, p) => sum + (p.po_total_amount || 0), 0),
      po_total_received_amount: poData
        .filter((p) => p.status === "RECEIVED")
        .reduce((sum, p) => sum + (p.po_total_amount || 0), 0),
      dr_draft: drData.filter((d) => d.status === "DRAFT").length,
      dr_accepted: drData.filter((d) => d.status === "ACCEPTED").length,
    };
  };

// ────────────────────────────────────────────────────────────
// AUTO-CREATE PO DRAFT WHEN ABSTRACT IS AWARDED
// ────────────────────────────────────────────────────────────

export const autoCreatePOFromAbstract = async (
  abstractId: string,
): Promise<{ success: boolean; po_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };

  // Check if PO already exists for this abstract
  const { data: existingPO } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order")
    .select("po_id")
    .eq("a_id", abstractId)
    .maybeSingle();

  if (existingPO) {
    return { success: true, po_id: existingPO.po_id };
  }

  // Fetch abstract details
  const { data: abstract } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("abstract")
    .select("*")
    .eq("a_id", abstractId)
    .single();

  if (!abstract) {
    return { success: false, error: "Abstract not found" };
  }

  // Generate PO number
  const poNo = await generateNextPONumber();

  // Create PO draft
  const result = await createPurchaseOrder({
    po_no: poNo,
    po_date: new Date().toISOString().slice(0, 10),
    a_id: abstractId,
    dt_id: abstract.dt_id,
    pt_id: abstract.pt_id,
    status: "DRAFT",
  });

  if (!result.success || !result.po_id) {
    return result;
  }

  // Fetch winning bidtures and create PO lines
  const winningBids = await fetchWinningBidtures(abstractId);
  const prLines = await fetchPRLinesForAbstract(abstract.pr_id);

  const poLines = winningBids.map((bid) => {
    const prl = prLines.find((l) => l.prl_id === bid.prl_id);
    return {
      po_id: result.po_id!,
      b_id: bid.b_id,
      prl_id: bid.prl_id,
      qty_ordered: prl?.qty || 1,
      unit_price: bid.unit_price_bid,
      pol_total_amount: bid.unit_total_amount_bid,
    };
  });

  if (poLines.length > 0) {
    await upsertPOLines(poLines);
  }

  // Update PO total
  const total = poLines.reduce((sum, l) => sum + l.pol_total_amount, 0);
  await updatePurchaseOrder(result.po_id!, { po_total_amount: total });

  return result;
};

// ────────────────────────────────────────────────────────────
// ISSUED POs FOR DELIVERY RECEIPT
// ────────────────────────────────────────────────────────────

export const fetchIssuedPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("bac")
    .from("purchase_order")
    .select("*")
    .in("status", ["ISSUED", "RECEIVED"])
    .order("po_date", { ascending: false });
  if (error) {
    console.error("Error fetching issued POs:", error);
    return [];
  }
  return data || [];
};

// Fetch PO lines with delivery status
export const fetchPOLinesWithDelivery = async (
  poId: string,
): Promise<
  Array<
    PurchaseOrderLine & {
      pending_qty: number;
      item_description: string;
      item_code: string;
      unit_code: string;
    }
  >
> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  // Step 1: fetch PO lines from bac schema
  const { data: polData, error: polError } = await (
    supabase as NonNullable<typeof supabase>
  )
    .schema("bac")
    .from("purchase_order_list")
    .select("*")
    .eq("po_id", poId);

  if (polError) {
    console.error("Error fetching PO lines with delivery:", polError);
    return [];
  }

  const poLines = polData || [];
  const prlIds = poLines
    .map((l) => l.prl_id)
    .filter((id): id is string => !!id);

  // Step 2: fetch PR line details from gse schema
  const prlMap: Record<
    string,
    { item_description: string; item_code: string; unit_code: string }
  > = {};

  if (prlIds.length > 0) {
    const { data: prlData, error: prlError } = await (
      supabase as NonNullable<typeof supabase>
    )
      .schema("gse")
      .from("purchase_request_list")
      .select(
        `prl_id,
         items:i_id ( i_code, description ),
         unit:u_id ( u_code )`,
      )
      .in("prl_id", prlIds);

    if (prlError) {
      console.error("Error fetching PR line details for DR:", prlError);
    }

    for (const row of prlData || []) {
      const item = Array.isArray((row as any).items)
        ? (row as any).items[0]
        : (row as any).items;
      const unit = Array.isArray((row as any).unit)
        ? (row as any).unit[0]
        : (row as any).unit;
      prlMap[(row as any).prl_id] = {
        item_description: item?.description ?? "",
        item_code: item?.i_code ?? "",
        unit_code: unit?.u_code ?? "",
      };
    }
  }

  return poLines.map((line) => ({
    ...line,
    pending_qty: Math.max(
      0,
      (line.qty_ordered || 0) - (line.qty_delivered || 0),
    ),
    item_description: prlMap[line.prl_id]?.item_description ?? "",
    item_code: prlMap[line.prl_id]?.item_code ?? "",
    unit_code: prlMap[line.prl_id]?.unit_code ?? "",
  }));
};

// Fetch PO lines for DR — auto-creates PO lines from winning bidtures if none exist
export const fetchPOLinesForDR = async (
  poId: string,
  aId?: string | null,
): Promise<
  Array<
    PurchaseOrderLine & {
      pending_qty: number;
      item_description: string;
      item_code: string;
      unit_code: string;
    }
  >
> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  // Step 1: fetch existing PO lines
  const { data: polData, error: polError } = await (
    supabase as NonNullable<typeof supabase>
  )
    .schema("bac")
    .from("purchase_order_list")
    .select("*")
    .eq("po_id", poId);

  if (polError) {
    console.error("Error fetching PO lines for DR:", polError);
    return [];
  }

  let poLines = polData || [];

  // Step 2: if no saved lines and we have an abstract, get items from winning bidtures (display only)
  if (poLines.length === 0 && aId) {
    const { data: abstractData } = await (
      supabase as NonNullable<typeof supabase>
    )
      .schema("bac")
      .from("abstract")
      .select("pr_id")
      .eq("a_id", aId)
      .single();

    if (abstractData?.pr_id) {
      const [winBids, prLinesData] = await Promise.all([
        fetchWinningBidtures(aId),
        fetchPRLinesForAbstract(abstractData.pr_id),
      ]);

      if (winBids.length > 0) {
        // Build display-only items from winning bidtures (no actual pol_id yet)
        const displayLines = winBids.map((bid) => {
          const prl = prLinesData.find((l) => l.prl_id === bid.prl_id);
          return {
            pol_id: `pending:${bid.prl_id}`, // Marker for display-only
            po_id: poId,
            b_id: bid.b_id,
            prl_id: bid.prl_id,
            qty_ordered: prl?.qty || 1,
            unit_price: bid.unit_price_bid,
            pol_total_amount: bid.unit_total_amount_bid,
            qty_delivered: 0,
            delivery_status: "PENDING",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pending_qty: prl?.qty || 1,
            item_description: prl?.item_description || "",
            item_code: prl?.item_code || "",
            unit_code: prl?.unit_code || "",
          };
        });
        return displayLines as Array<
          PurchaseOrderLine & {
            pending_qty: number;
            item_description: string;
            item_code: string;
            unit_code: string;
          }
        >;
      }
    }
  }

  // Step 3: enrich with PR line details from gse schema
  const prlIds = poLines
    .map((l) => l.prl_id)
    .filter((id): id is string => !!id);

  const prlMap: Record<
    string,
    { item_description: string; item_code: string; unit_code: string }
  > = {};

  if (prlIds.length > 0) {
    const { data: prlData, error: prlError } = await (
      supabase as NonNullable<typeof supabase>
    )
      .schema("gse")
      .from("purchase_request_list")
      .select(
        `prl_id,
         items:i_id ( i_code, description ),
         unit:u_id ( u_code )`,
      )
      .in("prl_id", prlIds);

    if (prlError) {
      console.error("Error fetching PR line details for DR:", prlError);
    }

    for (const row of prlData || []) {
      const item = Array.isArray((row as any).items)
        ? (row as any).items[0]
        : (row as any).items;
      const unit = Array.isArray((row as any).unit)
        ? (row as any).unit[0]
        : (row as any).unit;
      prlMap[(row as any).prl_id] = {
        item_description: item?.description ?? "",
        item_code: item?.i_code ?? "",
        unit_code: unit?.u_code ?? "",
      };
    }
  }

  return poLines.map((line) => ({
    ...line,
    pending_qty: Math.max(
      0,
      (line.qty_ordered || 0) - (line.qty_delivered || 0),
    ),
    item_description: prlMap[line.prl_id]?.item_description ?? "",
    item_code: prlMap[line.prl_id]?.item_code ?? "",
    unit_code: prlMap[line.prl_id]?.unit_code ?? "",
  }));
};
