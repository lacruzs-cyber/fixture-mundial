import { getMatchesByDate } from "../../../lib/theSportsDb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Parametro 'date' invalido (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const matches = await getMatchesByDate(date);
    return Response.json({ date, matches });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
