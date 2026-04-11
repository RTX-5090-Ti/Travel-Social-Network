export default function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen px-6 place-items-center bg-zinc-50 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))]">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98))] dark:shadow-[0_16px_36px_rgba(2,6,23,0.24)]">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-white/10 dark:border-t-zinc-100" />

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Đang kiểm tra phiên đăng nhập
        </h2>

        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Vui lòng chờ một chút...
        </p>
      </div>
    </div>
  );
}
