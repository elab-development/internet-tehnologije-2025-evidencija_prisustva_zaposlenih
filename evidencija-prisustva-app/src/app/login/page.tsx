export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        {/* Logo i tekst */}
        <div className="flex items-center justify-between mb-4">
            <img src="/logo-tamni.png" alt="FON logo" className="h-10 w-auto" />
            <span className="text-sm text-[color:var(--color-secondary-75)]">Fakultetski servis FON-a</span>
        </div>

        <h1 className="text-2xl font-sans font-extrabold text-text mb-6 text-center">
          Evidencija prisustva
        </h1>

        <form className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-sans text-text mb-1">
              Email
            </label>
            <input type="email" placeholder="ime.prezime.xxxx@fon.bg.ac.rs" className="w-full rounded-md border border-primary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-sans text-text mb-1">
              Lozinka
            </label>
            <input type="password" placeholder="••••••••" className="w-full rounded-md border border-secondary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2" />
          </div>

          <div>
            <hr className="w-full h-[1.5px] bg-[color:var(--color-secondary-600)] border-0 my-6 rounded-md" />
          </div>

          {/* Button */}
          <button type="submit" className="w-full bg-[color:var(--color-primary-900)] hover:bg-[var(--color-secondary-700)] font-sans text-white rounded-md py-2 rounded-md font-medium transition duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            Prijavi se
          </button>
        </form>

      </div>
    </div>
  );
}