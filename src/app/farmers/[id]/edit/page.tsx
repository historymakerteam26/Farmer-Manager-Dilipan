"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "../../../../components/layout/AppLayout";
import { FarmerForm } from "../../../../components/farmers/FarmerForm";
import { IFarmer } from "../../../../types";

export default function EditFarmerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [farmer, setFarmer] = useState<IFarmer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const res = await fetch(`/api/farmers/${id}`);
        if (!res.ok) {
          router.push("/farmers");
          return;
        }
        const data = await res.json();
        setFarmer(data.farmer);
      } catch {
        router.push("/farmers");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFarmer();
  }, [id, router]);

  if (isLoading || !farmer) {
    return (
      <AppLayout title="Edit Farmer">
        <div className="py-20 text-center text-xs text-slate-500 font-semibold animate-pulse">
          Loading farmer data...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Edit Farmer: ${farmer.name}`}>
      <FarmerForm initialData={farmer} isEdit={true} />
    </AppLayout>
  );
}
