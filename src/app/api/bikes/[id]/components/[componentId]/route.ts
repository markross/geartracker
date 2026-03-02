import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateComponent, deleteComponent, retireComponent } from "@/lib/components";
import type { ComponentUpdate, ComponentType } from "@/lib/types";

const VALID_TYPES: ComponentType[] = [
  "chain", "cassette", "chainring", "tire_front", "tire_rear",
  "brake_pads", "cables", "bar_tape", "custom",
];

interface RouteContext {
  params: { id: string; componentId: string };
}

export async function PUT(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: ComponentUpdate = {};

  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.type === "string") {
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "Invalid component type" }, { status: 400 });
    }
    updates.type = body.type;
  }
  if (typeof body.max_distance_km === "number") updates.max_distance_km = body.max_distance_km;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { componentId } = await params;
  const { data, error } = await updateComponent(supabase, componentId, updates);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ component: data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { componentId } = await params;
  const { error } = await deleteComponent(supabase, componentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action !== "retire") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { componentId } = await params;
  const { data, error } = await retireComponent(supabase, componentId, new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ component: data });
}