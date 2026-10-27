// Generates the fictional UK demo document kit (PDF) and a local seed script.
//
//   npm i --no-save pdfkit@0.15   (or install it anywhere and set NODE_PATH)
//   node samples/uk-demo/generate.cjs
//
// Output: samples/uk-demo/<study>/trial/*.pdf, <study>/sites/<site>/*.pdf,
//         samples/uk-demo/seed_uk_demo.sql
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { studies } = require("./data.cjs");

const OUT = __dirname;
const BANNER = "SAMPLE - FICTIONAL TEST DOCUMENT - NOT FOR CLINICAL USE";
const gbp = (n) => `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pounds = (s) => s.replace(/GBP (\d)/g, "£$1");

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------

function newDoc(file, meta) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const doc = new PDFDocument({ size: "A4", margins: { top: 64, bottom: 64, left: 60, right: 60 }, info: { Title: meta.title, Author: meta.author ?? "CareCompanion demo kit" } });
  doc.pipe(fs.createWriteStream(file));
  const stamp = () => {
    const { top, left, bottom } = doc.page.margins;
    // Writing inside the bottom margin would otherwise trigger another page break.
    doc.page.margins.bottom = 0;
    const width = doc.page.width - left * 2;
    doc.save().fontSize(7.5).fillColor("#b00020").text(BANNER, left, top - 34, { width, align: "center", lineBreak: false });
    doc.fillColor("#666").text(meta.footer ?? meta.title, left, doc.page.height - 44, { width, align: "center", lineBreak: false });
    doc.restore().fillColor("black");
    doc.page.margins.bottom = bottom;
    doc.x = left;
    doc.y = top;
  };
  stamp();
  doc.on("pageAdded", stamp);
  return doc;
}

function h1(doc, text) {
  doc.moveDown(0.4).font("Helvetica-Bold").fontSize(16).text(text).moveDown(0.4).font("Helvetica").fontSize(10);
}
function h2(doc, text) {
  doc.moveDown(0.6).font("Helvetica-Bold").fontSize(12).text(text).moveDown(0.25).font("Helvetica").fontSize(10);
}
function p(doc, text) {
  doc.font("Helvetica").fontSize(10).text(pounds(text), { align: "left", lineGap: 2 }).moveDown(0.45);
}
function bullets(doc, items) {
  for (const item of items) doc.font("Helvetica").fontSize(10).text(`•  ${pounds(item)}`, { indent: 8, lineGap: 2 }).moveDown(0.15);
  doc.moveDown(0.35);
}
function kv(doc, rows) {
  for (const [k, v] of rows) {
    doc.font("Helvetica-Bold").fontSize(10).text(`${k}: `, { continued: true }).font("Helvetica").text(pounds(String(v)));
  }
  doc.moveDown(0.5);
}
function table(doc, headers, rows, widths) {
  const left = doc.page.margins.left;
  const total = doc.page.width - left * 2;
  const w = widths ?? headers.map(() => total / headers.length);
  const drawRow = (cells, bold) => {
    const heights = cells.map((c, i) => doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).heightOfString(pounds(String(c)), { width: w[i] - 6 }));
    const h = Math.max(...heights) + 6;
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage();
    const y = doc.y;
    let x = left;
    cells.forEach((c, i) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).text(pounds(String(c)), x + 3, y + 3, { width: w[i] - 6 });
      doc.rect(x, y, w[i], h).strokeColor("#999").lineWidth(0.5).stroke();
      x += w[i];
    });
    doc.x = left;
    doc.y = y + h;
  };
  drawRow(headers, true);
  rows.forEach((r) => drawRow(r, false));
  doc.moveDown(0.8).font("Helvetica").fontSize(10);
}
function signature(doc, lines) {
  doc.moveDown(1);
  for (const line of lines) doc.font("Helvetica").fontSize(10).text(line).moveDown(0.2);
}
const end = (doc) => new Promise((resolve) => { doc.on("end", resolve); doc.end(); setTimeout(resolve, 50); });

// ---------------------------------------------------------------------------
// Compensation text (single source for protocol, policy and consent forms)
// ---------------------------------------------------------------------------

function msExpenseRules(s) {
  const c = s.comp;
  return [
    `Visit payment: ${gbp(c.perVisit)} for each completed on-site study visit (Screening to Safety Follow-up), paid by bank transfer.`,
    `MRI visit supplement: an additional ${gbp(c.mriSupplement)} for each visit that includes an MRI scan (Baseline, Weeks 24, 48, 72 and 96), in recognition of the longer visit.`,
    `Mileage: ${gbp(c.mileageRate)} per mile for travel by private car, up to ${c.mileageCapMiles} miles per return journey. No receipt is required; the site confirms the distance.`,
    `Public transport: the actual cost of standard-class rail, bus or tram fares, receipt or ticket required.`,
    `Taxi: only where agreed in advance by the site (for example for participants with limited mobility), up to ${gbp(c.taxiCap)} per visit, receipt required.`,
    `Car parking: actual cost up to ${gbp(c.parkingCap)} per visit, receipt required.`,
    `Meals and refreshments: up to ${gbp(c.mealsCap)} per visit day for visits lasting more than ${c.mealsMinHours} hours, receipt required.`,
    `Overnight accommodation: up to ${gbp(c.accommodationCap)} per night, maximum one night per visit, when the one-way journey is longer than ${c.accommodationTriggerHours} hours; must be approved by the site in advance; receipt required.`,
    `Companion or carer: where a participant needs help to attend (for example an EDSS score of 6.0 or more), the travel and meal costs of one companion are reimbursed at the same rates.`,
  ];
}

function paedsExpenseRules(s) {
  const c = s.comp;
  return [
    `Travel by car: ${gbp(c.mileageRate)} per mile for the child and up to two parents or guardians travelling together. Journeys over ${c.mileagePreApprovalMiles} miles return must be agreed with the site in advance. No receipt required.`,
    `Public transport: actual cost of standard-class fares for the child and up to two parents or guardians, ticket or receipt required.`,
    `Taxi: only where agreed in advance by the site, up to ${gbp(c.taxiCap)} per journey, receipt required.`,
    `Car parking: actual cost up to ${gbp(c.parkingCapDay)} per day, receipt required.`,
    `Parent meals during inpatient admissions: up to ${gbp(c.parentMealsDay)} per day per family, receipts required.`,
    `Accommodation for parents during inpatient admissions: free on-site family accommodation where available; otherwise a hotel up to ${gbp(c.accommodationCap)} per night, approved in advance, receipt required.`,
    `Childcare for brothers and sisters on admission days: up to ${gbp(c.siblingChildcareDay)} per day, receipt from the childcare provider required.`,
    `Thank-you voucher: a ${gbp(c.childVoucherPerCycle)} gift voucher for the child for each completed treatment cycle. This is a thank-you, not a payment for taking part.`,
    `Loss of earnings is not reimbursed.`,
  ];
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

async function protocol(s, dir) {
  const isPaeds = s.population === "paediatric";
  const doc = newDoc(path.join(dir, `${s.protocolNumber}_Protocol_v${s.protocolVersion}.pdf`), {
    title: `${s.shortTitle} Clinical Study Protocol ${s.protocolNumber} v${s.protocolVersion}`,
    footer: `${s.protocolNumber} Protocol v${s.protocolVersion}, ${s.protocolDate} - Confidential`,
  });
  h1(doc, "CLINICAL STUDY PROTOCOL");
  p(doc, s.title);
  kv(doc, [
    ["Protocol number", s.protocolNumber],
    ["Version and date", `${s.protocolVersion}, ${s.protocolDate}`],
    ["IRAS ID", s.iras],
    ["Phase", s.phase === "phase_3" ? "Phase III" : "Phase II"],
    ["Sponsor", `${s.sponsor.name}, ${s.sponsor.address}`],
    ...(s.cro ? [["Contract research organisation", s.cro]] : []),
    ["Chief Investigator", s.chiefInvestigator],
  ]);
  h2(doc, "1. Synopsis");
  if (isPaeds) {
    p(doc, `Population: children and young people aged ${s.minAge} to ${s.maxAge} years with relapsed or refractory high-risk neuroblastoma after at least one line of salvage therapy. Approximately ${s.targetEnrollment} participants will be enrolled at three UK Principal Treatment Centres.`);
    p(doc, "Design: open-label, single-arm, Simon two-stage. Participants receive BPC-118 (an anti-GD2 chimeric monoclonal antibody) as a continuous infusion on Days 1 to 5 together with oral temozolomide on Days 1 to 5 of each 21-day cycle, for up to six cycles.");
    p(doc, "Primary endpoint: best overall response by the end of cycle 6 (INRC 2017). Secondary endpoints: progression-free survival, overall survival, safety, pain scores and quality of life (PedsQL).");
  } else {
    p(doc, `Population: adults aged ${s.minAge} to ${s.maxAge} years with relapsing multiple sclerosis (2017 McDonald criteria), EDSS 0 to 5.5, and at least one relapse in the previous 12 months. Approximately ${s.targetEnrollment} participants will be randomised at five UK sites (900 globally).`);
    p(doc, `Design: randomised 1:1, double-blind, double-dummy, active-controlled. Ovalitinib 60 mg once daily versus ${s.comparator} for 96 weeks.`);
    p(doc, "Primary endpoint: annualised relapse rate up to Week 96. Key secondary endpoints: confirmed disability progression, new or enlarging T2 lesions on MRI, and NfL levels.");
  }
  h2(doc, "2. Eligibility (summary)");
  bullets(doc, isPaeds
    ? ["Age 12 months to 17 years at consent.", "Lansky or Karnofsky performance score of 50 or more.", "Adequate bone marrow, renal and hepatic function.", "Written informed consent from a parent or guardian, and assent from the child where appropriate.", "Exclusion: prior anti-GD2 therapy within 12 weeks; uncontrolled infection; pregnancy."]
    : ["Age 18 to 55 years at consent.", "Diagnosis of relapsing MS and EDSS 0 to 5.5 at screening.", "At least one documented relapse in the 12 months before screening.", "Exclusion: progressive MS; prior BTK inhibitor treatment; contraindication to MRI; pregnancy or breastfeeding."]);
  h2(doc, "3. Schedule of visits");
  p(doc, "Visits must take place within the windows below. Visits outside the window are recorded as protocol deviations.");
  table(doc, ["Visit code", "Visit", "Timing", "Window"], s.visits, [70, 215, 120, 70]);
  if (isPaeds) {
    p(doc, "Each treatment cycle includes a five-day inpatient admission (Days 1 to 5) for the BPC-118 infusion, with outpatient blood tests on Days 8 and 15. A parent or guardian is expected to stay with the child during admissions.");
  } else {
    p(doc, "On-site visits last approximately 2 to 3 hours. Visits that include an MRI scan last approximately 5 hours.");
  }
  h2(doc, "4. Safety reporting");
  p(doc, "Serious adverse events are reported to the sponsor within 24 hours of the site becoming aware. SUSARs are reported to the MHRA and the REC in line with UK regulations.");
  h2(doc, `5. ${isPaeds ? "Support for families: travel and expenses" : "Participant payments and expenses"}`);
  p(doc, isPaeds
    ? `Families will not be out of pocket because of taking part. The sponsor's Family Travel and Expenses Policy applies at all sites; the clinical trial agreement with each site may adjust local rates. Claims are submitted through the CareCompanion app within ${s.comp.claimDays} days and paid within ${s.comp.paymentDays} days.`
    : `Participants receive a payment for each completed visit and reimbursement of reasonable travel expenses under the sponsor's Participant Expenses Policy. The clinical trial agreement with each site may set local rates. Claims are submitted through the CareCompanion app within ${s.comp.claimDays} days of the visit and paid within ${s.comp.paymentDays} days.`);
  bullets(doc, isPaeds ? paedsExpenseRules(s) : msExpenseRules(s));
  h2(doc, "6. Ethics and regulatory");
  p(doc, `The study will be conducted in accordance with ICH GCP (E6), the UK Policy Framework for Health and Social Care Research and the Medicines for Human Use (Clinical Trials) Regulations 2004. Favourable opinion from the ${s.rec.name} and HRA Approval are required before any site opens.`);
  await end(doc);
}

