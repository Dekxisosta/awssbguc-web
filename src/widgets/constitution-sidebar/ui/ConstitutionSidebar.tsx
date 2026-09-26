"use client";

import { useEffect, useRef, useState } from "react";

type SectionEntry = { id: string; label: string };
type ArticleEntry = { id: string; label: string; sections: SectionEntry[] };

const NAV: ArticleEntry[] = [
  { id: "preamble", label: "Preamble", sections: [] },
  { id: "article-i", label: "I. General Provisions", sections: [
    { id: "article-i-s1", label: "§1. Name and Acronym" },
    { id: "article-i-s2", label: "§2. Vision and Mission" },
    { id: "article-i-s3", label: "§3. Core Values" },
    { id: "article-i-s4", label: "§4. Brief History and Evolution" },
    { id: "article-i-s5", label: "§5. Seal, Branding, and Asset Usage" },
  ]},
  { id: "article-ii", label: "II. Meetings", sections: [
    { id: "article-ii-s1", label: "§1. Classification and Frequency" },
    { id: "article-ii-s2", label: "§2. Notice and Agenda" },
    { id: "article-ii-s3", label: "§3. Quorum Requirements" },
    { id: "article-ii-s4", label: "§4. Virtual and Hybrid Governance" },
    { id: "article-ii-s5", label: "§5. Documentation and Follow-Up" },
  ]},
  { id: "article-iii", label: "III. Membership, Rights, and Duties", sections: [
    { id: "article-iii-s1", label: "§1. Eligibility and Classification" },
    { id: "article-iii-s2", label: "§2. Rights of Members" },
    { id: "article-iii-s3", label: "§3. Duties and Responsibilities" },
  ]},
  { id: "article-iv", label: "IV. Organizational Structure", sections: [
    { id: "article-iv-s1", label: "§1. Hierarchy and Composition" },
    { id: "article-iv-s2", label: "§2. Core Team Powers and Functions" },
    { id: "article-iv-s3", label: "§3. Directors and Leads" },
    { id: "article-iv-s4", label: "§4. Technical Working Group (TWG)" },
  ]},
  { id: "article-v", label: "V. Tenureship, Succession, and Vacancies", sections: [
    { id: "article-v-s1", label: "§1. Term of Office and Tenure" },
    { id: "article-v-s2", label: "§2. Succession Protocol" },
    { id: "article-v-s3", label: "§3. Performance Evaluation" },
    { id: "article-v-s4", label: "§4. Recruitment and Appointment" },
    { id: "article-v-s5", label: "§5. Removal and Resignation" },
    { id: "article-v-s6", label: "§6. Governance and Grievance" },
  ]},
  { id: "article-vi", label: "VI. Finance and Appropriations", sections: [
    { id: "article-vi-s1", label: "§1. Sources of Funds" },
    { id: "article-vi-s2", label: "§2. Custody and Dual Governance" },
    { id: "article-vi-s3", label: "§3. Budgeting and Disbursement" },
    { id: "article-vi-s4", label: "§4. Liquidation and Receipts" },
    { id: "article-vi-s5", label: "§5. Auditing and Compliance" },
  ]},
  { id: "article-vii", label: "VII. Student Participation", sections: [
    { id: "article-vii-s1", label: "§1. Program Affiliation" },
    { id: "article-vii-s2", label: "§2. Cross-Sectoral Participation" },
    { id: "article-vii-s3", label: "§3. External Representation" },
    { id: "article-vii-s4", label: "§4. Conduct in Tech Ecosystem" },
  ]},
  { id: "article-viii", label: "VIII. Faculty Adviser", sections: [
    { id: "article-viii-s1", label: "§1. Qualifications and Designation" },
    { id: "article-viii-s2", label: "§2. Term of Advisory" },
    { id: "article-viii-s3", label: "§3. Duties and Responsibilities" },
  ]},
  { id: "article-ix", label: "IX. Amendments and Revisions", sections: [
    { id: "article-ix-s1", label: "§1. Proposal of Amendments" },
    { id: "article-ix-s2", label: "§2. Ratification Process" },
    { id: "article-ix-s3", label: "§3. Plebiscite for Major Revisions" },
  ]},
  { id: "article-x", label: "X. Transitory and Final Provisions", sections: [
    { id: "article-x-s1", label: "§1. Effectivity" },
    { id: "article-x-s2", label: "§2. Turnover Procedures" },
    { id: "article-x-s3", label: "§3. Repealing Clause" },
    { id: "article-x-s4", label: "§4. Separability Clause" },
  ]},
];

const ALL_IDS = NAV.flatMap((a) => [a.id, ...a.sections.map((s) => s.id)]);

export function ConstitutionSidebar() {
  const [activeId, setActiveId] = useState<string>("preamble");
  const [open, setOpen] = useState<Record<string, boolean>>({ preamble: false });
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const parentArticle = NAV.find(
      (a) => a.id === activeId || a.sections.some((s) => s.id === activeId)
    );
    if (parentArticle) {
      const next: Record<string, boolean> = {};
      NAV.forEach((a) => { next[a.id] = a.id === parentArticle.id; });
      setOpen(next);
    }
  }, [activeId]);

  useEffect(() => {
    const ratioMap = new Map<string, number>(ALL_IDS.map((id) => [id, 0]));

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratioMap.set(e.target.id, e.intersectionRatio));
        let bestId = activeId;
        let bestRatio = -1;
        ratioMap.forEach((ratio, id) => {
          if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
        });
        setActiveId(bestId);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0], rootMargin: "0px 0px -40% 0px" }
    );

    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }

  function toggleArticle(id: string) {
    setOpen((prev) => {
      const next: Record<string, boolean> = {};
      NAV.forEach((a) => { next[a.id] = false; });
      next[id] = !prev[id];
      return next;
    });
  }

  return (
    <nav
      aria-label="Article shortcuts"
      className="pt-10 sticky top-[calc(3.75rem+2rem)] hidden h-[calc(100vh-3.75rem-2rem)] w-52 shrink-0 overflow-y-auto pb-10 lg:block"
    >
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Articles
      </p>
      <ul className="space-y-0.5">
        {NAV.map((article) => {
          const articleActive = activeId === article.id || article.sections.some((s) => s.id === activeId);
          const isOpen = !!open[article.id];
          const hasSections = article.sections.length > 0;

          return (
            <li key={article.id}>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => scrollTo(article.id)}
                  className={[
                    "flex-1 rounded-md py-1.5 pl-3 pr-1 text-left text-xs transition-colors",
                    articleActive
                      ? "font-semibold text-[#00e482]"
                      : "text-neutral-400 hover:text-neutral-200",
                  ].join(" ")}
                >
                  {article.label}
                </button>
                {hasSections && (
                  <button
                    type="button"
                    aria-label={isOpen ? "Collapse sections" : "Expand sections"}
                    onClick={() => toggleArticle(article.id)}
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
                      articleActive
                        ? "text-[#00e482]"
                        : "text-neutral-500 hover:text-neutral-300",
                    ].join(" ")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>

              {hasSections && isOpen && (
                <ul className="mb-1 mt-0.5 border-l border-neutral-700 pl-3">
                  {article.sections.map((sec) => {
                    const secActive = activeId === sec.id;
                    return (
                      <li key={sec.id}>
                        <button
                          type="button"
                          onClick={() => scrollTo(sec.id)}
                          className={[
                            "w-full rounded py-1 pl-2 pr-1 text-left text-[11px] transition-colors",
                            secActive
                              ? "font-semibold text-[#00e482]"
                              : "text-neutral-500 hover:text-neutral-200",
                          ].join(" ")}
                        >
                          {sec.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
