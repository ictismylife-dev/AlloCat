import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  BarChart3,
  Building2,
  PieChart,
  Briefcase,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileJson,
  Check,
  Calendar,
  ArrowUpDown,
  Users,
  UserCheck,
  CalendarOff,
  TrendingUp
} from 'lucide-react';
import {
  Allocation,
  Client,
  Department,
  EmploymentType,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_BADGE_CONFIG,
  LeaveEntry,
  LeaveType,
  LeaveTypeMeta,
  LEAVE_TYPE_CONFIG,
  getLeaveTypeMeta,
  MONTH_NAMES,
  Person,
  Project
} from '../types';
import {
  getPersonCapacitySummary,
  getPersonBenchSummary,
  formatPersonTableName
} from '../utils/allocationMath';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ReportTab =
  | 'departments'
  | 'billable'
  | 'clients'
  | 'risk_availability';

interface ReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ReportTab;
  people: Person[];
  departments: Department[];
  clients: Client[];
  projects: Project[];
  allocations: Allocation[];
  leaves: LeaveEntry[];
  leaveTypes?: Record<LeaveType, LeaveTypeMeta>;
  availableYears: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

export const ReportingModal: React.FC<ReportingModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'departments',
  people,
  departments,
  clients,
  projects,
  allocations,
  leaves,
  leaveTypes = LEAVE_TYPE_CONFIG,
  availableYears,
  selectedYear,
  onSelectYear
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');
  const [contractFilter, setContractFilter] = useState<EmploymentType | 'all'>('all');
  const [clientGroupMode, setClientGroupMode] = useState<'projects' | 'clients'>('projects');
  const [sortField, setSortField] = useState<string>('default');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Reset sort when switching tabs
  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    setSortField('default');
    setSortAsc(false);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Filtered people based on Department & Contract Type
  const scopedPeople = useMemo(() => {
    return people.filter((p) => {
      if (deptFilter !== 'all' && p.department !== deptFilter) return false;
      const emp = p.employmentType || 'Internal';
      if (contractFilter !== 'all' && emp !== contractFilter) return false;
      return true;
    });
  }, [people, deptFilter, contractFilter]);

  const scopedPersonIds = useMemo(
    () => new Set(scopedPeople.map((p) => p.id)),
    [scopedPeople]
  );

  // ============================================================================
  // 1. DEPARTMENT UTILIZATION & CAPACITY TRENDS ANALYTICS
  // ============================================================================
  const departmentReport = useMemo(() => {
    const activeDepts =
      deptFilter === 'all'
        ? Array.from(new Set([...departments, ...scopedPeople.map((p) => p.department)]))
        : [deptFilter];

    const rows = activeDepts.map((dept) => {
      const deptPeople = scopedPeople.filter((p) => p.department === dept);
      const monthlyBookedPctSum = Array(12).fill(0);
      const monthlyEffectiveCapSum = Array(12).fill(0);
      const monthlyLeaveRedSum = Array(12).fill(0);
      const monthlyNominalCapSum = Array(12).fill(0);

      let totalOvertimeMonths = 0;
      let totalBenchPM = 0;
      let internalCount = 0;
      let externalCount = 0;
      let b2bCount = 0;

      for (const person of deptPeople) {
        const emp = person.employmentType || 'Internal';
        if (emp === 'Internal') internalCount++;
        else if (emp === 'External') externalCount++;
        else if (emp === 'B2B') b2bCount++;

        const cap = getPersonCapacitySummary(
          person.id,
          selectedYear,
          allocations,
          person.maxCapacityPercent,
          leaves
        );
        totalOvertimeMonths += cap.overtimeMonths.length;

        for (let m = 0; m < 12; m++) {
          monthlyNominalCapSum[m] += person.maxCapacityPercent;
          monthlyBookedPctSum[m] += cap.totals[m];
          monthlyEffectiveCapSum[m] += cap.effectiveCapacities[m];
          monthlyLeaveRedSum[m] += cap.leaveReductions[m];
          totalBenchPM += Math.max(0, cap.effectiveCapacities[m] - cap.totals[m]) / 100;
        }
      }

      const monthlyUtilPct = monthlyBookedPctSum.map((booked, m) => {
        const eff = monthlyEffectiveCapSum[m];
        if (eff <= 0) return booked > 0 ? 100 : 0;
        return Math.round((booked / eff) * 100);
      });

      const totalBookedPM = +(
        monthlyBookedPctSum.reduce((a, b) => a + b, 0) / 100
      ).toFixed(1);
      const totalEffectivePM = +(
        monthlyEffectiveCapSum.reduce((a, b) => a + b, 0) / 100
      ).toFixed(1);
      const totalLeavePM = +(
        monthlyLeaveRedSum.reduce((a, b) => a + b, 0) / 100
      ).toFixed(1);
      const avgUtilPct =
        totalEffectivePM > 0
          ? Math.round((totalBookedPM / totalEffectivePM) * 100)
          : 0;

      return {
        department: dept,
        headcount: deptPeople.length,
        internalCount,
        externalCount,
        b2bCount,
        monthlyUtilPct,
        monthlyBookedPM: monthlyBookedPctSum.map((v) => +(v / 100).toFixed(1)),
        monthlyEffectivePM: monthlyEffectiveCapSum.map((v) => +(v / 100).toFixed(1)),
        monthlyLeavePM: monthlyLeaveRedSum.map((v) => +(v / 100).toFixed(1)),
        avgUtilPct,
        totalBookedPM,
        totalEffectivePM,
        totalBenchPM: +totalBenchPM.toFixed(1),
        totalLeavePM,
        totalOvertimeMonths
      };
    });

    // Monthly organization totals across scoped people
    const orgMonthly = Array.from({ length: 12 }, (_, m) => {
      let bookedPM = 0;
      let effectivePM = 0;
      let leavePM = 0;
      let benchPM = 0;
      for (const r of rows) {
        bookedPM += r.monthlyBookedPM[m];
        effectivePM += r.monthlyEffectivePM[m];
        leavePM += r.monthlyLeavePM[m];
        benchPM += Math.max(0, r.monthlyEffectivePM[m] - r.monthlyBookedPM[m]);
      }
      const utilPct = effectivePM > 0 ? Math.round((bookedPM / effectivePM) * 100) : 0;
      return {
        monthIndex: m,
        monthName: MONTH_NAMES[m],
        bookedPM: +bookedPM.toFixed(1),
        effectivePM: +effectivePM.toFixed(1),
        leavePM: +leavePM.toFixed(1),
        benchPM: +benchPM.toFixed(1),
        utilPct
      };
    });

    const totalBookedPM = +rows.reduce((s, r) => s + r.totalBookedPM, 0).toFixed(1);
    const totalEffectivePM = +rows.reduce((s, r) => s + r.totalEffectivePM, 0).toFixed(1);
    const totalBenchPM = +rows.reduce((s, r) => s + r.totalBenchPM, 0).toFixed(1);
    const totalLeavePM = +rows.reduce((s, r) => s + r.totalLeavePM, 0).toFixed(1);
    const overallUtilPct =
      totalEffectivePM > 0 ? Math.round((totalBookedPM / totalEffectivePM) * 100) : 0;

    const sortedRows = [...rows].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortField === 'headcount') return (a.headcount - b.headcount) * dir;
      if (sortField === 'avgUtilPct') return (a.avgUtilPct - b.avgUtilPct) * dir;
      if (sortField === 'totalBookedPM') return (a.totalBookedPM - b.totalBookedPM) * dir;
      if (sortField === 'totalBenchPM') return (a.totalBenchPM - b.totalBenchPM) * dir;
      if (sortField === 'totalOvertimeMonths')
        return (a.totalOvertimeMonths - b.totalOvertimeMonths) * dir;
      return a.department.localeCompare(b.department);
    });

    return {
      rows: sortedRows,
      orgMonthly,
      totalHeadcount: scopedPeople.length,
      totalBookedPM,
      totalBookedFTE: +(totalBookedPM / 12).toFixed(1),
      totalEffectivePM,
      totalBenchPM,
      totalLeavePM,
      overallUtilPct
    };
  }, [
    departments,
    scopedPeople,
    deptFilter,
    selectedYear,
    allocations,
    leaves,
    sortField,
    sortAsc
  ]);

  // ============================================================================
  // 2. BILLABLE VS. INTERNAL EFFORT BREAKDOWN ANALYTICS
  // ============================================================================
  const billableReport = useMemo(() => {
    const projectMap = new Map<string, Project>(projects.map((p) => [p.id, p]));

    const monthlyBillablePM = Array(12).fill(0);
    const monthlyInternalPM = Array(12).fill(0);
    const monthlyEffectiveCapPM = Array(12).fill(0);
    const monthlyLeavePM = Array(12).fill(0);
    const monthlyBenchPM = Array(12).fill(0);

    // Compute per-person capacity and project split
    for (const person of scopedPeople) {
      const cap = getPersonCapacitySummary(
        person.id,
        selectedYear,
        allocations,
        person.maxCapacityPercent,
        leaves
      );
      for (let m = 0; m < 12; m++) {
        monthlyEffectiveCapPM[m] += cap.effectiveCapacities[m] / 100;
        monthlyLeavePM[m] += cap.leaveReductions[m] / 100;
        monthlyBenchPM[m] += Math.max(0, cap.effectiveCapacities[m] - cap.totals[m]) / 100;
      }
    }

    const yearAllocs = allocations.filter(
      (a) => a.year === selectedYear && scopedPersonIds.has(a.personId)
    );

    for (const alloc of yearAllocs) {
      const proj = projectMap.get(alloc.projectId);
      if (!proj) continue;
      for (let m = 0; m < 12; m++) {
        const pm = (alloc.monthlyPercentage[m] || 0) / 100;
        if (proj.billable) {
          monthlyBillablePM[m] += pm;
        } else {
          monthlyInternalPM[m] += pm;
        }
      }
    }

    const totalBillablePM = +monthlyBillablePM.reduce((a, b) => a + b, 0).toFixed(1);
    const totalInternalPM = +monthlyInternalPM.reduce((a, b) => a + b, 0).toFixed(1);
    const totalBookedPM = +(totalBillablePM + totalInternalPM).toFixed(1);
    const totalBenchPM = +monthlyBenchPM.reduce((a, b) => a + b, 0).toFixed(1);
    const totalLeavePM = +monthlyLeavePM.reduce((a, b) => a + b, 0).toFixed(1);
    const totalEffectiveCapPM = +monthlyEffectiveCapPM.reduce((a, b) => a + b, 0).toFixed(1);
    const totalNominalCapPM = +(totalEffectiveCapPM + totalLeavePM).toFixed(1);

    const billableShareOfBookedPct =
      totalBookedPM > 0 ? Math.round((totalBillablePM / totalBookedPM) * 100) : 0;
    const billableShareOfEffectivePct =
      totalEffectiveCapPM > 0
        ? Math.round((totalBillablePM / totalEffectiveCapPM) * 100)
        : 0;

    // Department billable breakdown
    const activeDepts = Array.from(new Set(scopedPeople.map((p) => p.department))).sort();
    const deptBreakdown = activeDepts.map((dept) => {
      const deptPersonIds = new Set(
        scopedPeople.filter((p) => p.department === dept).map((p) => p.id)
      );
      let billablePM = 0;
      let internalPM = 0;
      let benchPM = 0;

      for (const p of scopedPeople.filter((person) => person.department === dept)) {
        const cap = getPersonCapacitySummary(
          p.id,
          selectedYear,
          allocations,
          p.maxCapacityPercent,
          leaves
        );
        for (let m = 0; m < 12; m++) {
          benchPM += Math.max(0, cap.effectiveCapacities[m] - cap.totals[m]) / 100;
        }
      }

      for (const alloc of yearAllocs) {
        if (!deptPersonIds.has(alloc.personId)) continue;
        const proj = projectMap.get(alloc.projectId);
        if (!proj) continue;
        const sumPM = alloc.monthlyPercentage.reduce((s, v) => s + (v || 0), 0) / 100;
        if (proj.billable) billablePM += sumPM;
        else internalPM += sumPM;
      }

      const totalDeptBooked = billablePM + internalPM;
      const billableRatio =
        totalDeptBooked > 0 ? Math.round((billablePM / totalDeptBooked) * 100) : 0;

      return {
        department: dept,
        headcount: deptPersonIds.size,
        billablePM: +billablePM.toFixed(1),
        internalPM: +internalPM.toFixed(1),
        benchPM: +benchPM.toFixed(1),
        billableRatio
      };
    });

    return {
      monthlyBillablePM: monthlyBillablePM.map((v) => +v.toFixed(1)),
      monthlyInternalPM: monthlyInternalPM.map((v) => +v.toFixed(1)),
      monthlyBenchPM: monthlyBenchPM.map((v) => +v.toFixed(1)),
      monthlyLeavePM: monthlyLeavePM.map((v) => +v.toFixed(1)),
      totalBillablePM,
      totalBillableFTE: +(totalBillablePM / 12).toFixed(1),
      totalInternalPM,
      totalInternalFTE: +(totalInternalPM / 12).toFixed(1),
      totalBookedPM,
      totalBenchPM,
      totalLeavePM,
      totalNominalCapPM,
      billableShareOfBookedPct,
      billableShareOfEffectivePct,
      deptBreakdown
    };
  }, [projects, scopedPeople, scopedPersonIds, selectedYear, allocations, leaves]);

  // ============================================================================
  // 3. CLIENT & PROJECT EFFORT DISTRIBUTION ANALYTICS
  // ============================================================================
  const clientProjectReport = useMemo(() => {
    const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));
    const yearAllocs = allocations.filter(
      (a) => a.year === selectedYear && scopedPersonIds.has(a.personId)
    );

    const projectRows = projects.map((proj) => {
      const client = clientMap.get(proj.clientId);
      const projAllocs = yearAllocs.filter((a) => a.projectId === proj.id);
      const staffIds = new Set<string>();
      const monthlyPM = Array(12).fill(0);

      for (const alloc of projAllocs) {
        const hasEffort = alloc.monthlyPercentage.some((v) => v > 0);
        if (hasEffort) staffIds.add(alloc.personId);
        for (let m = 0; m < 12; m++) {
          monthlyPM[m] += (alloc.monthlyPercentage[m] || 0) / 100;
        }
      }

      const totalPM = +monthlyPM.reduce((a, b) => a + b, 0).toFixed(1);
      const avgFTE = +(totalPM / 12).toFixed(2);

      return {
        id: proj.id,
        name: proj.name,
        code: proj.code,
        color: proj.color,
        status: proj.status,
        billable: proj.billable,
        clientId: proj.clientId,
        clientName: client?.name || 'Unassigned Client',
        clientColor: client?.color || '#64748B',
        staffCount: staffIds.size,
        monthlyPM: monthlyPM.map((v) => +v.toFixed(1)),
        totalPM,
        avgFTE,
        sharePct: 0
      };
    });

    const grandTotalPM = projectRows.reduce((s, r) => s + r.totalPM, 0);

    for (const r of projectRows) {
      r.sharePct = grandTotalPM > 0 ? +((r.totalPM / grandTotalPM) * 100).toFixed(1) : 0;
    }

    // Client aggregated rows
    const clientRows = clients.map((client) => {
      const cProjects = projectRows.filter((p) => p.clientId === client.id);
      const monthlyPM = Array(12).fill(0);
      let totalPM = 0;
      const staffIds = new Set<string>();

      for (const proj of cProjects) {
        totalPM += proj.totalPM;
        for (let m = 0; m < 12; m++) {
          monthlyPM[m] += proj.monthlyPM[m];
        }
      }

      for (const alloc of yearAllocs) {
        const p = projects.find((pr) => pr.id === alloc.projectId);
        if (p?.clientId === client.id && alloc.monthlyPercentage.some((v) => v > 0)) {
          staffIds.add(alloc.personId);
        }
      }

      const roundedTotalPM = +totalPM.toFixed(1);
      const avgFTE = +(roundedTotalPM / 12).toFixed(2);
      const sharePct =
        grandTotalPM > 0 ? +((roundedTotalPM / grandTotalPM) * 100).toFixed(1) : 0;

      return {
        id: client.id,
        name: client.name,
        industry: client.industry,
        status: client.status,
        color: client.color,
        projectCount: cProjects.length,
        staffCount: staffIds.size,
        monthlyPM: monthlyPM.map((v) => +v.toFixed(1)),
        totalPM: roundedTotalPM,
        avgFTE,
        sharePct
      };
    });

    const sortedProjects = [...projectRows].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortField === 'staffCount') return (a.staffCount - b.staffCount) * dir;
      if (sortField === 'totalPM' || sortField === 'default')
        return (a.totalPM - b.totalPM) * (sortField === 'default' ? -1 : dir);
      if (sortField === 'avgFTE') return (a.avgFTE - b.avgFTE) * dir;
      if (sortField === 'sharePct') return (a.sharePct - b.sharePct) * dir;
      return a.name.localeCompare(b.name);
    });

    const sortedClients = [...clientRows].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortField === 'staffCount') return (a.staffCount - b.staffCount) * dir;
      if (sortField === 'totalPM' || sortField === 'default')
        return (a.totalPM - b.totalPM) * (sortField === 'default' ? -1 : dir);
      if (sortField === 'avgFTE') return (a.avgFTE - b.avgFTE) * dir;
      if (sortField === 'sharePct') return (a.sharePct - b.sharePct) * dir;
      return a.name.localeCompare(b.name);
    });

    const activeClientsStaffed = clientRows.filter((c) => c.totalPM > 0).length;
    const activeProjectsStaffed = projectRows.filter((p) => p.totalPM > 0).length;
    const topClient = [...clientRows].sort((a, b) => b.totalPM - a.totalPM)[0];

    return {
      projectRows: sortedProjects,
      clientRows: sortedClients,
      grandTotalPM: +grandTotalPM.toFixed(1),
      grandTotalFTE: +(grandTotalPM / 12).toFixed(1),
      activeClientsStaffed,
      activeProjectsStaffed,
      topClientName: topClient && topClient.totalPM > 0 ? topClient.name : 'None',
      topClientSharePct: topClient ? topClient.sharePct : 0
    };
  }, [clients, projects, allocations, selectedYear, scopedPersonIds, sortField, sortAsc]);

  // ============================================================================
  // 4. OVERTIME, BENCH & LEAVE IMPACT SUMMARY ANALYTICS
  // ============================================================================
  const riskAvailabilityReport = useMemo(() => {
    const personAuditRows = scopedPeople.map((person) => {
      const cap = getPersonCapacitySummary(
        person.id,
        selectedYear,
        allocations,
        person.maxCapacityPercent,
        leaves
      );
      const bench = getPersonBenchSummary(person, selectedYear, allocations, leaves);

      const bookedPM = +(cap.totals.reduce((a, b) => a + b, 0) / 100).toFixed(1);
      const effectiveCapPM = +(
        cap.effectiveCapacities.reduce((a, b) => a + b, 0) / 100
      ).toFixed(1);
      const benchPM = +(bench.monthlyBenchPct.reduce((a, b) => a + b, 0) / 100).toFixed(1);
      const leaveReductionPM = +(
        cap.leaveReductions.reduce((a, b) => a + b, 0) / 100
      ).toFixed(1);
      const overtimeExcessPM = +(
        cap.overtimeMonths.reduce((s, o) => s + o.excessPct, 0) / 100
      ).toFixed(2);

      return {
        person,
        formattedName: formatPersonTableName(person),
        employmentType: (person.employmentType || 'Internal') as EmploymentType,
        avgBookedPct: cap.annualAverage,
        avgEffectiveCapPct: Math.round(
          cap.effectiveCapacities.reduce((a, b) => a + b, 0) / 12
        ),
        maxMonthPct: cap.maxMonthPct,
        bookedPM,
        effectiveCapPM,
        benchPM,
        leaveReductionPM,
        overtimeMonthsCount: cap.overtimeMonths.length,
        overtimeExcessPM,
        overtimeDetails: cap.overtimeMonths
          .map((o) => `${MONTH_NAMES[o.monthIndex]} (${o.totalPct}%/${o.effectiveCapacity}%)`)
          .join(', ')
      };
    });

    // Leave Breakdown by Leave Type (supporting custom leave types)
    const yearLeaves = leaves.filter(
      (l) => l.year === selectedYear && scopedPersonIds.has(l.personId)
    );
    const allTypeKeys = Array.from(
      new Set([...Object.keys(leaveTypes), ...yearLeaves.map((l) => l.type)])
    );

    const leaveCategoryBreakdown = allTypeKeys
      .map((typeKey) => {
        const meta = getLeaveTypeMeta(typeKey, leaveTypes);
        const matchingLeaves = yearLeaves.filter((l) => l.type === typeKey);
        let affectedPersonMonths = 0;
        let capacityLostPM = 0;
        const uniquePeople = new Set<string>();

        for (const l of matchingLeaves) {
          uniquePeople.add(l.personId);
          const monthsSpan = Math.abs(l.endMonth - l.startMonth) + 1;
          affectedPersonMonths += monthsSpan;
          capacityLostPM += (monthsSpan * l.impactPercent) / 100;
        }

        return {
          typeKey,
          label: meta.label,
          badgeClass: meta.badgeClass,
          entriesCount: matchingLeaves.length,
          uniquePeopleCount: uniquePeople.size,
          affectedPersonMonths,
          capacityLostPM: +capacityLostPM.toFixed(2)
        };
      })
      .filter((item) => item.entriesCount > 0 || Object.keys(leaveTypes).includes(item.typeKey))
      .sort((a, b) => b.capacityLostPM - a.capacityLostPM);

    const sortedAuditRows = [...personAuditRows].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortField === 'avgBookedPct') return (a.avgBookedPct - b.avgBookedPct) * dir;
      if (sortField === 'benchPM') return (a.benchPM - b.benchPM) * dir;
      if (sortField === 'leaveReductionPM')
        return (a.leaveReductionPM - b.leaveReductionPM) * dir;
      if (sortField === 'overtimeMonthsCount' || sortField === 'default') {
        const diff =
          (a.overtimeMonthsCount - b.overtimeMonthsCount) *
          (sortField === 'default' ? -1 : dir);
        if (diff !== 0) return diff;
        return b.avgBookedPct - a.avgBookedPct;
      }
      return a.formattedName.localeCompare(b.formattedName);
    });

    const totalOvertimeMonths = personAuditRows.reduce(
      (s, r) => s + r.overtimeMonthsCount,
      0
    );
    const peopleWithOvertime = personAuditRows.filter(
      (r) => r.overtimeMonthsCount > 0
    ).length;
    const totalBenchPM = +personAuditRows
      .reduce((s, r) => s + r.benchPM, 0)
      .toFixed(1);
    const totalLeaveLostPM = +personAuditRows
      .reduce((s, r) => s + r.leaveReductionPM, 0)
      .toFixed(1);

    return {
      personAuditRows: sortedAuditRows,
      leaveCategoryBreakdown,
      totalOvertimeMonths,
      peopleWithOvertime,
      totalBenchPM,
      totalLeaveLostPM
    };
  }, [scopedPeople, scopedPersonIds, selectedYear, allocations, leaves, leaveTypes, sortField, sortAsc]);

  // ============================================================================
  // CSV & JSON REPORT EXPORT HANDLERS
  // ============================================================================
  const triggerExportFeedback = (msg: string) => {
    setExportSuccessMessage(msg);
    setTimeout(() => {
      setExportSuccessMessage(null);
    }, 3000);
  };

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportActiveTabCSV = () => {
    const lines: string[] = [];
    const filterTag = `${selectedYear}${deptFilter !== 'all' ? `-${deptFilter}` : ''}${
      contractFilter !== 'all' ? `-${contractFilter}` : ''
    }`;

    if (activeTab === 'departments') {
      lines.push(
        [
          'Department',
          'Headcount',
          'Internal',
          'External',
          'B2B',
          ...MONTH_NAMES.map((m) => `${m} Util %`),
          'Annual Avg Util %',
          'Booked Person-Months',
          'Effective Cap Person-Months',
          'Bench Person-Months',
          'Leave Reduction Person-Months',
          'Overtime Person-Months'
        ]
          .map(escapeCSV)
          .join(',')
      );

      for (const r of departmentReport.rows) {
        lines.push(
          [
            r.department,
            r.headcount,
            r.internalCount,
            r.externalCount,
            r.b2bCount,
            ...r.monthlyUtilPct,
            r.avgUtilPct,
            r.totalBookedPM,
            r.totalEffectivePM,
            r.totalBenchPM,
            r.totalLeavePM,
            r.totalOvertimeMonths
          ]
            .map(escapeCSV)
            .join(',')
        );
      }

      downloadFile(
        lines.join('\n'),
        `allocat-report-departments-${filterTag}.csv`,
        'text/csv;charset=utf-8;'
      );
      triggerExportFeedback('Department Utilization CSV downloaded');
    } else if (activeTab === 'billable') {
      lines.push(
        [
          'Effort Category',
          ...MONTH_NAMES.map((m) => `${m} (PM)`),
          'Annual Person-Months',
          'Annual Avg FTE',
          'Share of Nominal Capacity %'
        ]
          .map(escapeCSV)
          .join(',')
      );

      const nom = billableReport.totalNominalCapPM || 1;
      lines.push(
        [
          'Billable Client Work',
          ...billableReport.monthlyBillablePM,
          billableReport.totalBillablePM,
          billableReport.totalBillableFTE,
          Math.round((billableReport.totalBillablePM / nom) * 100)
        ]
          .map(escapeCSV)
          .join(',')
      );
      lines.push(
        [
          'Internal / Non-Billable Projects',
          ...billableReport.monthlyInternalPM,
          billableReport.totalInternalPM,
          billableReport.totalInternalFTE,
          Math.round((billableReport.totalInternalPM / nom) * 100)
        ]
          .map(escapeCSV)
          .join(',')
      );
      lines.push(
        [
          'Unallocated Bench Capacity',
          ...billableReport.monthlyBenchPM,
          billableReport.totalBenchPM,
          +(billableReport.totalBenchPM / 12).toFixed(1),
          Math.round((billableReport.totalBenchPM / nom) * 100)
        ]
          .map(escapeCSV)
          .join(',')
      );
      lines.push(
        [
          'Time Off & Leaves Impact',
          ...billableReport.monthlyLeavePM,
          billableReport.totalLeavePM,
          +(billableReport.totalLeavePM / 12).toFixed(1),
          Math.round((billableReport.totalLeavePM / nom) * 100)
        ]
          .map(escapeCSV)
          .join(',')
      );

      downloadFile(
        lines.join('\n'),
        `allocat-report-billable-vs-internal-${filterTag}.csv`,
        'text/csv;charset=utf-8;'
      );
      triggerExportFeedback('Billable vs. Internal CSV downloaded');
    } else if (activeTab === 'clients') {
      if (clientGroupMode === 'projects') {
        lines.push(
          [
            'Project Code',
            'Project Name',
            'Client',
            'Billing Type',
            'Status',
            'Assigned Staff',
            ...MONTH_NAMES.map((m) => `${m} (PM)`),
            'Annual Person-Months',
            'Annual Avg FTE',
            'Effort Share %'
          ]
            .map(escapeCSV)
            .join(',')
        );
        for (const r of clientProjectReport.projectRows) {
          lines.push(
            [
              r.code,
              r.name,
              r.clientName,
              r.billable ? 'Billable' : 'Internal',
              r.status,
              r.staffCount,
              ...r.monthlyPM,
              r.totalPM,
              r.avgFTE,
              r.sharePct
            ]
              .map(escapeCSV)
              .join(',')
          );
        }
      } else {
        lines.push(
          [
            'Client Name',
            'Industry',
            'Status',
            'Projects Count',
            'Assigned Staff',
            ...MONTH_NAMES.map((m) => `${m} (PM)`),
            'Annual Person-Months',
            'Annual Avg FTE',
            'Effort Share %'
          ]
            .map(escapeCSV)
            .join(',')
        );
        for (const r of clientProjectReport.clientRows) {
          lines.push(
            [
              r.name,
              r.industry,
              r.status,
              r.projectCount,
              r.staffCount,
              ...r.monthlyPM,
              r.totalPM,
              r.avgFTE,
              r.sharePct
            ]
              .map(escapeCSV)
              .join(',')
          );
        }
      }

      downloadFile(
        lines.join('\n'),
        `allocat-report-${clientGroupMode}-${filterTag}.csv`,
        'text/csv;charset=utf-8;'
      );
      triggerExportFeedback('Client & Project Effort CSV downloaded');
    } else {
      lines.push(
        [
          'Team Member',
          'Role',
          'Department',
          'Contract Type',
          'Avg Booked %',
          'Avg Effective Cap %',
          'Peak Month %',
          'Booked Person-Months',
          'Bench Person-Months',
          'Leave Reduction Person-Months',
          'Overtime Months Count',
          'Overtime Excess Person-Months',
          'Overtime Details'
        ]
          .map(escapeCSV)
          .join(',')
      );

      for (const r of riskAvailabilityReport.personAuditRows) {
        lines.push(
          [
            r.formattedName,
            r.person.role,
            r.person.department,
            r.employmentType,
            r.avgBookedPct,
            r.avgEffectiveCapPct,
            r.maxMonthPct,
            r.bookedPM,
            r.benchPM,
            r.leaveReductionPM,
            r.overtimeMonthsCount,
            r.overtimeExcessPM,
            r.overtimeDetails
          ]
            .map(escapeCSV)
            .join(',')
        );
      }

      downloadFile(
        lines.join('\n'),
        `allocat-report-overtime-bench-leaves-${filterTag}.csv`,
        'text/csv;charset=utf-8;'
      );
      triggerExportFeedback('Overtime, Bench & Leave CSV downloaded');
    }
  };

  const handleExportFullReportJSON = () => {
    const payload = {
      reportGeneratedAt: new Date().toISOString(),
      filters: {
        year: selectedYear,
        department: deptFilter,
        contractType: contractFilter
      },
      departmentUtilization: departmentReport,
      billableVsInternal: billableReport,
      clientAndProjectDistribution: clientProjectReport,
      overtimeBenchAndLeaves: {
        totalOvertimeMonths: riskAvailabilityReport.totalOvertimeMonths,
        peopleWithOvertime: riskAvailabilityReport.peopleWithOvertime,
        totalBenchPM: riskAvailabilityReport.totalBenchPM,
        totalLeaveLostPM: riskAvailabilityReport.totalLeaveLostPM,
        leaveCategoryBreakdown: riskAvailabilityReport.leaveCategoryBreakdown,
        personAudit: riskAvailabilityReport.personAuditRows.map((r) => ({
          personId: r.person.id,
          name: r.formattedName,
          department: r.person.department,
          employmentType: r.employmentType,
          avgBookedPct: r.avgBookedPct,
          avgEffectiveCapPct: r.avgEffectiveCapPct,
          bookedPM: r.bookedPM,
          benchPM: r.benchPM,
          leaveReductionPM: r.leaveReductionPM,
          overtimeMonthsCount: r.overtimeMonthsCount,
          overtimeDetails: r.overtimeDetails
        }))
      }
    };

    const filterTag = `${selectedYear}${deptFilter !== 'all' ? `-${deptFilter}` : ''}${
      contractFilter !== 'all' ? `-${contractFilter}` : ''
    }`;
    downloadFile(
      JSON.stringify(payload, null, 2),
      `allocat-executive-analytics-${filterTag}.json`,
      'application/json;charset=utf-8;'
    );
    triggerExportFeedback('Full Analytics JSON Report downloaded');
  };

  if (!isOpen) return null;

  const navTabs: {
    id: ReportTab;
    label: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'departments',
      label: 'Dept Utilization & Trends',
      subtitle: 'Capacity vs. bookings',
      icon: Building2
    },
    {
      id: 'billable',
      label: 'Billable vs. Internal',
      subtitle: 'FTE & revenue effort split',
      icon: PieChart
    },
    {
      id: 'clients',
      label: 'Client & Project Effort',
      subtitle: 'Portfolio FTE distribution',
      icon: Briefcase
    },
    {
      id: 'risk_availability',
      label: 'Overtime, Bench & Leaves',
      subtitle: 'Risk & availability audit',
      icon: AlertTriangle
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[1440px] h-[88vh] flex flex-col overflow-hidden">
        {/* Top Modal Header & Global Report Filter / Export Bar */}
        <div className="relative px-6 py-3.5 pr-14 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
            title="Close Reporting Module"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Reporting & Capacity Analytics
                </h2>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  · {selectedYear} Horizon · {scopedPeople.length} Staff
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-dimensional utilization, billable effort ratio, client portfolio FTEs, and leave impact reports
              </p>
            </div>
          </div>

          {/* Right: Scoping Filters + CSV/JSON Exports */}
          <div className="flex flex-wrap items-center gap-2.5">
            {exportSuccessMessage && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>{exportSuccessMessage}</span>
              </div>
            )}

            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-300/80 dark:border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-500 dark:text-slate-400">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => onSelectYear(Number(e.target.value))}
                className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option
                    key={yr}
                    value={yr}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-300/80 dark:border-slate-700 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-800">
                  All Departments ({departments.length})
                </option>
                {departments.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-slate-800">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Contract Type Segmented Filter */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setContractFilter('all')}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  contractFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All Contracts
              </button>
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContractFilter(type)}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    contractFilter === type
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Export Current View CSV */}
            <button
              type="button"
              onClick={handleExportActiveTabCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              title="Download active report table as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Export Full Analytics JSON */}
            <button
              type="button"
              onClick={handleExportFullReportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              title="Download complete multi-tab analytical report pack as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Main Body: Left Sidebar + Right Report Canvas */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <aside className="w-64 shrink-0 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between overflow-y-auto">
            <nav className="space-y-1.5">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Analytical Perspectives
              </div>
              {navTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{item.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Quick Unit Legend & Annual Snapshot */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Unit Reference
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">1.0 PM</span>
                  <span className="font-mono tabular-nums font-semibold">100% · 1 Month</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">1.0 Annual FTE</span>
                  <span className="font-mono tabular-nums font-semibold">12.0 PM / Year</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Effective Cap</span>
                  <span className="font-mono tabular-nums font-semibold">Nominal − Leaves</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Report Content Viewport */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
            {/* ============================================================== */}
            {/* TAB 1: DEPARTMENT UTILIZATION & CAPACITY TRENDS                */}
            {/* ============================================================== */}
            {activeTab === 'departments' && (
              <div className="space-y-6">
                {/* 4 Executive Summary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Scoped Team Headcount</span>
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {departmentReport.totalHeadcount}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        across {departmentReport.rows.length} dept(s)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Effective Utilization Rate</span>
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {departmentReport.overallUtilPct}%
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        of leave-adjusted capacity
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Total Booked Effort</span>
                      <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {departmentReport.totalBookedPM} PM
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        · {departmentReport.totalBookedFTE} FTE
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Available Bench Capacity</span>
                      <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                        {departmentReport.totalBenchPM} PM
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        · {(departmentReport.totalBenchPM / 12).toFixed(1)} FTE
                      </span>
                    </div>
                  </div>
                </div>

                {/* 12-Month Capacity vs Booked Trend Chart */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        12-Month Organization Utilization & Capacity Trend ({selectedYear})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Monthly effective utilization percentage and Person-Month (PM) capacity split across Jan–Dec
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                        Booked Effort
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-sky-400/70 inline-block" />
                        Available Bench
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-400/80 inline-block" />
                        Time Off / Leaves
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 pt-2">
                    {departmentReport.orgMonthly.map((m) => {
                      const totalNom = m.effectivePM + m.leavePM || 1;
                      const bookedRatio = Math.min(100, Math.round((m.bookedPM / totalNom) * 100));
                      const benchRatio = Math.max(
                        0,
                        Math.min(100 - bookedRatio, Math.round((m.benchPM / totalNom) * 100))
                      );
                      const leaveRatio = Math.max(
                        0,
                        Math.min(
                          100 - bookedRatio - benchRatio,
                          Math.round((m.leavePM / totalNom) * 100)
                        )
                      );

                      return (
                        <div
                          key={m.monthIndex}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800"
                          title={`${m.monthName}: ${m.utilPct}% Util · Booked ${m.bookedPM} PM · Bench ${m.benchPM} PM · Leaves ${m.leavePM} PM`}
                        >
                          <span
                            className={`text-[11px] font-mono tabular-nums font-bold ${
                              m.utilPct > 100
                                ? 'text-rose-600 dark:text-rose-400'
                                : m.utilPct >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {m.utilPct}%
                          </span>

                          {/* Stacked Vertical Bar */}
                          <div className="w-full h-24 bg-slate-200/70 dark:bg-slate-700/50 rounded-md overflow-hidden flex flex-col justify-end">
                            {leaveRatio > 0 && (
                              <div
                                style={{ height: `${leaveRatio}%` }}
                                className="w-full bg-amber-400/85 transition-all"
                              />
                            )}
                            {benchRatio > 0 && (
                              <div
                                style={{ height: `${benchRatio}%` }}
                                className="w-full bg-sky-400/75 transition-all"
                              />
                            )}
                            {bookedRatio > 0 && (
                              <div
                                style={{ height: `${bookedRatio}%` }}
                                className={`w-full transition-all ${
                                  m.utilPct > 100 ? 'bg-rose-600' : 'bg-indigo-600'
                                }`}
                              />
                            )}
                          </div>

                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {m.monthName}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-400">
                            {m.bookedPM} PM
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Department Utilization Matrix Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Departmental Utilization & Capacity Matrix ({selectedYear})
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Click column headers to sort
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                          <th
                            onClick={() => handleSort('default')}
                            className="py-2.5 px-3 cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1">
                              <span>Department</span>
                              <ArrowUpDown className="w-3 h-3 opacity-60" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('headcount')}
                            className="py-2.5 px-2.5 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                          >
                            Staff
                          </th>
                          <th className="py-2.5 px-2.5 whitespace-nowrap">Contract Split</th>
                          {MONTH_NAMES.map((m) => (
                            <th
                              key={m}
                              className="py-2.5 px-1.5 text-right font-mono text-[11px] whitespace-nowrap"
                            >
                              {m}
                            </th>
                          ))}
                          <th
                            onClick={() => handleSort('avgUtilPct')}
                            className="py-2.5 px-2.5 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                          >
                            Avg Util
                          </th>
                          <th
                            onClick={() => handleSort('totalBookedPM')}
                            className="py-2.5 px-2.5 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                          >
                            Booked PM
                          </th>
                          <th
                            onClick={() => handleSort('totalBenchPM')}
                            className="py-2.5 px-2.5 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                          >
                            Bench PM
                          </th>
                          <th
                            onClick={() => handleSort('totalOvertimeMonths')}
                            className="py-2.5 px-3 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                          >
                            OT Months
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {departmentReport.rows.map((row) => (
                          <tr
                            key={row.department}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {row.department}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-semibold">
                              {row.headcount}
                            </td>
                            <td className="py-2.5 px-2.5 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono tabular-nums">
                              {row.internalCount} Int · {row.externalCount} Ext · {row.b2bCount} B2B
                            </td>
                            {row.monthlyUtilPct.map((pct, mIdx) => (
                              <td
                                key={mIdx}
                                className={`py-2.5 px-1.5 text-right font-mono tabular-nums text-[11px] ${
                                  pct > 100
                                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                                    : pct >= 80
                                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                    : pct === 0
                                    ? 'text-slate-300 dark:text-slate-600'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {pct}%
                              </td>
                            ))}
                            <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                              {row.avgUtilPct}%
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                              {row.totalBookedPM}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-sky-600 dark:text-sky-400 font-medium">
                              {row.totalBenchPM}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                              {row.totalOvertimeMonths > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-bold">
                                  {row.totalOvertimeMonths}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: BILLABLE VS. INTERNAL EFFORT BREAKDOWN                  */}
            {/* ============================================================== */}
            {activeTab === 'billable' && (
              <div className="space-y-6">
                {/* 4 Executive Summary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Billable Client Effort
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {billableReport.totalBillablePM} PM
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        · {billableReport.totalBillableFTE} FTE
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Billable Share of Booked Work
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {billableReport.billableShareOfBookedPct}%
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({billableReport.billableShareOfEffectivePct}% of effective cap)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Internal / Non-Billable Effort
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                        {billableReport.totalInternalPM} PM
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        · {billableReport.totalInternalFTE} FTE
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Unallocated Bench & Leaves
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                        {billableReport.totalBenchPM} PM
                      </span>
                      <span className="text-xs font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        · {billableReport.totalLeavePM} PM Leave
                      </span>
                    </div>
                  </div>
                </div>

                {/* Annual Effort Distribution Bar */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Annual Capacity & Effort Composition ({selectedYear})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Proportion of total organizational capacity allocated to Billable deliverables, Internal initiatives, Bench, and Time Off
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                        Billable ({billableReport.totalBillablePM} PM)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                        Internal ({billableReport.totalInternalPM} PM)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 inline-block" />
                        Bench ({billableReport.totalBenchPM} PM)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" />
                        Leaves ({billableReport.totalLeavePM} PM)
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const total =
                      billableReport.totalBillablePM +
                        billableReport.totalInternalPM +
                        billableReport.totalBenchPM +
                        billableReport.totalLeavePM || 1;
                    const bPct = +((billableReport.totalBillablePM / total) * 100).toFixed(1);
                    const iPct = +((billableReport.totalInternalPM / total) * 100).toFixed(1);
                    const benchPct = +((billableReport.totalBenchPM / total) * 100).toFixed(1);
                    const lPct = +((billableReport.totalLeavePM / total) * 100).toFixed(1);

                    return (
                      <div className="space-y-2">
                        <div className="w-full h-7 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
                          {bPct > 0 && (
                            <div
                              style={{ width: `${bPct}%` }}
                              className="bg-emerald-600 h-full flex items-center justify-center text-[10px] font-mono font-bold text-white"
                              title={`Billable: ${bPct}%`}
                            >
                              {bPct >= 6 ? `${bPct}%` : ''}
                            </div>
                          )}
                          {iPct > 0 && (
                            <div
                              style={{ width: `${iPct}%` }}
                              className="bg-indigo-600 h-full flex items-center justify-center text-[10px] font-mono font-bold text-white"
                              title={`Internal: ${iPct}%`}
                            >
                              {iPct >= 6 ? `${iPct}%` : ''}
                            </div>
                          )}
                          {benchPct > 0 && (
                            <div
                              style={{ width: `${benchPct}%` }}
                              className="bg-sky-400 h-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
                              title={`Bench: ${benchPct}%`}
                            >
                              {benchPct >= 6 ? `${benchPct}%` : ''}
                            </div>
                          )}
                          {lPct > 0 && (
                            <div
                              style={{ width: `${lPct}%` }}
                              className="bg-amber-400 h-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
                              title={`Leaves: ${lPct}%`}
                            >
                              {lPct >= 6 ? `${lPct}%` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 12-Month Billable vs Internal Matrix Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Monthly Effort Breakdown in Person-Months ({selectedYear})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                          <th className="py-2.5 px-3">Effort Stream</th>
                          {MONTH_NAMES.map((m) => (
                            <th key={m} className="py-2.5 px-2 text-right font-mono text-[11px]">
                              {m}
                            </th>
                          ))}
                          <th className="py-2.5 px-3 text-right">Annual PM</th>
                          <th className="py-2.5 px-3 text-right">Avg FTE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                            Billable Client Projects
                          </td>
                          {billableReport.monthlyBillablePM.map((v, i) => (
                            <td
                              key={i}
                              className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-medium"
                            >
                              {v}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                            {billableReport.totalBillablePM}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                            {billableReport.totalBillableFTE}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">
                            Internal / Non-Billable Projects
                          </td>
                          {billableReport.monthlyInternalPM.map((v, i) => (
                            <td
                              key={i}
                              className="py-2.5 px-2 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-medium"
                            >
                              {v}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                            {billableReport.totalInternalPM}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                            {billableReport.totalInternalFTE}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-sky-600 dark:text-sky-400">
                            Unallocated Bench Capacity
                          </td>
                          {billableReport.monthlyBenchPM.map((v, i) => (
                            <td
                              key={i}
                              className="py-2.5 px-2 text-right font-mono tabular-nums text-sky-600 dark:text-sky-400"
                            >
                              {v}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-sky-600 dark:text-sky-400">
                            {billableReport.totalBenchPM}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {(billableReport.totalBenchPM / 12).toFixed(1)}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-amber-600 dark:text-amber-400">
                            Time Off & Leaves Impact
                          </td>
                          {billableReport.monthlyLeavePM.map((v, i) => (
                            <td
                              key={i}
                              className="py-2.5 px-2 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400"
                            >
                              {v}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                            {billableReport.totalLeavePM}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {(billableReport.totalLeavePM / 12).toFixed(1)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Department Billable Ratio Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Billable Efficiency by Department
                    </h3>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                        <th className="py-2.5 px-4">Department</th>
                        <th className="py-2.5 px-3 text-right">Headcount</th>
                        <th className="py-2.5 px-3 text-right">Billable PM</th>
                        <th className="py-2.5 px-3 text-right">Internal PM</th>
                        <th className="py-2.5 px-3 text-right">Bench PM</th>
                        <th className="py-2.5 px-4 text-right">Billable Ratio (of Booked)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {billableReport.deptBreakdown.map((d) => (
                        <tr
                          key={d.department}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {d.department}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {d.headcount}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                            {d.billablePM}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                            {d.internalPM}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sky-600 dark:text-sky-400">
                            {d.benchPM}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">
                            {d.billableRatio}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: CLIENT & PROJECT EFFORT DISTRIBUTION                    */}
            {/* ============================================================== */}
            {activeTab === 'clients' && (
              <div className="space-y-6">
                {/* 4 Executive Summary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Active Clients Staffed
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {clientProjectReport.activeClientsStaffed}
                      </span>
                      <span className="text-xs text-slate-500">
                        of {clients.length} total clients
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Active Projects Staffed
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                        {clientProjectReport.activeProjectsStaffed}
                      </span>
                      <span className="text-xs text-slate-500">
                        of {projects.length} total projects
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Total Portfolio Effort
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {clientProjectReport.grandTotalPM} PM
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        · {clientProjectReport.grandTotalFTE} FTE
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Largest Client Effort Share
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                        {clientProjectReport.topClientName}
                      </span>
                      <span className="text-xs font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        ({clientProjectReport.topClientSharePct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Client Effort Distribution Bars */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Client Effort Share Distribution ({selectedYear})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ranked by total Person-Months (PM) and average annual FTEs
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {clientProjectReport.clientRows
                      .filter((c) => c.totalPM > 0)
                      .map((client) => (
                        <div key={client.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: client.color }}
                              />
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {client.name}
                              </span>
                              <span className="text-slate-400">
                                · {client.projectCount} proj · {client.staffCount} staff
                              </span>
                            </div>
                            <div className="font-mono tabular-nums text-xs">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {client.totalPM} PM
                              </span>
                              <span className="text-slate-400">
                                {' '}
                                · {client.avgFTE} FTE · {client.sharePct}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              style={{
                                width: `${Math.max(2, client.sharePct)}%`,
                                backgroundColor: client.color
                              }}
                              className="h-full rounded-full transition-all"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Switchable Client / Project 12-Month Effort Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      12-Month Effort Matrix in Person-Months ({selectedYear})
                    </h3>
                    <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setClientGroupMode('projects')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          clientGroupMode === 'projects'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        By Projects ({clientProjectReport.projectRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientGroupMode('clients')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          clientGroupMode === 'clients'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        By Clients ({clientProjectReport.clientRows.length})
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {clientGroupMode === 'projects' ? (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                            <th
                              onClick={() => handleSort('name')}
                              className="py-2.5 px-3 cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Project & Client
                            </th>
                            <th className="py-2.5 px-2 whitespace-nowrap">Billing</th>
                            <th
                              onClick={() => handleSort('staffCount')}
                              className="py-2.5 px-2 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Staff
                            </th>
                            {MONTH_NAMES.map((m) => (
                              <th
                                key={m}
                                className="py-2.5 px-1.5 text-right font-mono text-[11px]"
                              >
                                {m}
                              </th>
                            ))}
                            <th
                              onClick={() => handleSort('totalPM')}
                              className="py-2.5 px-2.5 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Total PM
                            </th>
                            <th
                              onClick={() => handleSort('avgFTE')}
                              className="py-2.5 px-2.5 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Avg FTE
                            </th>
                            <th
                              onClick={() => handleSort('sharePct')}
                              className="py-2.5 px-3 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Share %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {clientProjectReport.projectRows.map((row) => (
                            <tr
                              key={row.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {row.name}{' '}
                                  <span className="font-mono text-[10px] text-slate-400">
                                    · {row.code}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {row.clientName}
                                </div>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap">
                                <span
                                  className={`text-[11px] font-medium ${
                                    row.billable
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-indigo-600 dark:text-indigo-400'
                                  }`}
                                >
                                  {row.billable ? 'Billable' : 'Internal'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                                {row.staffCount}
                              </td>
                              {row.monthlyPM.map((pm, idx) => (
                                <td
                                  key={idx}
                                  className={`py-2.5 px-1.5 text-right font-mono tabular-nums text-[11px] ${
                                    pm === 0
                                      ? 'text-slate-300 dark:text-slate-600'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {pm}
                                </td>
                              ))}
                              <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                                {row.totalPM}
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                                {row.avgFTE}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                {row.sharePct}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                            <th
                              onClick={() => handleSort('name')}
                              className="py-2.5 px-3 cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Client & Industry
                            </th>
                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Projects</th>
                            <th
                              onClick={() => handleSort('staffCount')}
                              className="py-2.5 px-2 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Staff
                            </th>
                            {MONTH_NAMES.map((m) => (
                              <th
                                key={m}
                                className="py-2.5 px-1.5 text-right font-mono text-[11px]"
                              >
                                {m}
                              </th>
                            ))}
                            <th
                              onClick={() => handleSort('totalPM')}
                              className="py-2.5 px-2.5 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Total PM
                            </th>
                            <th
                              onClick={() => handleSort('avgFTE')}
                              className="py-2.5 px-2.5 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Avg FTE
                            </th>
                            <th
                              onClick={() => handleSort('sharePct')}
                              className="py-2.5 px-3 text-right cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                            >
                              Share %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {clientProjectReport.clientRows.map((row) => (
                            <tr
                              key={row.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {row.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {row.industry} · {row.status}
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                                {row.projectCount}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                                {row.staffCount}
                              </td>
                              {row.monthlyPM.map((pm, idx) => (
                                <td
                                  key={idx}
                                  className={`py-2.5 px-1.5 text-right font-mono tabular-nums text-[11px] ${
                                    pm === 0
                                      ? 'text-slate-300 dark:text-slate-600'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {pm}
                                </td>
                              ))}
                              <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                                {row.totalPM}
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                                {row.avgFTE}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                {row.sharePct}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: OVERTIME, BENCH & LEAVE IMPACT SUMMARY                  */}
            {/* ============================================================== */}
            {activeTab === 'risk_availability' && (
              <div className="space-y-6">
                {/* 4 Executive Summary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Overbooked Person-Months</span>
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                        {riskAvailabilityReport.totalOvertimeMonths}
                      </span>
                      <span className="text-xs text-slate-500">
                        across {riskAvailabilityReport.peopleWithOvertime} staff
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Available Bench Capacity</span>
                      <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                        {riskAvailabilityReport.totalBenchPM} PM
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        · {(riskAvailabilityReport.totalBenchPM / 12).toFixed(1)} FTE
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Capacity Reduced by Leaves</span>
                      <CalendarOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        {riskAvailabilityReport.totalLeaveLostPM} PM
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        · {(riskAvailabilityReport.totalLeaveLostPM / 12).toFixed(1)} FTE
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Leave Categories Tracked</span>
                      <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {riskAvailabilityReport.leaveCategoryBreakdown.length}
                      </span>
                      <span className="text-xs text-slate-500">configured leave types</span>
                    </div>
                  </div>
                </div>

                {/* Time Off & Leave Impact Breakdown by Category */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Time Off & Leave Capacity Reduction by Type ({selectedYear})
                    </h3>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                        <th className="py-2.5 px-4">Leave Type</th>
                        <th className="py-2.5 px-3 text-right">Scheduled Entries</th>
                        <th className="py-2.5 px-3 text-right">Staff Affected</th>
                        <th className="py-2.5 px-3 text-right">Month Spans</th>
                        <th className="py-2.5 px-4 text-right">Capacity Lost (PM)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {riskAvailabilityReport.leaveCategoryBreakdown.map((item) => (
                        <tr
                          key={item.typeKey}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {item.label}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {item.entriesCount}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {item.uniquePeopleCount}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {item.affectedPersonMonths}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                            {item.capacityLostPM} PM
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Person-Level Overtime, Bench & Leave Audit Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Individual Overtime, Bench & Availability Audit ({selectedYear})
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Click headers to sort by risk or bench availability
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                          <th
                            onClick={() => handleSort('name')}
                            className="py-2.5 px-4 cursor-pointer hover:text-indigo-600"
                          >
                            Team Member
                          </th>
                          <th className="py-2.5 px-3">Department & Contract</th>
                          <th
                            onClick={() => handleSort('avgBookedPct')}
                            className="py-2.5 px-3 text-right cursor-pointer hover:text-indigo-600"
                          >
                            Avg Booked %
                          </th>
                          <th className="py-2.5 px-3 text-right">Effective Cap %</th>
                          <th
                            onClick={() => handleSort('benchPM')}
                            className="py-2.5 px-3 text-right cursor-pointer hover:text-indigo-600"
                          >
                            Bench PM
                          </th>
                          <th
                            onClick={() => handleSort('leaveReductionPM')}
                            className="py-2.5 px-3 text-right cursor-pointer hover:text-indigo-600"
                          >
                            Leave PM
                          </th>
                          <th
                            onClick={() => handleSort('overtimeMonthsCount')}
                            className="py-2.5 px-3 text-right cursor-pointer hover:text-indigo-600"
                          >
                            OT Months
                          </th>
                          <th className="py-2.5 px-4">Overtime Conflict Months</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {riskAvailabilityReport.personAuditRows.map((r) => {
                          const empCfg = EMPLOYMENT_BADGE_CONFIG[r.employmentType];
                          return (
                            <tr
                              key={r.person.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                              <td className="py-2.5 px-4">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {r.formattedName}
                                </div>
                                <div className="text-[11px] text-slate-400">{r.person.role}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {r.person.department}
                                </span>
                                <span className="text-slate-400"> · {empCfg.label}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                                {r.avgBookedPct}%
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                                {r.avgEffectiveCapPct}%
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sky-600 dark:text-sky-400 font-semibold">
                                {r.benchPM}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">
                                {r.leaveReductionPM}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                {r.overtimeMonthsCount > 0 ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                                    {r.overtimeMonthsCount} ({r.overtimeExcessPM} PM)
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-[11px] font-mono text-rose-600 dark:text-rose-400">
                                {r.overtimeDetails || (
                                  <span className="text-slate-400 font-sans">Balanced</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
