import Link from "next/link";
export default function ForgotPassword() {
  return (
    <>
      <h1>Password recovery</h1>
      <p className="section-copy" role="status">
        Password recovery is unavailable in this demo. Live email delivery has
        not been configured. Your password cannot be reset through this page
        yet.
      </p>
      <Link className="button" href="/login">
        Back to sign in
      </Link>
    </>
  );
}
