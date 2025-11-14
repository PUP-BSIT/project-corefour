export type UserNotification = {
  notif_id: number;
  user_id: number;
  report_id: number;
  message: string;
  status: 'read' | 'unread';
  created_at: string;
};

export type PaginatedNotifications = {
  items: UserNotification[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
};