import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  ResponsibilityCenter,
  ResponsibilityCenterSection,
  Unit,
  Item,
  Spec,
  PurchaseRequest,
  PurchaseRequestLine,
  PurchaseRequestFormData,
  PRLineFormData,
} from "@/types/gse.types";

// ────────────────────────────────────────────────────────────
// LOOKUPS (public + gse schemas)
// ────────────────────────────────────────────────────────────

export const fetchResponsibilityCenters = async (): Promise<
  ResponsibilityCenter[]
> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from("responsibility_center")
    .select("id, rc_code, description, is_active, created_at")
    .eq("is_active", true)
    .order("description");
  if (error) {
    console.error("Error fetching responsibility centers:", error);
    return [];
  }
  return data || [];
};

export const fetchSections = async (
  rcId?: string,
): Promise<ResponsibilityCenterSection[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  let query = (supabase as NonNullable<typeof supabase>)
    .from("responsibility_center_section")
    .select("id, rcs_code, description, rc_id, is_active, created_at")
    .eq("is_active", true)
    .order("description");
  if (rcId) query = query.eq("rc_id", rcId);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching sections:", error);
    return [];
  }
  return data || [];
};

export const fetchUnits = async (): Promise<Unit[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("unit")
    .select("u_id, u_code, description, is_active")
    .eq("is_active", true)
    .order("u_code");
  if (error) {
    console.error("Error fetching units:", error);
    return [];
  }
  return (data || []).map((r: any) => ({ id: r.u_id, ...r }));
};

export const fetchItems = async (): Promise<Item[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("items")
    .select("i_id, i_code, description, default_u_id, is_active")
    .eq("is_active", true)
    .order("i_code");
  if (error) {
    console.error("Error fetching items:", error);
    return [];
  }
  return (data || []).map((r: any) => ({ id: r.i_id, ...r }));
};

export const fetchSpecs = async (): Promise<Spec[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("specs")
    .select("s_id, s_code, description, is_active")
    .eq("is_active", true)
    .order("description");
  if (error) {
    console.error("Error fetching specs:", error);
    return [];
  }
  return (data || []).map((r: any) => ({ id: r.s_id, ...r }));
};

// Fetches catalog specs for a given item from item_spec table.
export interface ItemSpecDefault {
  s_id: string;
  s_code: string;
  s_description: string;
  spec_value: string;
}

export const fetchItemSpecs = async (
  i_id: string,
): Promise<ItemSpecDefault[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("item_spec")
    .select("s_id, spec_value, specs:s_id(s_code, description)")
    .eq("i_id", i_id);
  if (error) {
    console.error("Error fetching item specs:", error);
    return [];
  }
  return ((data as any[]) || []).map((row) => {
    const spec = Array.isArray(row.specs) ? row.specs[0] : row.specs;
    return {
      s_id: row.s_id,
      s_code: spec?.s_code ?? "",
      s_description: spec?.description ?? "",
      spec_value: row.spec_value ?? "",
    };
  });
};

// Returns the most-recent specifications JSON string keyed by item description.
// Used to auto-fill specs when an item is re-selected in a new PR line.
export const fetchItemSpecHistory = async (): Promise<
  Record<string, string | null>
> => {
  if (!isSupabaseConfigured() || !supabase) return {};
  const { data } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .select("specifications, items:i_id(description)")
    .order("created_at", { ascending: false });
  const map: Record<string, string | null> = {};
  for (const row of (data as any[]) || []) {
    const desc = (Array.isArray(row.items) ? row.items[0] : row.items)
      ?.description as string | undefined;
    if (desc && !(desc in map)) {
      map[desc] = row.specifications || null;
    }
  }
  return map;
};

// Returns all previously-used values keyed by spec label.
// Parses every specifications JSON in purchase_request_list so the value
// field can suggest options based on what was typed in past entries.
export const fetchSpecValueHistory = async (): Promise<
  Record<string, string[]>
> => {
  if (!isSupabaseConfigured() || !supabase) return {};
  const { data } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .select("specifications")
    .not("specifications", "is", null);
  const map: Record<string, Set<string>> = {};
  for (const row of (data as any[]) || []) {
    try {
      const parsed = JSON.parse(row.specifications);
      if (Array.isArray(parsed)) {
        for (const e of parsed) {
          const label = String(e.label ?? "").trim();
          const value = String(e.value ?? "").trim();
          if (label && value) {
            if (!map[label]) map[label] = new Set();
            map[label].add(value);
          }
        }
      }
    } catch {
      // ignore non-JSON rows
    }
  }
  const result: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) result[k] = [...v];
  return result;
};

// ────────────────────────────────────────────────────────────
// PURCHASE REQUESTS — header
// ────────────────────────────────────────────────────────────

