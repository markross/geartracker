import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireUser, verifyBikeOwnership } from "@/lib/auth";
import { updateComponent, deleteComponent, retireComponent } from "@/lib/components";
import { VALID_COMPONENT_TYPES } from "@/lib/constants";
import type { ComponentUpdate } from "@/lib/types";

interface RouteContext {
  params: { id: string; componentId: string };
}

export async function PUT(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const user = await requireUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: ComponentUpdate = {};

  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updates.name = trimmed;
  }
  if (typeof body.type === "string") {
    if (!VALID_COMPONENT_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "Invalid component type" }, { status: 400 });
    }
    updates.type = body.type;
  }
  if (typeof body.max_distance_km === "number") {
    if (body.max_distance_km <= 0) {
      return NextResponse.json({ error: "max_distance_km must be positive" }, { status: 400 });
    }
    updates.max_distance_km = body.max_distance_km;
  }
  if (typeof body.installed_at === "string" && body.installed_at) {
    updates.installed_at = body.installed_at;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { id: bikeId, componentId } = await params;
  if (!(await verifyBikeOwnership(supabase, bikeId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await updateComponent(supabase, componentId, updates);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ component: data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const user = await requireUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bikeId, componentId } = await params;
  if (!(await verifyBikeOwnership(supabase, bikeId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await deleteComponent(supabase, componentId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const user = await requireUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (body.action !== "retire") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { id: bikeId, componentId } = await params;
  if (!(await verifyBikeOwnership(supabase, bikeId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const retiredAt = (typeof body.retired_at === "string" && body.retired_at) ? body.retired_at : new Date().toISOString();
  const { data, error } = await retireComponent(supabase, componentId, retiredAt);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ component: data });
}
