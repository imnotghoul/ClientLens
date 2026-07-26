const MAX_SOURCE_SIZE = 8_000_000;
const MAX_EDGE = 1600;

export const isAvatarMimeType = (mimeType: string): boolean => ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);

export const avatarFileExtension = (mimeType: string): 'jpg' | 'png' | 'webp' => mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

const resizeToJpeg = async (file: File): Promise<File> => {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();
    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Не удалось обработать изображение.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) throw new Error('Не удалось обработать изображение.');
    return new File([blob], 'avatar.jpg', { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

export const prepareAvatarFile = async (file: File): Promise<File> => {
  if (!isAvatarMimeType(file.type)) throw new Error('Выберите изображение JPG, PNG или WebP. Фото HEIC пока не поддерживается.');
  if (file.size > MAX_SOURCE_SIZE) throw new Error('Фото слишком большое. Выберите файл до 8 МБ.');
  return file.size > 1_500_000 ? resizeToJpeg(file) : file;
};
