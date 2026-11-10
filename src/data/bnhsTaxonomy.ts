export type ResearchDivisionId = 'basic' | 'action' | 'tuklas';

export type ResearchStatus =
  | 'Pending Review'
  | 'Ongoing'
  | 'Completed'
  | 'Approved'
  | 'Revision Requested'
  | 'Archived';

export type AuthorRoleType = 'Teacher' | 'Student' | 'Collaborative';

export interface ResearchRecord {
  id: string;
  portalId: 'bnhs';
  title: string;
  division: ResearchDivisionId;
  category: string;
  subcategory: string;
  abstract: string;
  keywords: string;
  authors: string;
  authorRole: AuthorRoleType;
  adviser: string;
  departmentOrGrade: string;
  schoolYear: string;
  status: ResearchStatus;
  methodology: string;
  keyFindings: string;
  attachmentName: string;
  attachmentType: string;
  attachmentSize: number;
  fileDocId: string;
  driveUrl: string;
  evaluationScore: number;
  evaluationRemarks: string;
  evaluatedBy: string;
  authorUid: string;
  createdAtIso: string;
  updatedAtIso: string;
  isBaseline?: boolean;
}

export type ResearcherRoleType =
  | 'Student Researcher'
  | 'Teacher Researcher'
  | 'Master Teacher Researcher'
  | 'Teacher/Adviser'
  | 'Master Teacher / Adviser'
  | 'School Research Grammarian'
  | 'School Research Statistician'
  | 'Research Coordinator';

export const RESEARCHER_ACCOUNT_CLASSIFICATIONS: ResearcherRoleType[] = [
  'Teacher Researcher',
  'Master Teacher Researcher',
  'Teacher/Adviser',
  'School Research Grammarian',
  'School Research Statistician',
  'Student Researcher',
  'Master Teacher / Adviser',
  'Research Coordinator',
];

export interface ResearcherProfileRecord {
  id: string;
  portalId: 'bnhs';
  uid: string;
  fullName: string;
  role: ResearcherRoleType;
  departmentOrStrand: string;
  gradeOrPosition: string;
  specialization: string;
  bio: string;
  institutionIdCode: string;
  driveFolderUrl: string;
  photoUrl?: string;
  photoDriveUrl?: string;
  isBaseline?: boolean;
}

export const PORTAL_IMAGES = {
  heroCampus: '/src/assets/images/bnhs_hero_campus_1794282752878.jpg',
  basicResearch: '/src/assets/images/division_basic_research_1794282753932.jpg',
  actionResearch: '/src/assets/images/division_action_research_1794282755536.jpg',
  tuklasFair: '/src/assets/images/division_tuklas_fair_1794282756486.jpg',
};

export interface DivisionDefinition {
  id: ResearchDivisionId;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
}

export const RESEARCH_DIVISIONS: DivisionDefinition[] = [
  {
    id: 'basic',
    code: 'DIV-01',
    name: 'Basic Research',
    subtitle: 'Foundational & Policy Repository',
    description:
      'Completed and ongoing empirical investigations examining foundational learning phenomena, curriculum efficacy, socio-demographic profiles, and institutional performance at Barobo National High School.',
    image: PORTAL_IMAGES.basicResearch,
  },
  {
    id: 'action',
    code: 'DIV-02',
    name: 'Action Research',
    subtitle: 'Seven Official DepEd Themes',
    description:
      'Classroom-based and school-level practitioner inquiries organized across the seven Department of Education themes to directly improve instruction, learner welfare, and school governance.',
    image: PORTAL_IMAGES.actionResearch,
  },
  {
    id: 'tuklas',
    code: 'DIV-03',
    name: 'TUKLAS: A Research Project Fair',
    subtitle: 'Five Major Categories (Including Innovation Expo)',
    description:
      'Student and mentored STEM & innovation projects competing across Life Science, Physical Science, Robotics & Intelligent Machines, Mathematics & Computational Sciences, and the Innovation Expo.',
    image: PORTAL_IMAGES.tuklasFair,
  },
];

export const BASIC_RESEARCH_CATEGORIES: {
  name: string;
  subcategories: string[];
  description: string;
}[] = [
  {
    name: 'Curriculum & Pedagogical Foundations',
    subcategories: [
      'Learning Competency Mastery Analysis',
      'SPIRAL Progression & STEM Readiness',
      'Assessment Literacy & Instructional Alignment',
    ],
    description:
      'Baseline studies evaluating curriculum alignment, instructional time-on-task, and long-term competency retention across Junior and Senior High School.',
  },
  {
    name: 'Learner Socio-Emotional & Demographic Studies',
    subcategories: [
      'Coastal & Rural Household Learning Correlates',
      'Academic Resilience & Study Habits',
      'Career Track Preference & Post-Secondary Transition',
    ],
    description:
      'Empirical profiles of BNHS learners across coastal and upland barangays of Barobo, Surigao del Sur.',
  },
  {
    name: 'Educational Policy & School Governance Analysis',
    subcategories: [
      'School-Based Management (SBM) Impact Studies',
      'Resource Allocation & MOOE Utilization',
      'Community & Barangay Stakeholder Partnership',
    ],
    description:
      'Macro-level institutional studies supporting data-driven school improvement planning (SIP).',
  },
  {
    name: 'Institutional Assessment & Learning Outcomes',
    subcategories: [
      'National Achievement & Quarterly Diagnostic Trends',
      'Reading & Numeracy Proficiency Baselines',
      'Senior High School Exit Outcomes Tracer',
    ],
    description:
      'Longitudinal analysis of academic performance indicators, literacy indices, and graduate tracer records.',
  },
];

export const ACTION_RESEARCH_THEMES: {
  id: string;
  themeNumber: string;
  name: string;
  subcategories: string[];
  description: string;
}[] = [
  {
    id: 'theme-1',
    themeNumber: 'Theme 01',
    name: 'Theme 1: Teaching and Learning',
    subcategories: [
      'Reading Comprehension & Literacy Interventions',
      'Numeracy & Mathematical Problem-Solving Strategies',
      'Contextualized & Differentiated Instruction',
      'Laboratory & Inquiry-Based Pedagogy',
    ],
    description:
      'Classroom interventions addressing instructional delivery, learning remediation, instructional materials development, and student academic engagement.',
  },
  {
    id: 'theme-2',
    themeNumber: 'Theme 02',
    name: 'Theme 2: Child Protection',
    subcategories: [
      'Positive Discipline & Anti-Bullying Programs',
      'Psychosocial Support & Learner Mental Well-Being',
      'Peer Mediation & Safe School Spaces',
      'Cyber-Safety & Responsible Digital Citizenship',
    ],
    description:
      'Action studies safeguarding learner rights, preventing bullying and dropout risk, and strengthening guidance counseling systems.',
  },
  {
    id: 'theme-3',
    themeNumber: 'Theme 03',
    name: 'Theme 3: Human Resource Development',
    subcategories: [
      'Learning Action Cell (LAC) Collaborative Coaching',
      'Instructional Supervision & Clinical Mentoring',
      'Teacher Digital & Pedagogical Upskilling',
      'Faculty Workload & Well-Being Initiatives',
    ],
    description:
      'Initiatives enhancing teacher competence, peer mentoring through LAC sessions, and professional instructional support.',
  },
  {
    id: 'theme-4',
    themeNumber: 'Theme 04',
    name: 'Theme 4: Governance',
    subcategories: [
      'School-Based Management (SBM) Process Automation',
      'Data-Driven Attendance & Retention Monitoring',
      'PTA & Barangay Stakeholder Co-Governance',
      'Transparent Procurement & Record Management',
    ],
    description:
      'Institutional reforms improving school operations, transparency, attendance tracking, and participatory decision-making.',
  },
  {
    id: 'theme-5',
    themeNumber: 'Theme 05',
    name: 'Theme 5: Gender and Development (GAD)',
    subcategories: [
      'Gender-Responsive Classroom Pedagogy',
      'Equitable Participation in STEM & Robotics',
      'Gender-Fair Instructional Materials Review',
    ],
    description:
      'Action inquiries promoting gender equality, eliminating stereotyping in learning materials, and ensuring gender-fair student leadership.',
  },
  {
    id: 'theme-6',
    themeNumber: 'Theme 06',
    name: 'Theme 6: Inclusive Education',
    subcategories: [
      'Indigenous Peoples Education (IPEd) Contextualization',
      'Special Needs Education (SNED) Mainstreaming',
      'Alternative Delivery Modes (ADM) & SARDO Support',
    ],
    description:
      'Interventions supporting diverse learners, Manobo/Kamayo indigenous cultural integration, and Students-at-Risk-of-Dropping-Out (SARDO).',
  },
  {
    id: 'theme-7',
    themeNumber: 'Theme 07',
    name: 'Theme 7: Disaster Risk Reduction and Management (DRRM)',
    subcategories: [
      'Coastal Typhoon & Storm Surge Readiness Protocols',
      'School Eco-Waste & Climate Adaptation Systems',
      'WASH, School Health & Gulayan sa Paaralan',
    ],
    description:
      'Cross-cutting school safety, climate resilience, emergency preparedness drills, and sustainable environmental management.',
  },
];

