import { NextResponse } from "next/server";

/* The sign-up endpoint.
 *
 * It deliberately does NOT accept an address when there is nowhere to put it.
 * A form that says "thanks, you're subscribed" and drops the address on the
 * floor is worse than one that admits it is not live: people believe it, do
 * not sign up again, and nobody finds out until the mailing list turns out to
 * be empty. So with no provider configured this answers 503 and the footer
 * says so in as many words.
 *
 * TO GO LIVE: set SUBSCRIBE_ENDPOINT to the provider's URL — Mailchimp,
 * Buttondown, a Google Form, an internal handler, whatever the team uses — and
 * SUBSCRIBE_TOKEN if it needs an Authorization header. Nothing else here needs
 * to change. If the provider wants a different body shape, that is the one
 * thing to adjust below.
 */

/* Good enough for a sign-up box: something, an @, something, a dot, a TLD. The
   real check is the confirmation email — no regex settles whether an address
   exists, and the aggressive ones reject valid addresses. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Longer than this is not an address anyone owns. */
const MAX_LENGTH = 254;

export async function POST(request: Request) {
  let email = "";
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "email" in body) {
      const value = (body as { email: unknown }).email;
      if (typeof value === "string") email = value.trim();
    }
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  if (!email || email.length > MAX_LENGTH || !LOOKS_LIKE_EMAIL.test(email)) {
    return NextResponse.json(
      { error: "That does not look like an email address." },
      { status: 400 },
    );
  }

  const endpoint = process.env.SUBSCRIBE_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json(
      { error: "Sign-up is not connected yet — nothing was saved." },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SUBSCRIBE_TOKEN
          ? { authorization: `Bearer ${process.env.SUBSCRIBE_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ email }),
    });

    if (!upstream.ok) {
      // The provider's own message is for us, not for the person signing up.
      console.error(
        `subscribe: ${endpoint} answered ${upstream.status} ${upstream.statusText}`,
      );
      return NextResponse.json(
        { error: "Could not sign you up just now. Please try again." },
        { status: 502 },
      );
    }
  } catch (cause) {
    console.error("subscribe: could not reach the provider", cause);
    return NextResponse.json(
      { error: "Could not sign you up just now. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
