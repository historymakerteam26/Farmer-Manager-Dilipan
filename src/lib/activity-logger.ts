import ActivityLog from "@/models/ActivityLog";
import connectToDatabase from "./mongodb";

export async function logActivity({
  userId,
  action,
  module,
  recordId,
  description,
}: {
  userId?: string;
  action: string;
  module: "Farmer" | "AIRecord" | "Auth" | "Backup" | "FollowUp" | "Payment" | "StrawStock";
  recordId?: string;
  description: string;
}) {
  try {
    await connectToDatabase();
    await ActivityLog.create({
      userId: userId || null,
      action,
      module,
      recordId: recordId || "",
      description,
    });
  } catch (error) {
    console.error("Failed to record activity log:", error);
  }
}
