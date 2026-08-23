import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import {
  addCommunityComment,
  addCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  toggleCommunityReaction,
} from "@/app/client/community/actions";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heart,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { toDateString } from "@/lib/timezone";
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

export default async function ClientCommunityPage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

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

  const today = toDateString(new Date());

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Community
        </h1>
        <p className="mt-1 text-sm text-gray">
          A shared space for everyone Mickey coaches — post a win, a
          question, a progress photo, or whatever&apos;s on your mind.
          Totally optional, and separate from anything you track privately.
        </p>
      </div>

      <Card>
        <form action={addCommunityPost} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              What kind of post is this?
            </label>
            <Select name="kind" defaultValue="general">
              <option value="win">Win</option>
              <option value="question">Question</option>
              <option value="progress">Progress photo</option>
              <option value="general">General</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Share something
            </label>
            <Textarea name="body" rows={3} placeholder="Optional if you're just posting a photo" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Photo{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
            />
          </div>
          <Button type="submit">Post</Button>
        </form>
      </Card>

      {(posts ?? []).length === 0 ? (
        <EmptyState
          title="Nothing posted yet"
          body="Be the first — a win, a question, anything at all."
        />
      ) : (
        <div className="space-y-4">
          {posts!.map((p) => {
            const postComments = commentsByPost.get(p.id) ?? [];
            const postReactions = reactionsByPost.get(p.id) ?? [];
            const iReacted = postReactions.some((r) => r.client_id === me.id);
            const isMine = p.client_id === me.id;
            return (
              <Card key={p.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">
                      {clientNameById.get(p.client_id) ?? "A client"}
                    </p>
                    <p className="text-xs text-gray">
                      {p.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <Badge tone={KIND_TONE[p.kind]}>{KIND_LABEL[p.kind]}</Badge>
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

                <div className="flex items-center gap-3 border-t border-grayLt pt-3">
                  <form
                    action={async () => {
                      "use server";
                      await toggleCommunityReaction(p.id);
                    }}
                  >
                    <button
                      type="submit"
                      className={`flex items-center gap-1 text-sm ${
                        iReacted ? "text-rose" : "text-gray hover:text-rose"
                      }`}
                    >
                      <Heart /> {postReactions.length > 0 ? postReactions.length : "Support"}
                    </button>
                  </form>
                  {isMine ? (
                    <form
                      action={async () => {
                        "use server";
                        await deleteCommunityPost(p.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-gray hover:text-pink"
                      >
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>

                {postComments.length > 0 ? (
                  <div className="space-y-2 border-t border-grayLt pt-3">
                    {postComments.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2">
                        <p className="text-sm text-ink">
                          <span className="font-medium">
                            {c.author_role === "coach"
                              ? "Mickey"
                              : clientNameById.get(c.client_id ?? "") ?? "A client"}
                          </span>{" "}
                          {c.body}
                        </p>
                        {c.client_id === me.id ? (
                          <form
                            action={async () => {
                              "use server";
                              await deleteCommunityComment(c.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="shrink-0 text-xs text-gray hover:text-pink"
                            >
                              Delete
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await addCommunityComment(p.id, formData);
                  }}
                  className="flex items-center gap-2 border-t border-grayLt pt-3"
                >
                  <input type="hidden" name="date" value={today} />
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
