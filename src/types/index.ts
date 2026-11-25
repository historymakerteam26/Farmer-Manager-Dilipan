export type UserRole = "admin" | "staff";

export interface IUser {
  _id: string;
  name: string;
  username?: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IFarmer {
  _id: string;
  farmerId: string;
  name: string;
  mobile: string;
  village: string;
  address?: string;
  notes?: string;
  photoUrl?: string;
  isDeleted?: boolean;
  createdBy?: string | IUser;
  createdAt: string | Date;
  updatedAt: string | Date;
  aiRecordsCount?: number;
  pregnantCount?: number;
  pendingPdCount?: number;
  calvingCount?: number;
}

export type HeatResult = "Not Checked" | "Heat Detected" | "No Heat" | "Recheck Required";
export type CattleType = "Cow" | "Buffalo" | "Heifer";
export type PDStatus = "Pending" | "Pregnant" | "Not Pregnant" | "Recheck Required" | "Failed";

export interface IAIRecord {
  _id: string;
  aiRecordId: string;
  farmerId: string | IFarmer;
  cattleType?: CattleType;
  cowName?: string;
  cowId: string;
  cowBreed?: string;
  attemptNumber?: number;
  previousAiRecordId?: string | IAIRecord;
  aiDate: string | Date;
  cowPhotoUrl?: string;
  aiRemarks?: string;
  semenBreed?: string;
  bullName?: string;
  strawCode?: string;
  heatCheckDate?: string | Date;
  heatResult?: HeatResult;
  pdDate?: string | Date;
  pdStatus: PDStatus;
  expectedCalvingDate?: string | Date;
  calvingDate?: string | Date;
  calfPhotoUrl?: string;
  remarks?: string;
  strawStockId?: string | IStrawStock;
  strawsDeducted?: number;
  isDeleted?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IPayment {
  _id: string;
  farmerId: string | IFarmer;
  date: string | Date;
  amount: number;
  note?: string;
  status: "Pending" | "Paid";
  paidDate?: string | Date;
  isDeleted?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IStrawStock {
  _id: string;
  strawTitle: string;
  strawCount: number;
  bullNumber?: string;
  description?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IActivityLog {
  _id: string;
  userId: string | IUser;
  action: string;
  module: "Farmer" | "AIRecord" | "Auth" | "Backup" | "FollowUp" | "Payment" | "StrawStock";
  recordId?: string;
  description: string;
  createdAt: string | Date;
}

export interface DashboardStats {
  totalFarmers: number;
  totalAIRecords: number;
  pdCompleted: number;
  pdPending: number;
  pdOverdue: number;
  totalCalvings: number;
  totalPendingPayment: number;
  pendingPaymentCount: number;
  upcomingFollowUpsCount: number;
  overdueFollowUpsCount: number;
  monthlyAIRegistrations: { month: string; count: number }[];
  villageDistribution: { village: string; count: number }[];
  pdStatusDistribution: { status: string; count: number }[];
  monthlyCalvings: { month: string; count: number }[];
  recentFarmers: IFarmer[];
  recentAIRecords: IAIRecord[];
  upcomingFollowUps: IAIRecord[];
  overdueFollowUps: IAIRecord[];
  recentActivities: IActivityLog[];
}
