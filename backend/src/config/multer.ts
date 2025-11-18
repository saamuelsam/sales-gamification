import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Diretório para uploads
const uploadDir = path.join(__dirname, '../../uploads/avatars');

// Garantir que o diretório existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único com timestamp e hash
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

// Filtro de tipo de arquivo
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem inválido. Use: JPEG, PNG, GIF ou WebP'));
  }
};

// Configuração do multer
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Função para deletar avatar antigo
export const deleteOldAvatar = (avatarUrl: string) => {
  if (!avatarUrl) return;
  
  try {
    // Extrair nome do arquivo da URL
    const filename = avatarUrl.split('/').pop();
    if (!filename) return;
    
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Avatar antigo deletado: ${filename}`);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar avatar antigo:', error);
  }
};
