-- Replaces the placeholder 'disclaimer' document with a real, complete
-- liability waiver, written directly from Mickey's own terms. Bumping
-- the version means any client who already "signed" the old placeholder
-- text is no longer considered acknowledged for this document -- they'll
-- be prompted to read and sign the real thing next time they open
-- Documents, which is the correct behavior for a genuine content change.

update public.legal_documents set
  title = 'Liability Waiver & Release',
  requires_signature = true,
  version = version + 1,
  updated_at = now(),
  body = $t$## 1. Sole Proprietor

MeFirstFitness — Mind & Muscle Mechanics is operated by Mickey as a sole proprietor. There is no gym, studio, or other facility involved — sessions use Mickey's own personal training equipment, whether held in-person or virtually.

## 2. Assumption of Risk

Physical exercise carries an inherent risk of injury. By participating in any session, you acknowledge that risk and confirm that you are responsible for your own safety throughout.

## 3. Release of Liability

Neither Mickey nor the property she resides at (The Oxford at Iron Horse) is liable for any injury to your body or damage to your property arising from your participation in training — except where that injury or damage is a direct result of Mickey's specific instruction or conduct. In that case, and only that case, Mickey accepts responsibility. The owners, management, and staff of The Oxford at Iron Horse are never responsible for anything arising from your training relationship with Mickey, under any circumstances.

## 4. Personal Equipment

Sessions use Mickey's own personal equipment. Any damage to that equipment caused by the client during a session is the client's responsibility.

## 5. Communication Is Your Responsibility

Mickey cannot feel what is happening in your body. You are responsible for communicating your limits, discomfort, pain, or anything else you're feeling, in real time, throughout every session. If an instruction or exercise feels beyond your current ability, it is your responsibility to know your own body and speak up — Mickey will adjust, but only if she knows.

## 6. Programs Are Guidance, Not Orders

Any program, exercise, or instruction Mickey provides — written or verbal — is guidance and a roadmap, not a command you're obligated to follow exactly as given. You are always free to modify, stop, or decline any part of a session based on how your body feels.

## Client Acknowledgment

By signing below, I confirm I have read and understood this Liability Waiver & Release. I understand physical training carries inherent risk, that I am responsible for my own safety and for communicating my limits honestly and in real time, and that neither Mickey nor The Oxford at Iron Horse is liable for injury or damage except where it directly results from Mickey's specific instruction or conduct, as described above.$t$
where key = 'disclaimer';
