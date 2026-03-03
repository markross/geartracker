import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireUser, verifyBikeOwnership } from "@/lib/auth";
import { getComponents, createComponent } from "@/lib/components";
import { VALID_COMPONENT_TYPES } from "@/lib/constants";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const user = await requireUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bikeId } = await params;
  if (!(await verifyBikeOwnership(supabase, bikeId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await getComponents(supabase, bikeId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ components: data });
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const user = await requireUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, max_distance_km } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!type || !VALID_COMPONENT_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid component type" }, { status: 400 });
  }

  if (typeof max_distance_km !== "number" || max_distance_km <= 0) {
    return NextResponse.json({ error: "max_distance_km must be a positive number" }, { status: 400 });
  }

  const { id: bikeId } = await params;
  if (!(await verifyBikeOwnership(supabase, bikeId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await createComponent(supabase, {
    bike_id: bikeId,
    name: name.trim(),
    type,
    max_distance_km,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ component: data }, { status: 201 });
}
