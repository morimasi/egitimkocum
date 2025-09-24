export enum UserRole {
  Coach = 'coach',
  Student = 'student',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture: string;
}

export enum AssignmentStatus {
  Pending = 'pending',
  Submitted = 'submitted',
  Graded = 'graded',
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  grade: number | null;
  feedback: string;
  fileUrl: string | null;
  studentId: string;
  coachId: string;
  submittedAt: string | null;
  coachAttachments?: { name: string; url: string }[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'file' | 'audio';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
}

export type Page = 'dashboard' | 'assignments' | 'students' | 'messages' | 'analytics' | 'settings';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export interface ChartData {
  name: string;
  [key: string]: string | number;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: {
    page: Page;
    filter?: { [key: string]: any };
  };
}
