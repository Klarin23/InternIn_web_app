import Link from "next/link";

/**
 * Logo adaptatif clair / sombre.
 * S'appuie sur la classe `dark` du <html> (useThemeStore).
 */
export default function SiteLogo({
  href = "/",
  className = "h-9 w-auto",
  priority = false,
}) {
  return (
    <Link href={href} className="flex items-center">
      {/* Mode clair */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo.svg"
        alt="InternIn"
        className={`${className} dark:hidden`}
      />
      {/* Mode sombre */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo-dark.svg"
        alt="InternIn"
        className={`${className} hidden dark:block`}
      />
    </Link>
  );
}
