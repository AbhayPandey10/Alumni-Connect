import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import Opportunity from '../models/Opportunity.js';
import ReferralRequest from '../models/ReferralRequest.js';
import { generateAnalyticsInsightsWithAI } from '../services/aiService.js';

const SUCCESS = ['Referred', 'Interviewing', 'Hired'];
const REACHED_INTERVIEW = ['Interviewing', 'Hired'];
const OFFER = 'Hired';

// small helpers
const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);
const incr = (map, key, by = 1) => { if (key == null || key === '') return; map.set(key, (map.get(key) || 0) + by); };
const topEntries = (map, n = 6) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10;
};
const avg = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);

const monthlySeries = (items, getDate, months = 6) => {
  const now = new Date();
  const keyOf = (d) => `${d.getFullYear()}-${d.getMonth()}`;
  const order = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    order.push({ key: keyOf(d), label: d.toLocaleString('en-US', { month: 'short' }) });
  }
  const counts = new Map(order.map((o) => [o.key, 0]));
  for (const it of items) {
    const raw = getDate(it);
    if (!raw) continue;
    const k = keyOf(new Date(raw));
    if (counts.has(k)) counts.set(k, counts.get(k) + 1);
  }
  return order.map((o) => ({ label: o.label, value: counts.get(o.key) || 0 }));
};

const nameOf = (u) => (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u?.username || u?.email?.split('@')[0] || 'Unknown'));

