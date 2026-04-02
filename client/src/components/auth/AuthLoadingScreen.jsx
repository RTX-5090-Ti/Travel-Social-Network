export default function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen px-6 place-items-center bg-zinc-50">
      <div className="flex flex-col items-center w-full max-w-sm p-8 bg-white border shadow-sm rounded-3xl border-zinc-200">
        <div className="w-12 h-12 mb-4 border-4 rounded-full animate-spin border-zinc-200 border-t-zinc-900" />

        <h2 className="text-lg font-semibold text-zinc-900">
          Đang kiểm tra phiên đăng nhập
        </h2>

        <p className="mt-2 text-sm text-center text-zinc-500">
          Vui lòng chờ một chút...
        </p>
      </div>
    </div>
  );
}
