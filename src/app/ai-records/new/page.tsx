"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { AIRecordForm } from "@/components/ai-records/AIRecordForm";

function NewAIRecordContent() {
  const searchParams = useSearchParams();
  const farmerId = searchParams.get("farmerId") || undefined;
  const cowId = searchParams.get("cowId") || undefined;
  const cowName = searchParams.get("cowName") || undefined;
  const cattleType = (searchParams.get("cattleType") as any) || undefined;
  const cowBreed = searchParams.get("cowBreed") || undefined;
  const cowPhotoUrl = searchParams.get("cowPhotoUrl") || undefined;
  const attemptNumberParam = searchParams.get("attemptNumber");
  const attemptNumber = attemptNumberParam ? parseInt(attemptNumberParam, 10) : undefined;
  const previousAiRecordId = searchParams.get("prevId") || undefined;

  return (
    <AIRecordForm
      initialFarmerId={farmerId}
      initialCowId={cowId}
      initialCowName={cowName}
      initialCattleType={cattleType}
      initialCowBreed={cowBreed}
      initialCowPhotoUrl={cowPhotoUrl}
      initialAttemptNumber={attemptNumber}
      initialPreviousAiRecordId={previousAiRecordId}
    />
  );
}

export default function NewAIRecordPage() {
  return (
    <AppLayout title="Register Cow Insemination (AI)">
      <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading form...</div>}>
        <NewAIRecordContent />
      </Suspense>
    </AppLayout>
  );
}
