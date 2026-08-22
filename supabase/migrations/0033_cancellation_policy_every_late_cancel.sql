-- Section 3 previously only spelled out what happens on the *second* late
-- cancellation. The app has always charged the $10 fee on every late
-- cancellation from the second onward within the 16-week window (not just
-- the second one specifically) -- the contract language just hadn't caught
-- up. Firms up the wording without changing tone.
update public.legal_documents set
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

Please provide at least 12 hours notice to cancel or reschedule a session, through the app. Monthly clients receive one guaranteed reschedule per month at no cost, regardless of notice given.

Cancelling with less than 12 hours notice counts as a late cancellation. Your first late cancellation within a rolling 16-week period (matching a training cycle) is simply noted, no charge. From the second late cancellation onward within that same 16-week window, a flat $10 fee applies each time, and upcoming sessions are paused until the fee is marked paid. The 16-week window resets after each late cancellation.

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
