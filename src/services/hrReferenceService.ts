/**
 * hrReferenceService.ts
 * Reference / lookup data + Plantilla position management.
 * Covers: hr.office, hr.position, hr.salary_rate, hr.rate, hr.pos_type
 */
import { supabase, isSupabaseConfigured } from "./supabase";

// =============================================================================
// Interfaces
// =============================================================================

export interface Office {
  id: string;
  description: string;
}

export interface Position {
  id: string;
  description: string;
  item_no: string;
}

export interface SalaryRate {
  id: string;
  description: string;
  sg_number: number | null;
  step: number | null;
  amount: number;
  is_perday: boolean;
}

export interface RateRow {
  id: string;
  description: string;
  amount: number;
  sg_number: number | null;
  step: number | null;
}

export interface PositionType {
  id: string;
  description: string;
}

export interface PlantillaPositionFormData {
  item_no: string;
  description: string;
  sr_id: string;
  pt_id: string;
  o_id: string;
  authorization: string;
  /** DBM fund source: GF, SEF, LDRRMF, SHF, DEVFUND, TRUST */
  funding_source?: string;
  slots?: number;
}

export interface UnassignedPersonnel {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  employment_status: string | null;
}

export interface PositionForDialog {
  id: string;
  description: string;
  item_no: string;
  o_id: string | null;
  monthly_salary: number;
}

// =============================================================================
// Reference fetchers
// =============================================================================

/**
 * Fetch all offices from hr.office table
 */
