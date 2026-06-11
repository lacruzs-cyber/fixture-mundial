import { getAllMatches } from "../../../lib/footballData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const matches = await getAllMatches();
    return Response.json({ matches });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
