import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export async function exportCertificateImage(ref: View) {
  try {
    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      height: 1920,
      width: 1080, // ~9:16 story ratio; high resolution for crisp typography
    });
    return uri;
  } catch {
    return null;
  }
}
