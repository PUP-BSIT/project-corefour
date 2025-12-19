export type DashboardStats = {
  totalReports: number;
  successfullyClaimed: number;
  pendingAction: number;
  lostFoundRatio: string;
};

export type ChartData = {
  label: string;
  value: number;
};

export type DashboardData = {
  stats: DashboardStats;
  reportsOverTime: ChartData[];
};