// Preview media and music live in Supabase Storage. Telegram fetches each file
// from its public URL once; after that the cached file id is reused.
import { cachedFileId, rememberFileId, publicUrl } from './db.js';

export async function mediaRef(env, bucket, path) {
  return (await cachedFileId(env, `${bucket}/${path}`)) || publicUrl(env, bucket, path);
}

// Remember the file id Telegram gave back, so the next send is instant.
export async function remember(env, bucket, path, response, kind) {
  try {
    if (!response || !response.ok || !response.result) return;
    const r = response.result;
    const id =
      kind === 'video' ? r.video && r.video.file_id
      : kind === 'audio' ? r.audio && r.audio.file_id
      : r.photo && r.photo.length ? r.photo[r.photo.length - 1].file_id
      : null;
    if (id) await rememberFileId(env, `${bucket}/${path}`, id);
  } catch (e) {
    console.error('remember file id failed:', e && e.message);
  }
}