async function consent(s, dir, audience) {
  const titles = {
    adult: "Participant Information Sheet and Informed Consent Form",
    parent_guardian: "Parent / Guardian Information Sheet and Consent Form",
    young_person: "Information Sheet and Assent Form for Young People (12 to 17 years)",
    child: "Information Sheet and Assent Form for Children (6 to 11 years)",
  };
  const version = audience === "child" ? "1.0" : audience === "young_person" ? "1.1" : s.protocolVersion;
  const fileTag = { adult: "PIS-ICF", parent_guardian: "Parent-PIS-ICF", young_person: "YP-Assent", child: "Child-Assent" }[audience];
  const doc = newDoc(path.join(dir, `${s.shortTitle}_${fileTag}_v${version}.pdf`), {
    title: `${s.shortTitle} ${titles[audience]} v${version}`,
    footer: `${s.shortTitle} ${titles[audience]} version ${version} - IRAS ${s.iras}`,
  });
  h1(doc, titles[audience]);
  p(doc, s.title);
  kv(doc, [["Version", `${version}, ${s.protocolDate}`], ["IRAS ID", s.iras], ["Sponsor", s.sponsor.name]]);

  if (audience === "child") {
    h2(doc, "What is this study about?");
    p(doc, "Doctors are trying a new medicine to help children whose neuroblastoma has come back. We would like to ask if you want to help us find out how well it works.");
    h2(doc, "What will happen?");
    p(doc, "You will stay in hospital for five days every three weeks to have the medicine through a drip. You will have blood tests and some scans. Your mum, dad or carer can stay with you.");
    h2(doc, "Will I get anything for helping?");
    p(doc, `You will get a ${gbp(s.comp.childVoucherPerCycle)} gift voucher to say thank you after each treatment cycle. Your family can get back the money they spend on travel, parking and food while you are in hospital.`);
    h2(doc, "Do I have to say yes?");
    p(doc, "No. It is up to you. Nobody will be cross if you say no, and you can change your mind at any time.");
    signature(doc, ["Write your name: ____________________________", "Date: ______________", "Doctor or nurse: ____________________________"]);
    return end(doc);
  }

  h2(doc, "1. Why is this study being done?");
  p(doc, s.population === "paediatric"
    ? "We are testing whether BPC-118 given with temozolomide can shrink neuroblastoma that has come back or not responded to earlier treatment."
    : "We are testing whether ovalitinib, a new tablet, reduces MS relapses more than teriflunomide, a medicine already used in the NHS.");
  h2(doc, "2. What would taking part involve?");
  p(doc, s.population === "paediatric"
    ? "Your child would have up to six treatment cycles of 21 days. Each cycle starts with a five-day stay in hospital. There are blood tests on Days 8 and 15 of each cycle, scans after cycles 2, 4 and 6, and follow-up visits every three months for two years."
    : "You would take part for about 100 weeks and come to the hospital 12 times. Five of the visits include an MRI scan and take about 5 hours. Other visits take 2 to 3 hours.");
  h2(doc, "3. What are the possible risks?");
  p(doc, s.population === "paediatric"
    ? "BPC-118 commonly causes pain, which is treated with pain relief during the infusion, and can cause fever, low blood pressure and changes in eyesight. Temozolomide can lower blood counts."
    : "Possible side effects include headache, nausea, raised liver enzymes and an increased risk of infections. Your liver blood tests will be checked regularly.");
  h2(doc, s.population === "paediatric" ? "4. Will our family be paid or have expenses covered?" : "4. Will I be paid for taking part? Will my expenses be covered?");
  p(doc, s.population === "paediatric"
    ? "Your family should not be out of pocket because of the study. You can claim the following through the CareCompanion app:"
    : "Yes. You will receive a payment for each visit you complete and your reasonable travel costs will be reimbursed. You can claim through the CareCompanion app:");
  bullets(doc, s.population === "paediatric" ? paedsExpenseRules(s) : msExpenseRules(s));
  p(doc, `Your study site may have slightly different local rates, for example for parking; the research nurse will tell you. Claims should be made within ${s.comp.claimDays} days and are normally paid within ${s.comp.paymentDays} days. Payments may need to be declared for tax or benefits purposes.`);
  if (audience === "young_person") {
    h2(doc, "5. Your choice");
    p(doc, "Your parent or guardian will also be asked to agree. You can still say no, and you can stop at any time without giving a reason. Stopping will not affect your normal care.");
  } else {
    h2(doc, "5. Consent");
    bullets(doc, [
      "I confirm I have read and understood this information sheet and have had the opportunity to ask questions.",
      "I understand that participation is voluntary and that I am free to withdraw at any time without giving a reason.",
      "I agree to the study team accessing medical records relevant to the study.",
      "I agree to receive study payments and reimbursements by bank transfer through the sponsor's payment provider.",
    ]);
  }
  signature(doc, ["Name: ____________________________   Signature: ____________________   Date: __________", "Person taking consent: ____________________________   Date: __________"]);
  await end(doc);
}

