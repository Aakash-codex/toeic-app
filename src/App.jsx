import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard, BookOpen, Layers, Headphones, FileText, PenSquare,
  ClipboardList, BarChart3, CalendarDays, Sun, Moon, Volume2, Star,
  Bookmark, Check, X, RotateCcw, Play, Pause, ChevronRight, ChevronLeft,
  Flame, Target, Clock, TrendingUp, Award, Search,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

/* ============================================================
   TOKENS
   Exam-report aesthetic: cream "answer sheet" paper, navy ink,
   gold seal accent. Multiple-choice options render as scantron
   bubbles that fill in like a real OMR sheet — the signature
   motif reused across every quiz in the product.
   ============================================================ */
const GLOBAL_CSS = `
  :root {
    --bg: #FAF7EF;
    --surface: #FFFFFF;
    --surface-2: #F3EEE1;
    --ink: #1B2A4A;
    --ink-soft: #55617D;
    --accent: #C08A20;
    --accent-soft: #F3E3BC;
    --line: #DCD4BF;
    --correct: #2F7A4F;
    --correct-soft: #DCEEE1;
    --error: #B8483C;
    --error-soft: #F6DEDA;
    --radius: 14px;
  }
  .tp-dark {
    --bg: #10152A;
    --surface: #171E3A;
    --surface-2: #1E2647;
    --ink: #EEE7D6;
    --ink-soft: #A6AFCE;
    --accent: #E3B84E;
    --accent-soft: #33301C;
    --line: #2B3358;
    --correct: #6FCB9A;
    --correct-soft: #1D3529;
    --error: #E38177;
    --error-soft: #3A2223;
  }
  .tp-root {
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    min-height: 100%;
    transition: background 0.25s ease, color 0.25s ease;
  }
  .tp-serif { font-family: Georgia, "Times New Roman", serif; }
  .tp-mono { font-family: "SF Mono", "Courier New", ui-monospace, monospace; }
  .tp-card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
  }
  .tp-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
  .tp-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
  .tp-bubble {
    width: 34px; height: 34px; border-radius: 50%;
    border: 2px solid var(--ink-soft);
    display: flex; align-items: center; justify-content: center;
    font-family: "SF Mono", ui-monospace, monospace;
    font-size: 13px; font-weight: 700; color: var(--ink-soft);
    flex-shrink: 0; transition: all 0.15s ease; background: transparent;
  }
  .tp-bubble-selected { border-color: var(--ink); background: var(--ink); color: var(--surface); }
  .tp-bubble-correct { border-color: var(--correct); background: var(--correct); color: #fff; }
  .tp-bubble-error { border-color: var(--error); background: var(--error); color: #fff; }
  .tp-opt-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 16px; border: 1px solid var(--line); border-radius: 10px;
    cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease;
    background: var(--surface);
  }
  .tp-opt-row:hover { border-color: var(--accent); }
  .tp-opt-row-correct { border-color: var(--correct); background: var(--correct-soft); }
  .tp-opt-row-error { border-color: var(--error); background: var(--error-soft); }
  .tp-tab-btn {
    display: flex; align-items: center; gap: 8px; padding: 9px 14px;
    border-radius: 10px; font-size: 13.5px; font-weight: 600; white-space: nowrap;
    color: var(--ink-soft); cursor: pointer; border: 1px solid transparent;
    transition: all 0.15s ease;
  }
  .tp-tab-btn.active { background: var(--ink); color: var(--bg); }
  .tp-tab-btn:hover:not(.active) { border-color: var(--line); color: var(--ink); }
  .tp-pill {
    display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
    border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: .03em;
    text-transform: uppercase;
  }
  .tp-diff-easy { background: var(--correct-soft); color: var(--correct); }
  .tp-diff-medium { background: var(--accent-soft); color: var(--accent); }
  .tp-diff-hard { background: var(--error-soft); color: var(--error); }
  .tp-progress-track { height: 8px; border-radius: 5px; background: var(--surface-2); overflow: hidden; }
  .tp-progress-fill { height: 100%; border-radius: 5px; background: var(--accent); transition: width 0.4s ease; }
  .tp-flip-card { perspective: 1200px; cursor: pointer; }
  .tp-flip-inner { position: relative; transition: transform 0.5s; transform-style: preserve-3d; }
  .tp-flip-inner.flipped { transform: rotateY(180deg); }
  .tp-flip-face { backface-visibility: hidden; }
  .tp-flip-back { position: absolute; inset: 0; transform: rotateY(180deg); }
  .tp-seal {
    border: 3px double var(--accent); border-radius: 999px;
  }
  @keyframes tp-pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
  .tp-live { animation: tp-pulse 1.4s ease-in-out infinite; }
`;

/* ============================================================
   DATA
   ============================================================ */
