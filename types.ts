

export enum UserRole {
  Coach = 'coach',
  Student = 'student',
  SuperAdmin = 'superadmin',
  Parent = 'parent',
}

export enum AcademicTrack {
  Sayisal = 'sayisal',
  EsitAgirlik = 'esit-agirlik',
  Sozel = 'sozel',
  Dil = 'dil',
}

export enum BadgeID {
  FirstAssignment = 'first-assignment',
  HighAchiever = 'high-achiever',
  PerfectScore = 'perfect-score',
  GoalGetter = 'goal-getter',
  StreakStarter = 'streak-starter',
  StreakMaster = 'streak-master',
  OnTimeSubmissions = 'on-time-submissions',
}

export enum QuestionDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export interface Badge {
  id: BadgeID;
  name: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture: string;
  isOnline?: boolean;
  notes?: string; // Coach's private notes about a student
  assignedCoachId?: string | null; // ID of the assigned coach for a student
  gradeLevel?: string;
  academicTrack?: AcademicTrack;
  childIds?: string[]; // For parents
  parentIds?: string[]; // For students
  xp?: number;
  streak?: number;
  lastSubmissionDate?: string | null;
  earnedBadgeIds?: BadgeID[];
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

export type SubmissionType = 'file' | 'text' | 'completed';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  grade: number | null;
  feedback: string;
  fileUrl: string | null;
  fileName?: string;
  studentId: string;
  coachId: string;
  submittedAt: string | null;
  gradedAt?: string | null;
  coachAttachments?: { name: string; url: string }[];
  checklist?: ChecklistItem[];
  audioFeedbackUrl?: string | null;
  videoDescriptionUrl?: string | null;
  videoFeedbackUrl?: string | null;
  studentVideoSubmissionUrl?: string | null;
  feedbackReaction?: '👍' | '🤔' | null;
  submissionType?: SubmissionType;
  textSubmission?: string | null;
  studentAudioFeedbackResponseUrl?: string | null;
  studentVideoFeedbackResponseUrl?: string | null;
  studentTextFeedbackResponse?: string | null;
  startTime?: string;
  endTime?: string;
}

export interface Reaction {
  [emoji: string]: string[]; // key: emoji, value: array of user IDs
}

export interface PollOption {
  text: string;
  votes: string[]; // array of user IDs
}

export interface Poll {
  question: string;
  options: PollOption[];
}

export interface Conversation {
  id: string;
  participantIds: string[];
  isGroup: boolean;
  groupName?: string | null;
  groupImage?: string | null;
  adminId?: string | null;
  isArchived?: boolean;
}

export enum NotificationPriority {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export interface Message {
  id: string;
  senderId: string;
  conversationId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'file' | 'audio' | 'video' | 'announcement' | 'poll' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  readBy: string[];
  reactions?: Reaction;
  replyTo?: string; // ID of the message being replied to
  poll?: Poll;
  priority?: NotificationPriority;
}


export type Page = 'dashboard' | 'assignments' | 'students' | 'messages' | 'analytics' | 'settings' | 'library' | 'superadmin' | 'calendar' | 'parent' | 'templates' | 'motivation' | 'odak' | 'akilli-planlayici' | 'sinav-performansi' | 'goals' | 'exams' | 'soru-bankasi';

export type ToastType = 'success' | 'error' | 'info' | 'xp';

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
  id:string;
  userId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: NotificationPriority;
  link?: {
    page: Page;
    filter?: { [key:string]: any };
  };
}

export interface AssignmentTemplate {
  id: string;
  title: string;
  description: string;
  checklist: Omit<ChecklistItem, 'id' | 'isCompleted'>[];
  isFavorite?: boolean;
}

export enum ResourceCategory {
    Matematik = 'matematik',
    Fizik = 'fizik',
    Kimya = 'kimya',
    Biyoloji = 'biyoloji',
    Turkce = 'turkce',
    Tarih = 'tarih',
    Cografya = 'cografya',
    Felsefe = 'felsefe',
    Ingilizce = 'ingilizce',
    Genel = 'genel',
}

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'link' | 'video' | 'image' | 'audio' | 'document' | 'spreadsheet';
  url: string;
  isPublic: boolean;
  uploaderId: string;
  assignedTo?: string[]; // Array of student IDs
  category: ResourceCategory;
}

export interface Question {
  id: string;
  creatorId: string; // Coach ID
  category: ResourceCategory;
  topic: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: QuestionDifficulty;
  explanation?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  documentUrl?: string;
  documentName?: string;
}

export interface Goal {
  id: string;
  studentId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  milestones: ChecklistItem[];
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  date: string;
  type: 'personal' | 'study';
  color: string;
  startTime?: string;
  endTime?: string;
}

export interface ExamSubjectPerformance {
    name: string;
    totalQuestions: number;
    correct: number;
    incorrect: number;
    empty: number;
    netScore: number;
}

export interface Exam {
    id: string;
    studentId: string;
    title: string;
    date: string;
    totalQuestions: number;
    correct: number;
    incorrect: number;
    empty: number;
    netScore: number;
    subjects: ExamSubjectPerformance[];
    coachNotes?: string;
    studentReflections?: string;
    category: string; // e.g., 'Matematik', 'Genel Deneme Sınavları'
    topic: string; // e.g., 'Türev', 'TYT'
    type: 'deneme' | 'konu-tarama';
}