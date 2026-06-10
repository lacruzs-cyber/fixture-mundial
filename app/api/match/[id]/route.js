import { getMatchDetail } from "../../../../lib/footballApi";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const id = params.id;
  if (!id || !/^\d+$/.test(id)) {
    return Response.json({ error: "id de partido invalido" }, { status: 400 });
  }

  try {
    const data = await getMatchDetail(id);
    if (!data.fixture) {
      return Response.json({ error: "Partido no encontrado" }, { status: 404 });
    }
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