async function expensesPolicy(s, dir) {
  const isPaeds = s.population === "paediatric";
  const doc = newDoc(path.join(dir, `${s.shortTitle}_${isPaeds ? "Family-Travel-and-Expenses" : "Participant-Expenses"}-Policy_v1.1.pdf`), {
    title: `${s.shortTitle} ${isPaeds ? "Family Travel and Expenses Policy" : "Participant Expenses and Payments Policy"}`,
  });
  h1(doc, isPaeds ? "Family Travel and Expenses Policy" : "Participant Expenses and Payments Policy");
  kv(doc, [["Study", `${s.shortTitle} (${s.protocolNumber})`], ["Version", "1.1, " + s.protocolDate], ["Owner", s.sponsor.name], ["Applies to", "All UK sites unless the site's clinical trial agreement states a different local rate"]]);
  h2(doc, "1. Purpose");
  p(doc, isPaeds
    ? "This policy sets out what families of children taking part in the study can claim, so that no family is out of pocket because of taking part."
    : "This policy sets out the payments participants receive and the expenses they can claim for taking part in the study.");
  h2(doc, "2. What can be claimed");
  const rows = isPaeds
    ? [
        ["Travel by car", `${gbp(s.comp.mileageRate)} per mile`, `Pre-approval over ${s.comp.mileagePreApprovalMiles} miles return`, "No"],
        ["Public transport", "Actual cost, standard class", "Child + up to 2 parents/guardians", "Yes"],
        ["Taxi", "Actual cost", `Up to ${gbp(s.comp.taxiCap)} per journey, pre-approved`, "Yes"],
        ["Car parking", "Actual cost", `Up to ${gbp(s.comp.parkingCapDay)} per day`, "Yes"],
        ["Parent meals (inpatient)", "Actual cost", `Up to ${gbp(s.comp.parentMealsDay)} per day per family`, "Yes"],
        ["Parent accommodation", "On-site free or hotel", `Up to ${gbp(s.comp.accommodationCap)} per night, pre-approved`, "Yes"],
        ["Sibling childcare", "Actual cost", `Up to ${gbp(s.comp.siblingChildcareDay)} per admission day`, "Yes"],
        ["Child thank-you voucher", `${gbp(s.comp.childVoucherPerCycle)} gift voucher`, "Per completed cycle", "No"],
      ]
    : [
        ["Visit payment", `${gbp(s.comp.perVisit)} per completed visit`, "Screening to Follow-up", "No"],
        ["MRI visit supplement", `${gbp(s.comp.mriSupplement)} per MRI visit`, "Baseline, W24, W48, W72, W96", "No"],
        ["Mileage", `${gbp(s.comp.mileageRate)} per mile`, `Up to ${s.comp.mileageCapMiles} miles per return journey`, "No"],
        ["Public transport", "Actual cost, standard class", "-", "Yes"],
        ["Taxi", "Actual cost", `Up to ${gbp(s.comp.taxiCap)} per visit, pre-approved`, "Yes"],
        ["Car parking", "Actual cost", `Up to ${gbp(s.comp.parkingCap)} per visit`, "Yes"],
        ["Meals", "Actual cost", `Up to ${gbp(s.comp.mealsCap)} per visit day (visits over ${s.comp.mealsMinHours} hours)`, "Yes"],
        ["Accommodation", "Actual cost", `Up to ${gbp(s.comp.accommodationCap)} per night, 1 night per visit, pre-approved`, "Yes"],
        ["Companion / carer", "Same rates as participant", "Where help is needed to attend", "As above"],
      ];
  table(doc, ["Item", "Rate", "Limit / condition", "Receipt"], rows, [120, 120, 175, 60]);
  h2(doc, "3. How to claim");
  bullets(doc, [
    `Claims are submitted in the CareCompanion app within ${s.comp.claimDays} days of the visit, with photographs of receipts where required.`,
    "Claims are checked against this policy and the site's local rates, and against the visit record in the study EDC.",
    `Approved claims are paid by bank transfer within ${s.comp.paymentDays} days.`,
    "Items not listed (for example loss of earnings) are not reimbursed unless agreed in writing by the sponsor.",
  ]);
  h2(doc, "4. Local rates");
  p(doc, "Where a site's clinical trial agreement sets a different rate for an item (for example parking at a city-centre hospital), the site's rate applies to participants at that site.");
  await end(doc);
}