export const fetchPurchaseRequests = async (): Promise<PurchaseRequest[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .select(
      `
      pr_id, pr_no, pr_date, rc_id, rcs_id, purpose, remarks,
      pr_total_amount, status, requested_by, approved_by, approved_at,
      created_at, updated_at
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching purchase requests:", error);
    return [];
  }

  return ((data || []) as any[]).map((row) => ({
    ...row,
    id: row.pr_id,
  })) as PurchaseRequest[];
};

export const createPurchaseRequest = async (
  formData: PurchaseRequestFormData,
): Promise<{ success: boolean; pr_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const cleaned: Record<string, unknown> = {
    pr_date: formData.pr_date,
    rc_id: formData.rc_id,
    rcs_id: formData.rcs_id || null,
    purpose: formData.purpose,
    remarks: formData.remarks || null,
    requested_by: formData.requested_by || null,
    status: "DRAFT",
  };
  if (formData.pr_no) cleaned.pr_no = formData.pr_no;

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .insert([cleaned])
    .select("pr_id")
    .single();

  if (error) {
    console.error("Error creating PR:", error);
    return { success: false, error: error.message };
  }

  return { success: true, pr_id: data?.pr_id };
};

export const updatePurchaseRequest = async (
  prId: string,
  formData: Partial<PurchaseRequestFormData & { status: string }>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .update(formData)
    .eq("pr_id", prId);

  if (error) {
    console.error("Error updating PR:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const deletePurchaseRequest = async (
  prId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .delete()
    .eq("pr_id", prId);

  if (error) {
    console.error("Error deleting PR:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// ────────────────────────────────────────────────────────────
// PURCHASE REQUEST LINE ITEMS
// ────────────────────────────────────────────────────────────

export const fetchPRLines = async (
  prId: string,
): Promise<PurchaseRequestLine[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .select(
      `
      prl_id, pr_id, i_id, u_id, qty, unit_price_estimated,
      prl_total_amount_estimated, specifications, created_at, updated_at,
      items:i_id ( i_code, description ),
      unit:u_id  ( u_code )
    `,
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

export const addPRLine = async (
  prId: string,
  line: PRLineFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .insert([
      {
        pr_id: prId,
        i_id: line.i_id,
        u_id: line.u_id,
        qty: line.qty,
        unit_price_estimated: line.unit_price_estimated,
        specifications: line.specifications || null,
      },
    ]);

  if (error) {
    console.error("Error adding PR line:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const updatePRLine = async (
  prlId: string,
  line: Partial<PRLineFormData>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .update(line)
    .eq("prl_id", prlId);

  if (error) {
    console.error("Error updating PR line:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const deletePRLine = async (
  prlId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .delete()
    .eq("prl_id", prlId);

  if (error) {
    console.error("Error deleting PR line:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// ────────────────────────────────────────────────────────────
// RESPONSIBILITY CENTER / SECTION — QUICK CREATE
// ────────────────────────────────────────────────────────────

export const createResponsibilityCenter = async (
  description: string,
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const rc_code = "RC-" + Date.now().toString().slice(-6);
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from("responsibility_center")
    .insert({ rc_code, description: description.trim(), is_active: true })
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
};

export const createResponsibilityCenterSection = async (
  description: string,
  rc_id: string,
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase is not configured" };
  const rcs_code = "RCS-" + Date.now().toString().slice(-6);
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from("responsibility_center_section")
    .insert({
      rcs_code,
      description: description.trim(),
      rc_id,
      is_active: true,
    })
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
};

// ────────────────────────────────────────────────────────────
// AUTO-GENERATE PR NUMBER
// ────────────────────────────────────────────────────────────

export const generateNextPRNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;

  if (!isSupabaseConfigured() || !supabase) {
    return `${prefix}0001`;
  }

  const { data } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .select("pr_no")
    .like("pr_no", `${prefix}%`)
    .order("pr_no", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0 && data[0].pr_no) {
    const lastNum = parseInt(data[0].pr_no.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
};

// ────────────────────────────────────────────────────────────
// GET OR CREATE ITEM / UNIT (for free-text inputs)
// ────────────────────────────────────────────────────────────

export const getOrCreateItem = async (
  description: string,
): Promise<string | null> => {
  if (!isSupabaseConfigured() || !supabase || !description.trim()) return null;

  const { data: existing } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("items")
    .select("i_id")
    .ilike("description", description.trim())
    .limit(1);

  if (existing && existing.length > 0) return existing[0].i_id;

  const i_code = "ITEM-" + Date.now().toString().slice(-6);
  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("items")
    .insert({ i_code, description: description.trim(), is_active: true })
    .select("i_id")
    .single();

  if (error) {
    console.error("Error creating item:", error);
    return null;
  }
  return data?.i_id ?? null;
};

export const getOrCreateUnit = async (code: string): Promise<string | null> => {
  if (!isSupabaseConfigured() || !supabase || !code.trim()) return null;

  const { data: existing } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("unit")
    .select("u_id")
    .ilike("u_code", code.trim())
    .limit(1);

  if (existing && existing.length > 0) return existing[0].u_id;

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("unit")
    .insert({
      u_code: code.trim().toUpperCase(),
      description: code.trim(),
      is_active: true,
    })
    .select("u_id")
    .single();

  if (error) {
    console.error("Error creating unit:", error);
    return null;
  }
  return data?.u_id ?? null;
};
