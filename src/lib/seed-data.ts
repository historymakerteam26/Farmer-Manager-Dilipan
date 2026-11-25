import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Farmer from "@/models/Farmer";
import AIRecord from "@/models/AIRecord";
import ActivityLog from "@/models/ActivityLog";
import { hashPassword } from "@/lib/auth";

export async function runDatabaseSeed() {
  await connectToDatabase();

  // 1. Ensure Admin and Staff exist
  const adminPasswordHash = await hashPassword("2002");
  const staffPasswordHash = await hashPassword("staff123");

  let admin = await User.findOne({
    $or: [{ email: "gvinsemination@gmail.com" }, { email: "inseminatormuni@gmail.com" }, { email: "admin@farmer.com" }, { username: "@admin" }, { role: "admin" }],
  });
  if (!admin) {
    admin = await User.create({
      name: "Dilipan",
      username: "@admin",
      email: "gvinsemination@gmail.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      isActive: true,
    });
  } else {
    admin.name = "Dilipan";
    admin.email = "gvinsemination@gmail.com";
    admin.username = "@admin";
    admin.passwordHash = adminPasswordHash;
    await admin.save();
  }

  let staff = await User.findOne({ email: "staff@farmer.com" });
  if (!staff) {
    staff = await User.create({
      name: "Ramesh Sharma (Field Inseminator)",
      email: "staff@farmer.com",
      passwordHash: staffPasswordHash,
      role: "staff",
      isActive: true,
    });
  }

  // 2. Check if Farmers already exist
  const existingFarmerCount = await Farmer.countDocuments();
  if (existingFarmerCount > 0) {
    return {
      message: "Database already contains farmers and records. Default accounts verified.",
      admin: admin.email,
      staff: staff.email,
    };
  }

  // 3. Create Seed Farmers (realistic Indian dairy farmers)
  const sampleFarmers = [
    {
      farmerId: "FRM-2511-001-4192",
      name: "Suresh Baburao Patil",
      mobile: "9822014589",
      village: "Khandala",
      address: "Gat No 142, Post Khandala, Taluka Shirur",
      notes: "Progressive dairy farmer, maintains 8 HF crossbreds and 3 Murrah buffaloes.",
      photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400",
      createdBy: admin._id,
      isDeleted: false,
    },
    {
      farmerId: "FRM-2511-002-8321",
      name: "Dnyaneshwar M. Shinde",
      mobile: "9421098234",
      village: "Manchar",
      address: "Near Datta Mandir, Manchar",
      notes: "Participating in indigenous Gir breed conservation program.",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      createdBy: staff._id,
      isDeleted: false,
    },
    {
      farmerId: "FRM-2511-003-5510",
      name: "Sunita Ashok Gaikwad",
      mobile: "9766554432",
      village: "Narayangaon",
      address: "Shivaji Chowk, Narayangaon",
      notes: "Women dairy entrepreneur, supplies 90 liters daily to cooperative.",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      createdBy: staff._id,
      isDeleted: false,
    },
    {
      farmerId: "FRM-2511-004-9274",
      name: "Hanumant Rao Kadam",
      mobile: "9923487123",
      village: "Alephata",
      address: "Bori Road, Alephata",
      notes: "Prefers Jersey sexed semen for higher female ratio.",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
      createdBy: admin._id,
      isDeleted: false,
    },
    {
      farmerId: "FRM-2511-005-3819",
      name: "Balasaheb Ramchandra Thorat",
      mobile: "9890123456",
      village: "Khandala",
      address: "Thorat Vasti, Khandala",
      notes: "Owns 4 crossbred cows with automated milking machines.",
      photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
      createdBy: staff._id,
      isDeleted: false,
    },
  ];

  const createdFarmers = await Farmer.insertMany(sampleFarmers);

  // 4. Create Sample AI Records
  // Dates: recent AI dates, heat checks (21 days), PD dates (60-90 days), calving dates (280 days)
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const sampleAIRecords = [
    {
      aiRecordId: "AI-2511-001-1029",
      farmerId: createdFarmers[0]._id,
      cowName: "Gauri",
      cowId: "IN-MH-100293",
      cowBreed: "HF Crossbred",
      aiDate: daysAgo(75),
      cowPhotoUrl: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600",
      semenBreed: "Holstein Friesian",
      bullName: "ABS Supercharge",
      strawCode: "HF-IND-8921",
      heatCheckDate: daysAgo(54),
      heatResult: "No Heat",
      pdDate: daysAgo(10), // Overdue or past check
      pdStatus: "Pregnant",
      calvingDate: daysAhead(205),
      remarks: "Right horn pregnancy confirmed by rectal examination. High milk potential expected.",
      isDeleted: false,
    },
    {
      aiRecordId: "AI-2511-002-2384",
      farmerId: createdFarmers[0]._id,
      cowName: "Laxmi",
      cowId: "IN-MH-100294",
      cowBreed: "Murrah Buffalo",
      aiDate: daysAgo(50),
      cowPhotoUrl: "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&q=80&w=600",
      semenBreed: "Murrah",
      bullName: "Mehsana Star",
      strawCode: "MUR-7729",
      heatCheckDate: daysAgo(29),
      heatResult: "No Heat",
      pdDate: daysAhead(10), // Upcoming PD check
      pdStatus: "Pending",
      remarks: "2nd lactation buffalo, good feed intake, PD check scheduled next week.",
      isDeleted: false,
    },
    {
      aiRecordId: "AI-2511-003-8841",
      farmerId: createdFarmers[1]._id,
      cowName: "Kapila",
      cowId: "IN-MH-203811",
      cowBreed: "Gir",
      aiDate: daysAgo(95),
      cowPhotoUrl: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&q=80&w=600",
      semenBreed: "Gir Purebred",
      bullName: "Bhavnagar Maharaja",
      strawCode: "GIR-5521",
      heatCheckDate: daysAgo(74),
      heatResult: "No Heat",
      pdDate: daysAgo(5), // Overdue PD
      pdStatus: "Pending",
      remarks: "Farmer requested call before visit. Pending PD overdue by 5 days.",
      isDeleted: false,
    },
    {
      aiRecordId: "AI-2511-004-4412",
      farmerId: createdFarmers[2]._id,
      cowName: "Radha",
      cowId: "IN-MH-338291",
      cowBreed: "Jersey Cross",
      aiDate: daysAgo(290),
      cowPhotoUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=600",
      semenBreed: "Jersey Sexed",
      bullName: "Dairyman Champion",
      strawCode: "JSY-SX-12",
      heatCheckDate: daysAgo(269),
      heatResult: "No Heat",
      pdDate: daysAgo(200),
      pdStatus: "Pregnant",
      calvingDate: daysAgo(5),
      calfPhotoUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=600",
      remarks: "Successful calving! Delivered healthy female calf weighing 28 kg.",
      isDeleted: false,
    },
    {
      aiRecordId: "AI-2511-005-7721",
      farmerId: createdFarmers[3]._id,
      cowName: "Sita",
      cowId: "IN-MH-449102",
      cowBreed: "Jersey Cross",
      aiDate: daysAgo(18),
      cowPhotoUrl: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600",
      semenBreed: "Jersey",
      bullName: "Red Gold 4",
      strawCode: "JSY-0092",
      heatCheckDate: daysAhead(3), // Heat check in 3 days
      heatResult: "Not Checked",
      pdDate: daysAhead(42),
      pdStatus: "Pending",
      remarks: "Heat check reminder required around 21st day post insemination.",
      isDeleted: false,
    },
    {
      aiRecordId: "AI-2511-006-9932",
      farmerId: createdFarmers[4]._id,
      cowName: "Kasturi",
      cowId: "IN-MH-552019",
      cowBreed: "HF Crossbred",
      aiDate: daysAgo(110),
      cowPhotoUrl: "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&q=80&w=600",
      semenBreed: "HF",
      bullName: "Silver Top",
      strawCode: "HF-9901",
      heatCheckDate: daysAgo(89),
      heatResult: "Heat Detected",
      pdDate: daysAgo(20),
      pdStatus: "Not Pregnant",
      remarks: "Cow returned to heat at 21 days; negative on PD. Advised mineral mixture and repeat AI on next cycle.",
      isDeleted: false,
    },
  ];

  await AIRecord.insertMany(sampleAIRecords);

  // 5. Activity Logs
  await ActivityLog.insertMany([
    {
      userId: admin._id,
      action: "INITIAL_SETUP",
      module: "Auth",
      description: "Initialized Farmer Manager CRM system with Administrator role.",
    },
    {
      userId: staff._id,
      action: "REGISTER_FARMER",
      module: "Farmer",
      recordId: createdFarmers[0].farmerId,
      description: `Registered new farmer: ${createdFarmers[0].name} (${createdFarmers[0].village})`,
    },
    {
      userId: staff._id,
      action: "CREATE_AI_RECORD",
      module: "AIRecord",
      recordId: sampleAIRecords[0].aiRecordId,
      description: `Inseminated cow '${sampleAIRecords[0].cowName}' with ${sampleAIRecords[0].bullName} straw.`,
    },
  ]);

  return {
    success: true,
    message: "Sample data seeded successfully!",
    adminEmail: admin.email,
    staffEmail: staff.email,
    farmersCount: sampleFarmers.length,
    aiRecordsCount: sampleAIRecords.length,
  };
}