export const TUKLAS_CATEGORIES: {
  id: string;
  code: string;
  name: string;
  subcategories: string[];
  description: string;
}[] = [
  {
    id: 'tuklas-ls',
    code: 'CAT-01 · LS',
    name: 'Life Science (LS)',
    subcategories: [
      'Botany & Agricultural Sciences',
      'Microbiology & Biochemistry',
      'Medicine, Health & Behavioral Sciences',
      'Zoology & Marine Ecology',
    ],
    description:
      'Experimental investigations in plant biology, marine biodiversity of Barobo Bay, antimicrobial phyto-extracts, and sustainable agriculture.',
  },
  {
    id: 'tuklas-ps',
    code: 'CAT-02 · PS',
    name: 'Physical Science (PS)',
    subcategories: [
      'Chemistry & Materials Science',
      'Physics & Energy Systems',
      'Earth & Environmental Sciences',
    ],
    description:
      'Applied research in biodegradable polymers, coastal water quality chemistry, renewable energy harvesting, and material engineering.',
  },
  {
    id: 'tuklas-rim',
    code: 'CAT-03 · RIM',
    name: 'Robotics and Intelligent Machines (RIM)',
    subcategories: [
      'Automated Systems & IoT',
      'Artificial Intelligence & Machine Vision',
      'Agricultural & Disaster Response Robotics',
    ],
    description:
      'Mechatronics, microcontroller sensor networks, computer vision diagnostics, and automated environmental monitoring prototypes.',
  },
  {
    id: 'tuklas-mcs',
    code: 'CAT-04 · MCS',
    name: 'Mathematics and Computational Sciences (MCS)',
    subcategories: [
      'Applied Mathematics & Statistical Modeling',
      'Algorithm Design & Data Analytics',
      'Educational Software & Simulation Systems',
    ],
    description:
      'Mathematical modeling, epidemiological and climate simulations, optimization algorithms, and computational learning platforms.',
  },
  {
    id: 'tuklas-ie',
    code: 'CAT-05 · IE',
    name: 'Innovation Expo',
    subcategories: [
      'Educational & Instructional Technology Innovations',
      'Sustainable Community & Livelihood Prototypes',
      'Disaster Resilience, Health & Utility Inventions',
      'Green Engineering & Upcycled Product Design',
    ],
    description:
      'Applied student and faculty inventions, instructional devices, sustainable community livelihood prototypes, and utility models exhibited at the BNHS TUKLAS Innovation Expo.',
  },
];

export function getCategoriesForDivision(division: ResearchDivisionId) {
  if (division === 'basic') {
    return BASIC_RESEARCH_CATEGORIES.map((c) => ({
      name: c.name,
      subcategories: c.subcategories,
      description: c.description,
    }));
  }
  if (division === 'action') {
    return ACTION_RESEARCH_THEMES.map((t) => ({
      name: t.name,
      subcategories: t.subcategories,
      description: t.description,
    }));
  }
  return TUKLAS_CATEGORIES.map((c) => ({
    name: c.name,
    subcategories: c.subcategories,
    description: c.description,
  }));
}

