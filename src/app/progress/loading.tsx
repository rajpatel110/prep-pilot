import { StudentShell } from "@/shared/ui/student-shell";
import { ProgressSkeleton } from "@/modules/planning/ui/progress-skeleton";
export default function LoadingProgress() {
  return (
    <StudentShell name="">
      <h1>Loading progress…</h1>
      <ProgressSkeleton />
    </StudentShell>
  );
}