async function recLetter(s, dir) {
  const doc = newDoc(path.join(dir, `${s.shortTitle}_REC-Favourable-Opinion_${s.rec.ref.replace(/\//g, "-")}.pdf`), { title: `${s.rec.name} favourable opinion ${s.rec.ref}` });
  h1(doc, s.rec.name);
  p(doc, `Date: ${s.rec.date}`);
  p(doc, `Dear ${s.chiefInvestigator},`);
  kv(doc, [["Study title", s.title], ["REC reference", s.rec.ref], ["IRAS project ID", s.iras], ["Protocol number", s.protocolNumber], ["Sponsor", s.sponsor.name]]);
  h2(doc, "Final opinion");
  p(doc, "On behalf of the Committee, I am pleased to confirm a favourable ethical opinion for the above research on the basis described in the application form, protocol and supporting documentation, subject to the conditions specified below.");
  h2(doc, "Conditions of the favourable opinion");
  bullets(doc, [
    "Management permission must be obtained from each host organisation (HRA Approval and NHS confirmation of capacity and capability) before the study starts at the site.",
    "Participant expenses and payments must be made as described in the approved information sheets; any change to the amounts requires a notification to the Committee.",
    "The Committee must be informed of any substantial amendment and of the end of the study.",
  ]);
  h2(doc, "Approved documents");
  const docs = s.population === "paediatric"
    ? [["Protocol", s.protocolVersion, s.protocolDate], ["Parent/Guardian Information Sheet and Consent Form", s.protocolVersion, s.protocolDate], ["Young Person Information Sheet and Assent", "1.1", s.protocolDate], ["Child Information Sheet and Assent", "1.0", s.protocolDate], ["Family Travel and Expenses Policy", "1.1", s.protocolDate]]
    : [["Protocol", s.protocolVersion, s.protocolDate], ["Participant Information Sheet and Consent Form", s.protocolVersion, s.protocolDate], ["Participant Expenses and Payments Policy", "1.1", s.protocolDate]];
  table(doc, ["Document", "Version", "Date"], docs, [275, 80, 120]);
  signature(doc, ["Yours sincerely,", "Dr Margaret Ellwood (fictional)", `Chair, ${s.rec.name}`]);
  await end(doc);
}

