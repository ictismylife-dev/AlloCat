import { Person, Client, Project, Allocation, LeaveEntry } from '../types';

export const INITIAL_PEOPLE: Person[] = [
  {
    id: 'p-1',
    name: 'Marcus Vance',
    role: 'Principal Cloud Architect',
    department: 'Engineering',
    email: 'marcus.v@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#2563EB',
    initials: 'MV',
    notes: 'Cloud Architect · Tech lead on FinTech & GCP migration'
  },
  {
    id: 'p-2',
    name: 'Elena Rostova',
    role: 'Staff Product Designer',
    department: 'Design',
    email: 'elena.r@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#7C3AED',
    initials: 'ER',
    notes: 'Staff UI/UX · Mobile design systems & Figma tokens'
  },
  {
    id: 'p-3',
    name: 'Devon Zhao',
    role: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    email: 'devon.z@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#059669',
    initials: 'DZ',
    notes: 'Senior Full-Stack · Microservices & GraphQL focus'
  },
  {
    id: 'p-4',
    name: 'Sarah Lindqvist',
    role: 'Lead Product Manager',
    department: 'Product',
    email: 'sarah.l@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#D97706',
    initials: 'SL',
    notes: 'Lead PM · Enterprise roadmap & quarterly OKRs'
  },
  {
    id: 'p-5',
    name: 'Tariq Al-Mansoor',
    role: 'Senior Mobile Engineer (iOS/Android)',
    department: 'Engineering',
    email: 'tariq.m@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#0284C7',
    initials: 'TA',
    notes: 'Senior Mobile · Swift & Kotlin cross-platform specialist'
  },
  {
    id: 'p-6',
    name: 'Amara Okafor',
    role: 'Senior UX Researcher',
    department: 'Design',
    email: 'amara.o@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#DB2777',
    initials: 'AO',
    notes: 'UX Researcher · Usability benchmarking & client discovery'
  },
  {
    id: 'p-7',
    name: 'Kenji Takahashi',
    role: 'Staff Data Scientist & ML',
    department: 'Data',
    email: 'kenji.t@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#4F46E5',
    initials: 'KT',
    notes: 'Data & ML · Predictive analytics & vector retrieval'
  },
  {
    id: 'p-8',
    name: 'Chloe Bennett',
    role: 'QA Automation Lead',
    department: 'QA',
    email: 'chloe.b@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#0891B2',
    initials: 'CB',
    notes: 'QA Lead · Cypress/Playwright automation suites'
  },
  {
    id: 'p-9',
    name: 'Liam Henderson',
    role: 'Frontend Engineer',
    department: 'Engineering',
    email: 'liam.h@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#16A34A',
    initials: 'LH',
    notes: 'Frontend · React 19, TypeScript & Tailwind CSS'
  },
  {
    id: 'p-10',
    name: 'Priya Patel',
    role: 'Technical Program Manager',
    department: 'Operations',
    email: 'priya.p@company.internal',
    maxCapacityPercent: 100,
    avatarColor: '#EA580C',
    initials: 'PP',
    notes: 'TPM · Client delivery milestones & sprint coordination'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c-1',
    name: 'Apex Financial Technologies',
    industry: 'Fintech & Capital Markets',
    color: '#2563EB',
    status: 'active'
  },
  {
    id: 'c-2',
    name: 'Lumina Healthcare Systems',
    industry: 'HealthTech & Telemedicine',
    color: '#059669',
    status: 'active'
  },
  {
    id: 'c-3',
    name: 'Horizon Logistics Worldwide',
    industry: 'Supply Chain & IoT',
    color: '#D97706',
    status: 'active'
  },
  {
    id: 'c-4',
    name: 'Velocity Mobility Hub',
    industry: 'Autonomous & EV Transit',
    color: '#7C3AED',
    status: 'active'
  },
  {
    id: 'c-5',
    name: 'Starlight Interactive Media',
    industry: 'Streaming & Digital Gaming',
    color: '#DB2777',
    status: 'active'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    clientId: 'c-1',
    name: 'High-Frequency Settlement Engine',
    code: 'AF-SETTLE',
    status: 'active',
    color: '#2563EB',
    billable: true,
    notes: 'Real-time settlement engine; Phase 2 go-live targeted for May'
  },
  {
    id: 'proj-2',
    clientId: 'c-1',
    name: 'Wealth Portal Mobile 3.0',
    code: 'AF-MOBILE',
    status: 'active',
    color: '#3B82F6',
    billable: true,
    notes: 'React Native & iOS redesign for high-net-worth investors'
  },
  {
    id: 'proj-3',
    clientId: 'c-2',
    name: 'Patient Telehealth Gateway',
    code: 'LH-TELEHEALTH',
    status: 'active',
    color: '#059669',
    billable: true,
    notes: 'HIPAA compliant video visits & integrated prescription routing'
  },
  {
    id: 'proj-4',
    clientId: 'c-2',
    name: 'HIPAA Compliance & EHR Core',
    code: 'LH-EHR',
    status: 'active',
    color: '#10B981',
    billable: true,
    notes: 'HL7 FHIR database migration & enterprise security audit'
  },
  {
    id: 'proj-5',
    clientId: 'c-3',
    name: 'Fleet Routing & Predictive ETA',
    code: 'HL-ROUTER',
    status: 'active',
    color: '#D97706',
    billable: true,
    notes: 'Route optimization microservice; requires ML model updates in Q3'
  },
  {
    id: 'proj-6',
    clientId: 'c-4',
    name: 'EV Telemetry & Charging Grid',
    code: 'VM-GRID',
    status: 'active',
    color: '#7C3AED',
    billable: true,
    notes: 'IoT telemetry ingestion pipeline processing 50k events/sec'
  },
  {
    id: 'proj-7',
    clientId: 'c-4',
    name: 'Driver In-Cabin UX Suite',
    code: 'VM-CABIN',
    status: 'active',
    color: '#8B5CF6',
    billable: true,
    notes: 'Automotive Android automotive OS in-cabin display prototypes'
  },
  {
    id: 'proj-8',
    clientId: 'c-5',
    name: 'Live Video Transcoding SDK',
    code: 'SM-STREAM',
    status: 'active',
    color: '#DB2777',
    billable: true,
    notes: 'Low-latency WebRTC transcoding engine for gaming broadcasts'
  }
];

