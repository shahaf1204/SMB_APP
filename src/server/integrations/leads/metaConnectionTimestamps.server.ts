import { getSupabaseAdminOptional } from '../../core/supabase.server';

/** Updates last_lead_received_at for a Meta connection after successful lead ingestion. */
export async function touchMetaConnectionLastLeadReceived(
  connectionId: string,
  at: string,
): Promise<void> {
  const supabase = getSupabaseAdminOptional();
  if (!supabase) return;

  await supabase
    .from('meta_connections')
    .update({ last_lead_received_at: at, updated_at: at })
    .eq('id', connectionId);
}