const GRAMMAR_TOPICS = [
  {
    id: "be-verbs", title: "Be Verbs", difficulty: "Easy",
    explanation: "Be verbs (am, is, are, was, were) link the subject to more information. They change depending on the subject and the time.",
    formula: "Subject + am/is/are (now)  |  Subject + was/were (past)",
    examples: ["I am a manager.", "The report was late yesterday."],
    mistakes: ["Using 'is' with plural subjects: 'The employees is ready' (wrong).", "Forgetting 'were' with 'you': 'You was late' (wrong)."],
    tip: "I → am. He/She/It → is. You/We/They → are. Past: was for I/he/she/it, were for you/we/they.",
    questions: [
      { q: "The new employees ___ excited about the training.", options: ["is", "am", "are", "be"], answer: 2, explain: "'Employees' is plural, so use 'are'." },
      { q: "Last week, the budget report ___ due on Friday.", options: ["is", "was", "are", "were"], answer: 1, explain: "Singular subject + past time → 'was'." },
      { q: "I ___ available for a meeting tomorrow at 10 a.m.", options: ["am", "is", "are", "was"], answer: 0, explain: "'I' always pairs with 'am' in present tense." },
      { q: "Mr. Sato and Ms. Lee ___ the finance team.", options: ["is", "was", "are", "am"], answer: 2, explain: "Two people = plural subject → 'are'." },
      { q: "The invoice ___ not correct when we received it.", options: ["was", "were", "are", "am"], answer: 0, explain: "Singular subject ('invoice') + past → 'was'." },
    ],
  },
  {
    id: "sva", title: "Subject–Verb Agreement", difficulty: "Medium",
    explanation: "The verb must match the subject in number. Singular subjects take singular verbs; plural subjects take plural verbs.",
    formula: "Singular subject + verb+s  |  Plural subject + verb (no s)",
    examples: ["The manager approves the budget.", "The managers approve the budget."],
    mistakes: ["'The department need more staff' (wrong — needs 'needs').", "Ignoring words between subject and verb: 'The list of items are long' (should be 'is')."],
    tip: "Find the real subject first, then match the verb to it — ignore the words in between.",
    questions: [
      { q: "Each employee ___ required to complete the training.", options: ["is", "are", "were", "be"], answer: 0, explain: "'Each' takes a singular verb: 'is'." },
      { q: "The list of suppliers ___ posted on the website.", options: ["are", "is", "were", "have"], answer: 1, explain: "Subject is 'list' (singular), not 'suppliers'." },
      { q: "Our sales team ___ a strong quarter every year.", options: ["have", "has", "are", "were"], answer: 1, explain: "'Team' is treated as singular here → 'has'." },
      { q: "The documents in the folder ___ ready for review.", options: ["is", "was", "are", "has"], answer: 2, explain: "Subject 'documents' is plural → 'are'." },
      { q: "Neither the manager nor the employees ___ available today.", options: ["is", "was", "are", "has"], answer: 2, explain: "With 'neither...nor', the verb agrees with the nearer subject ('employees')." },
    ],
  },
  {
    id: "tenses", title: "Verb Tenses", difficulty: "Medium",
    explanation: "TOEIC              often tests choosing the correct tense based on time clues in the sentence (yesterday, now, since, by next week).",
    formula: "Present Simple: base/-s | Present Cont.: am/is/are + -ing | Present Perfect: have/has + p.p. | Past Simple: -ed | Future: will / be going to",
    examples: ["We usually ship orders on Fridays.", "The team has finished the project since March."],
    mistakes: ["Using present simple for a finished past action: 'I finish the report yesterday' (wrong).", "Missing 'have/has' in present perfect: 'She worked here since 2019' should be 'has worked'."],
    tip: "Look for the time word first — 'yesterday' = past, 'since/for' = perfect, 'next week' = future.",
    questions: [
      { q: "The company ___ its new product next month.", options: ["launches", "will launch", "launched", "launching"], answer: 1, explain: "'Next month' signals the future tense." },
      { q: "She ___ for this company since 2020.", options: ["works", "worked", "has worked", "is working"], answer: 2, explain: "'Since + year' requires present perfect." },
      { q: "Please review the contract before you ___ it.", options: ["sign", "signed", "will sign", "signing"], answer: 0, explain: "After 'before', present simple is used for a near-future action." },
      { q: "Right now, the manager ___ a conference call.", options: ["attends", "attended", "is attending", "attend"], answer: 2, explain: "'Right now' signals present continuous." },
      { q: "By the time the client arrived, we ___ the report.", options: ["finish", "finished", "had finished", "finishing"], answer: 2, explain: "An action completed before another past action uses past perfect." },
    ],
  },
  {
    id: "articles", title: "Articles", difficulty: "Easy",
    explanation: "'A' and 'an' introduce a single, non-specific noun. 'The' refers to a specific noun already known to the reader.",
    formula: "a/an + singular noun (general) | the + noun (specific)",
    examples: ["We need a new printer.", "The printer in the office is broken."],
    mistakes: ["Using 'a' before a vowel sound: 'a invoice' (should be 'an invoice').", "Dropping 'the' for something already mentioned."],
    tip: "'An' goes before a vowel SOUND, not just a vowel letter (an hour, but a university).",
    questions: [
      { q: "Please send me ___ invoice for last month's order.", options: ["a", "an", "the", "—"], answer: 1, explain: "'Invoice' starts with a vowel sound → 'an'." },
      { q: "___ manager you spoke to yesterday has left the company.", options: ["A", "An", "The", "—"], answer: 2, explain: "This refers to a specific, already-known manager → 'the'." },
      { q: "She is looking for ___ new job in marketing.", options: ["a", "an", "the", "—"], answer: 0, explain: "'New' begins with a consonant sound → 'a'." },
      { q: "___ equipment in warehouse B needs to be inspected.", options: ["A", "An", "The", "—"], answer: 2, explain: "Specific equipment already identified by location → 'the'." },
      { q: "It took almost ___ hour to fix the server.", options: ["a", "an", "the", "—"], answer: 1, explain: "'Hour' starts with a silent H → vowel sound → 'an'." },
    ],
  },
  {
    id: "prepositions", title: "Prepositions", difficulty: "Hard",
    explanation: "Prepositions show time, place, and relationships. TOEIC frequently tests fixed pairs like 'in charge of' or 'prior to'.",
    formula: "in (month/year/room) | on (day/date) | at (time/place) | by (deadline) | during (event)",
    examples: ["The meeting is at 3 p.m. on Monday.", "Please submit the report by Friday."],
    mistakes: ["'on 2024' (should be 'in 2024').", "'during three hours' (should be 'for three hours')."],
    tip: "Think big-to-small for place/time: in (year) → on (date) → at (exact time).",
    questions: [
      { q: "The workshop will be held ___ March 15.", options: ["in", "on", "at", "during"], answer: 1, explain: "Use 'on' for a specific date." },
      { q: "Please complete the form ___ the end of the day.", options: ["until", "by", "since", "for"], answer: 1, explain: "'By' marks a deadline." },
      { q: "The CEO gave a speech ___ the conference.", options: ["during", "while", "for", "since"], answer: 0, explain: "'During' + noun (event) is correct." },
      { q: "Mr. Kim is ___ charge of the sales department.", options: ["at", "on", "in", "for"], answer: 2, explain: "Fixed phrase: 'in charge of'." },
      { q: "The store is located ___ the corner of Main Street.", options: ["in", "on", "at", "by"], answer: 1, explain: "Fixed phrase: 'on the corner of'." },
    ],
  },
  {
    id: "passive", title: "Passive Voice", difficulty: "Hard",
    explanation: "Use the passive voice when the action matters more than who does it. It's very common in TOEIC notices and reports.",
    formula: "Subject + be + past participle (+ by agent)",
    examples: ["The invoice was sent yesterday.", "New equipment will be installed next week."],
    mistakes: ["Missing 'be': 'The report reviewed by the manager' (should be 'was reviewed').", "Wrong participle form: 'was wrote' instead of 'was written'."],
    tip: "If the sentence focuses on the object receiving the action, it's passive — check for 'be + past participle'.",
    questions: [
      { q: "The new policy ___ to all employees next Monday.", options: ["announces", "will announce", "will be announced", "announced"], answer: 2, explain: "The policy receives the action → passive voice." },
      { q: "All applications ___ carefully before the interview stage.", options: ["review", "are reviewed", "reviewing", "reviews"], answer: 1, explain: "Applications receive the action → 'are reviewed'." },
      { q: "The contract ___ by both parties last week.", options: ["signed", "was signed", "signs", "signing"], answer: 1, explain: "Passive + past time → 'was signed'." },
      { q: "This machine ___ regularly to avoid delays.", options: ["is maintained", "maintains", "maintain", "maintaining"], answer: 0, explain: "The machine receives the maintenance → passive." },
      { q: "The budget proposal ___ by the finance team tomorrow.", options: ["will review", "reviews", "will be reviewed", "reviewed"], answer: 2, explain: "Future passive: 'will be + past participle'." },
    ],
  },
  {
    id: "gerund-inf", title: "Gerunds & Infinitives", difficulty: "Hard",
    explanation: "Some verbs are followed by a gerund (-ing), others by an infinitive (to + verb). This is a common Part 5 trap.",
    formula: "verb + -ing (enjoy, avoid, finish, consider) | verb + to + base (decide, plan, want, agree)",
    examples: ["We plan to expand the office.", "The team finished preparing the report."],
    mistakes: ["'We plan expanding' (should be 'plan to expand').", "'She enjoys to travel' (should be 'enjoys traveling')."],
    tip: "Memorize verb groups in pairs — 'plan/decide/want/agree' + to-verb, 'enjoy/avoid/finish/consider' + -ing.",
    questions: [
      { q: "The company decided ___ its office to a bigger building.", options: ["moving", "to move", "move", "moved"], answer: 1, explain: "'Decide' is followed by an infinitive." },
      { q: "Please avoid ___ personal calls during work hours.", options: ["to make", "make", "making", "made"], answer: 2, explain: "'Avoid' is followed by a gerund." },
      { q: "We look forward ___ from you soon.", options: ["to hear", "hearing", "to hearing", "hear"], answer: 2, explain: "'Look forward to' is followed by a gerund (to is a preposition here)." },
      { q: "The manager suggested ___ the deadline by two days.", options: ["to extend", "extending", "extend", "extended"], answer: 1, explain: "'Suggest' is followed by a gerund." },
      { q: "They agreed ___ the contract terms.", options: ["reviewing", "to review", "review", "reviewed"], answer: 1, explain: "'Agree' is followed by an infinitive." },
    ],
  },
  {
    id: "relative", title: "Relative Pronouns", difficulty: "Medium",
    explanation: "Relative pronouns (who, whom, whose, which, that) connect a clause that describes a noun.",
    formula: "who/whom/whose (people) | which (things) | that (people or things)",
    examples: ["The employee who trained me is on leave.", "The invoice, which arrived late, was still paid."],
    mistakes: ["Using 'which' for a person: 'the manager which called' (should be 'who').", "Using 'who' for a thing: 'the report who was late' (should be 'that/which')."],
    tip: "People → who/whom. Things → which. 'That' can replace who or which in essential clauses.",
    questions: [
      { q: "The candidate ___ we interviewed yesterday impressed the team.", options: ["which", "whom", "whose", "when"], answer: 1, explain: "'Whom' refers to the person receiving the action of 'interviewed'." },
      { q: "The report, ___ was submitted late, is under review.", options: ["who", "which", "whose", "whom"], answer: 1, explain: "'Which' refers to the thing (report)." },
      { q: "This is the employee ___ proposal won the award.", options: ["who", "which", "whose", "whom"], answer: 2, explain: "'Whose' shows possession (the employee's proposal)." },
      { q: "The supplier ___ products we use is based in Osaka.", options: ["who", "whose", "which", "whom"], answer: 1, explain: "'Whose' links the supplier to their products." },
      { q: "We hired a consultant ___ has 10 years of experience.", options: ["which", "whose", "who", "whom"], answer: 2, explain: "'Who' is the subject of 'has' and refers to a person." },
    ],
  },
];