export const INITIAL_ALLOCATIONS: Allocation[] = [
  {
    id: 'a-1',
    personId: 'p-1',
    projectId: 'proj-1',
    year: 2026,
    monthlyPercentage: [60, 60, 60, 60, 50, 50, 40, 40, 40, 40, 30, 30]
  },
  {
    id: 'a-2',
    personId: 'p-1',
    projectId: 'proj-6',
    year: 2026,
    monthlyPercentage: [40, 40, 60, 60, 50, 50, 40, 40, 0, 0, 0, 0]
  },
  {
    id: 'a-3',
    personId: 'p-2',
    projectId: 'proj-2',
    year: 2026,
    monthlyPercentage: [50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0]
  },
  {
    id: 'a-4',
    personId: 'p-2',
    projectId: 'proj-7',
    year: 2026,
    monthlyPercentage: [50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 100, 100]
  },
  {
    id: 'a-5',
    personId: 'p-3',
    projectId: 'proj-1',
    year: 2026,
    monthlyPercentage: [100, 100, 100, 100, 80, 80, 50, 50, 0, 0, 0, 0]
  },
  {
    id: 'a-6',
    personId: 'p-3',
    projectId: 'proj-5',
    year: 2026,
    monthlyPercentage: [0, 0, 0, 0, 20, 20, 50, 50, 100, 100, 100, 100]
  },
  {
    id: 'a-7',
    personId: 'p-4',
    projectId: 'proj-3',
    year: 2026,
    monthlyPercentage: [60, 60, 60, 60, 60, 60, 50, 50, 50, 50, 50, 50]
  },
  {
    id: 'a-8',
    personId: 'p-4',
    projectId: 'proj-2',
    year: 2026,
    monthlyPercentage: [40, 40, 40, 40, 40, 40, 50, 50, 50, 50, 50, 50]
  },
  {
    id: 'a-9',
    personId: 'p-5',
    projectId: 'proj-2',
    year: 2026,
    monthlyPercentage: [80, 80, 80, 80, 70, 70, 50, 50, 50, 50, 0, 50]
  },
  {
    id: 'a-10',
    personId: 'p-5',
    projectId: 'proj-7',
    year: 2026,
    monthlyPercentage: [20, 20, 30, 30, 40, 40, 50, 50, 50, 50, 0, 50]
  },
  {
    id: 'a-11',
    personId: 'p-6',
    projectId: 'proj-3',
    year: 2026,
    monthlyPercentage: [80, 80, 75, 75, 50, 50, 0, 0, 0, 0, 0, 0]
  },
  {
    id: 'a-12',
    personId: 'p-6',
    projectId: 'proj-7',
    year: 2026,
    monthlyPercentage: [0, 0, 25, 25, 50, 50, 50, 50, 80, 80, 80, 80]
  },
  {
    id: 'a-13',
    personId: 'p-7',
    projectId: 'proj-5',
    year: 2026,
    monthlyPercentage: [70, 70, 70, 70, 70, 70, 60, 60, 60, 60, 60, 60]
  },
  {
    id: 'a-14',
    personId: 'p-7',
    projectId: 'proj-6',
    year: 2026,
    monthlyPercentage: [30, 30, 30, 30, 30, 30, 40, 40, 40, 40, 40, 40]
  },
  {
    id: 'a-15',
    personId: 'p-8',
    projectId: 'proj-3',
    year: 2026,
    monthlyPercentage: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
  },
  {
    id: 'a-16',
    personId: 'p-8',
    projectId: 'proj-4',
    year: 2026,
    monthlyPercentage: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
  },
  {
    id: 'a-17',
    personId: 'p-9',
    projectId: 'proj-8',
    year: 2026,
    monthlyPercentage: [100, 100, 100, 100, 100, 100, 90, 90, 80, 80, 80, 80]
  },
  {
    id: 'a-18',
    personId: 'p-10',
    projectId: 'proj-5',
    year: 2026,
    monthlyPercentage: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
  },
  {
    id: 'a-19',
    personId: 'p-10',
    projectId: 'proj-6',
    year: 2026,
    monthlyPercentage: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
  }
];

