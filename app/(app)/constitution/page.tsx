import { ConstitutionSidebar } from "@/src/widgets/constitution-sidebar";

export const metadata = {
  title: "Constitution & By-Laws — AWSSBG-UC",
};

export default function ConstitutionPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      {/* Page header */}
      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-50">Constitution and By-Laws</h1>
      <p className="mt-2 text-sm text-neutral-400">
        AWS Student Builder Group – University of Cabuyao (Pamantasan ng Cabuyao)
        &nbsp;·&nbsp; Adopted: November 26, 2023 &nbsp;·&nbsp; Last Amended: August 15, 2026
      </p>

      {/* Two-column layout: sidebar + content */}
      <div className="mt-6 flex gap-8">
        <ConstitutionSidebar />

        {/* Main content */}
        <div className="min-w-0 flex-1">
      <div className="space-y-14 text-base text-neutral-200">

        {/* ── Preamble ── */}
        <section aria-labelledby="preamble">
          <h2 id="preamble" className="mb-4 text-xs font-bold uppercase tracking-widest text-[#00e482]">
            Preamble
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-neutral-300">
            <p>
              We, the members of the AWS Student Builder Group at the University of Cabuyao, unite to
              promote learning, innovation, and collaboration in the realm of cloud computing, artificial
              intelligence, and modern technology. Recognizing the increasing significance of cloud and
              emerging technologies in today&apos;s digital landscape, our organization aims to provide a
              platform for students to enhance their skills, explore innovative solutions, and engage with
              industry professionals.
            </p>
            <p>
              Furthermore, we are committed to promoting inclusivity, diversity, and ethical practices
              within our community. We value the participation of students from diverse backgrounds,
              academic disciplines, and skill levels. We foster a culture of respect, collaboration, and
              integrity, ensuring that every member feels valued and supported in their journey towards
              mastery of AWS and modern computing disciplines.
            </p>
            <p>
              We pledge to uphold these principles, inspire innovation, and contribute to the growth of
              cloud computing and technology knowledge within our university, the AWS Student User Group
              Philippines, the AWS User Group Philippines, and the broader builder ecosystem.
            </p>
          </div>
        </section>

        {/* ── Article I ── */}
        <section aria-labelledby="article-i">
          <ArticleHeading id="article-i">Article I. General Provisions</ArticleHeading>

          <SectionBlock id="article-i-s1" title="Section 1. Name and Acronym">
            <Item number="1.1">
              <strong>Official Name:</strong> The official name of this organization shall be the AWS
              Student Builder Group – University of Cabuyao (Pamantasan ng Cabuyao).
            </Item>
            <Item number="1.2">
              <strong>Official Acronym:</strong> The organization shall be officially abbreviated and
              referred to as <strong>AWS SBG UC</strong> (or AWS SBG – UC / PnC).
            </Item>
          </SectionBlock>

          <SectionBlock id="article-i-s2" title="Section 2. Vision and Mission">
            <Item number="2.1">
              <strong>Vision:</strong> As a student organization centered around Amazon Web Services,
              cloud computing, artificial intelligence, and emerging technologies, we envision a
              sustainable, long-standing community of passionate student builders across universities
              nationwide who embrace innovation and leverage modern tech solutions to drive technological
              advancements.
            </Item>
            <Item number="2.2">
              <strong>Mission:</strong> We are committed to:
              <SubList>
                <SubItem number="2.2.1">
                  Empowering students across diverse academic backgrounds to build and specialize in
                  cloud computing, artificial intelligence, and modern software development through
                  inclusive educational initiatives, hands-on workshops, and professional networking
                  avenues.
                </SubItem>
                <SubItem number="2.2.2">
                  Fostering a spirit of volunteerism and civic responsibility by engaging in community
                  service initiatives that leverage technology to create meaningful societal impact.
                </SubItem>
                <SubItem number="2.2.3">
                  Serving as a primary bridge to equip student builders with the technical skills,
                  tools, and industry certifications required to thrive in the global digital economy
                  and contribute to industry transformation through AWS ecosystem tools.
                </SubItem>
              </SubList>
            </Item>
          </SectionBlock>

          <SectionBlock id="article-i-s3" title="Section 3. Core Values">
            <Item number="3.1">
              <strong>Technical Excellence &amp; Innovation:</strong> Striving for continuous learning,
              practical mastery, and ethical innovation in cloud infrastructure, artificial intelligence,
              and software engineering.
            </Item>
            <Item number="3.2">
              <strong>Inclusivity and Diversity:</strong> Welcoming and supporting student builders of
              all skill levels, academic disciplines, and backgrounds.
            </Item>
            <Item number="3.3">
              <strong>Integrity and Governance:</strong> Conducting all organizational, technical, and
              administrative operations with transparency, accountability, and ethical responsibility.
            </Item>
            <Item number="3.4">
              <strong>Community Impact:</strong> Utilizing technical expertise and builder mindsets to
              give back to the university, local communities, and the broader technology ecosystem.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-i-s4" title="Section 4. Brief History and Evolution">
            <Item number="4.1">
              <strong>Establishment:</strong> The organization was founded in 2023 by students from the
              College of Computing Studies at the University of Cabuyao, located at Katapatan Mutual
              Homes, Brgy. Banay-banay, City of Cabuyao, Laguna 4025.
            </Item>
            <Item number="4.2">
              <strong>Regional Milestone:</strong> It holds the distinction of being established as the
              first official AWS-backed student group in Region 4A (CALABARZON), Philippines.
            </Item>
            <Item number="4.3">
              <strong>Organizational Evolution:</strong> Originally established as an AWS Cloud Club,
              the organization formally adopted the name AWS Student Builder Group to align with global
              AWS student community directions—expanding its mission to encompass artificial
              intelligence, machine learning, and broader end-to-end technology solutions.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-i-s5" title="Section 5. Seal, Branding, and Asset Usage">
            <Item number="5.1">
              <strong>Brand Alignment:</strong> The official logo, seal, and visual assets of the
              organization shall strictly comply with official AWS Student Builder Group brand
              guidelines, AWS Student Community policies, and institutional regulations of the
              University of Cabuyao.
            </Item>
            <Item number="5.2">
              <strong>Governance:</strong> Any official modifications to local branding assets,
              promotional materials, or secondary logos must be vetted by the Chief Marketing Officer
              (CMO) and are subject to final approval by the Chief Executive Officer (CEO).
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article II ── */}
        <section aria-labelledby="article-ii">
          <ArticleHeading id="article-ii">Article II. Meetings</ArticleHeading>

          <SectionBlock id="article-ii-s1" title="Section 1. Classification and Frequency of Meetings">
            <Item number="1.1">
              <strong>General Assembly (GA):</strong> The organization shall hold a General Assembly at
              least once per academic semester for the general membership to review accomplishments,
              announce upcoming initiatives, and discuss organizational updates.
            </Item>
            <Item number="1.2">
              <strong>Executive Board Meetings:</strong> The Core Team (C-Suite and Executive Officers)
              shall convene bi-weekly, or as deemed necessary by the Chief Executive Officer (CEO) or
              Chief Operating Officer (COO), to evaluate operations, strategy, and project execution.
            </Item>
            <Item number="1.3">
              <strong>Departmental Meetings:</strong> Department Directors and Leads shall schedule
              regular internal meetings to manage tactical workflows, technical development, financial
              planning, and marketing deliverables.
            </Item>
            <Item number="1.4">
              <strong>Emergency or Special Meetings:</strong> Special meetings may be called on short
              notice by the CEO, COO, or upon the written petition of a simple majority of the Executive
              Board to address urgent or unforeseen matters.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-ii-s2" title="Section 2. Notice of Meetings and Agenda Coordination">
            <Item number="2.1">
              <strong>Regular Meetings:</strong> Official written or digital notice for regular
              Executive Board meetings or General Assemblies must be communicated at least three (3)
              calendar days prior to the scheduled date via the organization&apos;s official
              communication channels.
            </Item>
            <Item number="2.2">
              <strong>Emergency Meetings:</strong> Notice for emergency meetings must be issued at
              least twenty-four (24) hours prior to the session, accompanied by an urgent agenda
              summary.
            </Item>
            <Item number="2.3">
              <strong>Agenda Preparation:</strong> The Executive Associate (Co-Lead), in coordination
              with the CEO and COO, shall be responsible for collating agenda items from department
              heads and distributing the finalized meeting agenda to attendees prior to the call to
              order.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-ii-s3" title="Section 3. Quorum Requirements">
            <Item number="3.1">
              <strong>Executive Board Meetings:</strong> A simple majority (50% + 1) of the voting
              members of the active Executive Board shall constitute a quorum necessary to officially
              conduct business, vote, and pass binding resolutions.
            </Item>
            <Item number="3.2">
              <strong>General Assembly:</strong> The active members present during a duly called
              General Assembly shall constitute a quorum for passing general membership resolutions,
              provided proper notice was given to all members.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-ii-s4" title="Section 4. Virtual, Hybrid, and Asynchronous Governance">
            <Item number="4.1">
              <strong>Modern Meeting Formats:</strong> Official meetings may be conducted physically,
              virtually through verified video conferencing platforms (e.g., Google Meet, Zoom), or in
              a hybrid format.
            </Item>
            <Item number="4.2">
              <strong>Validity:</strong> Virtual attendance and digitally cast votes shall hold equal
              validity to physical presence and manual voting, provided identity and attendance are
              verified.
            </Item>
            <Item number="4.3">
              <strong>Asynchronous Approvals:</strong> For time-sensitive logistical or administrative
              matters, digital polls or written sign-offs on official internal channels shall be valid
              once the required quorum threshold is met and logged.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-ii-s5" title="Section 5. Administrative Support, Documentation, and Follow-Up">
            <Item number="5.1">
              <strong>Meeting Minutes and Official Records:</strong> The Executive Secretary shall
              record official minutes for all Executive Board meetings and General Assemblies,
              archiving and circulating finalized copies within forty-eight (48) hours following
              adjournment.
            </Item>
            <Item number="5.2">
              <strong>Action Item Tracking and Administrative Liaison:</strong> The Executive Associate
              (Co-Lead) shall track action items, follow up on deliverables with respective departments
              following each meeting, manage inter-departmental administrative requests, and assist the
              CEO in monitoring executive deadlines.
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article III ── */}
        <section aria-labelledby="article-iii">
          <ArticleHeading id="article-iii">Article III. Membership, Rights, and Duties</ArticleHeading>

          <SectionBlock id="article-iii-s1" title="Section 1. Membership Eligibility and Classification">
            <Item number="1.1">
              <strong>Eligibility:</strong> Membership in the AWS Student Builder Group – University of
              Cabuyao (AWS SBG UC) is open to all currently enrolled undergraduate and graduate
              students of the University of Cabuyao across all academic colleges and degree programs who
              express an interest in cloud computing, artificial intelligence, and software development.
            </Item>
            <Item number="1.2">
              <strong>General Members:</strong> Registered students who participate in organization
              events, workshops, bootcamps, and community initiatives.
            </Item>
            <Item number="1.3">
              <strong>Executive and Departmental Officers:</strong> Members selected, appointed, or
              elected to serve in leadership, administrative, operational, creative, or technical
              capacities across the organization&apos;s departments.
            </Item>
            <Item number="1.4">
              <strong>Inclusivity and Non-Discrimination:</strong> Membership shall not be restricted
              or denied on the basis of age, sex, gender identity, religious affiliation,
              socio-economic status, degree program, or initial level of technical knowledge.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-iii-s2" title="Section 2. Rights of Members">
            <Item number="2.1">
              <strong>Access to Technical and Educational Resources:</strong> Every active member has
              the right to access club-organized workshops, training materials, cloud development
              sandboxes, artificial intelligence bootcamps, and AWS-related certification resources
              provided through the organization.
            </Item>
            <Item number="2.2">
              <strong>Freedom of Expression and Participation:</strong> Members have the right to
              freely express their opinions, suggest initiatives, voice concerns, and actively engage
              in organizational discussions and General Assemblies without fear of reprisal.
            </Item>
            <Item number="2.3">
              <strong>Voting Rights:</strong> Active members hold the right to participate and cast
              their votes during plebiscites, general membership resolutions, and constitutional
              ratifications as outlined in this Constitution.
            </Item>
            <Item number="2.4">
              <strong>Due Process:</strong> Any member subjected to administrative or disciplinary
              action retains the right to notice of grievances, fair hearing, and just due process
              before the Executive Board and the Faculty Adviser.
            </Item>
            <Item number="2.5">
              <strong>Safe and Collaborative Environment:</strong> Members are entitled to a safe,
              harassment-free, and respectful environment that fosters collaborative learning and
              professional development.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-iii-s3" title="Section 3. Duties and Responsibilities of Members">
            <Item number="3.1">
              <strong>Upholding Institutional and Club Standards:</strong> Members shall abide by this
              Constitution and By-Laws, the University of Cabuyao Student Handbook, and the official
              community guidelines set by AWS global student programs.
            </Item>
            <Item number="3.2">
              <strong>Ethical Technology and AI Usage:</strong> Members must uphold high standards of
              academic and technological integrity, which includes:
              <SubList>
                <SubItem number="3.2.1">
                  Practicing responsible and ethical use of cloud resources, computing credits, and
                  artificial intelligence tools.
                </SubItem>
                <SubItem number="3.2.2">
                  Refraining from unauthorized access, malicious hacking, exploitation of cloud
                  infrastructure, or misuse of club-provided credentials.
                </SubItem>
                <SubItem number="3.2.3">
                  Respecting intellectual property, open-source licenses, and attribution standards
                  in all individual and collaborative projects.
                </SubItem>
              </SubList>
            </Item>
            <Item number="3.3">
              <strong>Active Engagement:</strong> Members are encouraged to support organization
              initiatives, participate in community service projects, and share knowledge with fellow
              student builders.
            </Item>
            <Item number="3.4">
              <strong>Brand and Asset Protection:</strong> Members shall avoid misrepresenting the
              organization&apos;s name, logo, or official stance, and shall handle any organizational
              physical and digital property with due care.
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article IV ── */}
        <section aria-labelledby="article-iv">
          <ArticleHeading id="article-iv">Article IV. Organizational Structure</ArticleHeading>

          <SectionBlock id="article-iv-s1" title="Section 1. Hierarchy and Composition">
            <p className="mb-3 text-neutral-300">
              The governance and operational execution of AWS SBG UC shall be structured across four
              (4) distinct tiers:
            </p>
            <Item number="1.1">
              <strong>Tier I – Executive Board (Core Team):</strong> Composed of the C-Suite officers
              and Executive Staff—including the Student Builder Group Lead (CEO), Executive Associate
              (Co-Lead), Executive Secretary, and Chief Officers—responsible for strategic planning,
              high-level governance, and institutional leadership.
            </Item>
            <Item number="1.2">
              <strong>Tier II – Department Directors:</strong> Officers responsible for heading
              functional divisions under each Executive Office and supervising tactical operations.
            </Item>
            <Item number="1.3">
              <strong>Tier III – Department Leads:</strong> Officers assigned to execute specialized
              operational workflows, manage project components, and coordinate team deliverables.
            </Item>
            <Item number="1.4">
              <strong>Tier IV – Technical Working Group (TWG):</strong> The operational engine of the
              organization, operating primarily under the Office of the COO in close technical
              coordination with the Office of the CTO, composed of department leads, technical
              volunteers, and project associates mobilized for tech-driven event execution and system
              implementations.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-iv-s2" title="Section 2. Powers and Functions of the Core Team (Executive Board)">
            <div className="space-y-5">

              <SubSection title="2.1. Office of the Chief Executive Officer (CEO)">
                <OfficerBlock title="2.1.1. Chief Executive Officer (CEO) / AWS Student Builder Group Lead">
                  <li>Serves as the primary institutional representative and official liaison to AWS Global, AWS Student Community programs, university administrators, and external entities.</li>
                  <li>Presides over Executive Board meetings and provides overarching vision and strategic leadership for all organizational initiatives.</li>
                  <li>Retains primary signatory authority over official communications, partnership agreements, budget allocations, and constitutional matters.</li>
                </OfficerBlock>
                <OfficerBlock title="2.1.2. Executive Associate / Co-Lead">
                  <li>Serves as the Co-Lead of the organization, working in direct partnership with the CEO to drive overall strategic execution, leadership oversight, and administrative governance.</li>
                  <li>Acts as the primary administrative officer managing inter-departmental workflows, cross-functional tracking, and executive milestone monitoring.</li>
                  <li>Collates agenda points from department heads prior to Executive Meetings and conducts operational follow-ups on assigned deliverables.</li>
                  <li>Assumes presiding responsibilities and operational authority in the temporary absence or official delegation of the CEO.</li>
                </OfficerBlock>
                <OfficerBlock title="2.1.3. Executive Secretary">
                  <li>Serves as the official custodian of all organizational records, minutes, documentation archives, and formal correspondence.</li>
                  <li>Issues official notices and call-to-order communications for Executive Meetings and General Assemblies.</li>
                  <li>Prepares, files, and secures official resolutions, meeting minutes, and accreditation documents required by the university and AWS programs.</li>
                </OfficerBlock>
              </SubSection>

              <SubSection title="2.2. Office of the Chief Operating Officer (COO)">
                <OfficerBlock title="2.2.1. Chief Operating Officer (COO)">
                  <li>Directs internal operations, project management lifecycles, and logistical execution for all organization events, workshops, and build sessions.</li>
                  <li>Exercises direct administrative and managerial oversight over the Technical Working Group (TWG) for event execution, technical setups, and operational logistics.</li>
                  <li>Formulates operational guidelines, risk management protocols, venue coordination, and contingency plans for club activities.</li>
                  <li>Superintends the Directors under the Operations Department, ensuring timelines and operational standards are met.</li>
                </OfficerBlock>
              </SubSection>

              <SubSection title="2.3. Office of the Chief Finance Officer (CFO)">
                <OfficerBlock title="2.3.1. Chief Finance Officer (CFO)">
                  <li>Manages the fiscal health, custody of funds, budgeting, and financial allocations of the organization.</li>
                  <li>Enforces proper disbursement procedures, requiring CEO co-approval and official documentation for every expense.</li>
                  <li>Formulates post-activity financial statements, audit reports, and transparency records within mandated timelines.</li>
                  <li>Superintends the Directors under the Finance Department, managing receipts, invoices, and sponsorship fund tracking.</li>
                </OfficerBlock>
              </SubSection>

              <SubSection title="2.4. Office of the Chief Marketing Officer (CMO)">
                <OfficerBlock title="2.4.1. Chief Marketing Officer (CMO)">
                  <li>Formulates and executes comprehensive marketing, brand awareness, and public communication campaigns.</li>
                  <li>Guarantees that all visual assets, promotional media, publications, and merchandise comply strictly with AWS branding guidelines and university policies.</li>
                  <li>Directs digital engagement across official social media pages, streaming channels, and community announcement boards.</li>
                  <li>Superintends the Directors under the Marketing Department (e.g., Creatives, Content, Multimedia).</li>
                </OfficerBlock>
              </SubSection>

              <SubSection title="2.5. Office of the Chief Relations Officer (CRO)">
                <OfficerBlock title="2.5.1. Chief Relations Officer (CRO)">
                  <li>Spearheads external community engagement, corporate and institutional sponsorships, community partnerships, and industry networking.</li>
                  <li>Maintains communication linkages with other student organizations, professional AWS User Groups, and tech communities nationwide.</li>
                  <li>Manages guest speakers, partner contracts, and outreach programs in coordination with the Executive Board.</li>
                  <li>Superintends the Directors under the Relations Department (e.g., External Affairs, Community Outreach).</li>
                </OfficerBlock>
              </SubSection>

              <SubSection title="2.6. Office of the Chief Technology Officer (CTO)">
                <OfficerBlock title="2.6.1. Chief Technology Officer (CTO)">
                  <li>Directs the technical vision, curriculum, and hands-on modules across cloud computing, artificial intelligence, software engineering, and DevOps.</li>
                  <li>Manages the implementation of educational platforms and learning pathways, including AWS Skill Builder, AWS Academy tracks, technical bootcamps, and certification preparation initiatives.</li>
                  <li>Provides technical specifications, sandbox governance, architecture designs, and mentorship to the Technical Working Group (TWG) during tech-driven projects and buildouts.</li>
                  <li>Superintends the Directors under the Technology Department (e.g., Cloud &amp; AI Curriculum, Technical Operations, AWS Skill Builder &amp; Certification, Software Development).</li>
                </OfficerBlock>
              </SubSection>

            </div>
          </SectionBlock>

          <SectionBlock id="article-iv-s3" title="Section 3. Powers and Functions of Department Directors and Leads">
            <Item number="3.1">
              <strong>Department Directors:</strong>
              <SubList>
                <SubItem>Supervise specific functional arms under their respective Executive Offices.</SubItem>
                <SubItem>Formulate departmental action plans, assign project tasks, conduct departmental check-ins, and report directly to their supervising Chief Officer.</SubItem>
              </SubList>
            </Item>
            <Item number="3.2">
              <strong>Department Leads:</strong>
              <SubList>
                <SubItem>Serve as functional leads responsible for direct task execution, peer mentoring, and operational workflow implementation within their assigned departments or designated TWG teams.</SubItem>
              </SubList>
            </Item>
          </SectionBlock>

          <SectionBlock id="article-iv-s4" title="Section 4. Technical Working Group (TWG)">
            <Item number="4.1">
              <strong>Nature and Cross-Functional Composition:</strong>
              <SubList>
                <SubItem number="4.1.1">The Technical Working Group (TWG) serves as Tier IV of the organizational structure.</SubItem>
                <SubItem number="4.1.2">It operates as a specialized, cross-functional execution unit composed of designated Department Leads from the various Executive Offices (Operations, Technology, Finance, Marketing, and Relations), technical associates, and student builder volunteers to ensure cohesive, tech-driven project execution.</SubItem>
              </SubList>
            </Item>
            <Item number="4.2">
              <strong>Leadership and Project Management:</strong>
              <SubList>
                <SubItem number="4.2.1"><strong>Project Manager (Organizing Head):</strong> Each TWG project deployment or flagship initiative shall be headed by an appointed Project Manager who acts as the primary organizing head for the designated project.</SubItem>
                <SubItem number="4.2.2"><strong>Inter-Departmental Coordination:</strong> The Project Manager shall be responsible for orchestrating cross-departmental coordination, managing project timelines, aligning deliverables with the participating Department Leads, and ensuring active collaboration among all offices involved.</SubItem>
              </SubList>
            </Item>
            <Item number="4.3">
              <strong>Dual Governance Framework:</strong>
              <SubList>
                <SubItem number="4.3.1"><strong>Operational Oversight (COO):</strong> The TWG and its designated Project Manager shall be operationally supervised by the Office of the COO for task alignment, logistical execution, deployment schedules, and live event operations.</SubItem>
                <SubItem number="4.3.2"><strong>Technical Governance (CTO):</strong> The TWG shall work in close consultation with the Office of the CTO regarding system architecture, technical feasibility, development environments, cloud credit allocations, and technical standards.</SubItem>
              </SubList>
            </Item>
            <Item number="4.4">
              <strong>Key Functions and Deliverables:</strong>
              <SubList>
                <SubItem number="4.4.1">Execute on-site and virtual event tech operations (e.g., live streaming, platform moderation, audio-visual technical setups, and attendee platform onboarding).</SubItem>
                <SubItem number="4.4.2">Build, deploy, configure, and maintain organizational software platforms, websites, internal workflow automation tools, and cloud infrastructure.</SubItem>
                <SubItem number="4.4.3">Facilitate hands-on technical workshops, AWS Jam / GameDay sessions, hackathons, and AWS Skill Builder cohort learning through lab assistance and peer troubleshooting.</SubItem>
              </SubList>
            </Item>
            <Item number="4.5">
              <strong>Appointment and Project Tenure:</strong>
              <SubList>
                <SubItem number="4.5.1">The Project Manager and designated TWG personnel shall be selected through open application or appointed by the COO and CTO, subject to confirmation by the CEO and Executive Associate (Co-Lead).</SubItem>
                <SubItem number="4.5.2">TWG project mobilizations shall be active for the duration of the project lifecycle and formally conclude upon submission and clearance of the final post-activity evaluation and terminal report.</SubItem>
              </SubList>
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article V ── */}
        <section aria-labelledby="article-v">
          <ArticleHeading id="article-v">Article V. Tenureship, Succession, and Vacancies</ArticleHeading>

          <SectionBlock id="article-v-s1" title="Section 1. Term of Office and Tenure">
            <Item number="1.1">
              <strong>Official Term:</strong> The term of office for all executive and departmental
              officers shall span one (1) full academic year, unless otherwise specified by
              institutional guidelines or global program directives.
            </Item>
            <Item number="1.2">
              <strong>Global Program Alignment:</strong> The Student Builder Group Lead (CEO) has a
              fixed tenure managed and recognized by the global community team from the AWS Builder
              Center / AWS Student Community program.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-v-s2" title="Section 2. Succession Protocol">
            <Item number="2.1">
              <strong>Succession of the Student Builder Group Lead (CEO):</strong>
              <SubList>
                <SubItem number="2.1.1"><strong>Eligibility:</strong> The successor to the Student Builder Group Lead (CEO) must be an active member of the Core Team (Executive Board) or a Department Director who demonstrates proven technical capability, leadership merit, and active contribution to the community.</SubItem>
                <SubItem number="2.1.2"><strong>Endorsement and Vetting:</strong> The outgoing Lead/CEO, in consultation with the Faculty Adviser and Executive Board, shall nominate a qualified successor in alignment with regulatory measures, criteria, and interview processes mandated by the AWS Builder Center.</SubItem>
                <SubItem number="2.1.3"><strong>Structural Adjustments:</strong> Upon confirmation of the successor by the global program team, the Core Team shall realign its operational roster and transition responsibilities accordingly.</SubItem>
              </SubList>
            </Item>
            <Item number="2.2">
              <strong>Succession of the Executive Associate (Co-Lead):</strong> In the event of a
              vacancy in the Co-Lead position, the CEO shall appoint a qualified Department Director
              or Core Team officer, subject to confirmation by a simple majority vote (50% + 1) of
              the Executive Board.
            </Item>
            <Item number="2.3">
              <strong>Succession of Executive Chiefs:</strong> In the event of an unexpected vacancy
              in any Chief Office (COO, CFO, CMO, CRO, CTO), the corresponding Department Director
              shall assume the acting chief role until an official appointment is sanctioned by the
              CEO/Co-Lead.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-v-s3" title="Section 3. Performance Evaluation and Retention">
            <Item number="3.1">
              <strong>Performance Evaluation Framework:</strong> All officers across Tiers I through
              IV shall undergo periodic performance reviews (Mid-Semester and End-of-Semester)
              evaluated on a standard 100-point scale covering:
              <SubList>
                <SubItem number="3.1.1">Deliverable execution and milestone completion (40%).</SubItem>
                <SubItem number="3.1.2">Meeting attendance and operational punctuality (30%).</SubItem>
                <SubItem number="3.1.3">Leadership, initiative, and communication responsiveness (20%).</SubItem>
                <SubItem number="3.1.4">Peer and cross-functional feedback (10%).</SubItem>
              </SubList>
            </Item>
            <Item number="3.2">
              <strong>Retention Threshold:</strong> Officers seeking retention in their current or
              prospective roles for subsequent academic periods must maintain a minimum cumulative
              evaluation rating of 75% (or 3.5 out of 5.0) and receive formal approval from the CEO
              and Executive Associate (Co-Lead).
            </Item>
          </SectionBlock>

          <SectionBlock id="article-v-s4" title="Section 4. Recruitment and Appointment to Vacant Positions">
            <Item number="4.1">
              <strong>Open Application Process:</strong> Vacancies arising across Department
              Directorships, Department Leads, or the Technical Working Group (TWG) may be opened
              for recruitment through an application and screening process.
            </Item>
            <Item number="4.2">
              <strong>Appointment Authority:</strong> The supervising Executive Chief shall review
              and shortlist candidates, with final appointments sanctioned by the CEO and Co-Lead.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-v-s5" title="Section 5. Removal from Office and Resignation">
            <Item number="5.1">
              <strong>Quantifiable Grounds for Removal:</strong> An officer across any tier may be
              subject to formal impeachment or removal proceedings upon meeting any of the following
              measurable conditions:
              <SubList>
                <SubItem number="5.1.1">
                  <strong>Attendance Neglect:</strong> Accumulation of three (3) consecutive
                  unexcused absences, or four (4) cumulative unexcused absences from official
                  meetings per semester. Failure to maintain an overall meeting attendance rate of at
                  least 75% across all required Executive or Departmental Assemblies per semester.
                </SubItem>
                <SubItem number="5.1.2">
                  <strong>Deliverable Default and KPI Non-Performance:</strong> Failure to achieve a
                  minimum of 70% completion rate on officially assigned departmental deliverables and
                  Key Performance Indicators (KPIs) tracked by the Executive Associate. Unjustified
                  failure to deliver on two (2) critical event or operational milestones during a
                  single project cycle.
                </SubItem>
                <SubItem number="5.1.3">
                  <strong>Communication Neglect and Inactivity (Ghosting):</strong> Failure to
                  acknowledge, respond, or provide progress updates on official organizational
                  communication platforms for more than seven (7) consecutive calendar days during an
                  active operational cycle without prior approved leave of absence.
                </SubItem>
                <SubItem number="5.1.4">
                  <strong>Performance Review Failure:</strong> Scoring below a 70% overall rating
                  (or an average score below 3.0 out of 5.0) in two (2) consecutive performance
                  evaluation cycles.
                </SubItem>
                <SubItem number="5.1.5">
                  <strong>Financial and Asset Malpractice:</strong> Embezzlement, misappropriation
                  of funds, unauthorized disbursement, or failure to submit liquidation documents and
                  physical/digital receipts within seven (7) business days following the conclusion
                  of an event.
                </SubItem>
                <SubItem number="5.1.6">
                  <strong>Severe Ethical and Code Violations:</strong> Proven breach of the
                  University of Cabuyao Student Code of Conduct, AWS Community Guidelines, academic
                  dishonesty, or compromise of cloud credentials and organizational assets.
                </SubItem>
              </SubList>
            </Item>
            <Item number="5.2">
              <strong>Due Process and Escalation Procedure:</strong>
              <SubList>
                <SubItem number="5.2.1">
                  <strong>Escalation Protocol:</strong>
                  <ul className="mt-2 list-none space-y-1 pl-0">
                    <li><span className="font-medium">Step 1 (Informal Warning):</span> The supervising Chief Officer or Executive Associate issues an internal reminder upon the first violation or missed deliverable.</li>
                    <li><span className="font-medium">Step 2 (Formal Notice to Explain):</span> Upon meeting any condition in Section 5.1, the Executive Board shall issue a formal Notice to Explain (NTE), giving the respondent officer five (5) business days to submit a written explanation.</li>
                    <li><span className="font-medium">Step 3 (Executive Hearing):</span> If the response is unsatisfactory or unsubmitted, a special executive hearing shall be convened before the Core Team and the Faculty Adviser, where the officer has the right to present their defense.</li>
                  </ul>
                </SubItem>
                <SubItem number="5.2.2">
                  <strong>Voting Threshold for Removal:</strong> Removal from office requires a
                  two-thirds (2/3) supermajority vote of the voting members of the Core Team, with
                  official concurrence from the Faculty Adviser.
                </SubItem>
              </SubList>
            </Item>
            <Item number="5.3">
              <strong>Resignation Protocol:</strong>
              <SubList>
                <SubItem number="5.3.1"><strong>Notice Period:</strong> Any officer wishing to resign must submit a formal letter of resignation to the CEO and Executive Associate at least fourteen (14) calendar days (2 weeks) prior to the intended date of effectivity.</SubItem>
                <SubItem number="5.3.2"><strong>Handover and Clearance:</strong> The resigning officer must complete all ongoing task handovers, provide written status reports, and surrender all administrative credentials, domain accounts, and physical/digital assets to the designated interim officer before receiving official clearance.</SubItem>
              </SubList>
            </Item>
          </SectionBlock>

          <SectionBlock id="article-v-s6" title="Section 6. Governance, Alignment, and Grievance Resolution">
            <Item number="6.1">
              <strong>Administrative Alignment:</strong> All positions and operations must strictly
              align with university regulations and official AWS student community policies.
            </Item>
            <Item number="6.2">
              <strong>Grievance Redressal:</strong> Formal complaints, disputes, or allegations of
              unfair treatment shall be submitted in writing to the Office of the CEO or directly
              escalated to the Faculty Adviser for administrative mediation.
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article VI ── */}
        <section aria-labelledby="article-vi">
          <ArticleHeading id="article-vi">Article VI. Finance and Appropriations</ArticleHeading>

          <SectionBlock id="article-vi-s1" title="Section 1. Sources of Funds">
            <Item number="1.1">
              <strong>Recognized Revenue Streams:</strong> The funds of the organization shall be
              derived from legitimate, transparent, and non-profit sources, including:
              <SubList>
                <SubItem number="1.1.1">Official university student activity allocations and institutional grants.</SubItem>
                <SubItem number="1.1.2">AWS community support grants, hackathon stipends, and global program allowances.</SubItem>
                <SubItem number="1.1.3">Corporate, institutional, and industry partner sponsorships.</SubItem>
                <SubItem number="1.1.4">Authorized fundraising initiatives, tech merchandise sales, and project-based registration proceeds.</SubItem>
                <SubItem number="1.1.5">Voluntary contributions and donations from alumni, partners, or patrons.</SubItem>
              </SubList>
            </Item>
            <Item number="1.2">
              <strong>Prohibited Fundraising:</strong> The organization shall strictly prohibit any
              form of unlawful solicitations, unapproved mandatory fee collections, or commercial
              ventures that compromise the student-led integrity and non-profit status of AWS SBG UC.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-vi-s2" title="Section 2. Custody, Accounts, and Dual Governance">
            <Item number="2.1">
              <strong>Custody of Funds:</strong> The Chief Finance Officer (CFO) shall serve as the
              official custodian of all liquid assets, digital wallets, bank accounts, and physical
              petty cash belonging to the organization.
            </Item>
            <Item number="2.2">
              <strong>Dual-Signatory and Authorization Control:</strong>
              <SubList>
                <SubItem number="2.2.1">No fund allocation, bank transaction, or cash disbursement shall be executed without the joint authorization of the Chief Finance Officer (CFO) and the Chief Executive Officer (CEO).</SubItem>
                <SubItem number="2.2.2">Official digital transaction accounts (e.g., GCash, Maya, institutional bank accounts) must be registered under verified organizational credentials and monitored with transparent audit logs.</SubItem>
              </SubList>
            </Item>
          </SectionBlock>

          <SectionBlock id="article-vi-s3" title="Section 3. Budgeting, Allocation, and Disbursement Protocol">
            <Item number="3.1">
              <strong>Project Budget Proposals:</strong> Every proposed event, workshop, or technical
              buildout requiring financial expenditure must be accompanied by an itemized Project
              Budget Proposal (PBP) submitted by the organizing head to the CFO at least seven (7)
              business days prior to the activity.
            </Item>
            <Item number="3.2">
              <strong>Disbursement Thresholds and Workflow:</strong>
              <SubList>
                <SubItem number="3.2.1"><strong>Petty Expenses (Under PHP 1,000):</strong> Liquidated through the CFO&apos;s petty cash fund with immediate issuance of digital or physical receipts.</SubItem>
                <SubItem number="3.2.2"><strong>Operational Expenses (PHP 1,000 to PHP 10,000):</strong> Requires written budget approval from the CFO and CEO.</SubItem>
                <SubItem number="3.2.3"><strong>Major Capital / Flagship Expenses (Above PHP 10,000):</strong> Requires a formal majority vote (50% + 1) of the Executive Board alongside CEO and CFO concurrence.</SubItem>
              </SubList>
            </Item>
            <Item number="3.3">
              <strong>Emergency Contingency Allocation:</strong> An operational contingency reserve
              of up to 10% of the general fund may be maintained for unforeseen logistical or
              technical emergencies during live events, subject to post-activity executive
              justification.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-vi-s4" title="Section 4. Liquidation, Receipts, and Financial Integrity">
            <Item number="4.1">
              <strong>Post-Event Financial Liquidation:</strong> The designated project lead and
              finance director must submit a comprehensive liquidation report—including official
              receipts, invoice scans, and balance sheets—to the CFO within three (3) business days
              following the conclusion of any activity.
            </Item>
            <Item number="4.2">
              <strong>Receipt and Audit Trail Integrity:</strong>
              <SubList>
                <SubItem number="4.2.1">All disbursements must be supported by official receipts (OR), vendor sales invoices, or verified e-wallet transaction receipts.</SubItem>
                <SubItem number="4.2.2">Undocumented or unsupported disbursements shall not be honored by the organization and shall remain the personal financial liability of the disbursing officer.</SubItem>
              </SubList>
            </Item>
          </SectionBlock>

          <SectionBlock id="article-vi-s5" title="Section 5. Auditing, Institutional Compliance, and Financial Disclosures">
            <Item number="5.1">
              <strong>Institutional Reporting and Documentation:</strong> The Chief Finance Officer
              (CFO), in direct coordination with the Office of the CEO, shall be primarily
              responsible for preparing, consolidating, and certifying all official financial reports,
              annual budget plans, liquidation packets, and accounting documentation required for
              submission to the university administration, the Student Affairs and Services Department
              (SASD), and other institutional governing bodies.
            </Item>
            <Item number="5.2">
              <strong>Mid-Semester and End-of-Semester Audits:</strong> The CFO shall compile a
              comprehensive financial statement at the midpoint and conclusion of each academic
              semester for formal review by the Faculty Adviser and institutional auditors.
            </Item>
            <Item number="5.3">
              <strong>Transparency to General Membership:</strong> A summary of the organization&apos;s
              financial status, sponsorship acquisitions, and major expenditures shall be presented to
              the general membership during official General Assemblies. Active members hold the right
              to inspect audited statements upon formal written request to the Office of the CFO.
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article VII ── */}
        <section aria-labelledby="article-vii">
          <ArticleHeading id="article-vii">Article VII. Student Participation and Sectoral Representation</ArticleHeading>

          <SectionBlock id="article-vii-s1" title="Section 1. Program Affiliation and Global Network">
            <Item number="1.1">
              <strong>AWS Builder Center Affiliation:</strong> The AWS Student Builder Group –
              University of Cabuyao (AWS SBG UC) operates as an officially recognized student-led
              community under the global programs of the AWS Builder Center.
            </Item>
            <Item number="1.2">
              <strong>National and Regional Coordination:</strong> The organization maintains active
              affiliation with the AWS Student User Group Philippines in coordination with the AWS
              User Group Philippines (AWSUGPH) under the broader AWS User Group community and AWS
              Builder Center ecosystem.
            </Item>
            <Item number="1.3">
              <strong>Autonomous Student Identity:</strong> While affiliated with global initiatives
              and national builder networks, the organization functions as an autonomous,
              student-governed body representing student builders at the University of Cabuyao.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-vii-s2" title="Section 2. Multi-Disciplinary and Cross-Sectoral Participation">
            <Item number="2.1">
              <strong>Inter-Departmental and College-Wide Inclusivity:</strong> AWS SBG UC champions
              multi-disciplinary participation, actively engaging student builders across Computing,
              Engineering, Business, Arts, Sciences, Education, and all other academic colleges.
            </Item>
            <Item number="2.2">
              <strong>Sectoral Representation in Technology:</strong> The organization actively
              fosters specialized tracks, workshops, and build cohorts to support underrepresented
              groups in STEM, student researchers, and novice builders.
            </Item>
            <Item number="2.3">
              <strong>Community Extension and Civic Service:</strong> The organization shall
              collaborate with local government units (LGUs), secondary educational institutions, and
              civic bodies to conduct digital literacy, cloud computing fundamentals, and ethical AI
              awareness outreach.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-vii-s3" title="Section 3. External Representation and Institutional Partnerships">
            <Item number="3.1">
              <strong>Official Representation:</strong>
              <SubList>
                <SubItem number="3.1.1">The Chief Executive Officer (CEO) and the Executive Associate (Co-Lead) serve as the primary external representatives of AWS SBG UC.</SubItem>
                <SubItem number="3.1.2">Members of the Core Team (Executive Board) may officially represent the organization in external events, summits, forums, and engagements in respect of their functional domains (e.g., the CRO for community relations and partner alignments, the CTO for technical forums, and the CMO for media initiatives).</SubItem>
                <SubItem number="3.1.3">Individual officers and members participating in hackathons, open-source initiatives, or external conferences may identify their affiliation with the organization in distinction from their individual capacities.</SubItem>
              </SubList>
            </Item>
            <Item number="3.2">
              <strong>Institutional Accords and Partnership Clearances:</strong>
              <SubList>
                <SubItem number="3.2.1">All Memoranda of Understanding (MoUs), Memoranda of Agreement (MoAs), and external partnership accords shall be facilitated by the Office of the Chief Relations Officer (CRO), signed by the CEO, and concurred with by the Faculty Adviser.</SubItem>
                <SubItem number="3.2.2">In cases involving institutional commitments, university-wide scope, off-campus liabilities, or external sponsorship integration, agreements shall undergo review and clearance through the Student Affairs and Services Department (SASD) and the Office of the Vice President for Academics and Student Services (VPASS) as required by institutional policy.</SubItem>
              </SubList>
            </Item>
          </SectionBlock>

          <SectionBlock id="article-vii-s4" title="Section 4. Conduct in the Broader Tech Ecosystem">
            <Item number="4.1">
              <strong>Code of Representation:</strong> Members and officers representing AWS SBG UC
              at external conventions, competitions, or multi-university events shall uphold the
              highest standards of integrity, professional decorum, and sportsmanship.
            </Item>
            <Item number="4.2">
              <strong>Alignment with Community Guidelines:</strong> All external engagements must
              adhere to the AWS Community Code of Conduct, institutional policies of the University
              of Cabuyao, and applicable local regulations.
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article VIII ── */}
        <section aria-labelledby="article-viii">
          <ArticleHeading id="article-viii">Article VIII. Faculty Adviser</ArticleHeading>

          <SectionBlock id="article-viii-s1" title="Section 1. Qualifications and Designation">
            <Item number="1.1">
              <strong>Faculty Qualification:</strong> The Faculty Adviser of the AWS Student Builder
              Group – University of Cabuyao (AWS SBG UC) must be a bona fide, full-time or permanent
              faculty member of the University of Cabuyao, preferably from the College of Computing
              Studies or allied computing and technical disciplines, possessing relevant academic
              competence and technical inclination.
            </Item>
            <Item number="1.2">
              <strong>Official Designation:</strong> The selection of the Faculty Adviser shall be
              recommended by the Core Team (Executive Board) in consultation with the outgoing
              leadership and officially endorsed through the execution of the institutional
              Adviser&apos;s Agreement Form, subject to recognition by the Student Organization and
              Activities Office (SOAO) and the Student Affairs and Services Department (SASD).
            </Item>
          </SectionBlock>

          <SectionBlock id="article-viii-s2" title="Section 2. Term of Advisory">
            <Item number="2.1">
              <strong>Duration:</strong> The Faculty Adviser shall serve for a term of one (1)
              academic year, renewable annually upon mutual agreement between the Core Team, the
              Adviser, and the university administration via official re-endorsement.
            </Item>
            <Item number="2.2">
              <strong>Vacancy and Replacement:</strong> In the event of an unexpected vacancy or
              resignation of the Adviser, the Core Team shall recommend an interim or replacement
              faculty adviser within fifteen (15) school days to ensure continuity of accreditation
              and operations.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-viii-s3" title="Section 3. Duties and Responsibilities of the Adviser">
            <p className="mb-3 text-neutral-300">
              In adherence to institutional standards and the official Adviser&apos;s Agreement Form,
              the Faculty Adviser shall:
            </p>
            <Item number="3.1">
              <strong>Strategic Planning &amp; Program Evaluation:</strong> Assist the organization
              in the strategic planning, execution, and periodic evaluation of its year-round
              programs, developmental roadmaps, and technical initiatives.
            </Item>
            <Item number="3.2">
              <strong>Technical Mentorship and Resource Person:</strong> Serve as the primary
              academic and technical resource person, guiding student builders in achieving
              organizational goals, training roadmaps, and skills development.
            </Item>
            <Item number="3.3">
              <strong>Document and Proposal Review:</strong> Review all official written
              communications, administrative requests, activity forms, and project proposals,
              providing initial advisory endorsement and approval prior to submission to university
              offices.
            </Item>
            <Item number="3.4">
              <strong>Publicity and Digital Content Approval:</strong> Review, check, and approve all
              official social media posts, publications, digital content, and publicity materials
              prior to public release to ensure factual accuracy and strict compliance with university
              policies and official branding standards.
            </Item>
            <Item number="3.5">
              <strong>Activity Accompaniment and Supervision:</strong> Accompany and supervise the
              organization in all official in-person, off-campus, and remote/virtual external
              activities, hackathons, and conventions to ensure student safety, security, and
              institutional representation.
            </Item>
            <Item number="3.6">
              <strong>Financial and Operational Review:</strong> Review the financial management,
              budget allocations, accounting records, and liquidation packets prepared by the Chief
              Finance Officer (CFO) to maintain transparency and fiscal compliance.
            </Item>
            <Item number="3.7">
              <strong>Meeting Attendance:</strong> Attend regular meetings and assemblies of the
              organization when feasible to monitor pertinent issues, discussions, and leadership
              dynamics.
            </Item>
            <Item number="3.8">
              <strong>Institutional Coordination:</strong> Attend official adviser convocations and
              administrative meetings called by the Student Affairs and Services Department (SASD)
              and university authorities.
            </Item>
            <Item number="3.9">
              <strong>Member Welfare and Conflict Resolution:</strong> Assist student leaders and
              individual members in identifying internal issues, mediating grievances, and resolving
              organizational conflicts in an objective, professional manner.
            </Item>
            <Item number="3.10">
              <strong>Ethical Governance and Policy Compliance:</strong> Ensure the organization&apos;s
              operations strictly comply with the University of Cabuyao Code of Conduct, Student
              Handbook, and applicable national laws (including the Data Privacy Act of 2012),
              actively promoting ethical leadership, responsible technology use, and student welfare.
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article IX ── */}
        <section aria-labelledby="article-ix">
          <ArticleHeading id="article-ix">Article IX. Amendments and Revisions</ArticleHeading>

          <SectionBlock id="article-ix-s1" title="Section 1. Proposal of Amendments and Revisions">
            <Item number="1.1">
              <strong>Origin of Proposals:</strong> Any active member, departmental officer, or
              member of the Core Team (Executive Board) may propose amendments (minor modifications
              or additions) or revisions (substantial restructuring) to this Constitution and
              By-Laws.
            </Item>
            <Item number="1.2">
              <strong>Submission Protocol:</strong> All proposed amendments or revisions must be
              submitted in writing to the Executive Secretary and the Office of the CEO, accompanied
              by a detailed justification and comparative draft (showing existing versus proposed
              text).
            </Item>
            <Item number="1.3">
              <strong>Vetting and Legal Alignment:</strong> The Executive Board, in consultation with
              the Faculty Adviser, shall review the proposed changes to ensure compliance with
              university guidelines, Student Affairs and Services Department (SASD) policies, and
              global AWS Student Community standards prior to floor deliberations.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-ix-s2" title="Section 2. Ratification Process">
            <Item number="2.1">
              <strong>Quorum for Amendments:</strong> A special constitutional session of the
              Executive Board shall be convened, requiring a two-thirds (2/3) supermajority of the
              active Core Team voting members present.
            </Item>
            <Item number="2.2">
              <strong>Voting Threshold for Adoption:</strong> Proposed amendments shall be officially
              adopted upon securing a two-thirds (2/3) affirmative vote of the voting members of the
              Core Team and obtaining formal written concurrence from the Faculty Adviser.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-ix-s3" title="Section 3. Plebiscite for Major Revisions">
            <Item number="3.1">
              <strong>Revisions Triggering Plebiscite:</strong> In cases of comprehensive overhauls
              to the organizational structure, fundamental changes to membership rights, or major
              rewrites of this Constitution, a General Plebiscite may be convened by the Core Team.
            </Item>
            <Item number="3.2">
              <strong>Plebiscite Threshold:</strong> A general plebiscite shall be considered valid
              if participated in by active members of AWS SBG UC, requiring a simple majority vote
              (50% + 1) of all ballots cast for final ratification.
            </Item>
          </SectionBlock>
        </section>

        {/* ── Article X ── */}
        <section aria-labelledby="article-x">
          <ArticleHeading id="article-x">Article X. Transitory and Final Provisions</ArticleHeading>

          <SectionBlock id="article-x-s1" title="Section 1. Effectivity">
            <Item number="1.1">
              <strong>Official Date of Effectivity:</strong> This Constitution and By-Laws shall
              take effect immediately upon its official ratification by the Core Team, formal notation
              and approval by the Faculty Adviser, and final notation and accreditation by the
              Student Organization and Activities Office (SOAO) and the Student Affairs and Services
              Department (SASD) of the University of Cabuyao.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-x-s2" title="Section 2. Turnover Procedures and Digital Asset Handover">
            <Item number="2.1">
              <strong>Turnover Period:</strong> An official transition and turnover period of
              fourteen (14) calendar days (2 weeks) shall commence immediately following the
              confirmation or appointment of the incoming Core Team.
            </Item>
            <Item number="2.2">
              <strong>Scope of Handover:</strong> The outgoing Executive Board and department
              directors are strictly required to transfer full custody of the following to their
              incoming counterparts:
              <SubList>
                <SubItem number="2.2.1"><strong>Digital Infrastructure and Cloud Assets:</strong> Full administrative access, root credentials, cloud environments, GitHub repositories, and associated digital workspaces.</SubItem>
                <SubItem number="2.2.2"><strong>Financial and Asset Records:</strong> Liquid funds, banking/e-wallet credentials, official receipts, financial ledgers, sponsorship contracts, and physical inventory.</SubItem>
                <SubItem number="2.2.3"><strong>Communications and Brand Kit:</strong> Official email accounts, domain management consoles, social media channels, and brand asset libraries.</SubItem>
                <SubItem number="2.2.4"><strong>Documentation and Archives:</strong> Terminal project reports, meeting minutes, member databases, and official university accreditation binders.</SubItem>
              </SubList>
            </Item>
            <Item number="2.3">
              <strong>Joint Transition Session:</strong> A formal joint executive turnover session
              between the outgoing and incoming Core Teams shall be held to ensure continuity of
              active projects and knowledge transfer.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-x-s3" title="Section 3. Repealing Clause">
            <Item number="3.1">
              All previous constitutions, by-laws, internal standing rules, resolutions, or
              administrative guidelines previously adopted that are inconsistent with the provisions
              of this Constitution and By-Laws are hereby repealed, amended, or superseded
              accordingly.
            </Item>
          </SectionBlock>

          <SectionBlock id="article-x-s4" title="Section 4. Separability Clause">
            <Item number="4.1">
              If any provision, section, or clause of this Constitution is declared invalid,
              unconstitutional, or unenforceable by university authorities or competent legal bodies,
              the validity of the remaining provisions and sections shall not be affected and shall
              continue in full force and effect.
            </Item>
          </SectionBlock>
        </section>

        </div>{/* end space-y-10 */}
        </div>{/* end min-w-0 flex-1 */}
      </div>{/* end flex gap-8 */}

      {/* ── Closing white section ── */}
      <div className="mt-16 border border-neutral-200 bg-white px-8 py-10">
        <div className="grid gap-10 sm:grid-cols-3">

          {/* Ratification */}
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#FF9900]">Ratification</p>
            <p className="text-sm font-semibold text-neutral-900">Adopted November 26, 2023</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Ratified by the founding membership of AWS SBG UC at the University of Cabuyao, Pamantasan ng Cabuyao, Laguna.
            </p>
          </div>

          {/* Last amended */}
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#FF9900]">Last Amended</p>
            <p className="text-sm font-semibold text-neutral-900">August 15, 2026</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Amendments reviewed and approved by the Executive Board in accordance with Article IX of this Constitution.
            </p>
          </div>

          {/* Recognition */}
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#FF9900]">Recognition</p>
            <p className="text-sm font-semibold text-neutral-900">Chartered under SASD & SOAO</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Recognized by the University of Cabuyao Student Affairs and Services Department and the Student Organization Accreditation Office.
            </p>
          </div>

        </div>

        <div className="mt-8 border-t border-neutral-100 pt-6 text-center">
          <p className="text-xs text-neutral-400">
            AWS Student Builder Group — University of Cabuyao &nbsp;·&nbsp; All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ArticleHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 border-b border-neutral-200 pb-2 text-base font-bold uppercase tracking-wide text-neutral-900"
    >
      {children}
    </h2>
  );
}

function SectionBlock({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mt-7 scroll-mt-24">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#00e482]">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-base font-semibold text-neutral-100">{title}</p>
      <div className="space-y-3 pl-4 border-l-2 border-[#FF9900]/40">
        {children}
      </div>
    </div>
  );
}

function OfficerBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="mb-2 text-sm font-semibold text-neutral-200">
        {title}
      </p>
      <ul className="space-y-1.5 list-none pl-0 text-base text-neutral-300">
        {children}
      </ul>
    </div>
  );
}

function Item({
  number,
  children,
}: {
  number?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 text-neutral-300">
      {number && (
        <span className="shrink-0 font-bold text-[#FF9900] tabular-nums">
          {number}.
        </span>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SubList({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 space-y-2 pl-4 border-l-2 border-neutral-700">{children}</div>;
}

function SubItem({
  number,
  children,
}: {
  number?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 text-neutral-300">
      {number && (
        <span className="shrink-0 text-sm font-bold text-[#FF9900] tabular-nums">
          {number}.
        </span>
      )}
      <div className="flex-1 text-base text-neutral-300">{children}</div>
    </div>
  );
}