const VOCAB_WORDS = [
  { w: "employee", ipa: "/ɪmˈplɔɪ.iː/", pos: "noun", cat: "Office", meaning: "A person who works for a company.", ex: "Every employee must wear an ID badge.", syn: ["staff member", "worker"] },
  { w: "department", ipa: "/dɪˈpɑːrt.mənt/", pos: "noun", cat: "Office", meaning: "A section of a company that does a specific job.", ex: "Please forward this to the HR department.", syn: ["division", "section"] },
  { w: "equipment", ipa: "/ɪˈkwɪp.mənt/", pos: "noun", cat: "Office", meaning: "Tools or machines needed for a task.", ex: "The office equipment was upgraded last year.", syn: ["gear", "machinery"] },
  { w: "report", ipa: "/rɪˈpɔːrt/", pos: "noun/verb", cat: "Office", meaning: "A written document describing information or results.", ex: "She submitted the report before the deadline.", syn: ["summary", "record"] },
  { w: "application", ipa: "/ˌæp.lɪˈkeɪ.ʃən/", pos: "noun", cat: "Office", meaning: "A formal request, often for a job or service.", ex: "His job application was approved this week.", syn: ["request", "submission"] },
  { w: "training", ipa: "/ˈtreɪ.nɪŋ/", pos: "noun", cat: "Office", meaning: "Teaching someone a skill for their job.", ex: "New staff attend training during their first week.", syn: ["instruction", "coaching"] },
  { w: "meeting", ipa: "/ˈmiː.tɪŋ/", pos: "noun", cat: "Meeting", meaning: "A gathering of people to discuss something.", ex: "The weekly meeting starts at 9 a.m.", syn: ["gathering", "conference"] },
  { w: "schedule", ipa: "/ˈskedʒ.uːl/", pos: "noun/verb", cat: "Meeting", meaning: "A plan of times for events or tasks.", ex: "Please check your schedule before confirming.", syn: ["timetable", "agenda"] },
  { w: "conference", ipa: "/ˈkɑːn.fɚ.əns/", pos: "noun", cat: "Meeting", meaning: "A large formal meeting, often about a topic or industry.", ex: "The company hosted an international conference.", syn: ["convention", "summit"] },
  { w: "appointment", ipa: "/əˈpɔɪnt.mənt/", pos: "noun", cat: "Meeting", meaning: "An arranged time to meet someone.", ex: "I have an appointment with the client at noon.", syn: ["booking", "engagement"] },
  { w: "confirm", ipa: "/kənˈfɝːm/", pos: "verb", cat: "Meeting", meaning: "To say that something is true or will happen.", ex: "Please confirm your attendance by Friday.", syn: ["verify", "finalize"] },
  { w: "cancel", ipa: "/ˈkæn.səl/", pos: "verb", cat: "Meeting", meaning: "To stop a planned event from happening.", ex: "The meeting was canceled due to a scheduling conflict.", syn: ["call off", "abort"] },
  { w: "manager", ipa: "/ˈmæn.ɪ.dʒɚ/", pos: "noun", cat: "Business", meaning: "A person who controls a team, department, or project.", ex: "The manager approved the new budget.", syn: ["supervisor", "director"] },
  { w: "contract", ipa: "/ˈkɑːn.trækt/", pos: "noun", cat: "Business", meaning: "A written legal agreement between two parties.", ex: "Both companies signed the contract this morning.", syn: ["agreement", "deal"] },
  { w: "project", ipa: "/ˈprɑː.dʒekt/", pos: "noun", cat: "Business", meaning: "A planned piece of work with a specific goal.", ex: "The project will be completed by June.", syn: ["initiative", "assignment"] },
  { w: "quality", ipa: "/ˈkwɑː.lə.ti/", pos: "noun", cat: "Business", meaning: "How good or bad something is.", ex: "Our factory is known for high quality products.", syn: ["standard", "grade"] },
  { w: "service", ipa: "/ˈsɝː.vɪs/", pos: "noun", cat: "Business", meaning: "Work done to help or assist customers.", ex: "The hotel offers excellent customer service.", syn: ["assistance", "support"] },
  { w: "supplier", ipa: "/səˈplaɪ.ɚ/", pos: "noun", cat: "Business", meaning: "A company that provides goods or materials.", ex: "We changed suppliers to reduce costs.", syn: ["vendor", "provider"] },
  { w: "payment", ipa: "/ˈpeɪ.mənt/", pos: "noun", cat: "Finance", meaning: "Money given in exchange for goods or services.", ex: "The payment was processed within two days.", syn: ["remittance", "settlement"] },
  { w: "invoice", ipa: "/ˈɪn.vɔɪs/", pos: "noun", cat: "Finance", meaning: "A document listing goods sold and the amount owed.", ex: "Please pay the invoice within 30 days.", syn: ["bill", "statement"] },
  { w: "budget", ipa: "/ˈbʌdʒ.ɪt/", pos: "noun", cat: "Finance", meaning: "A plan for how money will be spent.", ex: "The marketing budget was increased this year.", syn: ["financial plan", "allowance"] },
  { w: "expense", ipa: "/ɪkˈspens/", pos: "noun", cat: "Finance", meaning: "Money spent on something.", ex: "Travel expenses must be reported monthly.", syn: ["cost", "expenditure"] },
  { w: "salary", ipa: "/ˈsæl.ɚ.i/", pos: "noun", cat: "Finance", meaning: "Money paid regularly for work, usually monthly.", ex: "Her salary was raised after the promotion.", syn: ["wage", "pay"] },
  { w: "receipt", ipa: "/rɪˈsiːt/", pos: "noun", cat: "Finance", meaning: "A paper proving that payment was made.", ex: "Keep your receipt in case of a refund.", syn: ["proof of purchase", "voucher"] },
  { w: "shipment", ipa: "/ˈʃɪp.mənt/", pos: "noun", cat: "Trade", meaning: "A batch of goods sent to a destination.", ex: "The shipment arrived two days late.", syn: ["consignment", "delivery"] },
  { w: "delivery", ipa: "/dɪˈlɪv.ɚ.i/", pos: "noun", cat: "Trade", meaning: "The act of bringing goods to a place.", ex: "Delivery is free for orders over $50.", syn: ["dispatch", "distribution"] },
  { w: "purchase", ipa: "/ˈpɝː.tʃəs/", pos: "noun/verb", cat: "Trade", meaning: "To buy something, or the thing bought.", ex: "Customers can purchase items online or in store.", syn: ["buy", "acquisition"] },
  { w: "order", ipa: "/ˈɔːr.dɚ/", pos: "noun/verb", cat: "Trade", meaning: "A request to buy or supply goods.", ex: "Your order will ship within 24 hours.", syn: ["request", "purchase order"] },
  { w: "warehouse", ipa: "/ˈwer.haʊs/", pos: "noun", cat: "Trade", meaning: "A large building for storing goods.", ex: "The products are stored in a warehouse nearby.", syn: ["storage facility", "depot"] },
  { w: "factory", ipa: "/ˈfæk.tɚ.i/", pos: "noun", cat: "Trade", meaning: "A building where goods are manufactured.", ex: "The factory produces 10,000 units a day.", syn: ["plant", "manufacturing site"] },
  { w: "reservation", ipa: "/ˌrez.ɚˈveɪ.ʃən/", pos: "noun", cat: "General", meaning: "An arrangement to have something held for you.", ex: "I'd like to make a reservation for two.", syn: ["booking"] },
  { w: "available", ipa: "/əˈveɪ.lə.bəl/", pos: "adjective", cat: "General", meaning: "Able to be used or obtained; free to talk.", ex: "The manager is available after 3 p.m.", syn: ["free", "obtainable"] },
  { w: "customer", ipa: "/ˈkʌs.tə.mɚ/", pos: "noun", cat: "General", meaning: "A person who buys goods or services.", ex: "The customer asked for a full refund.", syn: ["client", "buyer"] },
  { w: "interview", ipa: "/ˈɪn.tɚ.vjuː/", pos: "noun/verb", cat: "General", meaning: "A formal meeting to evaluate a candidate.", ex: "Her interview is scheduled for Monday morning.", syn: ["meeting", "evaluation"] },
  { w: "insurance", ipa: "/ɪnˈʃʊr.əns/", pos: "noun", cat: "General", meaning: "A plan that pays for loss or damage.", ex: "The company provides health insurance to staff.", syn: ["coverage", "policy"] },
  { w: "finance", ipa: "/ˈfaɪ.næns/", pos: "noun", cat: "General", meaning: "The management of money.", ex: "She works in the finance department.", syn: ["accounting", "funding"] },
];
const VOCAB_CATEGORIES = ["Office", "Meeting", "Business", "Finance", "Trade", "General"];