export const INITIAL_BNHS_RESEARCHES: ResearchRecord[] = [
  // ================= BASIC RESEARCH (3 Entries) =================
  {
    id: 'bnhs_basic_001',
    portalId: 'bnhs',
    title: 'Longitudinal Correlates of Senior High School STEM Readiness Among Grade 10 Completers at Barobo National High School',
    division: 'basic',
    category: 'Curriculum & Pedagogical Foundations',
    subcategory: 'SPIRAL Progression & STEM Readiness',
    abstract:
      'This completed basic research study examined the longitudinal academic predictors of STEM track readiness among 420 Grade 10 completers at Barobo National High School across two academic cohorts. Using multivariate regression on quarterly mastery indices in Integrated Science and Mathematics, the study identified critical conceptual bottlenecks in stoichiometric reasoning and trigonometric modeling, providing empirical baselines for bridging programs.',
    keywords: 'STEM Readiness, Spiral Progression, Quantitative Baseline, Senior High School, Barobo NHS',
    authors: 'Dr. Elena M. Urbiztondo, Mark Anthony R. Plaza',
    authorRole: 'Teacher',
    adviser: 'Dr. Elena M. Urbiztondo (School Research Coordinator)',
    departmentOrGrade: 'Science & Mathematics Department',
    schoolYear: '2025-2026',
    status: 'Approved',
    methodology:
      'Descriptive-correlational longitudinal design utilizing stratified random sampling (n = 420 Grade 10 completers), standardized diagnostic proficiency instruments, and multiple linear regression analysis.',
    keyFindings:
      'Hands-on laboratory exposure frequency (beta = 0.44, p < 0.001) and algebraic fluency accounted for 68.4% of variance in Grade 11 Pre-Calculus and General Chemistry diagnostic scores.',
    attachmentName: 'BNHS_BasicResearch_STEM_Readiness_2026.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1482900,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-basic-stem-readiness',
    evaluationScore: 96,
    evaluationRemarks:
      'Exemplary statistical rigor and direct policy utility for the BNHS Senior High School bridging curriculum. Approved for Division Research Congress presentation.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_coordinator_01',
    createdAtIso: '2026-02-14T08:30:00.000Z',
    updatedAtIso: '2026-03-01T14:15:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_basic_002',
    portalId: 'bnhs',
    title: 'Socio-Economic and Household Study Environment Profiles of Learners from Coastal Barangays of Barobo, Surigao del Sur',
    division: 'basic',
    category: 'Learner Socio-Emotional & Demographic Studies',
    subcategory: 'Coastal & Rural Household Learning Correlates',
    abstract:
      'An ongoing institutional baseline investigation mapping household study connectivity, livelihood seasonality, and study habit resilience among 610 Junior High School learners residing in coastal and island barangays serving Barobo National High School. Findings guide targeted deployment of offline digital learning packets.',
    keywords: 'Coastal Barangays, Learner Profile, Equity in Education, Surigao del Sur, Baseline Study',
    authors: 'Rhodora C. Balinton, Jomar S.Tejero',
    authorRole: 'Teacher',
    adviser: 'Dr. Elena M. Urbiztondo',
    departmentOrGrade: 'Araling Panlipunan & Guidance Department',
    schoolYear: '2026-2027',
    status: 'Ongoing',
    methodology:
      'Mixed-methods survey and geo-mapped household cluster analysis across eight coastal feeder barangays in Barobo.',
    keyFindings:
      'Preliminary data indicates 74% of coastal learners rely on offline modular references during monsoon months, supporting the creation of localized USB/microSD离线 learning libraries.',
    attachmentName: 'BNHS_Coastal_Learner_Profile_Draft_2026.docx',
    attachmentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    attachmentSize: 942000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-coastal-learner-profile',
    evaluationScore: 89,
    evaluationRemarks:
      'Strong sampling coverage across coastal barangays. Proceed with Phase 2 focus group discussions.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_teacher_02',
    createdAtIso: '2026-06-10T09:00:00.000Z',
    updatedAtIso: '2026-08-22T11:20:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_basic_003',
    portalId: 'bnhs',
    title: 'Post-Secondary Transition and Technical-Vocational Employment Tracer of BNHS TVL Graduates (Cohorts 2023–2025)',
    division: 'basic',
    category: 'Institutional Assessment & Learning Outcomes',
    subcategory: 'Senior High School Exit Outcomes Tracer',
    abstract:
      'Completed tracer study tracking the employment, entrepreneurship, and higher education enrollment trajectories of 385 Technical-Vocational-Livelihood (TVL) graduates of Barobo National High School in Agri-Fishery Arts, ICT, and Home Economics.',
    keywords: 'Graduate Tracer, TVL Track, Employability, TESDA National Certification, Barobo',
    authors: 'Engr. Dennis L. Millan, Clarissa V. Ocampo',
    authorRole: 'Teacher',
    adviser: 'Dr. Elena M. Urbiztondo',
    departmentOrGrade: 'Senior High School - TVL Department',
    schoolYear: '2025-2026',
    status: 'Completed',
    methodology:
      'Descriptive tracer survey with verified TESDA NC-II certification cross-tabulation and employer feedback interviews.',
    keyFindings:
      '82.6% of NC-II certified TVL graduates secured relevant employment or launched local aquaculture/food-processing micro-enterprises within 9 months of graduation.',
    attachmentName: 'BNHS_SHS_TVL_Graduate_Tracer_2026.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1820400,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-tvl-tracer-2026',
    evaluationScore: 93,
    evaluationRemarks:
      'Well-documented tracer dataset. Recommended for integration into the School Improvement Plan (SIP).',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_teacher_03',
    createdAtIso: '2026-01-19T10:00:00.000Z',
    updatedAtIso: '2026-04-05T16:00:00.000Z',
    isBaseline: true,
  },

  // ================= ACTION RESEARCH: ALL 7 THEMES =================
  {
    id: 'bnhs_action_t1',
    portalId: 'bnhs',
    title: 'Project SIKAT (Structured Interactive Reading & Vocabulary Scaffolds) to Elevate Phil-IRI Comprehension Levels in Grade 8',
    division: 'action',
    category: 'Theme 1: Teaching and Learning',
    subcategory: 'Reading Comprehension & Literacy Interventions',
    abstract:
      'This classroom action research implemented Project SIKAT over a 10-week intervention cycle for 48 Grade 8 frustration-level readers at Barobo National High School. Integrating local Surigaonon folktale texts with reciprocal questioning scaffolds significantly improved literal and inferential reading comprehension.',
    keywords: 'Phil-IRI, Reading Intervention, Project SIKAT, Reciprocal Questioning, Grade 8 English',
    authors: 'Maricel P. Duhac, Joycelle A. Campos',
    authorRole: 'Teacher',
    adviser: 'Master Teacher II Evelyn G. Navarro',
    departmentOrGrade: 'English Department · Grade 8',
    schoolYear: '2025-2026',
    status: 'Approved',
    methodology:
      'Quasi-experimental one-group pretest-posttest classroom action research using Phil-IRI validated passages and paired-samples t-test.',
    keyFindings:
      'Mean comprehension scores rose from 46.2% (Frustration) to 78.9% (Instructional/Independent), t(47) = 14.82, p < 0.0001, with 87.5% of participants transitioning out of the frustration category.',
    attachmentName: 'BNHS_ActionResearch_Theme1_ProjectSIKAT.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1320500,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-action-theme1-sikat',
    evaluationScore: 95,
    evaluationRemarks:
      'Outstanding classroom impact with replicable reading modules. Approved for school-wide adoption across Grade 7 and 8.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_teacher_04',
    createdAtIso: '2026-03-11T08:00:00.000Z',
    updatedAtIso: '2026-04-18T15:30:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_action_t2',
    portalId: 'bnhs',
    title: 'KALINGA Peer Mediation Circles: Reducing Classroom Conflict Incidents and Strengthening Child Protection Reporting in Grade 9',
    division: 'action',
    category: 'Theme 2: Child Protection',
    subcategory: 'Peer Mediation & Safe School Spaces',
    abstract:
      'Designed under DepEd Child Protection Policy (DO 40, s. 2012), this action research established student-led KALINGA Peer Mediation Circles across six Grade 9 sections at Barobo National High School to de-escalate interpersonal peer conflicts and foster psychologically safe homerooms.',
    keywords: 'Child Protection Policy, Peer Mediation, Restorative Discipline, Safe Schools, Guidance',
    authors: 'Lorna B. Cañete, RGC, Ronald M.Alvizo',
    authorRole: 'Teacher',
    adviser: 'Dr. Elena M. Urbiztondo',
    departmentOrGrade: 'Guidance & Values Education (EsP) Department',
    schoolYear: '2025-2026',
    status: 'Approved',
    methodology:
      'Participatory action research tracking monthly guidance referral logs, climate perception scales, and structured restorative circle protocols over two quarters.',
    keyFindings:
      'Minor peer conflict referrals decreased by 64.2% over 16 weeks, while student self-reported psychological safety scores increased from 3.12 to 4.58 on a 5-point scale.',
    attachmentName: 'BNHS_ActionResearch_Theme2_KALINGA_ChildProtection.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1185000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-action-theme2-kalinga',
    evaluationScore: 94,
    evaluationRemarks:
      'Exemplary alignment with DepEd Child Protection standards. Adopted by the BNHS Child Protection Committee.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_teacher_05',
    createdAtIso: '2026-02-25T10:15:00.000Z',
    updatedAtIso: '2026-04-12T09:45:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_action_t3',
    portalId: 'bnhs',
    title: 'Micro-Credentialed Learning Action Cell (LAC) Peer Coaching on Interactive PhET and GeoGebra Simulations for BNHS Teachers',
    division: 'action',
    category: 'Theme 3: Human Resource Development',
    subcategory: 'Learning Action Cell (LAC) Collaborative Coaching',
    abstract:
      'This human resource development action research evaluated a 6-session hands-on Learning Action Cell (LAC) peer-coaching program equipping 34 Junior High School Science and Mathematics teachers at Barobo National High School to design offline-capable interactive simulations.',
    keywords: 'Learning Action Cell, Teacher Professional Development, Clinical Supervision, GeoGebra, PhET',
    authors: 'Master Teacher II Evelyn G. Navarro, Arnel C. Lozada',
    authorRole: 'Teacher',
    adviser: 'Dr. Elena M. Urbiztondo',
    departmentOrGrade: 'Faculty Professional Development · JHS',
    schoolYear: '2025-2026',
    status: 'Completed',
    methodology:
      'Action research utilizing classroom observation tool (COT-RPMS) rubric ratings before and after peer-coached LAC lesson study cycles.',
    keyFindings:
      'Participating teachers improved their COT Indicator 3 (ICT & Teaching Resource Integration) mean rating from 5.18 to 6.74 out of 7.00.',
    attachmentName: 'BNHS_ActionResearch_Theme3_LAC_Coaching.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1540000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-action-theme3-lac',
    evaluationScore: 92,
    evaluationRemarks:
      'Clear measurable gains in COT-RPMS instructional competence indicators.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_coordinator_01',
    createdAtIso: '2026-01-30T13:00:00.000Z',
    updatedAtIso: '2026-03-29T16:10:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_action_t4',
    portalId: 'bnhs',
    title: 'QR-Assisted Daily Attendance and Early Warning SARDO Tracker for School-Based Management Efficiency at BNHS',
    division: 'action',
    category: 'Theme 4: Governance',
    subcategory: 'Data-Driven Attendance & Retention Monitoring',
    abstract:
      'Addressing delayed identification of Students-at-Risk-of-Dropping-Out (SARDO), this governance action research deployed a low-cost offline-first QR ID scanning workflow synced weekly with class advisers and parents at Barobo National High School.',
    keywords: 'School Governance, SBM, SARDO Prevention, Attendance Tracking, Dropout Reduction',
    authors: 'Engr. Dennis L. Millan,Reynaldo T. Sajelan',
    authorRole: 'Collaborative',
    adviser: 'Dr. Elena M. Urbiztondo',
    departmentOrGrade: 'School Governance & ICT Committee',
    schoolYear: '2026-2027',
    status: 'Approved',
    methodology:
      'Developmental action research comparing administrative SF2 consolidation time and consecutive-absence intervention latency across 18 sections.',
    keyFindings:
      'Reduced monthly SF2 attendance verification time by 78% and triggered home-visitation counseling within 3 consecutive absences, cutting quarterly SARDO incidence by 52%.',
    attachmentName: 'BNHS_ActionResearch_Theme4_Governance_QR_SARDO.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1650200,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-action-theme4-governance',
    evaluationScore: 97,
    evaluationRemarks:
      'High institutional impact on school retention governance and SF2 reporting accuracy.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_teacher_03',
    createdAtIso: '2026-05-12T08:45:00.000Z',
    updatedAtIso: '2026-07-02T10:30:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_action_t5',
    portalId: 'bnhs',
    title: 'Breaking Gender Stereotypes in Technical-Vocational Laboratories Through Rotational Non-Traditional Skill Pairing',
    division: 'action',
    category: 'Theme 5: Gender and Development (GAD)',
    subcategory: 'Equitable Participation in STEM & Robotics',
    abstract:
      'This Gender and Development (GAD) action research restructured TLE/TVL laboratory groupings at Barobo National High School using gender-balanced rotational lead roles across Shielded Metal Arc Welding, Aquaculture, and Culinary Arts modules.',
    keywords: 'Gender and Development, GAD Mainstreaming, TVL Laboratories, Inclusive Pedagogy',
    authors: 'Clarissa V. Ocampo, Generoso P. Tamayo',
    authorRole: 'Teacher',
    adviser: 'Master Teacher II Evelyn G. Navarro',
    departmentOrGrade: 'TLE / TVL Department · Grades 9–11',
    schoolYear: '2025-2026',
    status: 'Completed',
    methodology:
      'Classroom action research combining practical skill rubrics, GAD audit checklists, and learner self-efficacy scales.',
    keyFindings:
      'Female student hands-on equipment leadership in industrial and aquaculture tasks increased from 28% to 51%, with zero gender gap in practical competency scores.',
    attachmentName: 'BNHS_ActionResearch_Theme5_GAD_Laboratories.docx',
    attachmentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    attachmentSize: 890400,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-action-theme5-gad',
    evaluationScore: 91,
    evaluationRemarks:
      'Commendable GAD integration in TVL workshop instruction.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_teacher_03',
    createdAtIso: '2026-02-08T11:00:00.000Z',
    updatedAtIso: '2026-03-25T14:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_action_t6',
    portalId: 'bnhs',
    title: 'Ethnomathematical Learning Packets Anchored on Kamayo and Manobo Weaving and Fishery Practices for Inclusive Grade 7 Instruction',
    division: 'action',
    category: 'Theme 6: Inclusive Education',
    subcategory: 'Indigenous Peoples Education (IPEd) Contextualization',
    abstract:
      'Developed in consultation with local cultural elders in Barobo, this Inclusive Education action research indigenized Grade 7 geometry and ratio modules using traditional basketry tessellations and municipal artisanal fishery measurement practices.',
    keywords: 'Inclusive Education, IPEd, Ethnomathematics, Kamayo Culture, Contextualized Learning',
    authors: 'Mark Anthony R. Plaza, Nelly S. Morigo',
    authorRole: 'Teacher',
    adviser: 'Dr. Elena M. Urbiztondo',
    departmentOrGrade: 'Mathematics Department · IPEd Focal',
    schoolYear: '2026-2027',
    status: 'Approved',
    methodology:
      'Culturally responsive action research with indigenous learner cohorts (n = 62) using validated pre/post mastery assessments and elder validation rubrics.',
    keyFindings:
      'Indigenous and rural learners achieved an 84.6% mastery rate in geometric transformations compared to 61.3% in standard non-contextualized worksheets.',
    attachmentName: 'BNHS_ActionResearch_Theme6_IPEd_Ethnomath.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 2110000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-action-theme6-iped',
    evaluationScore: 96,
    evaluationRemarks:
      'Culturally authentic and rigorously validated with community elders. Approved for Division IPEd resource repository.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_teacher_02',
    createdAtIso: '2026-06-01T07:50:00.000Z',
    updatedAtIso: '2026-08-14T13:20:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_action_t7',
    portalId: 'bnhs',
    title: 'Brigada Eco-Resilience: Student-Led Storm Surge Micro-Zonation Mapping and Solid Waste Bioconversion at Barobo NHS',
    division: 'action',
    category: 'Theme 7: Disaster Risk Reduction and Management (DRRM)',
    subcategory: 'Coastal Typhoon & Storm Surge Readiness Protocols',
    abstract:
      'This DRRM and environmental action research engaged Supreme Secondary Learner Government (SSLG) officers and science clubs in updating campus hazard micro-maps and converting biodegradable canteen waste into vermicompost for the Gulayan sa Paaralan.',
    keywords: 'SDRRM, Climate Resilience, Hazard Mapping, Vermicomposting, Gulayan sa Paaralan',
    authors: 'Jomar S. Tejero, SSLG DRRM Core Group',
    authorRole: 'Collaborative',
    adviser: 'Dr. Elena M. Urbiztondo',
    departmentOrGrade: 'SDRRM Office & Science Club',
    schoolYear: '2026-2027',
    status: 'Ongoing',
    methodology:
      'Participatory school-based DRRM action research measuring campus evacuation drill clearance times and weekly biodegradable waste diversion mass (kg).',
    keyFindings:
      'Campus-wide multi-hazard evacuation time improved from 6 minutes 40 seconds to 3 minutes 55 seconds, while diverting 185 kg/month of organic waste into school garden soil enhancers.',
    attachmentName: 'BNHS_ActionResearch_Theme7_SDRRM_EcoResilience.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1745000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-action-theme7-drrm',
    evaluationScore: 90,
    evaluationRemarks:
      'Strong student participation and measurable campus safety outcomes.',
    evaluatedBy: 'BNHS School Research Committee',
    authorUid: 'baseline_teacher_02',
    createdAtIso: '2026-07-15T09:30:00.000Z',
    updatedAtIso: '2026-09-10T11:00:00.000Z',
    isBaseline: true,
  },

  // ================= TUKLAS: A RESEARCH PROJECT FAIR (4 Major Categories) =================
  {
    id: 'bnhs_tuklas_ls_01',
    portalId: 'bnhs',
    title: 'Foliar Bio-Stimulant Formulated from Fermented Eucheuma denticulatum (Spinosum Seaweed) Off Barobo Bay for Pechay (Brassica rapa) Growth',
    division: 'tuklas',
    category: 'Life Science (LS)',
    subcategory: 'Botany & Agricultural Sciences',
    abstract:
      'Developed for the BNHS TUKLAS Research Project Fair, this Life Science study extracted cytokinin-rich liquid bio-stimulants from locally harvested Eucheuma denticulatum seaweed in Barobo, Surigao del Sur. Randomized complete block trials demonstrated superior leaf area index and wet biomass compared to synthetic urea controls.',
    keywords: 'Eucheuma denticulatum, Seaweed Bio-Stimulant, Barobo Bay Aquaculture, Life Science, TUKLAS Fair',
    authors: 'Katrina Mae S. Ledesma, Joshua R. Baliling, Althea C. Picardal',
    authorRole: 'Student',
    adviser: 'Dr. Elena M. Urbiztondo',
    departmentOrGrade: 'Grade 12 - STEM Strand',
    schoolYear: '2026-2027',
    status: 'Approved',
    methodology:
      'Randomized Complete Block Design (RCBD) with 4 treatment concentrations (0%, 15%, 30%, 45% fermented seaweed extract) across 60 experimental pots, analyzed via One-Way ANOVA and Tukey HSD.',
    keyFindings:
      'The 30% Eucheuma denticulatum foliar spray treatment yielded a 38.4% increase in harvestable biomass (p = 0.0004) and reduced soil acidification compared to commercial synthetic fertilizer.',
    attachmentName: 'TUKLAS_LS_Eucheuma_Seaweed_BioStimulant_BNHS.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 2390000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-tuklas-ls-seaweed',
    evaluationScore: 98,
    evaluationRemarks:
      '1st Place Best TUKLAS Project in Life Science. Exceptional utilization of abundant Barobo marine resources with rigorous ANOVA validation.',
    evaluatedBy: 'TUKLAS Scientific Review Panel',
    authorUid: 'baseline_student_01',
    createdAtIso: '2026-08-05T08:15:00.000Z',
    updatedAtIso: '2026-09-28T17:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_tuklas_ps_01',
    portalId: 'bnhs',
    title: 'Thermal and Tensile Characterization of Biodegradable Packaging Film Reinforced with Calcined Perna viridis (Green Mussel) Shell Powder from Barobo Coastal Markets',
    division: 'tuklas',
    category: 'Physical Science (PS)',
    subcategory: 'Chemistry & Materials Science',
    abstract:
      'In Barobo coastal barangays, discarded Perna viridis (Tahong) shells accumulate as solid waste. This Physical Science investigation synthesized a cassava starch bio-polymer reinforced with micro-calcined mussel shell calcium carbonate (CaCO3) nanoparticles, achieving high tensile strength and rapid soil biodegradability.',
    keywords: 'Perna viridis, Mussel Shell CaCO3, Biodegradable Bio-Polymer, Materials Science, TUKLAS Fair',
    authors: 'Christian Dave M. Orcullo, Hannah Grace B.Tiu',
    authorRole: 'Student',
    adviser: 'Arnel C. Lozada',
    departmentOrGrade: 'Grade 10 - Special Science Class (STE)',
    schoolYear: '2026-2027',
    status: 'Approved',
    methodology:
      'Experimental materials synthesis varying calcined shell filler loading (5 wt%, 10 wt%, 15 wt%) with ASTM D882 tensile strength testing, water vapor transmission rate, and 28-day soil burial mass-loss assays.',
    keyFindings:
      '10 wt% calcined Perna viridis CaCO3 composite film exhibited a 2.4x increase in tensile strength (14.8 MPa) and 41% lower moisture absorption while degrading by 89% within 28 days in coastal sandy-loam soil.',
    attachmentName: 'TUKLAS_PS_MusselShell_BioPlastic_BNHS.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1965000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-tuklas-ps-musselshell',
    evaluationScore: 95,
    evaluationRemarks:
      'Strong circular-economy chemistry addressing Barobo shellfish waste. Selected for Division Science & Technology Fair.',
    evaluatedBy: 'TUKLAS Scientific Review Panel',
    authorUid: 'baseline_student_02',
    createdAtIso: '2026-08-12T10:30:00.000Z',
    updatedAtIso: '2026-10-02T14:45:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_tuklas_rim_01',
    portalId: 'bnhs',
    title: 'BANTAY-DAGAT IoT: Solar-Powered Telemetry Buoy for Real-Time Dissolved Oxygen, pH, and Turbidity Alerting in Barobo Milkfish (Chanos chanos) Cages',
    division: 'tuklas',
    category: 'Robotics and Intelligent Machines (RIM)',
    subcategory: 'Automated Systems & IoT',
    abstract:
      'Sudden dissolved oxygen depletion and salinity shifts after heavy rainfall threaten milkfish (Bangus) mariculture cages in Barobo Bay. This Robotics & Intelligent Machines project engineered a solar-powered ESP32/LoRa floating telemetry buoy that transmits real-time water quality alerts and triggers an automated surface aerator relay.',
    keywords: 'Aquaculture IoT, LoRa Telemetry, Dissolved Oxygen Sensor, Robotics, Barobo Mariculture',
    authors: 'Kian Gabriel V. Cortez, Francis Leo D. Manliguez, Bea Marie P. Sulapas',
    authorRole: 'Student',
    adviser: 'Engr. Dennis L. Millan',
    departmentOrGrade: 'Grade 12 - STEM & ICT Robotics Club',
    schoolYear: '2026-2027',
    status: 'Approved',
    methodology:
      'Engineering prototype development integrating galvanic DO, industrial pH, DS18B20 thermal probes, and LoRa 433MHz transceiver calibrated against standard Winkler titration and digital Hanna meters over 14 days of brackish water deployment.',
    keyFindings:
      'Achieved 98.4% sensor calibration accuracy (RMSE = 0.14 mg/L DO), 2.1 km line-of-sight LoRa transmission to shore without cellular data fees, and sub-3-second automatic aerator activation when DO drops below 4.0 mg/L.',
    attachmentName: 'TUKLAS_RIM_BantayDagat_Aquaculture_IoT.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 3120000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-tuklas-rim-bantaydagat',
    evaluationScore: 99,
    evaluationRemarks:
      'Best Overall TUKLAS Engineering & Robotics Prototype. Directly solves hypoxia fish-kill risks for Barobo fisherfolk.',
    evaluatedBy: 'TUKLAS Scientific Review Panel',
    authorUid: 'baseline_student_03',
    createdAtIso: '2026-08-18T14:00:00.000Z',
    updatedAtIso: '2026-10-08T16:20:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_tuklas_mcs_01',
    portalId: 'bnhs',
    title: 'Capacity-Constrained Dijkstra Evacuation Routing Model for Coastal Storm Surge Scenarios in Municipality of Barobo',
    division: 'tuklas',
    category: 'Mathematics and Computational Sciences (MCS)',
    subcategory: 'Applied Mathematics & Statistical Modeling',
    abstract:
      'This Mathematics & Computational Sciences study constructed a weighted directed road-network graph of Barobo’s coastal barangays (Poblacion, Wakat, Dapdap, and Rizal) incorporating elevation gradients, storm surge inundation polygons, and evacuation center capacity constraints to compute optimal multi-source evacuation assignments.',
    keywords: 'Graph Theory, Dijkstra Algorithm, Storm Surge Evacuation, Mathematical Modeling, TUKLAS MCS',
    authors: 'Sophia Lorraine G. Yu, Neil Patrick A. Montero',
    authorRole: 'Student',
    adviser: 'Mark Anthony R. Plaza',
    departmentOrGrade: 'Grade 11 - STEM Strand',
    schoolYear: '2026-2027',
    status: 'Approved',
    methodology:
      'Computational graph modeling in Python (NetworkX) with 142 nodes and 218 weighted edges parameterized by walking velocity decay on inclined road segments and shelter capacity limits.',
    keyFindings:
      'Capacity-constrained routing reduced simulated bottleneck congestion at Barobo National High School and Municipal Gymnasium evacuation hubs by 34.7% under a 3-meter storm surge scenario.',
    attachmentName: 'TUKLAS_MCS_Barobo_StormSurge_GraphModel.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 1680000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-tuklas-mcs-evacuation',
    evaluationScore: 95,
    evaluationRemarks:
      'Rigorous mathematical formulation with direct applicability to MDRRMO Barobo evacuation planning.',
    evaluatedBy: 'TUKLAS Scientific Review Panel',
    authorUid: 'baseline_student_04',
    createdAtIso: '2026-08-21T09:15:00.000Z',
    updatedAtIso: '2026-10-05T11:40:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_tuklas_ls_02',
    portalId: 'bnhs',
    title: 'Larvicidal Efficacy of Chromolaena odorata (Hagonoy) and Cymbopogon citratus Ethanolic Leaf Extracts Against Aedes aegypti Instars',
    division: 'tuklas',
    category: 'Life Science (LS)',
    subcategory: 'Microbiology & Biochemistry',
    abstract:
      'An ongoing TUKLAS Life Science bioassay evaluating synergistic larvicidal formulations from abundant local Chromolaena odorata and lemongrass extracts for community dengue vector control around school drainage perimeters.',
    keywords: 'Aedes aegypti, Larvicidal Bioassay, Chromolaena odorata, Probit Analysis, Dengue Prevention',
    authors: 'Janelle Mae R. Cuartero, Vince Angelo T. Balingit',
    authorRole: 'Student',
    adviser: 'Master Teacher II Evelyn G. Navarro',
    departmentOrGrade: 'Grade 9 - Special Science Class (STE)',
    schoolYear: '2026-2027',
    status: 'Pending Review',
    methodology:
      'WHO-standard 24-hour and 48-hour mosquito larvicidal bioassay with Probit LC50 and LC90 estimation across five concentration gradients.',
    keyFindings:
      'Preliminary 24-hour mortality reached 93.3% at 150 ppm synergistic extract concentration (estimated LC50 = 64.2 ppm). Awaiting final committee verification.',
    attachmentName: 'TUKLAS_LS_Hagonoy_Larvicidal_Manuscript.docx',
    attachmentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    attachmentSize: 1120000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-tuklas-ls-larvicidal',
    evaluationScore: 0,
    evaluationRemarks: '',
    evaluatedBy: '',
    authorUid: 'baseline_student_05',
    createdAtIso: '2026-10-14T13:20:00.000Z',
    updatedAtIso: '2026-10-14T13:20:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_tuklas_rim_02',
    portalId: 'bnhs',
    title: 'Convolutional Neural Network (MobileNetV3) Offline Mobile Diagnostic Tool for Abaca (Musa textilis) Bunchy Top Virus Leaf Symptomatology',
    division: 'tuklas',
    category: 'Robotics and Intelligent Machines (RIM)',
    subcategory: 'Artificial Intelligence & Machine Vision',
    abstract:
      'Designed to assist upland abaca farmers in Barobo and neighboring Surigao del Sur municipalities, this machine vision study trained a quantized MobileNetV3 model on 2,400 field-captured leaf images to detect early Abaca Bunchy Top Virus (ABTV) chlorotic streak symptoms without internet connectivity.',
    keywords: 'Machine Vision, MobileNetV3, Abaca Bunchy Top Virus, Edge AI, Agricultural Diagnostics',
    authors: 'rianne Kaye L. Espinoza, Kurt Justine S. Pimentel',
    authorRole: 'Student',
    adviser: 'Engr. Dennis L. Millan',
    departmentOrGrade: 'Grade 12 - STEM Strand',
    schoolYear: '2026-2027',
    status: 'Pending Review',
    methodology:
      'Transfer learning with 5-fold cross-validation on augmented field imagery (healthy, early ABTV, nutrient deficiency, fungal leaf spot) deployed as an offline TensorFlow Lite Android package.',
    keyFindings:
      'Achieved 94.8% validation F1-score with an average on-device inference latency of 118 milliseconds on entry-level smartphones.',
    attachmentName: 'TUKLAS_RIM_AbacaVision_CNN_2026.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 2840000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-tuklas-rim-abacavision',
    evaluationScore: 0,
    evaluationRemarks: '',
    evaluatedBy: '',
    authorUid: 'baseline_student_03',
    createdAtIso: '2026-10-19T15:00:00.000Z',
    updatedAtIso: '2026-10-19T15:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'bnhs_tuklas_ie_01',
    portalId: 'bnhs',
    title: 'Solar-Assisted Hybrid Coconut Husk & Seaweed Biomass Dehydrator for Smallholder Coastal Copra and Carrageenan Producers in Barobo',
    division: 'tuklas',
    category: 'Innovation Expo',
    subcategory: 'Sustainable Community & Livelihood Prototypes',
    abstract:
      'Developed for the BNHS TUKLAS Innovation Expo, this student-faculty utility invention combines a polycarbonate solar thermal collector with an automated coconut-husk biomass backup heater and PID humidity controller to dry raw Eucheuma seaweed and copra 3.2 times faster than open-air sun drying during rainy monsoon weeks.',
    keywords: 'Innovation Expo, Solar Biomass Dehydrator, Seaweed Drying, Livelihood Prototype, Barobo NHS',
    authors: 'Jhon Rey M. Alvizo, Princess Diane C. Orcullo, Engr. Dennis L. Millan',
    authorRole: 'Collaborative',
    adviser: 'Engr. Dennis L. Millan',
    departmentOrGrade: 'Grade 12 - STEM & TVL Industrial Arts',
    schoolYear: '2026-2027',
    status: 'Approved',
    methodology:
      'Engineering utility prototype fabrication and comparative thermal-efficiency testing across 15 batch trials measuring moisture reduction curves (from 84% to 15% moisture content), chamber temperature uniformity, and fuel efficiency.',
    keyFindings:
      'Reduced seaweed drying time from 48 hours to 14.5 hours under intermittent cloud cover while preventing sand and mold contamination, increasing Grade-A dried seaweed yield by 29.4%.',
    attachmentName: 'TUKLAS_InnovationExpo_SolarBiomass_Dehydrator_2026.pdf',
    attachmentType: 'application/pdf',
    attachmentSize: 2450000,
    fileDocId: '',
    driveUrl: 'https://drive.google.com/drive/folders/1bnhs-tuklas-innovation-expo',
    evaluationScore: 98,
    evaluationRemarks:
      'Outstanding TUKLAS Innovation Expo entry with immediate community livelihood adoption potential for Barobo coastal barangays.',
    evaluatedBy: 'TUKLAS Scientific & Innovation Review Panel',
    authorUid: 'baseline_teacher_03',
    createdAtIso: '2026-10-22T10:30:00.000Z',
    updatedAtIso: '2026-10-25T14:15:00.000Z',
    isBaseline: true,
  },
];

