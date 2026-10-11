import { NextResponse } from "next/server";
import { getKnowledge } from "../../../chat/knowledge";

/* What the ask panel searches, as JSON.
 *
 * The panel does its searching in the browser, so a question costs nothing to
 * answer and is never sent anywhere. This is the one request it makes, once,
 * the first time it is opened.
 *
 * Five minutes, the same as the spreadsheet feeds it is built from (see
 * app/schedule/agenda.ts): an edit to the sheet reaches the panel when it
 * reaches the pages. */
export const revalidate = 300;

export async function GET() {
  return NextResponse.json(await getKnowledge());
}
