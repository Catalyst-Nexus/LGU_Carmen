import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  PurchaseRequest,
  PurchaseRequestList,
  Item,
  Unit,
  Spec,
  ItemSpec,
  PurchaseRequestFormData,
  PurchaseRequestListFormData,
} from "@/types/gse.types";

export interface ResponsibilityCenter {
  id: string;
  rc_code: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface ResponsibilityCenterSection {
  id: string;
  rcs_code: string;
  description: string;
  rc_id: string;
  is_active: boolean;
  created_at: string;
}

// Fetch all purchase requests
export const fetchPurchaseRequests = async (): Promise<PurchaseRequest[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .select(`
      *,
      responsibility_center:rc_id ( id, name ),
      responsibility_center_section:rcs_id ( id, name )
    `)
    .order("pr_date", { ascending: false });

  if (error) {
    console.error("Error fetching purchase requests:", error);
    return [];
  }

  return data || [];
};

// Fetch single purchase request with items
export const fetchPurchaseRequestById = async (
  pr_id: string
): Promise<{
  purchaseRequest: PurchaseRequest | null;
  items: PurchaseRequestList[];
}> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { purchaseRequest: null, items: [] };
  }

  // Fetch purchase request
  const { data: prData, error: prError } = await (
    supabase as NonNullable<typeof supabase>
  )
    .schema("gse")
    .from("purchase_request")
    .select(`
      *,
      responsibility_center:rc_id ( id, name ),
      responsibility_center_section:rcs_id ( id, name )
    `)
    .eq("pr_id", pr_id)
    .single();

  if (prError) {
    console.error("Error fetching purchase request:", prError);
    return { purchaseRequest: null, items: [] };
  }

  // Fetch purchase request items
  const { data: itemsData, error: itemsError } = await (
    supabase as NonNullable<typeof supabase>
  )
    .schema("gse")
    .from("purchase_request_list")
    .select(`
      *,
      item:i_id ( * ),
      unit:u_id ( * )
    `)
    .eq("pr_id", pr_id);

  if (itemsError) {
    console.error("Error fetching purchase request items:", itemsError);
    return { purchaseRequest: prData, items: [] };
  }

  return {
    purchaseRequest: prData,
    items: itemsData || [],
  };
};

// Fetch all items
export const fetchItems = async (): Promise<Item[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("items")
    .select(`
      *,
      default_unit:default_u_id ( * )
    `)
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching items:", error);
    return [];
  }

  return data || [];
};

// Fetch all units
export const fetchUnits = async (): Promise<Unit[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("unit")
    .select("*")
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching units:", error);
    return [];
  }

  return data || [];
};

// Fetch all specifications
export const fetchSpecs = async (): Promise<Spec[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("specs")
    .select("*")
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching specs:", error);
    return [];
  }

  return data || [];
};

// Fetch all responsibility centers
export const fetchResponsibilityCenters = async (): Promise<ResponsibilityCenter[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .from("responsibility_center")
    .select("*")
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching responsibility centers:", error);
    return [];
  }

  return data || [];
};

// Fetch responsibility center sections by rc_id
export const fetchResponsibilityCenterSections = async (rc_id?: string): Promise<ResponsibilityCenterSection[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  let query = (supabase as NonNullable<typeof supabase>)
    .from("responsibility_center_section")
    .select("*")
    .eq("is_active", true)
    .order("description");

  if (rc_id) {
    query = query.eq("rc_id", rc_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching responsibility center sections:", error);
    return [];
  }

  return data || [];
};

// Fetch item specifications
export const fetchItemSpecs = async (i_id: string): Promise<ItemSpec[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("item_spec")
    .select(`
      *,
      spec:s_id ( * )
    `)
    .eq("i_id", i_id);

  if (error) {
    console.error("Error fetching item specs:", error);
    return [];
  }

  return data || [];
};

// Create new purchase request
export const createPurchaseRequest = async (
  data: PurchaseRequestFormData
): Promise<{ success: boolean; pr_id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  const { data: result, error } = await (
    supabase as NonNullable<typeof supabase>
  )
    .schema("gse")
    .from("purchase_request")
    .insert({
      ...data,
      status: "DRAFT",
      pr_total_amount: 0,
    })
    .select("pr_id")
    .single();

  if (error) {
    console.error("Error creating purchase request:", error);
    return { success: false, error: error.message };
  }

  return { success: true, pr_id: result.pr_id };
};

// Update purchase request
export const updatePurchaseRequest = async (
  pr_id: string,
  data: Partial<PurchaseRequestFormData>
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .update(data)
    .eq("pr_id", pr_id);

  if (error) {
    console.error("Error updating purchase request:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Add item to purchase request
export const addPurchaseRequestItem = async (
  pr_id: string,
  item: PurchaseRequestListFormData
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .insert({
      pr_id,
      ...item,
    });

  if (error) {
    console.error("Error adding purchase request item:", error);
    return { success: false, error: error.message };
  }

  // Update total amount
  await updatePurchaseRequestTotal(pr_id);

  return { success: true };
};

// Delete purchase request item
export const deletePurchaseRequestItem = async (
  prl_id: string,
  pr_id: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .delete()
    .eq("prl_id", prl_id);

  if (error) {
    console.error("Error deleting purchase request item:", error);
    return { success: false, error: error.message };
  }

  // Update total amount
  await updatePurchaseRequestTotal(pr_id);

  return { success: true };
};

// Update purchase request total amount
const updatePurchaseRequestTotal = async (pr_id: string): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) return;

  const { data } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request_list")
    .select("prl_total_amount_estimated")
    .eq("pr_id", pr_id);

  if (data) {
    const total = data.reduce(
      (sum, item) => sum + (item.prl_total_amount_estimated || 0),
      0
    );

    await (supabase as NonNullable<typeof supabase>)
      .schema("gse")
      .from("purchase_request")
      .update({ pr_total_amount: total })
      .eq("pr_id", pr_id);
  }
};

// Generate next PR number
export const generatePRNumber = async (): Promise<string> => {
  if (!isSupabaseConfigured() || !supabase) {
    return `PR-${new Date().getFullYear()}-0001`;
  }

  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("gse")
    .from("purchase_request")
    .select("pr_no")
    .like("pr_no", `${prefix}%`)
    .order("pr_no", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(data[0].pr_no.split("-")[2] || "0");
  const nextNumber = (lastNumber + 1).toString().padStart(4, "0");

  return `${prefix}${nextNumber}`;
};
