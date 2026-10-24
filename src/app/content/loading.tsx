export default function LoadingContent() {
  return (
    <main id="main-content" className="student-main" aria-busy="true">
      <h1>Loading content library</h1>
      <div className="student-skeleton" role="status">
        Loading reviewed content…
      </div>
    </main>
  );
}
