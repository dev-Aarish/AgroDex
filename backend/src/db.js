import { createClient } from '@supabase/supabase-js';
import { env } from './utils/config.js';

// Initialize Supabase client with service role key for server-side trusted operations
// ✅ Uses SUPABASE_SERVICE_ROLE_KEY (not anon key) for all backend writes
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Insert batch record into database
 * @param {Object} batchData - Batch data to insert
 * @returns {Promise<Object>} Inserted record
 */
export async function insertBatch(batchData) {
  const { data, error } = await supabase
    .from('batches')
    .insert([batchData])
    .select()
    .single();

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`);
  }

  return data;
}

/**
 * Insert token record into database
 * @param {Object} tokenData - Token data to insert
 * @returns {Promise<Object>} Inserted record
 */
export async function insertToken(tokenData) {
  const { data, error } = await supabase
    .from('tokens')
    .insert([tokenData])
    .select()
    .single();

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`);
  }

  return data;
}

/**
 * Insert or update verification record
 * @param {Object} verificationData - Verification data
 * @returns {Promise<Object>} Inserted/updated record
 */
export async function upsertVerification(verificationData) {
  const { data, error } = await supabase
    .from('verifications')
    .upsert([verificationData], {
      onConflict: 'token_id,serial_number'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Database upsert failed: ${error.message}`);
  }

  return data;
}

/**
 * Get verification by token ID and serial number
 * @param {string} tokenId - Token ID
 * @param {string} serialNumber - Serial number
 * @returns {Promise<Object|null>} Verification record or null
 */
export async function getVerification(tokenId, serialNumber) {
  const { data, error } = await supabase
    .from('verifications')
    .select('*')
    .eq('token_id', tokenId)
    .eq('serial_number', serialNumber);

  console.log("VERIFICATION ROWS:", data?.length);

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  return data?.[0] || null;
}

/**
 * Get token by token ID and serial number
 * @param {string} tokenId - Token ID
 * @param {string} serialNumber - Serial number
 * @returns {Promise<Object|null>} Token record or null
 */
export async function getToken(tokenId, serialNumber) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('token_id', tokenId)
    .eq('serial_number', serialNumber);

  console.log("TOKEN ROWS:", data?.length);

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  return data?.[0] || null;
}
