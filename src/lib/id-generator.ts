import connectToDatabase from "./mongodb";
import Farmer from "@/models/Farmer";
import AIRecord from "@/models/AIRecord";

export async function generateUniqueFarmerId(): Promise<string> {
  await connectToDatabase();
  const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // e.g. 2511
  const count = await Farmer.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const candidate = `FRM-${dateStr}-${(count + 1).toString().padStart(3, "0")}-${randomSuffix}`;
  return candidate;
}

export async function generateUniqueAIRecordId(): Promise<string> {
  await connectToDatabase();
  const dateStr = new Date().toISOString().slice(2, 7).replace("-", "");
  const count = await AIRecord.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const candidate = `AI-${dateStr}-${(count + 1).toString().padStart(3, "0")}-${randomSuffix}`;
  return candidate;
}