const P5_TYPES = ["Verb Tense", "Subject-Verb Agreement", "Articles", "Prepositions", "Adj vs Adv", "Conjunction", "Passive Voice", "Gerund/Infinitive"];
const PART5_POOL = [
  { type: "Verb Tense", diff: "Easy", q: "The team ___ the new software next Tuesday.", options: ["installs", "will install", "installed", "installing"], answer: 1, explain: "'Next Tuesday' is a future time clue." },
  { type: "Verb Tense", diff: "Medium", q: "By 6 p.m., most staff ___ already left the office.", options: ["have", "has", "had", "will"], answer: 2, explain: "Past perfect for an action completed before another past point." },
  { type: "Subject-Verb Agreement", diff: "Medium", q: "Each of the applicants ___ a required document.", options: ["submit", "submits", "are submitting", "were submit"], answer: 1, explain: "'Each of' takes a singular verb." },
  { type: "Subject-Verb Agreement", diff: "Hard", q: "The number of complaints ___ decreased this quarter.", options: ["has", "have", "were", "are"], answer: 0, explain: "'The number of' is singular; use 'has'." },
  { type: "Articles", diff: "Easy", q: "We are hiring ___ experienced accountant.", options: ["a", "an", "the", "—"], answer: 1, explain: "'Experienced' starts with a vowel sound." },
  { type: "Articles", diff: "Medium", q: "___ information you requested is attached.", options: ["A", "An", "The", "—"], answer: 2, explain: "Refers to specific, already-mentioned information." },
  { type: "Prepositions", diff: "Medium", q: "The seminar starts ___ 9 a.m. sharp.", options: ["in", "on", "at", "by"], answer: 2, explain: "Use 'at' for a specific clock time." },
  { type: "Prepositions", diff: "Hard", q: "The revised policy is effective ___ January 1.", options: ["at", "on", "in", "for"], answer: 1, explain: "Use 'on' for a specific date." },
  { type: "Adj vs Adv", diff: "Medium", q: "The team completed the audit ___.", options: ["efficient", "efficiency", "efficiently", "efficient one"], answer: 2, explain: "An adverb is needed to modify the verb 'completed'." },
  { type: "Adj vs Adv", diff: "Easy", q: "It was a ___ presentation.", options: ["clear", "clearly", "clarity", "clears"], answer: 0, explain: "An adjective is needed to modify the noun 'presentation'." },
  { type: "Conjunction", diff: "Medium", q: "The flight was delayed ___ the storm.", options: ["because", "because of", "although", "so"], answer: 1, explain: "'Because of' is followed by a noun phrase." },
  { type: "Conjunction", diff: "Hard", q: "___ the price increase, sales remained strong.", options: ["Because", "Despite", "So that", "Unless"], answer: 1, explain: "'Despite' contrasts with a noun phrase." },
  { type: "Passive Voice", diff: "Medium", q: "The proposal ___ by the board next week.", options: ["will review", "reviews", "will be reviewed", "reviewed"], answer: 2, explain: "Future passive: 'will be + past participle'." },
  { type: "Passive Voice", diff: "Hard", q: "All visitors ___ to sign in at the front desk.", options: ["require", "are required", "requiring", "requires"], answer: 1, explain: "Passive voice: visitors receive the requirement." },
  { type: "Gerund/Infinitive", diff: "Medium", q: "The firm plans ___ two new branches this year.", options: ["opening", "to open", "open", "opened"], answer: 1, explain: "'Plan' is followed by an infinitive." },
  { type: "Gerund/Infinitive", diff: "Hard", q: "He is responsible for ___ the weekly report.", options: ["prepare", "preparing", "to prepare", "prepared"], answer: 1, explain: "'Responsible for' is followed by a gerund." },
  { type: "Verb Tense", diff: "Hard", q: "If the client ___ tomorrow, please notify the manager.", options: ["arrive", "arrives", "will arrive", "arrived"], answer: 1, explain: "Present simple is used in the if-clause for future meaning." },
  { type: "Subject-Verb Agreement", diff: "Easy", q: "Everyone in the office ___ invited to the party.", options: ["is", "are", "were", "have"], answer: 0, explain: "'Everyone' is singular." },
  { type: "Articles", diff: "Hard", q: "She was promoted to ___ senior analyst last month.", options: ["a", "an", "the", "—"], answer: 0, explain: "General role/title, first mention → 'a'." },
  { type: "Prepositions", diff: "Easy", q: "The invoice must be paid ___ 14 days.", options: ["at", "in", "within", "since"], answer: 2, explain: "'Within' expresses a time limit." },
  { type: "Adj vs Adv", diff: "Hard", q: "Customers were ___ satisfied with the new service.", options: ["high", "highly", "height", "higher"], answer: 1, explain: "An adverb modifies the adjective 'satisfied'." },
  { type: "Conjunction", diff: "Easy", q: "The store was closed, ___ we came back the next day.", options: ["so", "but", "because", "although"], answer: 0, explain: "'So' introduces a result." },
  { type: "Passive Voice", diff: "Easy", q: "The package ___ yesterday afternoon.", options: ["delivered", "was delivered", "delivers", "delivering"], answer: 1, explain: "Passive + past time → 'was delivered'." },
  { type: "Gerund/Infinitive", diff: "Easy", q: "We enjoy ___ with international clients.", options: ["work", "to work", "working", "worked"], answer: 2, explain: "'Enjoy' is followed by a gerund." },
];

const LISTENING_ITEMS = [
  { part: "Part 1", title: "Photo — Office Meeting", transcript: "A woman is presenting a chart to a group of colleagues in a conference room.", options: ["She is answering the phone.", "She is presenting a chart to colleagues.", "She is cleaning the whiteboard.", "She is leaving the room."], answer: 1 },
  { part: "Part 2", title: "Question-Response", transcript: "Question: When does the new shipment arrive? Response A: It arrives next Monday. Response B: I bought it yesterday. Response C: Yes, I agree.", options: ["It arrives next Monday.", "I bought it yesterday.", "Yes, I agree."], answer: 0 },
  { part: "Part 3", title: "Conversation — Scheduling a Repair", transcript: "Man: Our printer on the third floor stopped working again. Woman: I'll call the technician now, he usually comes within two hours. Man: Great, please tell him to check the paper feeder too.", options: ["The printer is brand new.", "The technician usually arrives within two hours.", "The woman will fix the printer herself.", "The paper feeder was already fixed."], answer: 1 },
  { part: "Part 4", title: "Talk — Office Announcement", transcript: "Attention all staff. Starting Monday, the third floor conference room will be closed for renovation. Please use the second floor room for meetings until further notice.", options: ["The building is closing permanently.", "A new employee is starting Monday.", "The third floor conference room will be closed for renovation.", "All meetings are canceled this month."], answer: 2 },
];

const READING_P6 = {
  title: "Part 6 — Text Completion",
  passage: [
    "Dear Team,",
    "The quarterly budget report is now ___(1)___ on the shared drive. Please review it before Friday's meeting. All department heads ___(2)___ to submit feedback by Thursday at noon. If you have questions, ___(3)___ contact the finance office directly.",
    "Thank you,\nFinance Team",
  ],
  blanks: [
    { options: ["available", "avail", "availability", "availed"], answer: 0, explain: "An adjective is needed after 'is'." },
    { options: ["require", "required", "are required", "requiring"], answer: 2, explain: "Passive voice: department heads receive the requirement." },
    { options: ["please", "pleasing", "pleased", "pleasure"], answer: 0, explain: "'Please' is used to make a polite request." },
  ],
};

const READING_P7 = {
  title: "Part 7 — Single Passage",
  passage: "NOTICE TO ALL STAFF\nThe annual company picnic will be held on Saturday, September 12, at Riverside Park. Registration begins at 10 a.m., and the event runs until 4 p.m. Employees may bring up to two guests. Please RSVP to the HR department by September 1 so we can arrange enough food and activities.",
  questions: [
    { q: "What is the purpose of the notice?", options: ["To announce a new HR policy", "To invite staff to a company event", "To report a schedule change", "To request vacation approval"], answer: 1, explain: "The notice announces the annual picnic." },
    { q: "By when should employees RSVP?", options: ["September 12", "October 1", "September 1", "The day of the event"], answer: 2, explain: "The passage states RSVP is due by September 1." },
    { q: "How many guests may each employee bring?", options: ["None", "One", "Two", "Unlimited"], answer: 2, explain: "The passage says 'up to two guests'." },
  ],
};

/* ============================================================
   HELPERS
   ============================================================ */
const LETTERS = ["A", "B", "C", "D"];

function speak(text, rate = 1) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech synthesis unavailable */ }
}

function DiffPill({ diff }) {
  const cls = diff === "Easy" ? "tp-diff-easy" : diff === "Hard" ? "tp-diff-hard" : "tp-diff-medium";
  return <span className={`tp-pill ${cls}`}>{diff}</span>;
}

