-- Adds a 4th legal document slot for the real Minor Consent & Intake
-- Addendum found in Active_Client_Material.zip -- unlike the 3 documents
-- seeded in 0019 (which are placeholders pending Mickey's real text), this
-- one's consent language is real and complete, transcribed directly from
-- "MeFirstFitness - Minor Consent - Intake Addendum.pdf". The surrounding
-- intake fields on that PDF (minor's info, guardian contact, medical
-- history) are a fillable form, not a read-and-acknowledge document, so
-- they aren't part of this -- a structured minor-intake form (mirroring
-- the lead_intake pattern) would be separate future work if wanted.

alter table public.legal_documents
  drop constraint legal_documents_key_check,
  add constraint legal_documents_key_check
    check (key in ('contract', 'onboarding_form', 'disclaimer', 'minor_consent'));

insert into public.legal_documents (key, title, body) values
  (
    'minor_consent',
    'Minor Consent & Intake Addendum',
    $t$Required in addition to the standard waiver -- complete alongside your child's standard intake.

MINOR'S INFORMATION
On file: full name, date of birth, age, grade, sport(s).

PARENT/GUARDIAN INFORMATION
On file: full name, phone, email, relationship to minor, and your preferred way to hear about progress updates (text, email, or in-person after sessions).

EMERGENCY CONTACT
On file: name, relationship, and phone (if different from the parent/guardian above).

MEDICAL INFORMATION
On file: primary physician/pediatrician name and phone, relevant diagnosis and current treatment (PT, bracing, rest protocol, etc.), other medical conditions/medications/allergies, and athletic training clearance status.

CONSENT
Please read before signing:

I consent to my child's participation in fitness training with MeFirstFitness, including movement assessment and a program designed around their sport and current health history.

I understand training will be adjusted around any pain or symptoms reported and is not a substitute for medical or physical therapy treatment.

I authorize MeFirstFitness to seek emergency medical care for my child if I cannot be reached immediately.

I understand progress updates will be shared with me as the parent/guardian, while session communication with my child happens directly, age-appropriately, in session.$t$
  )
on conflict (key) do nothing;