export const INITIAL_BNHS_RESEARCHERS: ResearcherProfileRecord[] = [
  {
    id: 'baseline_coordinator_01',
    portalId: 'bnhs',
    uid: 'baseline_coordinator_01',
    fullName: 'Dr. Elena M. Urbiztondo',
    role: 'Research Coordinator',
    departmentOrStrand: 'School Research & Innovation Center',
    gradeOrPosition: 'Master Teacher II · Overall Research Coordinator',
    specialization: 'Educational Policy, Quantitative Longitudinal Design, Life Sciences Mentoring',
    bio: 'Leads the Barobo National High School Research and Innovation Portal, mentoring faculty Action Research across the 7 DepEd themes and overseeing TUKLAS Science & Technology Fair delegations.',
    institutionIdCode: 'BNHS-FAC-001',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1bnhs-coordinator-urbiztondo',
    isBaseline: true,
  },
  {
    id: 'baseline_teacher_02',
    portalId: 'bnhs',
    uid: 'baseline_teacher_02',
    fullName: 'Mark Anthony R. Plaza',
    role: 'Teacher Researcher',
    departmentOrStrand: 'Mathematics Department',
    gradeOrPosition: 'Teacher III · IPEd & MCS Research Adviser',
    specialization: 'Ethnomathematics, Graph Theory Modeling, Statistical Analytics',
    bio: 'Specializes in contextualized Indigenous Peoples Education (IPEd) mathematics modules and advises student computational modeling projects for TUKLAS MCS.',
    institutionIdCode: 'BNHS-FAC-014',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1bnhs-faculty-plaza',
    isBaseline: true,
  },
  {
    id: 'baseline_teacher_03',
    portalId: 'bnhs',
    uid: 'baseline_teacher_03',
    fullName: 'Engr. Dennis L. Millan',
    role: 'Master Teacher / Adviser',
    departmentOrStrand: 'Senior High School — STEM & TVL',
    gradeOrPosition: 'Master Teacher I · Robotics & Embedded Systems Adviser',
    specialization: 'IoT Telemetry, Mechatronics, School Governance Automation, TVL Tracer Studies',
    bio: 'Advises the BNHS Robotics & Intelligent Machines (RIM) laboratory and leads school governance automation initiatives.',
    institutionIdCode: 'BNHS-FAC-008',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1bnhs-faculty-millan',
    isBaseline: true,
  },
  {
    id: 'baseline_teacher_04',
    portalId: 'bnhs',
    uid: 'baseline_teacher_04',
    fullName: 'Maricel P. Duhac',
    role: 'Teacher Researcher',
    departmentOrStrand: 'English & Reading Literacy Department',
    gradeOrPosition: 'Teacher III · Phil-IRI Literacy Coordinator',
    specialization: 'Reading Comprehension Scaffolds, Contextualized Surigaonon Literature',
    bio: 'Principal proponent of Project SIKAT literacy scaffolds addressing frustration-level readers in Junior High School.',
    institutionIdCode: 'BNHS-FAC-022',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1bnhs-faculty-duhac',
    isBaseline: true,
  },
  {
    id: 'baseline_student_01',
    portalId: 'bnhs',
    uid: 'baseline_student_01',
    fullName: 'Katrina Mae S. Ledesma',
    role: 'Student Researcher',
    departmentOrStrand: 'Senior High School — STEM Strand',
    gradeOrPosition: 'Grade 12 STEM · TUKLAS Life Science Lead',
    specialization: 'Marine Botany, Seaweed Bio-Stimulants, Agricultural Biometrics',
    bio: 'Lead student researcher of the Eucheuma denticulatum foliar bio-stimulant study and 1st Place recipient in the BNHS TUKLAS Life Science Category.',
    institutionIdCode: 'BNHS-STU-2026-104',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1bnhs-student-ledesma',
    isBaseline: true,
  },
  {
    id: 'baseline_student_03',
    portalId: 'bnhs',
    uid: 'baseline_student_03',
    fullName: 'Kian Gabriel V. Cortez',
    role: 'Student Researcher',
    departmentOrStrand: 'Senior High School — STEM & Robotics',
    gradeOrPosition: 'Grade 12 STEM · TUKLAS RIM Lead Engineer',
    specialization: 'LoRa Aquaculture Telemetry, ESP32 Sensor Networks, Edge Computer Vision',
    bio: 'Lead student engineer of the BANTAY-DAGAT IoT Solar Water Quality Telemetry Buoy designed for Barobo Bay milkfish cages.',
    institutionIdCode: 'BNHS-STU-2026-119',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1bnhs-student-cortez',
    isBaseline: true,
  },
];

