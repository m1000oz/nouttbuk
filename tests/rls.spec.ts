// Suite de integración contra el stack local de Supabase (`supabase start`).
// A diferencia de las pruebas pgTAP (supabase/tests/database), esta usa
// supabase-js real: signUp, signInWithPassword y sesiones por usuario, el
// camino que de verdad recorrerá la app.
//
// Requiere las variables de entorno de .env.local (ver .env.example)
// apuntando al stack local. Si no están presentes, la suite se salta en vez
// de fallar, para no romper `npm test` en un entorno sin Docker.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/types/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasLocalStack = Boolean(SUPABASE_URL && ANON_KEY && SERVICE_ROLE_KEY);

async function crearUsuarioConfirmado(
  admin: SupabaseClient<Database>,
  email: string,
) {
  const password = "contraseña-de-prueba-123";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  const client = createClient<Database>(SUPABASE_URL!, ANON_KEY!);
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  return { id: data.user!.id, client };
}

describe.skipIf(!hasLocalStack)("Matriz de RLS contra el stack local", () => {
  let admin: SupabaseClient<Database>;
  const usuariosCreados: string[] = [];

  beforeAll(() => {
    admin = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);
  });

  afterAll(async () => {
    for (const id of usuariosCreados) {
      await admin.auth.admin.deleteUser(id);
    }
  });

  it("rechaza el signup con un correo que no es institucional", async () => {
    const anon = createClient<Database>(SUPABASE_URL!, ANON_KEY!);
    const { error } = await anon.auth.signUp({
      email: `rechazado-${Date.now()}@gmail.com`,
      password: "contraseña-de-prueba-123",
    });

    expect(error).not.toBeNull();
  });

  it("crea la fila de profiles al registrarse con correo institucional", async () => {
    const email = `estudiante-${Date.now()}@pucp.edu.pe`;
    const { id, client } = await crearUsuarioConfirmado(admin, email);
    usuariosCreados.push(id);

    const { data, error } = await client
      .from("profiles")
      .select("universidad")
      .eq("id", id)
      .single();

    expect(error).toBeNull();
    expect(data?.universidad).toBe("Pontificia Universidad Católica del Perú");
  });

  it("aplica la matriz de visibilidad private/group/community", async () => {
    const sufijo = Date.now();
    const dueno = await crearUsuarioConfirmado(admin, `dueno-${sufijo}@pucp.edu.pe`);
    const colaborador = await crearUsuarioConfirmado(
      admin,
      `colaborador-${sufijo}@pucp.edu.pe`,
    );
    const otro = await crearUsuarioConfirmado(admin, `otro-${sufijo}@pucp.edu.pe`);
    usuariosCreados.push(dueno.id, colaborador.id, otro.id);

    const { data: privado } = await dueno.client
      .from("apuntes")
      .insert({ titulo: "Privado", autor_id: dueno.id, visibilidad: "private" })
      .select("id")
      .single();
    const { data: grupo } = await dueno.client
      .from("apuntes")
      .insert({ titulo: "Grupo", autor_id: dueno.id, visibilidad: "group" })
      .select("id")
      .single();
    const { data: comunidad } = await dueno.client
      .from("apuntes")
      .insert({ titulo: "Comunidad", autor_id: dueno.id, visibilidad: "community" })
      .select("id")
      .single();

    await dueno.client.from("colaboradores").insert({
      apunte_id: grupo!.id,
      perfil_id: colaborador.id,
      permiso: "read",
    });

    const anon = createClient<Database>(SUPABASE_URL!, ANON_KEY!);
    const { data: vistoPorAnon } = await anon.from("apuntes").select("id");
    expect(vistoPorAnon).toHaveLength(1);
    expect(vistoPorAnon?.[0]?.id).toBe(comunidad!.id);

    const { data: vistoPorOtro } = await otro.client.from("apuntes").select("id");
    expect(vistoPorOtro).toHaveLength(1);

    const { data: vistoPorColaborador } = await colaborador.client
      .from("apuntes")
      .select("id");
    expect(vistoPorColaborador).toHaveLength(2);
    expect(vistoPorColaborador?.some((a) => a.id === privado!.id)).toBe(false);

    const { data: vistoPorDueno } = await dueno.client.from("apuntes").select("id");
    expect(vistoPorDueno).toHaveLength(3);
  });
});
