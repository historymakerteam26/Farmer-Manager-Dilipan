import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Read .env.local if present
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value.trim();
    }
  });
} catch {}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/farmer_crm";

// Inline schemas for standalone Node execution
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FarmerSchema = new mongoose.Schema(
  {
    farmerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    village: { type: String, required: true },
    address: { type: String },
    notes: { type: String },
    photoUrl: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const AIRecordSchema = new mongoose.Schema(
  {
    aiRecordId: { type: String, required: true, unique: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },
    cowName: { type: String },
    cowId: { type: String, required: true },
    cowBreed: { type: String },
    aiDate: { type: Date, required: true },
    cowPhotoUrl: { type: String },
    semenBreed: { type: String },
    bullName: { type: String },
    strawCode: { type: String },
    heatCheckDate: { type: Date },
    heatResult: { type: String, default: "Not Checked" },
    pdDate: { type: Date },
    pdStatus: { type: String, default: "Pending" },
    calvingDate: { type: Date },
    calfPhotoUrl: { type: String },
    remarks: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    module: { type: String, required: true },
    recordId: { type: String },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Farmer = mongoose.models.Farmer || mongoose.model("Farmer", FarmerSchema);
const AIRecord = mongoose.models.AIRecord || mongoose.model("AIRecord", AIRecordSchema);
const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);

async function seed() {
  console.log("Connecting to MongoDB:", MONGODB_URI.replace(/:([^:@]+)@/, ":****@"));
  await mongoose.connect(MONGODB_URI, { dbName: "farmer_crm" });
  console.log("Connected to MongoDB successfully!");

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash("2002", salt);
  const staffHash = await bcrypt.hash("staff123", salt);

  let admin = await User.findOne({
    $or: [{ email: "gvinsemination@gmail.com" }, { email: "inseminatormuni@gmail.com" }, { email: "admin@farmer.com" }, { username: "@admin" }, { role: "admin" }],
  });
  if (!admin) {
    admin = await User.create({
      name: "Dilipan",
      username: "@admin",
      email: "gvinsemination@gmail.com",
      passwordHash: adminHash,
      role: "admin",
      isActive: true,
    });
    console.log("Created Admin account: Dilipan (@admin / admin4321 / gvinsemination@gmail.com)");
  } else {
    admin.name = "Dilipan";
    admin.email = "gvinsemination@gmail.com";
    admin.username = "@admin";
    admin.passwordHash = adminHash;
    await admin.save();
    console.log("Updated Admin profile: Dilipan (gvinsemination@gmail.com / @admin / PIN: 2002)");
  }

  let staff = await User.findOne({ email: "staff@farmer.com" });
  if (!staff) {
    staff = await User.create({
      name: "Ramesh Sharma (Field Inseminator)",
      email: "staff@farmer.com",
      passwordHash: staffHash,
      role: "staff",
      isActive: true,
    });
    console.log("Created Staff account: staff@farmer.com / staff123");
  }

  const existingFarmerCount = await Farmer.countDocuments();
  if (existingFarmerCount > 0) {
    console.log(`Database already has ${existingFarmerCount} farmers. Seeding complete.`);
    await mongoose.disconnect();
    return;
  }

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
  console.log(`Created ${createdFarmers.length} sample farmers.`);

  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

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
      pdDate: daysAgo(10),
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
      pdDate: daysAhead(10),
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
      pdDate: daysAgo(5),
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
      heatCheckDate: daysAhead(3),
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
      remarks: "Cow returned to heat at 21 days; negative on PD. Advised mineral mixture.",
      isDeleted: false,
    },
  ];

  await AIRecord.insertMany(sampleAIRecords);
  console.log(`Created ${sampleAIRecords.length} sample AI records.`);

  await ActivityLog.create({
    userId: admin._id,
    action: "DATABASE_SEEDED",
    module: "Auth",
    description: "Database seeded with default Indian dairy farmers and AI breeding records.",
  });

  console.log("Seeding complete! You can now log in at http://localhost:3000/login");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
