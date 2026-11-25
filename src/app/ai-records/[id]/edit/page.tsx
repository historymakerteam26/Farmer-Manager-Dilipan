"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "../../../../components/layout/AppLayout";
import { AIRecordForm } from "../../../../components/ai-records/AIRecordForm";
import { IAIRecord } from "../../../../types";

export default function EditAIRecordPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<IAIRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await fetch(`/api/ai-records/${id}`);
        if (!res.ok) {
          router.push("/ai-records");
          return;
        }
        const data = await res.json();
        setRecord(data.record);
      } catch {
        router.push("/ai-records");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecord();
  }, [id, router]);

  if (isLoading || !record) {
    return (
      <AppLayout title="Edit AI Record">
        <div className="py-20 text-center text-xs text-slate-500 font-semibold animate-pulse">
          Loading AI record data...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Edit AI Record: ${record.aiRecordId}`}>
      <AIRecordForm initialData={record} isEdit={true} />
    </AppLayout>
  );
}
