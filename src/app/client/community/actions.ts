"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { safeFileName } from "@/lib/storage";

export async function addCommunityPost(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const kind = String(formData.get("kind") ?? "general");
  const body = String(formData.get("body") ?? "").trim();
  const photo = formData.get("photo");

  const supabase = await createClient();

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const path = `${me.id}/community-${crypto.randomUUID()}-${safeFileName(photo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("form-checks")
      .upload(path, photo, { contentType: photo.type });
    if (uploadError) throw new Error(uploadError.message);
    photoPath = path;
  }

  if (!body && !photoPath) {
    throw new Error("Add a photo or a few words before posting.");
  }

  const { error } = await supabase.from("community_posts").insert({
    client_id: me.id,
    kind,
    body: body || null,
    photo_path: photoPath,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/client/community");
  revalidatePath("/coach/community");
}

export async function deleteCommunityPost(postId: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("client_id", me.id);
  if (error) throw new Error(error.message);

  revalidatePath("/client/community");
  revalidatePath("/coach/community");
}

export async function addCommunityComment(postId: string, formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Comment can't be empty.");

  const supabase = await createClient();
  const { error } = await supabase.from("community_post_comments").insert({
    post_id: postId,
    client_id: me.id,
    author_role: "client",
    body,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/client/community");
  revalidatePath("/coach/community");
}

export async function deleteCommunityComment(commentId: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_post_comments")
    .delete()
    .eq("id", commentId)
    .eq("client_id", me.id);
  if (error) throw new Error(error.message);

  revalidatePath("/client/community");
  revalidatePath("/coach/community");
}

export async function toggleCommunityReaction(postId: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("client_id", me.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("community_post_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("community_post_reactions")
      .insert({ post_id: postId, client_id: me.id });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/client/community");
  revalidatePath("/coach/community");
}
