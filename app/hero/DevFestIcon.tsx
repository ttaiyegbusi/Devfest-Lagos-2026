/* The four-colour icon mark, and the icon on its own.

   The path data lives here and nowhere else. DevFestLogo draws the same four
   paths inside the full lockup's viewBox, and the footer watermark draws them
   beside a wordmark it sets as type — so a change to the mark has one place to
   land rather than two that can quietly drift apart. */
export function MarkPaths() {
  return (
    <>
    <path d="M9.39159 2.18694L2.58308 7.0794C1.15648 8.10452 0.831018 10.092 1.85613 11.5186L1.85987 11.5238C2.88498 12.9505 4.87248 13.2759 6.29907 12.2508L13.1076 7.35835C14.5342 6.33322 14.8596 4.3457 13.8345 2.9191L13.8308 2.9139C12.8057 1.48729 10.8182 1.16182 9.39159 2.18694Z" fill="#EA4335" stroke="#1E1E1E" strokeWidth="0.347327" strokeMiterlimit="10" />
    <path d="M1.86035 7.80623L1.85662 7.81143C0.831506 9.23804 1.15697 11.2256 2.58357 12.2507L9.39208 17.1431C10.8187 18.1683 12.8062 17.8428 13.8313 16.4162L13.835 16.411C14.8601 14.9844 14.5347 12.9969 13.1081 11.9717L6.29956 7.07928C4.87297 6.05415 2.88547 6.37962 1.86035 7.80623Z" fill="#4285F4" stroke="#1E1E1E" strokeWidth="0.347327" strokeMiterlimit="10" />
    <path d="M25.8286 7.07561L19.0201 11.9681C17.5935 12.9932 17.268 14.9807 18.2931 16.4073L18.2969 16.4125C19.322 17.8391 21.3095 18.1646 22.7361 17.1395L29.5446 12.247C30.9712 11.2219 31.2967 9.23438 30.2715 7.80777L30.2678 7.80257C29.2427 6.37596 27.2552 6.05049 25.8286 7.07561Z" fill="#F9AB00" stroke="#1E1E1E" strokeWidth="0.347327" strokeMiterlimit="10" />
    <path d="M18.2959 2.91561L18.2922 2.9208C17.2671 4.34741 17.5925 6.33493 19.0191 7.36005L25.8276 12.2525C27.2542 13.2776 29.2417 12.9522 30.2668 11.5256L30.2706 11.5204C31.2957 10.0937 30.9702 8.10623 29.5436 7.08111L22.7351 2.18865C21.3085 1.16353 19.321 1.489 18.2959 2.91561Z" fill="#34A853" stroke="#1E1E1E" strokeWidth="0.347327" strokeMiterlimit="10" />
    </>
  );
}

/* The mark alone, in a viewBox cropped to it. The footer watermark needs the
   icon without the lockup's built-in lettering. */
export function DevFestIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="1.5 1.6 29.2 16.2"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <MarkPaths />
    </svg>
  );
}