function ProgressBar({ pct }) {
  return (
    <div className="tp-progress-track">
      <div className="tp-progress-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/** The signature scantron-bubble multiple choice question. */
function BubbleQuestion({ q, options, onAnswer, showResult, selected, answerIdx, compact }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {q && <p className="tp-serif" style={{ fontSize: compact ? 15 : 17, lineHeight: 1.5, margin: 0 }}>{q}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt, i) => {
          let rowCls = "tp-opt-row";
          let bubbleCls = "tp-bubble";
          if (showResult) {
            if (i === answerIdx) { rowCls += " tp-opt-row-correct"; bubbleCls += " tp-bubble-correct"; }
            else if (i === selected) { rowCls += " tp-opt-row-error"; bubbleCls += " tp-bubble-error"; }
          } else if (i === selected) {
            bubbleCls += " tp-bubble-selected";
          }
          return (
            <div key={i} className={rowCls} onClick={() => !showResult && onAnswer(i)}>
              <div className={bubbleCls}>{showResult && i === answerIdx ? <Check size={16} /> : showResult && i === selected && i !== answerIdx ? <X size={16} /> : LETTERS[i]}</div>
              <span style={{ fontSize: 14.5, color: "var(--ink)" }}>{opt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent)", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
        <Icon size={14} /> {eyebrow}
      </div>
      <h2 className="tp-serif" style={{ fontSize: 26, margin: "4px 0 6px", color: "var(--ink)" }}>{title}</h2>
      {sub && <p style={{ color: "var(--ink-soft)", fontSize: 14.5, margin: 0, maxWidth: 640 }}>{sub}</p>}
    </div>
  );
}

/* ============================================================
   GRAMMAR TAB
   ============================================================ */
function GrammarTab({ stats, onAnswer }) {
  const [activeId, setActiveId] = useState(GRAMMAR_TOPICS[0].id);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const topic = GRAMMAR_TOPICS.find((t) => t.id === activeId);
  const question = topic.questions[qi];
  const topicStat = stats[topic.id] || { correct: 0, total: 0 };

  const pick = (i) => {
    setSelected(i);
    setShowResult(true);
    onAnswer(topic.id, i === question.answer);
  };
  const next = () => {
    setSelected(null);
    setShowResult(false);
    setQi((qi + 1) % topic.questions.length);
  };
  const switchTopic = (id) => {
    setActiveId(id);
    setQi(0);
    setSelected(null);
    setShowResult(false);
  };

  return (
    <div>
      <SectionHeader icon={BookOpen} eyebrow="Grammar Course" title="Master the topics TOEIC Part 5 tests most" sub="Read the lesson, then fill in the answer sheet below. Every answer includes a plain-English explanation." />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div className="tp-scroll" style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 210, maxHeight: 560, overflowY: "auto" }}>
          {GRAMMAR_TOPICS.map((t) => {
            const s = stats[t.id];
            const acc = s && s.total ? Math.round((s.correct / s.total) * 100) : null;
            return (
              <div key={t.id} onClick={() => switchTopic(t.id)} className="tp-card" style={{
                padding: "10px 12px", cursor: "pointer",
                borderColor: activeId === t.id ? "var(--accent)" : "var(--line)",
                background: activeId === t.id ? "var(--accent-soft)" : "var(--surface)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{t.title}</span>
                  {acc !== null && <span className="tp-mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>{acc}%</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="tp-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
              <h3 className="tp-serif" style={{ margin: 0, fontSize: 20 }}>{topic.title}</h3>
              <DiffPill diff={topic.difficulty} />
            </div>
            <p style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.6 }}>{topic.explanation}</p>
            <div className="tp-mono" style={{ background: "var(--surface-2)", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{topic.formula}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, fontSize: 13.5 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--ink-soft)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".04em" }}>Examples</div>
                {topic.examples.map((e, i) => <div key={i} style={{ marginBottom: 3 }}>• {e}</div>)}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--error)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".04em" }}>Common mistakes</div>
                {topic.mistakes.map((e, i) => <div key={i} style={{ marginBottom: 3 }}>• {e}</div>)}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--accent-soft)", borderRadius: 8, fontSize: 13, color: "var(--ink)" }}>
              <strong>Memory tip:</strong> {topic.tip}
            </div>
          </div>

          <div className="tp-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span className="tp-mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>Question {qi + 1} / {topic.questions.length}</span>
              <span className="tp-mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{topicStat.correct}/{topicStat.total} correct this session</span>
            </div>
            <BubbleQuestion q={question.q} options={question.options} onAnswer={pick} showResult={showResult} selected={selected} answerIdx={question.answer} />
            {showResult && (
              <div style={{ marginTop: 12, fontSize: 13.5, padding: "10px 12px", borderRadius: 8, background: "var(--surface-2)" }}>
                {question.explain}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={next} disabled={!showResult} className="tp-tab-btn active" style={{ opacity: showResult ? 1 : 0.4, cursor: showResult ? "pointer" : "not-allowed" }}>
                Next question <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VOCABULARY TAB
   ============================================================ */
function VocabTab({ favorites, toggleFav, reviewed, markReviewed }) {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [flipped, setFlipped] = useState({});
  const [mode, setMode] = useState("cards"); // cards | quiz
  const [qIdx, setQIdx] = useState(0);
  const [qSelected, setQSelected] = useState(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const filtered = useMemo(() => {
    return VOCAB_WORDS.filter((v) => (cat === "All" || v.cat === cat) && v.w.toLowerCase().includes(query.toLowerCase()));
  }, [cat, query]);

  const flip = (w) => setFlipped((f) => ({ ...f, [w]: !f[w] }));

  // simple daily quiz pool: 8 random words w/ 3 distractor meanings
  const quizPool = useMemo(() => {
    const shuffled = [...VOCAB_WORDS].sort(() => Math.random() - 0.5).slice(0, 8);
    return shuffled.map((v) => {
      const distractors = VOCAB_WORDS.filter((x) => x.w !== v.w).sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.meaning);
      const options = [v.meaning, ...distractors].sort(() => Math.random() - 0.5);
      return { word: v.w, ipa: v.ipa, answer: options.indexOf(v.meaning), options };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode === "quiz" ? 1 : 0]);

  const currentQ = quizPool[qIdx];
  const pickQuiz = (i) => {
    setQSelected(i);
    setQuizScore((s) => ({ correct: s.correct + (i === currentQ.answer ? 1 : 0), total: s.total + 1 }));
  };
  const nextQuiz = () => {
    setQSelected(null);
    setQIdx((qIdx + 1) % quizPool.length);
  };

  return (
    <div>
      <SectionHeader icon={Layers} eyebrow="Vocabulary" title="High-frequency TOEIC workplace words" sub="Flip each card to reveal the meaning, tap the speaker to hear it, and star the words you want to review again." />

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div className="tp-tab-btn" onClick={() => setMode("cards")} style={{ background: mode === "cards" ? "var(--ink)" : "var(--surface)", color: mode === "cards" ? "var(--bg)" : "var(--ink-soft)", border: "1px solid var(--line)" }}>Flashcards</div>
        <div className="tp-tab-btn" onClick={() => setMode("quiz")} style={{ background: mode === "quiz" ? "var(--ink)" : "var(--surface)", color: mode === "quiz" ? "var(--bg)" : "var(--ink-soft)", border: "1px solid var(--line)" }}>Daily Quiz</div>
        {mode === "cards" && (
          <>
            <div style={{ position: "relative", marginLeft: "auto" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--ink-soft)" }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search words..." style={{ padding: "7px 10px 7px 30px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13 }} />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13 }}>
              <option>All</option>
              {VOCAB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </>
        )}
      </div>

      {mode === "cards" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
          {filtered.map((v) => {
            const isFlipped = !!flipped[v.w];
            const isFav = favorites.includes(v.w);
            return (
              <div key={v.w} className="tp-flip-card" style={{ height: 190 }} onClick={() => { flip(v.w); markReviewed(v.w); }}>
                <div className={`tp-flip-inner ${isFlipped ? "flipped" : ""}`} style={{ width: "100%", height: "100%" }}>
                  <div className="tp-card tp-flip-face" style={{ position: "absolute", inset: 0, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="tp-pill" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{v.cat}</span>
                      <Star size={17} fill={isFav ? "var(--accent)" : "none"} color="var(--accent)" onClick={(e) => { e.stopPropagation(); toggleFav(v.w); }} />
                    </div>
                    <div>
                      <div className="tp-serif" style={{ fontSize: 22 }}>{v.w}</div>
                      <div className="tp-mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{v.ipa} · {v.pos}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Tap to flip</span>
                      <Volume2 size={16} onClick={(e) => { e.stopPropagation(); speak(v.w); }} />
                    </div>
                  </div>
                  <div className="tp-card tp-flip-back" style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{v.meaning}</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-soft)", fontStyle: "italic" }}>"{v.ex}"</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>synonyms: {v.syn.join(", ")}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p style={{ color: "var(--ink-soft)" }}>No words match your search.</p>}
        </div>
      ) : (
        <div className="tp-card" style={{ padding: 20, maxWidth: 520 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span className="tp-mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>Word {qIdx + 1} / {quizPool.length}</span>
            <span className="tp-mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>Score: {quizScore.correct}/{quizScore.total}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span className="tp-serif" style={{ fontSize: 24 }}>{currentQ.word}</span>
            <Volume2 size={18} style={{ cursor: "pointer" }} onClick={() => speak(currentQ.word)} />
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: -8, marginBottom: 12 }}>Which meaning is correct?</p>
          <BubbleQuestion options={currentQ.options} onAnswer={pickQuiz} showResult={qSelected !== null} selected={qSelected} answerIdx={currentQ.answer} compact />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={nextQuiz} disabled={qSelected === null} className="tp-tab-btn active" style={{ opacity: qSelected === null ? 0.4 : 1 }}>Next word <ChevronRight size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LISTENING TAB
   ============================================================ */
function ListeningTab() {
  const [idx, setIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selected, setSelected] = useState(null);
  const item = LISTENING_ITEMS[idx];

  const change = (i) => { setIdx(i); setShowTranscript(false); setSelected(null); };

  return (
    <div>
      <SectionHeader icon={Headphones} eyebrow="Listening Practice" title="Parts 1–4, played aloud by your browser" sub="Audio is generated live with text-to-speech, so you can replay it, slow it down, or reveal the transcript any time." />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {LISTENING_ITEMS.map((it, i) => (
          <div key={i} onClick={() => change(i)} className="tp-tab-btn" style={{ background: idx === i ? "var(--ink)" : "var(--surface)", color: idx === i ? "var(--bg)" : "var(--ink-soft)", border: "1px solid var(--line)" }}>
            {it.part}
          </div>
        ))}
      </div>
      <div className="tp-card" style={{ padding: 22, maxWidth: 620 }}>
        <div className="tp-pill" style={{ background: "var(--accent-soft)", color: "var(--accent)", marginBottom: 8 }}>{item.part}</div>
        <h3 className="tp-serif" style={{ margin: "0 0 16px" }}>{item.title}</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => speak(item.transcript, rate)} className="tp-tab-btn active" style={{ padding: "10px 18px" }}>
            <Play size={15} /> Play audio
          </button>
          <button onClick={() => window.speechSynthesis && window.speechSynthesis.cancel()} className="tp-tab-btn" style={{ border: "1px solid var(--line)" }}>
            <Pause size={15} /> Stop
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <Clock size={14} color="var(--ink-soft)" />
            {[0.7, 1, 1.3].map((r) => (
              <span key={r} onClick={() => setRate(r)} className="tp-mono" style={{ cursor: "pointer", fontSize: 12, padding: "4px 8px", borderRadius: 6, background: rate === r ? "var(--accent-soft)" : "transparent", color: rate === r ? "var(--accent)" : "var(--ink-soft)" }}>{r}x</span>
            ))}
          </div>
        </div>

        {showTranscript && (
          <div style={{ background: "var(--surface-2)", padding: "12px 14px", borderRadius: 8, fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>
            {item.transcript}
          </div>
        )}
        <span onClick={() => setShowTranscript((s) => !s)} style={{ fontSize: 12.5, color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>
          {showTranscript ? "Hide transcript" : "Show transcript (shadowing practice)"}
        </span>

        <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
          <BubbleQuestion q="Choose the best answer:" options={item.options} onAnswer={setSelected} showResult={selected !== null} selected={selected} answerIdx={item.answer} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   READING TAB
   ============================================================ */
function ReadingTab() {
  const [blankAns, setBlankAns] = useState({});
  const [p7Ans, setP7Ans] = useState({});

  return (
    <div>
      <SectionHeader icon={FileText} eyebrow="Reading Practice" title="Parts 6 & 7" sub="Fill in the blanks for text completion, then read a short passage and answer comprehension questions." />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
        <div className="tp-card" style={{ padding: 20 }}>
          <h3 className="tp-serif" style={{ marginTop: 0 }}>{READING_P6.title}</h3>
          <div style={{ background: "var(--surface-2)", padding: "14px 16px", borderRadius: 8, fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-line", marginBottom: 16 }}>
            {READING_P6.passage.join("\n\n")}
          </div>
          {READING_P6.blanks.map((b, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Blank ({i + 1})</div>
              <BubbleQuestion options={b.options} onAnswer={(x) => setBlankAns((a) => ({ ...a, [i]: x }))} showResult={blankAns[i] !== undefined} selected={blankAns[i]} answerIdx={b.answer} compact />
              {blankAns[i] !== undefined && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>{b.explain}</div>}
            </div>
          ))}
        </div>

        <div className="tp-card" style={{ padding: 20 }}>
          <h3 className="tp-serif" style={{ marginTop: 0 }}>{READING_P7.title}</h3>
          <div style={{ background: "var(--surface-2)", padding: "14px 16px", borderRadius: 8, fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-line", marginBottom: 16 }}>
            {READING_P7.passage}
          </div>
          {READING_P7.questions.map((q, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <BubbleQuestion q={q.q} options={q.options} onAnswer={(x) => setP7Ans((a) => ({ ...a, [i]: x }))} showResult={p7Ans[i] !== undefined} selected={p7Ans[i]} answerIdx={q.answer} compact />
              {p7Ans[i] !== undefined && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>{q.explain}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PART 5 PRACTICE TAB
   ============================================================ */
function Part5Tab({ scoreHistory, addScoreEntry }) {
  const [diffFilter, setDiffFilter] = useState("All");
  const [mode, setMode] = useState("practice"); // practice | timed | exam
  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [finished, setFinished] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const timerRef = useRef(null);

  const pool = useMemo(() => PART5_POOL.filter((q) => diffFilter === "All" || q.diff === diffFilter), [diffFilter]);

  const startSet = useCallback((m) => {
    const shuffled = [...pool.keys()].sort(() => Math.random() - 0.5);
    setOrder(shuffled);
    setPos(0);
    setSelected(null);
    setMistakes([]);
    setCorrectCount(0);
    setAnsweredCount(0);
    setFinished(false);
    setReviewOpen(false);
    setMode(m);
    setTimeLeft(60);
  }, [pool]);

  useEffect(() => { startSet("practice"); /* eslint-disable-next-line */ }, [diffFilter]);

  useEffect(() => {
    if (mode !== "timed" || selected !== null || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); pick(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pos, selected, finished]);

  if (!order.length) return null;
  const q = pool[order[pos]];
  const isBookmarked = bookmarks.includes(order[pos]);

  function pick(i) {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.answer;
    setAnsweredCount((c) => c + 1);
    if (correct) setCorrectCount((c) => c + 1);
    else setMistakes((m) => [...m, { ...q, picked: i }]);
    if (mode === "exam") advance(i, correct, true);
  }

  function advance() {
    clearInterval(timerRef.current);
    if (pos + 1 >= order.length) {
      setFinished(true);
    } else {
      setPos((p) => p + 1);
      setSelected(null);
      setTimeLeft(60);
    }
  }

  function toggleBookmark() {
    setBookmarks((b) => (b.includes(order[pos]) ? b.filter((x) => x !== order[pos]) : [...b, order[pos]]));
  }

  useEffect(() => {
    if (finished) {
      addScoreEntry({ mode, correct: correctCount, total: order.length, date: new Date().toLocaleDateString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  return (
    <div>
      <SectionHeader icon={PenSquare} eyebrow="TOEIC Part 5" title="Unlimited grammar quizzes" sub="Drill sentence-completion questions across every grammar point. Switch modes, filter by difficulty, and review what you missed." />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {["practice", "timed", "exam"].map((m) => (
          <div key={m} className="tp-tab-btn" onClick={() => startSet(m)} style={{ background: mode === m ? "var(--ink)" : "var(--surface)", color: mode === m ? "var(--bg)" : "var(--ink-soft)", border: "1px solid var(--line)", textTransform: "capitalize" }}>
            {m} mode
          </div>
        ))}
        <select value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)} style={{ marginLeft: "auto", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13 }}>
          <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <div className="tp-tab-btn" onClick={() => setReviewOpen((r) => !r)} style={{ border: "1px solid var(--line)" }}>
          <Bookmark size={14} /> Review mistakes ({mistakes.length})
        </div>
      </div>

      {reviewOpen ? (
        <div className="tp-card" style={{ padding: 20, maxWidth: 640 }}>
          <h3 className="tp-serif" style={{ marginTop: 0 }}>Missed questions this session</h3>
          {mistakes.length === 0 && <p style={{ color: "var(--ink-soft)" }}>No mistakes yet — nicely done.</p>}
          {mistakes.map((m, i) => (
            <div key={i} style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}>
              <p style={{ margin: "0 0 6px", fontSize: 14 }}>{m.q}</p>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)" }}>Correct: <strong style={{ color: "var(--correct)" }}>{m.options[m.answer]}</strong> · You chose: <strong style={{ color: "var(--error)" }}>{m.picked >= 0 ? m.options[m.picked] : "(time out)"}</strong></p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>{m.explain}</p>
            </div>
          ))}
        </div>
      ) : finished ? (
        <div className="tp-card" style={{ padding: 26, maxWidth: 420, textAlign: "center" }}>
          <Award size={30} color="var(--accent)" />
          <h3 className="tp-serif" style={{ margin: "10px 0 4px" }}>Set complete</h3>
          <div className="tp-mono" style={{ fontSize: 34, fontWeight: 700, margin: "8px 0" }}>{correctCount}/{order.length}</div>
          <button className="tp-tab-btn active" style={{ margin: "10px auto 0", justifyContent: "center" }} onClick={() => startSet(mode)}><RotateCcw size={14} /> New set</button>
        </div>
      ) : (
        <div className="tp-card" style={{ padding: 20, maxWidth: 620 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="tp-mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>Q{pos + 1}/{order.length} · {q.type}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {mode === "timed" && <span className="tp-mono tp-live" style={{ fontSize: 13, color: timeLeft <= 10 ? "var(--error)" : "var(--ink-soft)" }}><Clock size={12} style={{ verticalAlign: -2 }} /> {timeLeft}s</span>}
              <Bookmark size={16} fill={isBookmarked ? "var(--accent)" : "none"} color="var(--accent)" style={{ cursor: "pointer" }} onClick={toggleBookmark} />
              <DiffPill diff={q.diff} />
            </div>
          </div>
          <BubbleQuestion q={q.q} options={q.options} onAnswer={pick} showResult={selected !== null && mode !== "exam"} selected={selected} answerIdx={q.answer} />
          {selected !== null && mode !== "exam" && <div style={{ marginTop: 12, fontSize: 13.5, padding: "10px 12px", borderRadius: 8, background: "var(--surface-2)" }}>{q.explain}</div>}
          {mode !== "exam" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={advance} disabled={selected === null} className="tp-tab-btn active" style={{ opacity: selected === null ? 0.4 : 1 }}>
                {pos + 1 >= order.length ? "Finish" : "Next"} <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {scoreHistory.length > 0 && !reviewOpen && (
        <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--ink-soft)" }}>
          Score history: {scoreHistory.slice(-6).map((s, i) => <span key={i} className="tp-mono" style={{ marginRight: 10 }}>{s.correct}/{s.total}</span>)}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MOCK TEST TAB
   ============================================================ */
const MOCK_LENGTHS = [10, 20, 30];
function MockTestTab({ onComplete }) {
  const [length, setLength] = useState(null);
  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef(null);

  const fullPool = useMemo(() => {
    const g = GRAMMAR_TOPICS.flatMap((t) => t.questions.map((q) => ({ q: q.q, options: q.options, answer: q.answer, explain: q.explain })));
    const p5 = PART5_POOL.map((q) => ({ q: q.q, options: q.options, answer: q.answer, explain: q.explain }));
    return [...g, ...p5];
  }, []);

  function start(n) {
    const shuffled = [...fullPool].sort(() => Math.random() - 0.5).slice(0, n);
    setOrder(shuffled);
    setLength(n);
    setPos(0);
    setAnswers({});
    setFinished(false);
    setSecondsLeft(n * 30);
  }

  useEffect(() => {
    if (!length || finished) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); setFinished(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [length, finished]);

  useEffect(() => {
    if (finished && length) {
      const correct = order.filter((q, i) => answers[i] === q.answer).length;
      onComplete({ correct, total: order.length, date: new Date().toLocaleDateString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (!length) {
    return (
      <div>
        <SectionHeader icon={ClipboardList} eyebrow="Mock Tests" title="Time yourself under real conditions" sub="Pick a length. Questions are auto-scored, with a full explanation for every answer at the end." />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {MOCK_LENGTHS.map((n) => (
            <div key={n} className="tp-card" onClick={() => start(n)} style={{ padding: 22, width: 170, cursor: "pointer", textAlign: "center" }}>
              <ClipboardList size={22} color="var(--accent)" />
              <div className="tp-serif" style={{ fontSize: 22, margin: "10px 0 2px" }}>{n} Qs</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{n === 10 ? "Mini test" : n === 20 ? "Standard set" : "Extended set"} · ~{Math.round(n * 0.5)} min</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (finished) {
    const correct = order.filter((q, i) => answers[i] === q.answer).length;
    const pct = Math.round((correct / order.length) * 100);
    return (
      <div>
        <SectionHeader icon={ClipboardList} eyebrow="Mock Test" title="Results" />
        <div className="tp-card tp-seal" style={{ padding: 28, maxWidth: 360, textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-soft)" }}>Score Report</div>
          <div className="tp-mono" style={{ fontSize: 46, fontWeight: 700, margin: "10px 0" }}>{correct}/{order.length}</div>
          <ProgressBar pct={pct} />
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8 }}>{pct}% accuracy</div>
        </div>
        <div style={{ maxWidth: 640 }}>
          <h3 className="tp-serif">Answer explanations</h3>
          {order.map((q, i) => (
            <div key={i} style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}>
              <p style={{ margin: "0 0 6px", fontSize: 14 }}>{i + 1}. {q.q}</p>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)" }}>
                Correct: <strong style={{ color: "var(--correct)" }}>{q.options[q.answer]}</strong>
                {answers[i] !== undefined && answers[i] !== q.answer && <> · You chose: <strong style={{ color: "var(--error)" }}>{q.options[answers[i]]}</strong></>}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>{q.explain}</p>
            </div>
          ))}
        </div>
        <button className="tp-tab-btn active" style={{ marginTop: 18 }} onClick={() => setLength(null)}><RotateCcw size={14} /> Take another test</button>
      </div>
    );
  }

  const q = order[pos];
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, maxWidth: 620 }}>
        <span className="tp-mono" style={{ fontSize: 13 }}>Question {pos + 1} / {order.length}</span>
        <span className="tp-mono tp-live" style={{ fontSize: 15, color: secondsLeft < 30 ? "var(--error)" : "var(--ink)" }}><Clock size={13} style={{ verticalAlign: -2 }} /> {mm}:{ss}</span>
      </div>
      <div className="tp-card" style={{ padding: 20, maxWidth: 620 }}>
        <BubbleQuestion q={q.q} options={q.options} onAnswer={(i) => setAnswers((a) => ({ ...a, [pos]: i }))} showResult={false} selected={answers[pos]} answerIdx={q.answer} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button className="tp-tab-btn" style={{ border: "1px solid var(--line)", opacity: pos === 0 ? 0.4 : 1 }} disabled={pos === 0} onClick={() => setPos((p) => p - 1)}><ChevronLeft size={15} /> Back</button>
          {pos + 1 < order.length ? (
            <button className="tp-tab-btn active" onClick={() => setPos((p) => p + 1)}>Next <ChevronRight size={15} /></button>
          ) : (
            <button className="tp-tab-btn active" onClick={() => setFinished(true)}>Submit test <Check size={15} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ANALYTICS TAB
   ============================================================ */
function AnalyticsTab({ grammarStats, vocabFavorites, vocabReviewed, part5History, mockHistory, planCompleted }) {
  const grammarData = GRAMMAR_TOPICS.map((t) => {
    const s = grammarStats[t.id];
    return { name: t.title.length > 12 ? t.title.slice(0, 11) + "…" : t.title, accuracy: s && s.total ? Math.round((s.correct / s.total) * 100) : 0 };
  });

  const totalGrammarAnswered = Object.values(grammarStats).reduce((a, s) => a + s.total, 0);
  const totalGrammarCorrect = Object.values(grammarStats).reduce((a, s) => a + s.correct, 0);
  const overallAcc = totalGrammarAnswered ? Math.round((totalGrammarCorrect / totalGrammarAnswered) * 100) : 0;

  const lastMock = mockHistory[mockHistory.length - 1];
  const predicted = Math.min(990, Math.max(10, Math.round(250 + overallAcc * 6 + (lastMock ? (lastMock.correct / lastMock.total) * 400 : 0))));

  const radialData = [{ name: "score", value: Math.round((predicted / 990) * 100), fill: "var(--accent)" }];

  return (
    <div>
      <SectionHeader icon={BarChart3} eyebrow="Analytics" title="Your session at a glance" sub="These numbers reflect what you've practiced in this session — the more you drill, the more accurate your predicted score becomes." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Grammar accuracy" value={`${overallAcc}%`} icon={BookOpen} />
        <StatCard label="Words reviewed" value={vocabReviewed.length} icon={Layers} />
        <StatCard label="Words favorited" value={vocabFavorites.length} icon={Star} />
        <StatCard label="Part 5 sets done" value={part5History.length} icon={PenSquare} />
        <StatCard label="Mock tests taken" value={mockHistory.length} icon={ClipboardList} />
        <StatCard label="Plan days done" value={planCompleted} icon={CalendarDays} />
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div className="tp-card" style={{ padding: 20, flex: 2, minWidth: 320, height: 300 }}>
          <h3 className="tp-serif" style={{ marginTop: 0, fontSize: 17 }}>Accuracy by grammar topic</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={grammarData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--ink-soft)" }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", fontSize: 12 }} />
              <Bar dataKey="accuracy" fill="var(--accent)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="tp-card" style={{ padding: 20, flex: 1, minWidth: 220, height: 300, textAlign: "center" }}>
          <h3 className="tp-serif" style={{ marginTop: 0, fontSize: 17 }}>Predicted TOEIC score</h3>
          <ResponsiveContainer width="100%" height="75%">
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="tp-mono" style={{ fontSize: 26, fontWeight: 700, marginTop: -70 }}>{predicted}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>out of 990</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="tp-card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color="var(--accent)" />
      </div>
      <div>
        <div className="tp-mono" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{label}</div>
      </div>
    </div>
  );
}

/* ============================================================
   30-DAY PLAN TAB
   ============================================================ */
function buildPlan() {
  return Array.from({ length: 30 }, (_, i) => {
    const topic = GRAMMAR_TOPICS[i % GRAMMAR_TOPICS.length];
    const words = VOCAB_WORDS.slice((i * 3) % VOCAB_WORDS.length, ((i * 3) % VOCAB_WORDS.length) + 3);
    return {
      day: i + 1,
      grammar: topic.title,
      words: words.length ? words : VOCAB_WORDS.slice(0, 3),
      listening: LISTENING_ITEMS[i % LISTENING_ITEMS.length].part,
      part5: 5,
      reading: i % 2 === 0 ? "Part 6 drill" : "Part 7 drill",
    };
  });
}

function PlanTab({ plan, completed, toggleDay }) {
  const [openDay, setOpenDay] = useState(null);
  const doneCount = completed.filter(Boolean).length;

  return (
    <div>
      <SectionHeader icon={CalendarDays} eyebrow="30-Day Study Plan" title="Your path to TOEIC 600+" sub="Each day bundles a grammar lesson, 20 new words, listening, Part 5 drills, and a mini quiz. Mark a day complete once you've worked through it." />
      <div style={{ marginBottom: 18, maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span>{doneCount} / 30 days complete</span>
          <span className="tp-mono">{Math.round((doneCount / 30) * 100)}%</span>
        </div>
        <ProgressBar pct={(doneCount / 30) * 100} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {plan.map((d, i) => {
          const isOpen = openDay === i;
          const done = completed[i];
          return (
            <div key={i} className="tp-card" style={{ padding: 14, borderColor: done ? "var(--correct)" : "var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setOpenDay(isOpen ? null : i)}>
                <span className="tp-serif" style={{ fontSize: 15 }}>Day {d.day}</span>
                <div onClick={(e) => { e.stopPropagation(); toggleDay(i); }} style={{
                  width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? "var(--correct)" : "var(--ink-soft)"}`,
                  background: done ? "var(--correct)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                  {done && <Check size={14} color="#fff" />}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>{d.grammar}</div>
              {isOpen && (
                <div style={{ marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 10, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div><strong>Grammar:</strong> {d.grammar}</div>
                  <div><strong>Vocabulary:</strong> {d.words.map((w) => w.w).join(", ")}</div>
                  <div><strong>Listening:</strong> {d.listening}</div>
                  <div><strong>Reading:</strong> {d.reading}</div>
                  <div><strong>Part 5 drill:</strong> {d.part5} questions</div>
                  <div><strong>Mini quiz + review yesterday</strong></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD TAB
   ============================================================ */
function DashboardTab({ grammarStats, vocabReviewed, part5History, mockHistory, plan, completed, streak, goToTab }) {
  const doneCount = completed.filter(Boolean).length;
  const currentDay = Math.min(30, doneCount + 1);
  const totalGrammarAnswered = Object.values(grammarStats).reduce((a, s) => a + s.total, 0);
  const totalGrammarCorrect = Object.values(grammarStats).reduce((a, s) => a + s.correct, 0);
  const grammarPct = totalGrammarAnswered ? Math.round((totalGrammarCorrect / totalGrammarAnswered) * 100) : 0;
  const lastMock = mockHistory[mockHistory.length - 1];
  const weekProgress = Math.min(7, doneCount % 7 === 0 && doneCount > 0 ? 7 : doneCount % 7);

  return (
    <div>
      <div className="tp-card tp-seal" style={{ padding: "24px 28px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>Day {currentDay} of 30</div>
          <h1 className="tp-serif" style={{ margin: "4px 0 6px", fontSize: 28 }}>Welcome back to your TOEIC 600+ plan</h1>
          <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 14 }}>Keep your streak alive — consistency beats cramming.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", padding: "10px 16px", borderRadius: 12 }}>
          <Flame size={22} color="var(--accent)" />
          <div>
            <div className="tp-mono" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>day streak</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 22 }}>
        <DashCard icon={Target} label="Weekly goal" value={`${weekProgress}/7 days`} pct={(weekProgress / 7) * 100} onClick={() => goToTab("plan")} />
        <DashCard icon={BookOpen} label="Grammar progress" value={`${grammarPct}% accuracy`} pct={grammarPct} onClick={() => goToTab("grammar")} />
        <DashCard icon={Layers} label="Vocabulary learned" value={`${vocabReviewed.length} / ${VOCAB_WORDS.length} words`} pct={(vocabReviewed.length / VOCAB_WORDS.length) * 100} onClick={() => goToTab("vocab")} />
        <DashCard icon={Headphones} label="Listening progress" value={`${LISTENING_ITEMS.length} clips available`} pct={40} onClick={() => goToTab("listening")} />
        <DashCard icon={PenSquare} label="Part 5 sets" value={`${part5History.length} completed`} pct={Math.min(100, part5History.length * 20)} onClick={() => goToTab("part5")} />
        <DashCard icon={ClipboardList} label="Latest mock score" value={lastMock ? `${lastMock.correct}/${lastMock.total}` : "Not taken yet"} pct={lastMock ? (lastMock.correct / lastMock.total) * 100 : 0} onClick={() => goToTab("mock")} />
      </div>

      <div className="tp-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 className="tp-serif" style={{ margin: 0, fontSize: 18 }}>Today's plan — Day {currentDay}</h3>
          <span className="tp-tab-btn" style={{ border: "1px solid var(--line)" }} onClick={() => goToTab("plan")}>View full plan <ChevronRight size={14} /></span>
        </div>
        {plan[currentDay - 1] && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, fontSize: 13 }}>
            <PlanChip label="Grammar" value={plan[currentDay - 1].grammar} />
            <PlanChip label="Vocabulary" value={plan[currentDay - 1].words.map((w) => w.w).join(", ")} />
            <PlanChip label="Listening" value={plan[currentDay - 1].listening} />
            <PlanChip label="Reading" value={plan[currentDay - 1].reading} />
          </div>
        )}
      </div>
    </div>
  );
}

function DashCard({ icon: Icon, label, value, pct, onClick }) {
  return (
    <div className="tp-card" onClick={onClick} style={{ padding: 16, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={16} color="var(--accent)" />
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</span>
      </div>
      <div className="tp-mono" style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{value}</div>
      <ProgressBar pct={pct} />
    </div>
  );
}

function PlanChip({ label, value }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: ".03em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12.5 }}>{value}</div>
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "grammar", label: "Grammar", icon: BookOpen },
  { id: "vocab", label: "Vocabulary", icon: Layers },
  { id: "listening", label: "Listening", icon: Headphones },
  { id: "reading", label: "Reading", icon: FileText },
  { id: "part5", label: "Part 5", icon: PenSquare },
  { id: "mock", label: "Mock Test", icon: ClipboardList },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "plan", label: "30-Day Plan", icon: CalendarDays },
];

export default function App() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState("dashboard");

  const [grammarStats, setGrammarStats] = useState(() =>
    Object.fromEntries(GRAMMAR_TOPICS.map((t) => [t.id, { correct: 0, total: 0 }]))
  );
  const [favorites, setFavorites] = useState([]);
  const [reviewed, setReviewed] = useState([]);
  const [part5History, setPart5History] = useState([]);
  const [mockHistory, setMockHistory] = useState([]);
  const [plan] = useState(buildPlan);
  const [completed, setCompleted] = useState(Array(30).fill(false));

  const handleGrammarAnswer = (topicId, correct) => {
    setGrammarStats((s) => ({ ...s, [topicId]: { correct: s[topicId].correct + (correct ? 1 : 0), total: s[topicId].total + 1 } }));
  };
  const toggleFav = (w) => setFavorites((f) => (f.includes(w) ? f.filter((x) => x !== w) : [...f, w]));
  const markReviewed = (w) => setReviewed((r) => (r.includes(w) ? r : [...r, w]));
  const addPart5Entry = (entry) => setPart5History((h) => [...h, entry]);
  const addMockEntry = (entry) => setMockHistory((h) => [...h, entry]);
  const toggleDay = (i) => setCompleted((c) => c.map((v, idx) => (idx === i ? !v : v)));

  // streak = consecutive completed days counting back from the highest completed index
  const streak = useMemo(() => {
    let s = 0;
    for (let i = completed.length - 1; i >= 0; i--) {
      if (completed[i]) s++;
      else if (s > 0) break;
    }
    // if nothing completed yet at the tail, still count trailing true block from start
    if (s === 0) {
      for (let i = 0; i < completed.length; i++) {
        if (completed[i]) s++;
        else break;
      }
    }
    return s;
  }, [completed]);

  return (
    <div className={`tp-root ${dark ? "tp-dark" : ""}`} style={{ minHeight: "100vh" }}>
      <style>{GLOBAL_CSS}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div className="tp-seal" style={{ width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="tp-serif" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>600</span>
            </div>
            <span className="tp-serif" style={{ fontSize: 17, fontWeight: 700 }}>Ascent TOEIC</span>
          </div>
          <nav className="tp-scroll" style={{ display: "flex", gap: 4, overflowX: "auto", marginLeft: 8 }}>
            {TABS.map((t) => (
              <div key={t.id} className={`tp-tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <t.icon size={14} /> {t.label}
              </div>
            ))}
          </nav>
          <div onClick={() => setDark((d) => !d)} className="tp-tab-btn" style={{ marginLeft: "auto", border: "1px solid var(--line)" }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 20px 60px" }}>
        {tab === "dashboard" && (
          <DashboardTab grammarStats={grammarStats} vocabReviewed={reviewed} part5History={part5History} mockHistory={mockHistory} plan={plan} completed={completed} streak={streak} goToTab={setTab} />
        )}
        {tab === "grammar" && <GrammarTab stats={grammarStats} onAnswer={handleGrammarAnswer} />}
        {tab === "vocab" && <VocabTab favorites={favorites} toggleFav={toggleFav} reviewed={reviewed} markReviewed={markReviewed} />}
        {tab === "listening" && <ListeningTab />}
        {tab === "reading" && <ReadingTab />}
        {tab === "part5" && <Part5Tab scoreHistory={part5History} addScoreEntry={addPart5Entry} />}
        {tab === "mock" && <MockTestTab onComplete={addMockEntry} />}
        {tab === "analytics" && (
          <AnalyticsTab grammarStats={grammarStats} vocabFavorites={favorites} vocabReviewed={reviewed} part5History={part5History} mockHistory={mockHistory} planCompleted={completed.filter(Boolean).length} />
        )}
        {tab === "plan" && <PlanTab plan={plan} completed={completed} toggleDay={toggleDay} />}
      </main>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "18px 20px", textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
        Built for the 30-day sprint to TOEIC 600+ · Progress in this demo resets on page reload
      </footer>
    </div>
  );
}