export const INITIAL_LEAVES: LeaveEntry[] = [
  {
    id: 'leave-1',
    personId: 'p-2',
    type: 'maternity',
    title: 'Maternity Leave',
    year: 2026,
    startMonth: 6,
    endMonth: 9,
    impactPercent: 100,
    notes: 'Welcoming newborn daughter. Complete design handover in place.'
  },
  {
    id: 'leave-2',
    personId: 'p-3',
    type: 'vacation',
    title: 'Annual Summer Holiday',
    year: 2026,
    startMonth: 7,
    endMonth: 7,
    impactPercent: 50,
    notes: '2-week hiking trip'
  },
  {
    id: 'leave-3',
    personId: 'p-5',
    type: 'paternity',
    title: 'Paternity Leave',
    year: 2026,
    startMonth: 10,
    endMonth: 10,
    impactPercent: 100,
    notes: 'Paternity bonding leave'
  },
  {
    id: 'leave-4',
    personId: 'p-4',
    type: 'sick',
    title: 'Medical Recovery',
    year: 2026,
    startMonth: 1,
    endMonth: 1,
    impactPercent: 50,
    notes: 'Post-op physical therapy'
  },
  {
    id: 'leave-5',
    personId: 'p-1',
    type: 'vacation',
    title: 'Winter Holiday & Travel',
    year: 2026,
    startMonth: 11,
    endMonth: 11,
    impactPercent: 50,
    notes: 'End of year PTO'
  }
];

const STORAGE_KEY = 'allocat_app_state_v1';
const LEGACY_STORAGE_KEY = 'staffgrid_app_state_v2';

export const INITIAL_DEPARTMENTS: string[] = [
  'Engineering',
  'Design',
  'Product',
  'QA',
  'Data',
  'Operations'
];

export interface AppState {
  people: Person[];
  clients: Client[];
  projects: Project[];
  allocations: Allocation[];
  leaves: LeaveEntry[];
  availableYears: number[];
  selectedYear: number;
  departments: string[];
}

declare global {
  interface Window {
    __ALLOCAT_EMBEDDED_STATE__?: AppState;
  }
}

export function getDefaultAppState(): AppState {
  if (typeof window !== 'undefined' && window.__ALLOCAT_EMBEDDED_STATE__) {
    return window.__ALLOCAT_EMBEDDED_STATE__;
  }
  return {
    people: INITIAL_PEOPLE,
    clients: INITIAL_CLIENTS,
    projects: INITIAL_PROJECTS,
    allocations: INITIAL_ALLOCATIONS,
    leaves: INITIAL_LEAVES,
    availableYears: [2025, 2026, 2027],
    selectedYear: 2026,
    departments: INITIAL_DEPARTMENTS
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return getDefaultAppState();
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.people) &&
      Array.isArray(parsed.clients) &&
      Array.isArray(parsed.projects) &&
      Array.isArray(parsed.allocations)
    ) {
      const years = Array.isArray(parsed.availableYears) && parsed.availableYears.length > 0
        ? parsed.availableYears.sort((a: number, b: number) => a - b)
        : [2025, 2026, 2027];

      const departments = Array.isArray(parsed.departments) && parsed.departments.length > 0
        ? parsed.departments
        : INITIAL_DEPARTMENTS;

      const loadedPeople = parsed.people.map((p: Person) => {
        const defaultPerson = INITIAL_PEOPLE.find((ip) => ip.id === p.id);
        return {
          ...p,
          notes: p.notes !== undefined ? p.notes : (defaultPerson?.notes || '')
        };
      });

      const loadedProjects = parsed.projects.map((proj: Project) => {
        const defaultProj = INITIAL_PROJECTS.find((ip) => ip.id === proj.id);
        return {
          ...proj,
          notes: proj.notes !== undefined ? proj.notes : (defaultProj?.notes || '')
        };
      });

      return {
        people: loadedPeople,
        clients: parsed.clients,
        projects: loadedProjects,
        allocations: parsed.allocations,
        leaves: Array.isArray(parsed.leaves) ? parsed.leaves : INITIAL_LEAVES,
        availableYears: years,
        selectedYear: typeof parsed.selectedYear === 'number' && years.includes(parsed.selectedYear)
          ? parsed.selectedYear
          : years[0] || 2026,
        departments
      };
    }
  } catch (e) {
    console.error('Failed to load saved state, using default dataset', e);
  }
  return getDefaultAppState();
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist state to localStorage', e);
  }
}

export function resetAppState(): AppState {
  const defaults = getDefaultAppState();
  saveAppState(defaults);
  return defaults;
}