async function hraLetter(s, dir) {
  const doc = newDoc(path.join(dir, `${s.shortTitle}_HRA-Approval_IRAS-${s.iras}.pdf`), { title: `HRA and HCRW Approval IRAS ${s.iras}` });
  h1(doc, "HRA and Health and Care Research Wales (HCRW) Approval Letter");
  p(doc, `Date: ${s.hraDate}`);
  p(doc, `Dear ${s.chiefInvestigator},`);
  kv(doc, [["Study title", s.title], ["IRAS project ID", s.iras], ["Protocol number", s.protocolNumber], ["REC reference", s.rec.ref], ["Sponsor", s.sponsor.name]]);
  p(doc, "I am pleased to confirm that HRA and HCRW Approval has been given for the above-referenced study, on the basis described in the application form, protocol, supporting documentation and any clarifications received. You should not expect to receive anything further relating to this application.");
  h2(doc, "Participating NHS organisations");
  p(doc, "Each participating NHS organisation in England and Wales should confirm capacity and capability before the study starts locally. Sites in Scotland follow NHS Research Scotland permissions.");
  table(doc, ["Site", "Principal Investigator"], s.sites.map((x) => [`${x.name}, ${x.trust}`, x.pi]), [330, 145]);
  signature(doc, ["Yours sincerely,", "Approvals Specialist (fictional)", "Health Research Authority"]);
  await end(doc);
}

