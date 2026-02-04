import { supabase } from "./supabaseClient.js";
import { getSession } from "./auth.js";

// 🔐 Allowed Elyra staff emails
const ALLOWED_EMAILS = [
  "glamoursocietymodelingagency@gmail.com",
  "100kabusinessinquires@gmail.com",
  "kalmond30@yahoo.com"
].map(e => String(e).toLowerCase().trim());

export async function requireOrganizer(){
  const session = await getSession();
  if(!session) throw new Error("Please log in.");

  const email = String(session.user.email || "").toLowerCase().trim();
  if(!ALLOWED_EMAILS.includes(email)) throw new Error("Access denied.");

  const userId = session.user.id;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if(error) throw error;
  if(!data || !["organizer","admin"].includes(data.role)) throw new Error("Access denied.");

  return true;
}

export async function createContest(payload){
  await requireOrganizer();

  const clean = {
    slug: String(payload.slug || "").trim(),
    title: String(payload.title || "").trim(),
    subtitle: payload.subtitle ? String(payload.subtitle).trim() : null,
    hero_image_url: payload.hero_image_url ? String(payload.hero_image_url).trim() : null,
    status: payload.status || "draft"
  };

  const { error } = await supabase.from("contests").insert(clean);
  if(error) throw error;
  return true;
}

export async function createContestant(payload){
  await requireOrganizer();

  const clean = {
    contest_id: payload.contest_id,
    display_name: String(payload.display_name || "").trim(),
    bio: payload.bio ? String(payload.bio).trim() : null,
    photo_url: payload.photo_url ? String(payload.photo_url).trim() : null,
    is_published: !!payload.is_published
  };

  const { error } = await supabase.from("contestants").insert(clean);
  if(error) throw error;
  return true;
}

export async function listMyContests(){
  await requireOrganizer();

  // If your RLS only allows organizer/admin to read all contests, this will work.
  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, status, created_at")
    .order("created_at", { ascending: false });

  if(error) throw error;
  return data || [];
}
