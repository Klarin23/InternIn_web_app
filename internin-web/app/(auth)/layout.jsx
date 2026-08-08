import BrandPanel from "@/components/features/auth/BrandPanel";

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-105">
          {/* Logo affiché uniquement sur mobile (le panneau de marque est masqué en dessous de lg) */}
          <div className="mb-7 text-xl font-extrabold text-foreground lg:hidden">
            Intern<span className="text-primary">In</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