export interface ResearchCommentRecord {
  id: string;
  portalId: 'bnhs';
  researchId: string;
  authorUid: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAtIso: string;
  isBaseline?: boolean;
}

export interface ResearchSubscriptionRecord {
  id: string;
  portalId: 'bnhs';
  researchId: string;
  researchTitle: string;
  subscriberUid: string;
  subscriberEmail: string;
  notifyOnStatusChange: boolean;
  notifyOnComments: boolean;
  createdAtIso: string;
}

export interface EmailAlertLogRecord {
  id: string;
  researchId: string;
  researchTitle: string;
  recipientEmail: string;
  triggerType: 'status_change' | 'new_comment' | 'subscription_confirmed';
  subject: string;
  messageBody: string;
  dispatchedAtIso: string;
}

export interface OverviewItemRecord {
  id: string;
  portalId: 'bnhs';
  itemType: 'hero' | 'card';
  code: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  divisionLink: 'none' | 'basic' | 'action' | 'tuklas';
  displayOrder: number;
  isDeleted: boolean;
  updatedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export const INITIAL_BNHS_COMMENTS: ResearchCommentRecord[] = [
  {
    id: 'cmt_baseline_001',
    portalId: 'bnhs',
    researchId: 'bnhs_basic_001',
    authorUid: 'baseline_coordinator_01',
    authorName: 'Dr. Elena M. Urbiztondo',
    authorRole: 'Research Coordinator',
    content:
      'Stoichiometry and trigonometric modeling modules from this study have been endorsed for the SY 2026–2027 Senior High School STEM Summer Bridging Program.',
    createdAtIso: '2026-03-04T09:30:00.000Z',
    isBaseline: true,
  },
  {
    id: 'cmt_baseline_002',
    portalId: 'bnhs',
    researchId: 'bnhs_tuklas_rim_01',
    authorUid: 'baseline_teacher_03',
    authorName: 'Engr. Dennis L. Millan',
    authorRole: 'Master Teacher I · RIM Adviser',
    content:
      'Field telemetry tests at Barobo Bay mariculture zone confirmed stable 433MHz LoRa packet reception across 2.1 km even during moderate squalls.',
    createdAtIso: '2026-10-09T11:15:00.000Z',
    isBaseline: true,
  },
];

export const INITIAL_OVERVIEW_ITEMS: OverviewItemRecord[] = [
  {
    id: 'overview_hero_main',
    portalId: 'bnhs',
    itemType: 'hero',
    code: 'DepEd Caraga · Division of Surigao del Sur · Municipality of Barobo',
    title: 'Barobo National High School Research & Innovation Portal',
    subtitle: 'Empowering Evidence-Based Pedagogy & Student STEM Discovery in Surigao del Sur',
    description:
      'A unified institutional repository, peer evaluation workflow, and public digital library connecting Basic Research, Action Research across the seven official DepEd themes, and the TUKLAS Research Project Fair.',
    imageUrl: PORTAL_IMAGES.heroCampus,
    divisionLink: 'none',
    displayOrder: 0,
    isDeleted: false,
    updatedByUid: 'baseline_coordinator_01',
    createdAtIso: '2026-01-15T08:00:00.000Z',
    updatedAtIso: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'overview_card_basic',
    portalId: 'bnhs',
    itemType: 'card',
    code: 'DIV-01',
    title: 'Basic Research',
    subtitle: 'Foundational & Policy Repository',
    description:
      'Completed and ongoing empirical investigations examining foundational learning phenomena, curriculum efficacy, socio-demographic profiles, and institutional performance at Barobo National High School.',
    imageUrl: PORTAL_IMAGES.basicResearch,
    divisionLink: 'basic',
    displayOrder: 1,
    isDeleted: false,
    updatedByUid: 'baseline_coordinator_01',
    createdAtIso: '2026-01-15T08:00:00.000Z',
    updatedAtIso: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'overview_card_action',
    portalId: 'bnhs',
    itemType: 'card',
    code: 'DIV-02',
    title: 'Action Research',
    subtitle: 'Seven Official DepEd Themes',
    description:
      'Classroom-based and school-level practitioner inquiries organized across the seven Department of Education themes to directly improve instruction, learner welfare, and school governance.',
    imageUrl: PORTAL_IMAGES.actionResearch,
    divisionLink: 'action',
    displayOrder: 2,
    isDeleted: false,
    updatedByUid: 'baseline_coordinator_01',
    createdAtIso: '2026-01-15T08:00:00.000Z',
    updatedAtIso: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'overview_card_tuklas',
    portalId: 'bnhs',
    itemType: 'card',
    code: 'DIV-03',
    title: 'TUKLAS: A Research Project Fair',
    subtitle: 'Five Major Categories & Innovation Expo',
    description:
      'Student and mentored STEM innovation projects competing across Life Science, Physical Science, Robotics & Intelligent Machines, Mathematics & Computational Sciences, and the Innovation Expo.',
    imageUrl: PORTAL_IMAGES.tuklasFair,
    divisionLink: 'tuklas',
    displayOrder: 3,
    isDeleted: false,
    updatedByUid: 'baseline_coordinator_01',
    createdAtIso: '2026-01-15T08:00:00.000Z',
    updatedAtIso: '2026-01-15T08:00:00.000Z',
  },
];

export interface ResearchStatusHistoryRecord {
  id: string;
  portalId: 'bnhs';
  researchId: string;
  previousStatus: string;
  newStatus: ResearchStatus;
  evaluatorName: string;
  evaluatorUid: string;
  evaluationScore: number;
  remarks: string;
  createdAtIso: string;
}

export interface ResearchGalleryItemRecord {
  id: string;
  portalId: 'bnhs';
  title: string;
  caption: string;
  imageUrl: string;
  displayOrder: number;
  createdAtIso: string;
  updatedAtIso: string;
  isBaseline?: boolean;
}

export interface ResearchInformationItemRecord {
  id: string;
  portalId: 'bnhs';
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder: number;
  createdAtIso: string;
  updatedAtIso: string;
  isBaseline?: boolean;
}

export const INITIAL_STATUS_HISTORY: ResearchStatusHistoryRecord[] = [
  {
    id: 'hist_baseline_001',
    portalId: 'bnhs',
    researchId: 'bnhs_basic_001',
    previousStatus: 'Initial Submission',
    newStatus: 'Pending Review',
    evaluatorName: 'Dr. Elena M. Urbiztondo (Research Coordinator)',
    evaluatorUid: 'baseline_coordinator_01',
    evaluationScore: 0,
    remarks: 'Manuscript submitted for institutional curriculum alignment review and ethics clearance.',
    createdAtIso: '2026-01-20T08:30:00.000Z',
  },
  {
    id: 'hist_baseline_002',
    portalId: 'bnhs',
    researchId: 'bnhs_basic_001',
    previousStatus: 'Pending Review',
    newStatus: 'Approved',
    evaluatorName: 'Dr. Elena M. Urbiztondo (Research Coordinator)',
    evaluatorUid: 'baseline_coordinator_01',
    evaluationScore: 94,
    remarks: 'Approved for institutional publication and endorsed for the SY 2026–2027 SHS STEM Bridging Program.',
    createdAtIso: '2026-02-14T10:15:00.000Z',
  },
  {
    id: 'hist_baseline_003',
    portalId: 'bnhs',
    researchId: 'bnhs_tuklas_rim_01',
    previousStatus: 'Initial Submission',
    newStatus: 'Ongoing',
    evaluatorName: 'Engr. Dennis L. Millan (RIM Adviser)',
    evaluatorUid: 'baseline_teacher_03',
    evaluationScore: 82,
    remarks: 'Hardware breadboard test passed. Field testing in Barobo Bay mariculture zone authorized.',
    createdAtIso: '2026-08-12T09:00:00.000Z',
  },
  {
    id: 'hist_baseline_004',
    portalId: 'bnhs',
    researchId: 'bnhs_tuklas_rim_01',
    previousStatus: 'Ongoing',
    newStatus: 'Approved',
    evaluatorName: 'Dr. Elena M. Urbiztondo (Research Coordinator)',
    evaluatorUid: 'baseline_coordinator_01',
    evaluationScore: 97,
    remarks: 'Telemetry transmission across 2.1 km verified. Endorsed for Division Science and Technology Fair (DSTF).',
    createdAtIso: '2026-10-15T14:30:00.000Z',
  },
];

export const INITIAL_RESEARCH_GALLERY: ResearchGalleryItemRecord[] = [
  {
    id: 'gallery_item_01',
    portalId: 'bnhs',
    title: 'BNHS STEM & Robotics Innovation Expo',
    caption: 'Junior and Senior High School researchers demonstrating automated hydro-filtration and telemetry robotics prototypes at Barobo National High School.',
    imageUrl: '/src/assets/images/bnhs_gallery_stem_fair_1794325399735.jpg',
    displayOrder: 1,
    createdAtIso: '2026-02-01T08:00:00.000Z',
    updatedAtIso: '2026-02-01T08:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'gallery_item_02',
    portalId: 'bnhs',
    title: 'Barobo Bay Marine & Mangrove Ecological Fieldwork',
    caption: 'Environmental science investigators and faculty research mentors collecting water salinity and coastal mangrove biodiversity samples in Surigao del Sur.',
    imageUrl: '/src/assets/images/bnhs_gallery_marine_fieldwork_1794325420611.jpg',
    displayOrder: 2,
    createdAtIso: '2026-02-02T08:00:00.000Z',
    updatedAtIso: '2026-02-02T08:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'gallery_item_03',
    portalId: 'bnhs',
    title: 'Center for Scientific Research & Faculty Innovation Session',
    caption: 'BNHS Master Teachers and research coordinators analyzing school-wide numeracy interventions and practitioner action research data.',
    imageUrl: '/src/assets/images/bnhs_info_research_agenda_1794325398231.jpg',
    displayOrder: 3,
    createdAtIso: '2026-02-03T08:00:00.000Z',
    updatedAtIso: '2026-02-03T08:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'gallery_item_04',
    portalId: 'bnhs',
    title: 'TUKLAS Research Project Fair & Scientific Prototype Exhibition',
    caption: 'STEM students presenting empirical models and engineering inventions for peer evaluation and Division science congress qualifying.',
    imageUrl: PORTAL_IMAGES.tuklasFair,
    displayOrder: 4,
    createdAtIso: '2026-02-04T08:00:00.000Z',
    updatedAtIso: '2026-02-04T08:00:00.000Z',
    isBaseline: true,
  },
];

export const INITIAL_RESEARCH_INFORMATION: ResearchInformationItemRecord[] = [
  {
    id: 'info_item_01',
    portalId: 'bnhs',
    title: 'BNHS Institutional Research Agenda & DepEd BERA Priorities',
    category: 'Basic Education Research Agenda (BERA)',
    description: 'Guided by DepEd Order No. 16, s. 2017, Barobo National High School promotes evidence-based pedagogical development, teacher practitioner inquiry, and student STEM innovation. Research outcomes are integrated into the School Improvement Plan (SIP) and curriculum intervention programs.',
    imageUrl: '/src/assets/images/bnhs_info_research_agenda_1794325398231.jpg',
    linkUrl: 'https://www.deped.gov.ph',
    displayOrder: 1,
    createdAtIso: '2026-02-01T08:00:00.000Z',
    updatedAtIso: '2026-02-01T08:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'info_item_02',
    portalId: 'bnhs',
    title: 'TUKLAS Science Fair: Scientific Review Committee (SRC) Clearance',
    category: 'STEM Research Protocols',
    description: 'All learner investigations in Life Science, Physical Science, Robotics & Intelligent Machines, and the Innovation Expo must secure Scientific Review Committee (SRC) pre-approval and safety clearance before data collection or hardware prototyping begins.',
    imageUrl: '/src/assets/images/bnhs_gallery_stem_fair_1794325399735.jpg',
    linkUrl: '',
    displayOrder: 2,
    createdAtIso: '2026-02-02T08:00:00.000Z',
    updatedAtIso: '2026-02-02T08:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'info_item_03',
    portalId: 'bnhs',
    title: 'Technical Review: Grammarian & Statistician Evaluation Workflow',
    category: 'Quality Assurance & Clearance',
    description: 'School-based manuscripts undergo formal structural reviews by the designated School Research Grammarian for APA 7th edition language rigor, followed by data validation from the School Research Statistician prior to coordinator certification.',
    imageUrl: '/src/assets/images/bnhs_gallery_marine_fieldwork_1794325420611.jpg',
    linkUrl: '',
    displayOrder: 3,
    createdAtIso: '2026-02-03T08:00:00.000Z',
    updatedAtIso: '2026-02-03T08:00:00.000Z',
    isBaseline: true,
  },
  {
    id: 'info_item_04',
    portalId: 'bnhs',
    title: 'Seven DepEd Action Research Themes Implementation Matrix',
    category: 'Practitioner Action Research',
    description: 'Teachers and Master Teachers address classroom challenges across 7 DepEd BERA themes: Teaching and Learning, Child Protection, Human Resource Development, Governance, Disaster Risk Reduction, Gender and Development, and Inclusive Education.',
    imageUrl: PORTAL_IMAGES.actionResearch,
    linkUrl: '',
    displayOrder: 4,
    createdAtIso: '2026-02-04T08:00:00.000Z',
    updatedAtIso: '2026-02-04T08:00:00.000Z',
    isBaseline: true,
  },
];


