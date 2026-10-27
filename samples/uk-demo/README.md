# UK demo kit: RELAPSE-STOP (MS) and LUMINA-NB2 (paediatric oncology)

Fictional study documents for testing document upload, AI extraction and
compensation rules. **Every organisation, person, product and reference number is
invented**, and each page is stamped "SAMPLE - FICTIONAL TEST DOCUMENT".

| Study | Sponsor (client) | Sites (UK) |
|---|---|---|
| RELAPSE-STOP, MNS-2207-301, Phase III relapsing MS, adults 18–55 | Meridian Neurosciences Ltd, via Northbridge CRO | Leeds, London, Manchester, Birmingham, Glasgow |
| LUMINA-NB2, BPC-118-NB2, Phase II relapsed neuroblastoma, ages 1–17 | Brightpath Children's Cancer Research (direct sponsor) | Bristol, Newcastle, Southampton |

## Documents

Trial level (`<study>/trial/`): protocol, consent forms (adult PIS/ICF; for the
paediatric study the parent/guardian ICF, young-person assent and child assent),
sponsor expenses policy, REC favourable opinion, HRA Approval, insurance
certificate and Investigator's Brochure summary.

Site level (`<study>/sites/<site>/`): model Clinical Trial Agreement with a
participant/family expenses schedule, and the NHS confirmation of capacity and
capability.

## What the AI should extract

The sponsor policy, protocol and consent forms define the **trial-wide** rules.
Site agreements either defer to the policy (Leeds, Manchester) or set **local
rates** that override it for that site only:

| Site | Local rate |
|---|---|
| London | Parking up to £25.00/visit (policy £15.00); London Congestion Charge £15.00/visit day |
| Birmingham | Parking up to £10.00/visit |
| Glasgow | Mileage up to 300 miles per return journey (policy 150); accommodation up to £110.00/night |
| Bristol | Parent meals up to £18.00/day (policy £15.00) |
| Newcastle | Free on-site family accommodation; hotel only if full, up to £85.00/night |
| Southampton | Parking up to £8.00/day (policy £10.00) |

## Use

1. Open the trial in the app → **Documents** → upload a document (or **Batch set-up**
   with the whole folder). Upload site agreements with their site selected, or
   let batch set-up match them by site name.
2. Review the extracted rules on the **Compensation** tab: AI drafts show their
   cited source and confidence, and only approved rules are used for claims.

`seed_uk_demo.sql` creates the two studies and eight sites in a **local**
Supabase stack (after `supabase/tests/local/seed.sh`). To regenerate the PDFs:

```bash
npm i --no-save pdfkit@0.15 && node samples/uk-demo/generate.cjs
```
