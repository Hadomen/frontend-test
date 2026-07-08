import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-semibold">
          登録フォーム
        </Link>
      </nav>
    </header>
  );
}
