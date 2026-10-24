export default function LoadingProgress() {
  return (
    <main className="student-main" aria-busy="true">
      <h1>Loading progress…</h1>
      <p role="status">
        Reading your recorded activity. Totals are not yet available.
      </p>
    </main>
  );
}