async function insurance(s, dir) {
  const doc = newDoc(path.join(dir, `${s.shortTitle}_Clinical-Trials-Insurance-Certificate.pdf`), { title: `${s.shortTitle} insurance certificate` });
  h1(doc, "Certificate of Clinical Trials Insurance");
  kv(doc, [["Insurer", "Harbourline Insurance plc (fictional)"], ["Policy holder", s.sponsor.name], ["Study", `${s.shortTitle} (${s.protocolNumber})`], ["Territory", "United Kingdom"], ["Period", `${s.plannedStart} to ${s.plannedEnd}`], ["Limit of indemnity", "£10,000,000 any one claim and in the aggregate"]]);
  p(doc, "This certificate confirms no-fault compensation cover for participants in line with the ABPI guidelines for Phase II-IV clinical trials. It does not cover participant travel or expenses.");
  await end(doc);
}

async function ibSummary(s, dir) {
  const doc = newDoc(path.join(dir, `${s.shortTitle}_Investigator-Brochure-Summary.pdf`), { title: `${s.shortTitle} Investigator's Brochure summary` });
  h1(doc, "Investigator's Brochure - Summary of Changes and Key Safety Information");
  p(doc, s.population === "paediatric"
    ? "BPC-118 is a chimeric IgG1 monoclonal antibody against the disialoganglioside GD2. Expected adverse reactions include neuropathic pain, fever, capillary leak, hypotension and visual disturbances. Reference Safety Information: Section 7.3, edition 4."
    : "Ovalitinib (MNS-2207) is a selective, reversible oral inhibitor of Bruton's tyrosine kinase. Expected adverse reactions include headache, nausea and elevations of liver transaminases. Reference Safety Information: Section 6.2, edition 3.");
  await end(doc);
}

