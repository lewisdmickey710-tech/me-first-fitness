-- The community board is the first place a client's own content becomes
-- visible to other clients, not just the coach -- that's a real change to
-- what "private" means in this app, so it gets its own signed agreement
-- rather than being folded into the general contract/disclaimer. Assigned
-- to everyone (shows up in their regular Documents list like the other
-- core documents) and gated in front of the community board itself in
-- /client/community -- a client can't post or read the feed until they've
-- signed it.

alter table public.legal_documents
  drop constraint legal_documents_key_check,
  add constraint legal_documents_key_check
    check (key in ('contract', 'onboarding_form', 'disclaimer', 'minor_consent', 'community_agreement'));

insert into public.legal_documents (key, title, body, version, requires_signature, assigned_to_all)
values (
  'community_agreement',
  'Community Board Agreement & Privacy Notice',
  $t$## 1. What This Is

MeFirstFitness's community board is an optional shared space where clients can post wins, questions, progress photos, or anything else — and support each other. Participation is entirely optional. Nothing you track privately in the app (your progress photos, measurements, check-ins, nutrition logs, symptom logs, etc.) is ever shared here automatically — posting to the community is always a separate, deliberate choice.

## 2. What Other Clients Can See

Anything you post — text, photos, and comments — is visible to every other client using this app, not just Mickey. Your name is shown next to what you post. Before you post anything, assume any other client coached by Mickey could see it.

## 3. Think Before You Share

Only share what you're comfortable with other clients seeing. If a post mentions a health condition, injury, medication, or anything else personal, that detail becomes visible to the whole community, not just Mickey. When in doubt, keep specifics of your health history to your private conversations with Mickey instead.

## 4. Not Medical or Professional Advice

Anything another client posts or comments — encouragement, suggestions, their own experience — is peer support, not professional guidance. It doesn't replace Mickey's coaching, and Mickey isn't responsible for advice or opinions other clients share.

## 5. Community Guidelines

- Be kind and encouraging — this is a space to lift each other up.
- No harassment, discrimination, or personal attacks.
- No soliciting, selling, or promoting outside businesses or services.
- No sharing another person's photo, story, or information without their okay.

## 6. Moderation

Mickey can view every post and comment and may remove anything that doesn't fit these guidelines, for any reason, at her discretion. Repeated issues may result in the community board being turned off for that client.

## 7. Your Posts Stay Up Until Removed

A post or comment you make stays visible to the community until you delete it yourself or Mickey removes it. Leaving the program doesn't automatically remove past posts — reach out to Mickey if you'd like something taken down.

## 8. You Can Opt Out Anytime

You're never required to use the community board. Not posting doesn't affect your program, sessions, or coaching relationship in any way.

## Client Acknowledgment

By signing below, I understand that anything I post to the community board — text, photos, and comments — is visible to other clients coached by Mickey, not just Mickey herself. I agree to follow the community guidelines above and understand I'm responsible for what I choose to share.$t$,
  1,
  true,
  true
)
on conflict (key) do nothing;
