export type ReportStat = {
  date: string;
  count: number;
}

export type DashboardStats = {
  totalReports: number;
  successfullyClaimed: number;
  pendingAction: number;
  lostFoundRatio: string;
}

export type DashboardData = {
  stats: DashboardStats;
  reportsOverTime: ReportStat[];
}