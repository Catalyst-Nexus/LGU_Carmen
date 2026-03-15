/**
 * hrTimekeepingService.ts
 * Time slot schedules and time record (DTR) management.
 * Covers: hr.time_slot_schedule, hr.time_record
 */
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import type { TimeSlotSchedule } from "@/types/hr.types";

// Re-export so consumers can import TimeSlotSchedule from here if needed
export type { TimeSlotSchedule };

// =============================================================================
// Time Slot Schedule CRUD
// =============================================================================

/**
 * Fetch all active time slot schedules
 */
export const fetchTimeSlotSchedules = async (): Promise<TimeSlotSchedule[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_slot_schedule")
    .select("*")
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching time slot schedules:", error);
    return [];
  }

  return data || [];
};

/**
 * Create a new time slot schedule
 */
export const createTimeSlotSchedule = async (
  slot: Omit<TimeSlotSchedule, "id" | "created_at">,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_slot_schedule")
    .insert([slot]);

  if (error) {
    console.error("Error creating time slot schedule:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update a time slot schedule
 */
export const updateTimeSlotSchedule = async (
  id: string,
  slot: Partial<Omit<TimeSlotSchedule, "id" | "created_at">>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_slot_schedule")
    .update(slot)
    .eq("id", id);

  if (error) {
    console.error("Error updating time slot schedule:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Soft-deactivate a time slot schedule
 */
export const deleteTimeSlotSchedule = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_slot_schedule")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting time slot schedule:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// =============================================================================
// Time Record (DTR)
// =============================================================================

/**
 * Insert a time record (IN or OUT) for an employee.
 * When time_identifier=2 (OUT), the DB trigger will auto-calculate total_hours.
 */
export const insertTimeRecord = async (params: {
  per_id: string;
  date: string;
  time_slot_id: string;
  time_identifier: 1 | 2;
  time: string; // HH:mm format
}): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const row: Record<string, unknown> = {
    per_id: params.per_id,
    date: params.date,
    time_slot_id: params.time_slot_id,
    time_identifier: params.time_identifier,
  };

  if (params.time_identifier === 1) {
    row.in = params.time;
  } else {
    row.out = params.time;
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_record")
    .insert([row]);

  if (error) {
    console.error("Error inserting time record:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};
