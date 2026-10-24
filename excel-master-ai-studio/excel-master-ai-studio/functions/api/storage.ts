interface Env {STUDIO_BUCKET:R2Bucket}
export const onRequestPost: PagesFunction<Env> = async ({request,env})=>{
  // Disabled until Supabase JWT verification and per-user authorization are implemented.
  return Response.json({error:'Storage uploads disabled until authentication is configured'},{status:501});
};
