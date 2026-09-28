import { createClient } from "@/lib/supabase/client";
import { safeFileName } from "@/lib/storage";

// Vercel caps a server action's request body at 4.5MB -- a platform
// limit, not something next.config can raise -- well under a real
// phone photo/video. Uploading straight from the browser to Supabase
// Storage (which only enforces the form-checks bucket's own 50MB
// limit) sidesteps that entirely; only the resulting path, a short
// string, needs to travel through the server action afterward.
export async function uploadFormCheckFile(
  clientId: string,
  prefix: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const path = `${clientId}/${prefix}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
  // Some mobile browsers (iOS Safari especially, with an iCloud-synced
  // photo not yet fully local) can hand supabase-js a File whose stream
  // reads as empty by the time the upload request is built, which the
  // storage API rejects with "No content provided" even though the file
  // picker showed a normal thumbnail. Reading it into an ArrayBuffer here,
  // where the browser has already fully materialized the bytes, avoids
  // relying on the File's own (sometimes flaky) stream at upload time.
  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("form-checks")
    .upload(path, bytes, { contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}