// Core computation — shared by the data + AI-insights endpoints
export const computeAnalytics = async (filters = {}, isAdmin = false) => {
  const { company, jobType, graduationYear, department, from, to } = filters;
  const gradYear = graduationYear ? Number(graduationYear) : null;
  const dept = department ? department.toLowerCase() : null;
  const fromD = from ? new Date(from) : null;
  const toD = to ? new Date(to) : null;
  const companyRx = company ? new RegExp(escapeRegex(company), 'i') : null;
  const inRange = (d) => {
    if (!fromD && !toD) return true;
    const t = new Date(d).getTime();
    if (fromD && t < fromD.getTime()) return false;
    if (toD && t > toD.getTime()) return false;
    return true;
  };

  const [users, studentProfiles, alumniProfiles, opportunitiesRaw, referralsRaw] = await Promise.all([
    User.find().select('role graduationYear firstName lastName username email createdAt'),
    StudentProfile.find().select('user major graduationYear skills githubUrl portfolioUrl projects'),
    AlumniProfile.find().select('user department currentCompany industry yearsOfExperience totalReferralsGiven verificationStatus'),
    Opportunity.find().select('role company type requiredSkills postedBy requestedBy isActive salary createdAt'),
    ReferralRequest.find().select('student alumni opportunity status createdAt updatedAt').populate('opportunity', 'company role type'),
  ]);

  const userById = new Map(users.map((u) => [String(u._id), u]));
  const studentProfByUser = new Map(studentProfiles.map((p) => [String(p.user), p]));
  const alumniProfByUser = new Map(alumniProfiles.map((p) => [String(p.user), p]));

  // apply filters
  const opportunities = opportunitiesRaw.filter((o) =>
    (!jobType || o.type === jobType) &&
    (!companyRx || companyRx.test(o.company || '')) &&
    inRange(o.createdAt));

  const referrals = referralsRaw.filter((r) =>
    inRange(r.createdAt) &&
    (!companyRx || companyRx.test(r.opportunity?.company || '')) &&
    (!jobType || r.opportunity?.type === jobType));

  const studentDept = (u) => (studentProfByUser.get(String(u._id))?.major || '').toLowerCase();
  const alumniDept = (u) => (alumniProfByUser.get(String(u._id))?.department || '').toLowerCase();

  let students = users.filter((u) => u.role === 'Student' && (!gradYear || u.graduationYear === gradYear));
  let alumni = users.filter((u) => u.role === 'Alumni' && (!gradYear || u.graduationYear === gradYear));
  if (dept) {
    students = students.filter((u) => studentDept(u).includes(dept));
    alumni = alumni.filter((u) => alumniDept(u).includes(dept));
  }

  // referral status buckets
  const byStatus = { Pending: 0, Reviewed: 0, Referred: 0, Interviewing: 0, Hired: 0, Rejected: 0 };
  for (const r of referrals) if (byStatus[r.status] != null) byStatus[r.status] += 1;
  const totalRef = referrals.length;
  const successRef = referrals.filter((r) => SUCCESS.includes(r.status)).length;
  const interviewsRef = referrals.filter((r) => REACHED_INTERVIEW.includes(r.status)).length;
  const offersRef = referrals.filter((r) => r.status === OFFER).length;
  const placedStudentIds = new Set(referrals.filter((r) => r.status === OFFER).map((r) => String(r.student)));

  // companies
  const companySet = new Set(opportunities.map((o) => o.company).filter(Boolean));
  const salaries = opportunities.map((o) => o.salary).filter((s) => typeof s === 'number' && s > 0);

  // OVERVIEW KPIs
  const kpis = {
    totalStudents: students.length,
    totalAlumni: alumni.length,
    totalCompanies: companySet.size,
    totalJobs: opportunities.length,
    activeJobs: opportunities.filter((o) => o.isActive).length,
    studentsPlaced: placedStudentIds.size,
    placementRate: pct(placedStudentIds.size, students.length),
    totalReferrals: totalRef,
    successfulReferrals: successRef,
    referralSuccessRate: pct(successRef, totalRef),
    totalInterviews: interviewsRef,
    totalOffers: offersRef,
    avgPackage: avg(salaries),
    medianPackage: median(salaries),
    highestPackage: salaries.length ? Math.max(...salaries) : null,
    lowestPackage: salaries.length ? Math.min(...salaries) : null,
  };

  // REFERRAL ANALYTICS
  const refByCompany = new Map();
  const refByAlumni = new Map();
  const successByAlumni = new Map();
  for (const r of referrals) {
    incr(refByCompany, r.opportunity?.company);
    incr(refByAlumni, String(r.alumni));
    if (SUCCESS.includes(r.status)) incr(successByAlumni, String(r.alumni));
  }
  const referral = {
    funnel: [
      { label: 'Requested', value: totalRef },
      { label: 'Reviewed+', value: totalRef - byStatus.Pending },
      { label: 'Referred+', value: successRef },
      { label: 'Interview+', value: interviewsRef },
      { label: 'Hired', value: offersRef },
    ],
    byStatus,
    responseRate: pct(totalRef - byStatus.Pending, totalRef),
    acceptanceRate: pct(successRef, totalRef),
    toInterviewRate: pct(interviewsRef, totalRef),
    toOfferRate: pct(offersRef, totalRef),
    byMonth: monthlySeries(referrals, (r) => r.createdAt, 6),
    topCompanies: topEntries(refByCompany, 6),
    mostActiveAlumni: topEntries(refByAlumni, 5).map((e) => ({ label: nameOf(userById.get(e.label)), value: e.value })),
    mostSuccessfulAlumni: topEntries(successByAlumni, 5).map((e) => ({ label: nameOf(userById.get(e.label)), value: e.value })),
  };

  // JOB ANALYTICS
  const jobsByType = new Map();
  const jobsByCompany = new Map();
  for (const o of opportunities) { incr(jobsByType, o.type); incr(jobsByCompany, o.company); }
  const jobs = {
    total: opportunities.length,
    active: opportunities.filter((o) => o.isActive).length,
    closed: opportunities.filter((o) => !o.isActive).length,
    byType: topEntries(jobsByType, 6),
    byCompany: topEntries(jobsByCompany, 6),
    byMonth: monthlySeries(opportunities, (o) => o.createdAt, 6),
    mostRequested: [...opportunities]
      .sort((a, b) => (b.requestedBy?.length || 0) - (a.requestedBy?.length || 0))
      .slice(0, 5)
      .map((o) => ({ label: `${o.role} · ${o.company}`, value: o.requestedBy?.length || 0 })),
  };

  // ALUMNI ANALYTICS
  const alById = (u) => alumniProfByUser.get(String(u._id));
  const alByCompany = new Map();
  const alByGradYear = new Map();
  const alByDept = new Map();
  const alByIndustry = new Map();
  const alByExp = new Map();
  let verifiedCount = 0;
  for (const u of alumni) {
    const p = alById(u);
    incr(alByCompany, p?.currentCompany);
    incr(alByGradYear, u.graduationYear ? String(u.graduationYear) : null);
    incr(alByDept, p?.department);
    incr(alByIndustry, p?.industry);
    if (p?.verificationStatus === 'Verified') verifiedCount += 1;
    const y = p?.yearsOfExperience;
    if (typeof y === 'number') incr(alByExp, y <= 2 ? '0–2 yrs' : y <= 5 ? '3–5 yrs' : y <= 10 ? '6–10 yrs' : '10+ yrs');
  }
  const alumniAnalytics = {
    total: alumni.length,
    verified: verifiedCount,
    byCompany: topEntries(alByCompany, 6),
    byGradYear: topEntries(alByGradYear, 8).sort((a, b) => a.label.localeCompare(b.label)),
    byDepartment: topEntries(alByDept, 6),
    byIndustry: topEntries(alByIndustry, 6),
    byExperience: topEntries(alByExp, 4),
    mostActive: [...alumni]
      .map((u) => ({ label: nameOf(u), value: alById(u)?.totalReferralsGiven || 0 }))
      .filter((e) => e.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  };

  // COMPANY ANALYTICS
  const hiresByCompany = new Map();
  for (const r of referrals) if (r.status === OFFER) incr(hiresByCompany, r.opportunity?.company);
  const companyAnalytics = {
    totalRecruiting: companySet.size,
    mostJobs: topEntries(jobsByCompany, 6),
    mostHires: topEntries(hiresByCompany, 6),
    topReferralCompanies: topEntries(refByCompany, 6),
  };

  // PLACEMENT TRENDS
  const placedRefs = referrals.filter((r) => r.status === OFFER);
  const placeByDept = new Map();
  const placeByYear = new Map();
  for (const r of placedRefs) {
    const sp = studentProfByUser.get(String(r.student));
    incr(placeByDept, sp?.major);
    const su = userById.get(String(r.student));
    incr(placeByYear, su?.graduationYear ? String(su.graduationYear) : null);
  }
  const placement = {
    rate: kpis.placementRate,
    placed: placedStudentIds.size,
    searching: Math.max(0, students.length - placedStudentIds.size),
    byMonth: monthlySeries(placedRefs, (r) => r.updatedAt || r.createdAt, 6),
    byDepartment: topEntries(placeByDept, 6),
    byBatch: topEntries(placeByYear, 6).sort((a, b) => a.label.localeCompare(b.label)),
  };

  // SALARY ANALYTICS
  const salByCompany = new Map(); // company -> [salaries]
  const salByRole = new Map();
  const salByType = new Map();
  const push = (map, key, val) => { if (!key) return; if (!map.has(key)) map.set(key, []); map.get(key).push(val); };
  for (const o of opportunities) {
    if (typeof o.salary === 'number' && o.salary > 0) {
      push(salByCompany, o.company, o.salary);
      push(salByRole, o.role, o.salary);
      push(salByType, o.type, o.salary);
    }
  }
  const dist = [
    { label: '0–5 LPA', value: salaries.filter((s) => s <= 5).length },
    { label: '5–10 LPA', value: salaries.filter((s) => s > 5 && s <= 10).length },
    { label: '10–20 LPA', value: salaries.filter((s) => s > 10 && s <= 20).length },
    { label: '20–40 LPA', value: salaries.filter((s) => s > 20 && s <= 40).length },
    { label: '40+ LPA', value: salaries.filter((s) => s > 40).length },
  ];
  const avgMap = (m) => [...m.entries()].map(([label, vals]) => ({ label, value: avg(vals) })).sort((a, b) => b.value - a.value).slice(0, 6);
  const salary = {
    count: salaries.length,
    avg: kpis.avgPackage, median: kpis.medianPackage, highest: kpis.highestPackage, lowest: kpis.lowestPackage,
    distribution: dist,
    byCompany: avgMap(salByCompany),
    byRole: avgMap(salByRole),
    byType: avgMap(salByType),
  };

  // SKILLS ANALYTICS
  const demanded = new Map();
  for (const o of opportunities) for (const s of (o.requiredSkills || [])) incr(demanded, s.trim());
  const studentSkillCount = new Map();
  const studentSkillSet = new Set();
  for (const u of students) {
    const sp = studentProfByUser.get(String(u._id));
    for (const s of (sp?.skills || [])) { incr(studentSkillCount, s.trim()); studentSkillSet.add(s.toLowerCase().trim()); }
  }
  const gap = [...demanded.entries()]
    .filter(([label]) => !studentSkillSet.has(label.toLowerCase()))
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  const skills = {
    mostDemanded: topEntries(demanded, 8),
    mostCommonStudent: topEntries(studentSkillCount, 8),
    gap,
  };

  // STUDENT ACTIVITY ANALYTICS
  const studentsWithReferrals = new Set(referrals.map((r) => String(r.student)));
  const studentsInterviewing = new Set(referrals.filter((r) => REACHED_INTERVIEW.includes(r.status)).map((r) => String(r.student)));
  const stByDept = new Map();
  const stByYear = new Map();
  let completionSum = 0;
  for (const u of students) {
    const sp = studentProfByUser.get(String(u._id));
    incr(stByDept, sp?.major);
    incr(stByYear, u.graduationYear ? String(u.graduationYear) : null);
    // profile completion across 6 key fields
    if (sp) {
      const filled = [sp.major, (sp.skills || []).length, sp.githubUrl, sp.portfolioUrl, (sp.projects || []).length, sp.graduationYear]
        .filter(Boolean).length;
      completionSum += filled / 6;
    }
  }
  const studentActivity = {
    total: students.length,
    byDepartment: topEntries(stByDept, 6),
    byBatch: topEntries(stByYear, 8).sort((a, b) => a.label.localeCompare(b.label)),
    receivingReferrals: studentsWithReferrals.size,
    gettingInterviews: studentsInterviewing.size,
    receivingOffers: placedStudentIds.size,
    withoutReferrals: Math.max(0, students.length - studentsWithReferrals.size),
    avgProfileCompletion: students.length ? Math.round((completionSum / students.length) * 100) : 0,
  };

  // LEADERBOARDS
  const refReceivedByStudent = new Map();
  for (const r of referrals) incr(refReceivedByStudent, String(r.student));
  const receivedByAlumni = new Map();
  for (const r of referrals) incr(receivedByAlumni, String(r.alumni));
  const leaderboards = {
    studentsMostReferrals: topEntries(refReceivedByStudent, 5).map((e) => ({ label: nameOf(userById.get(e.label)), value: e.value })),
    alumniMostReferrals: referral.mostSuccessfulAlumni,
    alumniBestAcceptance: [...receivedByAlumni.entries()]
      .filter(([, total]) => total >= 3)
      .map(([id, total]) => ({ label: nameOf(userById.get(id)), value: pct(successByAlumni.get(id) || 0, total) }))
      .sort((a, b) => b.value - a.value).slice(0, 5),
    companiesMostJobs: topEntries(jobsByCompany, 5),
    companiesMostHires: topEntries(hiresByCompany, 5),
  };

  const result = {
    isAdmin,
    generatedAt: new Date().toISOString(),
    filtersApplied: { company: company || null, jobType: jobType || null, graduationYear: gradYear, department: department || null, from: from || null, to: to || null },
    kpis, referral, jobs, alumni: alumniAnalytics, companies: companyAnalytics,
    placement, salary, skills, studentActivity, leaderboards,
  };

  // Non-admins get aggregate placement/referral/job/company/salary/skills stats,
  // but NOT headcounts, rosters, or individual student/alumni breakdowns.
  if (!isAdmin) {
    result.kpis = { ...result.kpis, totalStudents: null, totalAlumni: null, studentsPlaced: null };
    result.referral = { ...result.referral, mostActiveAlumni: null, mostSuccessfulAlumni: null };
    result.placement = { ...result.placement, searching: null, byDepartment: null, byBatch: null };
    delete result.alumni;
    delete result.studentActivity;
    delete result.leaderboards;
  }

  return result;
};

// endpoints
export const getAnalytics = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'Admin';
    const data = await computeAnalytics(req.query, isAdmin);
    res.status(200).json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAnalyticsInsights = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'Admin';
    const data = await computeAnalytics(req.query, isAdmin);
    const insights = await generateAnalyticsInsightsWithAI(data);
    res.status(200).json({ insights });
  } catch (error) {
    console.error('Analytics insights error:', error);
    res.status(500).json({ message: error.message });
  }
};