export const fetchOffices = async (): Promise<Office[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("office")
    .select("id, description")
    .order("description");

  if (error) {
    console.error("Error fetching offices:", error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all positions from hr.position table
 */
export const fetchPositions = async (): Promise<Position[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .select("id, description, item_no")
    .order("description");

  if (error) {
    console.error("Error fetching positions:", error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all salary rates from hr.salary_rate table
 */
export const fetchSalaryRates = async (): Promise<SalaryRate[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("salary_rate")
    .select(
      "id, description, is_perday, rate:rate_id ( amount, sg_number, step )",
    )
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching salary rates:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const rate = Array.isArray(row.rate) ? row.rate[0] : row.rate;
    return {
      id: row.id as string,
      description: row.description as string,
      sg_number:
        ((rate as Record<string, unknown>)?.sg_number as number | null) ?? null,
      step: ((rate as Record<string, unknown>)?.step as number | null) ?? null,
      amount: Number((rate as Record<string, unknown>)?.amount ?? 0),
      is_perday: row.is_perday as boolean,
    };
  });
};

/**
 * Fetch all rows from hr.rate (the raw amount table)
 */
export const fetchRates = async (): Promise<RateRow[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("rate")
    .select("id, description, amount, sg_number, step")
    .order("sg_number")
    .order("step");

  if (error) {
    console.error("Error fetching rates:", error);
    return [];
  }

  return (data || []).map((r) => ({
    id: r.id as string,
    description: r.description as string,
    amount: Number(r.amount),
    sg_number: r.sg_number as number | null,
    step: r.step as number | null,
  }));
};

/**
 * Update a rate amount in hr.rate
 */
export const updateRate = async (
  id: string,
  amount: number,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("rate")
    .update({ amount })
    .eq("id", id);

  if (error) {
    console.error("Error updating rate:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Fetch all position types from hr.pos_type table
 */
export const fetchPositionTypes = async (): Promise<PositionType[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("pos_type")
    .select("id, description")
    .order("description");

  if (error) {
    console.error("Error fetching position types:", error);
    return [];
  }

  return data || [];
};

// =============================================================================
// Plantilla position CRUD
// =============================================================================

/**
 * Parse an item_no like "MO-003" into { prefix: "MO", num: 3, padLength: 3 }.
 * Returns null if the format doesn't match.
 */
const parseItemNo = (itemNo: string) => {
  const lastDash = itemNo.lastIndexOf("-");
  if (lastDash === -1) return null;
  const prefix = itemNo.substring(0, lastDash);
  const numStr = itemNo.substring(lastDash + 1);
  const num = parseInt(numStr, 10);
  if (isNaN(num) || !prefix) return null;
  return { prefix, num, padLength: numStr.length };
};

/**
 * Create one or more positions in hr.position table.
 * When slots > 1, auto-generates sequential item numbers from the base item_no.
 */
export const createPosition = async (
  positionData: PlantillaPositionFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const slots = positionData.slots ?? 1;
  const { slots: _, ...baseData } = positionData;
  void _;

  // Convert empty string to undefined so it doesn't violate the CHECK constraint
  // CHECK (funding_source IS NULL OR funding_source IN ('GF','SEF',...))
  const cleanedBase = {
    ...baseData,
    funding_source: baseData.funding_source || undefined,
  };

  const rows: Omit<PlantillaPositionFormData, "slots">[] = [];

  if (slots <= 1) {
    rows.push(cleanedBase);
  } else {
    const parsed = parseItemNo(cleanedBase.item_no);
    if (!parsed) {
      return {
        success: false,
        error:
          "Item No. must follow the format PREFIX-NUMBER (e.g., MO-001) when creating multiple slots.",
      };
    }
    for (let i = 0; i < slots; i++) {
      const seq = String(parsed.num + i).padStart(parsed.padLength, "0");
      rows.push({ ...cleanedBase, item_no: `${parsed.prefix}-${seq}` });
    }
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .insert(rows);

  if (error) {
    console.error("Error creating position:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update an existing position in hr.position table
 */
export const updatePosition = async (
  id: string,
  positionData: Partial<PlantillaPositionFormData>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  // Prevent empty string from violating the funding_source CHECK constraint
  const cleaned: Partial<PlantillaPositionFormData> =
    "funding_source" in positionData
      ? {
          ...positionData,
          funding_source: positionData.funding_source || undefined,
        }
      : positionData;

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .update(cleaned)
    .eq("id", id);

  if (error) {
    console.error("Error updating position:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete a position from hr.position table
 */
export const deletePosition = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting position:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Assign a personnel record to a plantilla position.
 * Sets personnel.pos_id which triggers trg_sync_position_is_filled
 * to automatically mark the position as filled. Never directly
 * write to hr.position.is_filled — the trigger owns that column.
 */
export const assignEmployeeToPosition = async (
  positionId: string,
  personnelId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .update({ pos_id: positionId })
    .eq("id", personnelId);

  if (error) {
    console.error("Error assigning employee to position:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Remove a personnel record from their current plantilla position.
 * Sets personnel.pos_id = null which triggers trg_sync_position_is_filled
 * to automatically mark the position as vacant.
 */
export const unassignEmployeeFromPosition = async (
  personnelId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .update({ pos_id: null })
    .eq("id", personnelId);

  if (error) {
    console.error("Error unassigning employee from position:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Fetch active personnel who have no position assigned (pos_id IS NULL).
 * Used to populate the Assign Employee dialog's selection list.
 */
export const fetchUnassignedPersonnel = async (): Promise<
  UnassignedPersonnel[]
> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .select("id, first_name, last_name, middle_name, employment_status")
    .is("pos_id", null)
    .eq("is_active", true)
    .order("last_name");

  if (error) {
    console.error("Error fetching unassigned personnel:", error);
    return [];
  }

  return (data as UnassignedPersonnel[]) || [];
};

/**
 * Fetch active positions with their monthly salary amount.
 * Used to pre-populate the Service Record dialog's position dropdown.
 */
export const fetchPositionsForDialog = async (): Promise<
  PositionForDialog[]
> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .select(
      "id, description, item_no, o_id, salary_rate:sr_id( rate:rate_id( amount ) )",
    )
    .eq("is_active", true)
    .order("item_no");

  if (error) {
    console.error("Error fetching positions for dialog:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const sr = row.salary_rate as
      | { rate: { amount: number } | { amount: number }[] | null }
      | { rate: { amount: number } | { amount: number }[] | null }[]
      | null;
    const srObj = Array.isArray(sr) ? sr[0] : sr;
    const rate = srObj?.rate;
    const rateObj = Array.isArray(rate) ? rate[0] : rate;
    return {
      id: row.id as string,
      description: row.description as string,
      item_no: row.item_no as string,
      o_id: (row.o_id as string) || null,
      monthly_salary: Number(rateObj?.amount) || 0,
    };
  });
};
