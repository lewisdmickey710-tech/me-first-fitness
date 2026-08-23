import { createClient } from "@/lib/supabase/server";
import {
  addCommunityCommentAsCoach,
  deleteCommunityCommentAsCoach,
  deleteCommunityPostAsCoach,
} from "@/app/coach/actions";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heart,
  Input,
} from "@/components/ui";
import type {
  CommunityPost,
  CommunityPostComment,
  CommunityPostReaction,
} from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  win: "Win",
  question: "Question",
  progress: "Progress photo",
  general: "General",
};

const KIND_TONE: Record<string, "gold" | "teal" | "rose" | "gray"> = {
  win: "gold",
  question: "teal",
  progress: "rose",
  general: "gray",
};

export default async function CoachCommunityPage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: comments }, { data: reactions }, { data: allClients }] =
    await Promise.all([
      supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false }) as unknown as Promise<{
        data: CommunityPost[] | null;
      }>,
      supabase
        .from("community_post_comments")
        .select("*")
        .order("created_at", { ascending: true }) as unknown as Promise<{
        data: CommunityPostComment[] | null;
      }>,
      supabase.from("community_post_reactions").select("*") as unknown as Promise<{
        data: CommunityPostReaction[] | null;
      }>,
      supabase.from("clients").select("id, name") as unknown as Promise<{
        data: { id: string; name: string }[] | null;
      }>,
    ]);

  const clientNameById = new Map((allClients ?? []).map((c) => [c.id, c.name]));

  const photoUrlByPath = new Map<string, string>();
  const photoPaths = [
    ...new Set((posts ?? []).map((p) => p.photo_path).filter(Boolean)),
  ] as string[];
  if (photoPaths.length > 0) {
    await Promise.all(
      photoPaths.map(async (path) => {
        const { data } = await supabase.storage
          .from("form-checks")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) photoUrlByPath.set(path, data.signedUrl);
      })
    );
  }

  const commentsByPost = new Map<string, CommunityPostComment[]>();
  for (const c of comments ?? []) {
    commentsByPost.set(c.post_id, [...(commentsByPost.get(c.post_id) ?? []), c]);
  }

  const reactionsByPost = new Map<string, CommunityPostReaction[]>();
  for (const r of reactions ?? []) {
    reactionsByPost.set(r.post_id, [...(reactionsByPost.get(r.post_id) ?? []), r]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Community
        </h1>
        <p className="mt-1 text-sm text-gray">
          What clients are posting to each other. You can jump into the
          comments, or remove anything that shouldn&apos;t be here.
        </p>
      </div>

      {(posts ?? []).length === 0 ? (
        <EmptyState
          title="Nothing posted yet"
          body="Once a client posts a win, a question, or a photo, it'll show up here."
        />
      ) : (
        <div className="space-y-4">
          {posts!.map((p) => {
            const postComments = commentsByPost.get(p.id) ?? [];
            const postReactions = reactionsByPost.get(p.id) ?? [];
            return (
              <Card key={p.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">
                      {clientNameById.get(p.client_id) ?? "A client"}
                    </p>
                    <p className="text-xs text-gray">{p.created_at.slice(0, 10)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={KIND_TONE[p.kind]}>{KIND_LABEL[p.kind]}</Badge>
                    <form
                      action={async () => {
                        "use server";
                        await deleteCommunityPostAsCoach(p.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-gray hover:text-pink"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>

                {p.body ? <p className="text-sm text-ink">{p.body}</p> : null}
                {p.photo_path && photoUrlByPath.has(p.photo_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrlByPath.get(p.photo_path)}
                    alt="Post photo"
                    className="max-h-96 w-full rounded-xl object-cover"
                  />
                ) : null}

                {postReactions.length > 0 ? (
                  <p className="flex items-center gap-1 text-sm text-gray">
                    <Heart /> {postReactions.length} support
                  </p>
                ) : null}

                {postComments.length > 0 ? (
                  <div className="space-y-2 border-t border-grayLt pt-3">
                    {postComments.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2">
                        <p className="text-sm text-ink">
                          <span className="font-medium">
                            {c.author_role === "coach"
                              ? "You"
                              : clientNameById.get(c.client_id ?? "") ?? "A client"}
                          </span>{" "}
                          {c.body}
                        </p>
                        <form
                          action={async () => {
                            "use server";
                            await deleteCommunityCommentAsCoach(c.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="shrink-0 text-xs text-gray hover:text-pink"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : null}

                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await addCommunityCommentAsCoach(p.id, formData);
                  }}
                  className="flex items-center gap-2 border-t border-grayLt pt-3"
                >
                  <Input name="body" placeholder="Add a comment" className="flex-1" />
                  <Button type="submit" variant="secondary">
                    Send
                  </Button>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
