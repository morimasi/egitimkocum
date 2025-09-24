export enum UserRole {
  Coach = 'coach',
  Student = 'student',
  SuperAdmin = 'superadmin',
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

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
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
  checklist?: ChecklistItem[];
  audioFeedbackUrl?: string | null;
  feedbackReaction?: '👍' | '🤔' | null;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'file' | 'audio' | 'announcement';
  fileUrl?: string;
  fileName?: string;
  audioUrl?: string;
  isRead: boolean;
}

export type Page = 'dashboard' | 'assignments' | 'students' | 'messages' | 'analytics' | 'settings' | 'library' | 'superadmin';

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

export interface AssignmentTemplate {
  id: string;
  title: string;
  description: string;
  checklist: Omit<ChecklistItem, 'id' | 'isCompleted'>[];
}

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'link' | 'video';
  url: string;
}

export interface Goal {
  id: string;
  studentId: string;
  text: string;
  isCompleted: boolean;
}