async function siteAgreement(s, site, dir) {
  const isPaeds = s.population === "paediatric";
  const doc = newDoc(path.join(dir, `${s.shortTitle}_mCTA_${site.key}.pdf`), {
    title: `${s.shortTitle} Clinical Trial Agreement - ${site.name}`,
    footer: `${s.shortTitle} model Clinical Trial Agreement - ${site.name}`,
  });
  h1(doc, "Model Clinical Trial Agreement (mCTA)");
  p(doc, `This Agreement is made between ${s.sponsor.name} ("the Sponsor")${s.cro ? `, acting through ${s.cro} ("the CRO")` : ""}, and ${site.trust} ("the Trust") for the conduct of the study at ${site.name}.`);
  kv(doc, [
    ["Study", s.title],
    ["Protocol number", s.protocolNumber],
    ["IRAS ID", s.iras],
    ["Site", site.name],
    ["Address", `${site.address}, ${site.city} ${site.postcode}`],
    ["Principal Investigator", `${site.pi} (${site.piEmail})`],
    ["Research coordinator", `${site.crc} (${site.crcEmail})`],
    ["Target recruitment", `${site.target} participants over ${isPaeds ? 18 : 13} months`],
  ]);
  h2(doc, "Clause 4. Conduct of the study");
  p(doc, "The Trust shall conduct the study in accordance with the Protocol, Good Clinical Practice and all applicable UK law, and shall not begin recruitment until NHS confirmation of capacity and capability has been issued.");
  h2(doc, "Schedule 2. Financial arrangements (site payments)");
  table(doc, ["Item", "Amount"], [
    ["Set-up fee (non-refundable)", gbp(s.sitePayments.setupFee)],
    ["Per evaluable participant completing the study", gbp(s.sitePayments.perParticipant)],
    ["Annual maintenance fee", gbp(s.sitePayments.annualFee)],
  ], [330, 145]);
  p(doc, "Site payments are made quarterly in arrears against completed visits recorded in the study EDC.");
  h2(doc, `Schedule 3. ${isPaeds ? "Family" : "Participant"} payments and expenses at this site`);
  if (!site.overrides.length) {
    p(doc, `${isPaeds ? "Family" : "Participant"} payments and expenses at this site are made in accordance with the Sponsor's ${isPaeds ? "Family Travel and Expenses Policy" : "Participant Expenses and Payments Policy"} version 1.1, with no local variations.`);
  } else {
    p(doc, `${isPaeds ? "Family" : "Participant"} payments and expenses at this site follow the Sponsor's policy version 1.1, with the following local rates, which apply to ${isPaeds ? "families" : "Participants"} at this site in place of the corresponding policy rates:`);
    bullets(doc, site.overrides.map((o) => o.text));
  }
  p(doc, `Claims are submitted through the CareCompanion app and paid by the Sponsor's payment provider. The Trust will confirm attendance at each visit in the study EDC within 5 working days.`);
  h2(doc, "Signatures");
  signature(doc, [
    `For the Sponsor: ${s.sponsor.contact}          Date: __________`,
    `For the Trust: Director of Research and Development, ${site.trust}          Date: __________`,
    `Principal Investigator (read and understood): ${site.pi}          Date: __________`,
  ]);
  await end(doc);
}

async function capacityCapability(s, site, dir) {
  const doc = newDoc(path.join(dir, `${s.shortTitle}_Capacity-and-Capability_${site.key}.pdf`), { title: `${s.shortTitle} confirmation of capacity and capability - ${site.name}` });
  h1(doc, "Confirmation of Capacity and Capability");
  p(doc, `Date: ${site.ccDate}`);
  kv(doc, [["Study", `${s.shortTitle} (${s.protocolNumber})`], ["IRAS ID", s.iras], ["Site", site.name], ["Organisation", site.trust], ["Principal Investigator", site.pi]]);
  p(doc, `${site.trust} confirms that it has the capacity and capability to deliver the above study at ${site.name}. The study may start at this site from ${site.ccDate}, in accordance with HRA Approval dated ${s.hraDate} and the favourable opinion of the ${s.rec.name} (${s.rec.ref}).`);
  signature(doc, ["Research and Development Office (fictional)", site.trust]);
  await end(doc);
}

// ---------------------------------------------------------------------------
// Local seed (sites, sponsors, trials) for the local Supabase stack
// ---------------------------------------------------------------------------

