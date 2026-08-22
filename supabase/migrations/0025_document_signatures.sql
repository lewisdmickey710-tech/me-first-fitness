-- Upgrades legal_documents from "type text into a plain box, check a box"
-- to a real fillable/signable document: a light markup convention (##
-- headings, - bullets, **bold**) so bodies render with real structure
-- instead of one flat paragraph, and a typed full-legal-name signature on
-- documents that need one (a welcome letter doesn't need signing, a
-- contract does).
--
-- Also replaces the 'contract' and 'onboarding_form' placeholder bodies
-- with real text, transcribed directly from Mickey's actual
-- MeFirstFitness_Onboarding_Package.pdf (Welcome Letter + Client Services
-- Agreement). The Health & Lifestyle Questionnaire section of that same
-- PDF is not duplicated here -- it's already covered by the lead/client
-- intake questionnaire built earlier. The 'disclaimer' document is left
-- as-is (still placeholder-flagged): the real onboarding package doesn't
-- have a separate standalone waiver document -- the nutritional/results
-- disclaimer language lives inside the Client Services Agreement itself
-- (sections 6 and 7 below) -- so real content for a standalone disclaimer
-- doc still needs to come from Mickey if she wants one kept.

alter table public.legal_documents
  add column if not exists requires_signature boolean not null default true;

alter table public.client_document_acknowledgments
  add column if not exists signed_name text;

update public.legal_documents set
  title = 'Welcome Letter',
  requires_signature = false,
  version = version + 1,
  updated_at = now(),
  body = $t$Welcome to MeFirstFitness — I am so honored you chose to invest in yourself.

My name is Mickey, and I am the founder, coach, and nutritionist behind MeFirstFitness — Mind & Muscle Mechanics. Everything I do here is built around one belief: that you deserve to feel strong, capable, and at home in your body — not punished into it.

## What We Do Together

Our work together is rooted in NASM-based strength and movement coaching paired with Intuitive Eating nutritional guidance. We train with purpose and intention — not obsession. We build real strength through four progressive phases: Stability, Strength, Size, and Speed. My certifications include Pain-Free Movement, Glute Development, Behavior Change, Senior Fitness, Bodybuilding, Strength and Conditioning, and Nutrition — so wherever you are starting, I have the training to meet you there.

## What Intuitive Eating Means Here

I am a certified nutritionist with a deep commitment to helping clients heal their relationship with food. We will not count calories, assign guilt to meals, or talk about food as something to earn or burn. Instead we will build body awareness, trust your hunger and fullness cues, and find what truly nourishes you.

## How Sessions Work

Sessions can be in-person ($40) or virtual ($25). In-person sessions include hands-on support like assisted stretching, foam rolling, and Theragun work. Virtual sessions include form coaching, programming, and nutrition support. Standalone written programs are also available for $50.

## What I Need From You

Honesty. Show up as you are. Tell me when something hurts, when life gets hard, when motivation dips. I am not here to judge — I am here to adjust, support, and keep you moving forward. The only bad session is the one we do not talk about.

## This Packet

Inside the app you'll find your Health & Lifestyle Questionnaire (under Intake) and your Client Services Agreement (below, under Contract & documents). Please complete both fully and honestly before your first session. They help me build a program that is truly yours.

I am genuinely excited to work with you. Let us build something that lasts.

With care and intention,
Mickey
MeFirstFitness — Mind & Muscle Mechanics
(682) 430-6093 · mickey.mefirstfitness@gmail.com$t$
where key = 'onboarding_form';

update public.legal_documents set
  title = 'Client Services Agreement',
  requires_signature = true,
  version = version + 1,
  updated_at = now(),
  body = $t$## Parties

This Client Services Agreement ("Agreement") is entered into between:

**Service Provider:** Mickey, MeFirstFitness — Mind & Muscle Mechanics, sole proprietor, Texas

**Client:** as signed below

## 1. Services Provided

- NASM-based personal training — Stability, Strength, Size, and Speed phases
- Certified specializations: Pain-Free Movement, Glute Development, Behavior Change, Senior Fitness, Bodybuilding, Strength & Conditioning, and Nutrition
- Intuitive Eating nutritional coaching (certified nutritionist)
- Custom 3-day workout programming per phase with superset options
- In-person only: assisted stretching, foam rolling, Theragun therapy
- Virtual: form coaching, programming, nutrition support
- Standalone written program available without sessions ($50)

## 2. Rates & Payment

- In-Person Session: $40 / session
- Virtual Session: $25 / session
- Standalone Written Plan: $50 (no sessions)

Payment schedule is either pay-as-you-go (each session) or monthly client (1 guaranteed reschedule per month) — as set on your profile. Payment is due at time of service via Cash, Cash App, or Zelle.

## 3. Cancellation Policy

Please provide at least 12 hours notice to cancel or reschedule. Monthly clients receive one guaranteed reschedule per month.

First late cancellation (under 12 hrs): noted, no penalty. Second late cancellation: client chooses — Option A: reschedule at a mutually agreed time; Option B: convert to monthly; Option C: +$5/session surcharge if already monthly.

## 4. No-Show Policy

Clients who do not show and do not contact Mickey will be logged. Repeated no-shows may result in termination of the coaching relationship at Mickey's discretion.

## 5. Health & Safety

Client agrees to disclose all relevant health conditions, injuries, and medications before training and to inform Mickey immediately of any changes. Mickey reserves the right to modify or pause a session if safety is a concern.

## 6. Nutritional Disclaimer

Nutritional coaching provided by Mickey is based on Intuitive Eating principles and general wellness education. This is not medical nutrition therapy and does not replace advice from a licensed dietitian, physician, or mental health provider. Clients with eating disorder history are encouraged to maintain concurrent professional support.

## 7. Results Disclaimer

MeFirstFitness does not guarantee specific physical results. Results depend on individual effort, consistency, health status, and adherence. Mickey is committed to high-quality, evidence-informed coaching.

## 8. Confidentiality

All client information — health history, session notes, nutrition records, and personal communications — is strictly confidential and will not be shared without written consent, except as required by law.

## 9. Photos & Testimonials

Progress photos and testimonials will not be used publicly without explicit written consent. A separate Media Release Form will be provided if applicable.

## 10. Termination

Either party may terminate this Agreement with reasonable notice. Amounts owed for completed sessions remain due. A Training Cancellation Notice will be completed upon termination.

## 11. Governing Law

This Agreement is governed by the laws of the State of Texas. Any disputes shall be resolved in the county of the coach's principal place of business.

## Client Acknowledgment

By signing below, I confirm that I have read, understood, and agree to all terms of this Client Services Agreement. I understand that my health and safety are a shared responsibility and I commit to honest and open communication with my coach, Mickey, throughout our work together.$t$
where key = 'contract';

update public.legal_documents set requires_signature = true where key = 'minor_consent';
