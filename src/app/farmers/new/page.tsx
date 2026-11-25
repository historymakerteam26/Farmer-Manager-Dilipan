"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FarmerForm } from "@/components/farmers/FarmerForm";

export default function NewFarmerPage() {
  return (
    <AppLayout title="Register New Farmer">
      <FarmerForm />
    </AppLayout>
  );
}
