import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicSupabaseEnv } from '@/lib/env';
export async function createSupabaseServerClient(){const cookieStore=await cookies();const {supabaseUrl,supabaseAnonKey}=getPublicSupabaseEnv();return createServerClient(supabaseUrl,supabaseAnonKey,{cookies:{getAll(){return cookieStore.getAll()},setAll(cookiesToSet){try{cookiesToSet.forEach(({name,value,options})=>cookieStore.set(name,value,options))}catch{}}}})}