function seedSql() {
  const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
  const [ms, paeds] = studies;
  const lines = [
    "-- UK demo studies for a LOCAL Supabase stack (generated by samples/uk-demo/generate.cjs).",
    "-- Northbridge CRO runs RELAPSE-STOP for Meridian Neurosciences; Brightpath sponsors LUMINA-NB2 directly.",
    "do $$",
    "declare",
    "  v_cro uuid; v_bright uuid; v_uk uuid; v_meridian uuid; v_brightpath uuid; v_trial uuid; v_site uuid;",
    "begin",
    "  select id into v_cro from public.tenants where name = 'Northbridge CRO';",
    "  if v_cro is null then raise exception 'Run supabase/tests/local/seed.sh first (creates Northbridge CRO)'; end if;",
    "  select id into v_uk from public.countries where code = 'GB' limit 1;",
    "  insert into public.tenants (name, client_type) values ('Brightpath Children''s Cancer Research', 'sponsor_direct') returning id into v_bright;",
    `  insert into public.sponsors (tenant_id, name, code, legal_name, billing_contact_name) values (v_cro, ${q(ms.sponsor.name)}, ${q(ms.sponsor.code)}, ${q(ms.sponsor.name)}, ${q(ms.sponsor.contact)}) returning id into v_meridian;`,
    `  insert into public.sponsors (tenant_id, name, code, legal_name, billing_contact_name) values (v_bright, ${q(paeds.sponsor.name)}, ${q(paeds.sponsor.code)}, ${q(paeds.sponsor.name)}, ${q(paeds.sponsor.contact)}) returning id into v_brightpath;`,
  ];
  for (const [s, tenantVar, sponsorVar] of [[ms, "v_cro", "v_meridian"], [paeds, "v_bright", "v_brightpath"]]) {
    lines.push(
      `  insert into public.trials (tenant_id, sponsor_id, name, short_title, protocol_number, protocol_version, study_type, phase, therapeutic_area, indication, population, min_age_years, max_age_years, randomised, blinding, arms_count, comparator, target_enrollment, iras_id, chief_investigator, lifecycle_status, planned_start_date, recruitment_end_date, planned_end_date, requires_visit_verification)`,
      `  values (${tenantVar}, ${sponsorVar}, ${q(s.title)}, ${q(s.shortTitle)}, ${q(s.protocolNumber)}, ${q(s.protocolVersion)}, 'interventional', ${q(s.phase)}, ${q(s.therapeuticArea)}, ${q(s.indication)}, ${q(s.population)}, ${s.minAge}, ${s.maxAge}, ${s.arms > 1}, ${q(s.blinding)}, ${s.arms}, ${q(s.comparator)}, ${s.targetEnrollment}, ${q(s.iras)}, ${q(s.chiefInvestigator)}, 'setup', ${q(s.plannedStart)}, ${q(s.recruitmentEnd)}, ${q(s.plannedEnd)}, true)`,
      "  returning id into v_trial;",
    );
    for (const site of s.sites) {
      lines.push(
        `  insert into public.sites (tenant_id, name, country_id, address_line1, city, postal_code, investigator_name, investigator_email, coordinator_name, coordinator_email, status)`,
        `  values (${tenantVar}, ${q(site.name)}, v_uk, ${q(site.address)}, ${q(site.city)}, ${q(site.postcode)}, ${q(site.pi)}, ${q(site.piEmail)}, ${q(site.crc)}, ${q(site.crcEmail)}, 'active') returning id into v_site;`,
        "  insert into public.trial_sites (trial_id, site_id) values (v_trial, v_site);",
      );
    }
  }
  lines.push("end $$;", "");
  fs.writeFileSync(path.join(OUT, "seed_uk_demo.sql"), lines.join("\n"));
}

// ---------------------------------------------------------------------------

(async () => {
  const written = [];
  for (const s of studies) {
    const trialDir = path.join(OUT, s.key, "trial");
    await protocol(s, trialDir);
    if (s.population === "paediatric") {
      await consent(s, trialDir, "parent_guardian");
      await consent(s, trialDir, "young_person");
      await consent(s, trialDir, "child");
    } else {
      await consent(s, trialDir, "adult");
    }
    await expensesPolicy(s, trialDir);
    await recLetter(s, trialDir);
    await hraLetter(s, trialDir);
    await insurance(s, trialDir);
    await ibSummary(s, trialDir);
    for (const site of s.sites) {
      const siteDir = path.join(OUT, s.key, "sites", site.key);
      await siteAgreement(s, site, siteDir);
      await capacityCapability(s, site, siteDir);
    }
  }
  seedSql();
  const count = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : e.name.endsWith(".pdf") ? 1 : 0), 0);
  for (const s of studies) written.push(`${s.key}: ${count(path.join(OUT, s.key))} PDFs`);
  console.log(written.join("\n") + "\nseed_uk_demo.sql written");
})();
