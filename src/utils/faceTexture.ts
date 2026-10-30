import * as THREE from 'three';
import type { FaceExpression } from '../types';

export function createFaceTexture(expression: FaceExpression, baseColor: string): THREE.CanvasTexture | null {
  if (expression === 'none') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Fill entire canvas with the squishy's base color (CRITICAL: prevents black/dark transparency artifact)
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 1024, 1024);

  // Center coordinates for face placement (UV: u = 0.5, v = 0.5)
  const centerX = 512;
  const centerY = 500;
  const eyeDistance = 110;
  const eyeY = centerY - 15;

  // Blush color (soft pink/coral translucent)
  const blushColor = 'rgba(255, 110, 135, 0.42)';
  const strokeColor = '#2b2126'; // Warm dark chocolate for cute kawaii lines

  // Draw blush cheeks
  const drawBlush = () => {
    ctx.save();
    ctx.fillStyle = blushColor;
    // Left blush
    ctx.beginPath();
    ctx.ellipse(centerX - eyeDistance - 30, eyeY + 45, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right blush
    ctx.beginPath();
    ctx.ellipse(centerX + eyeDistance + 30, eyeY + 45, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;

  drawBlush();

  switch (expression) {
    case 'happy': {
      // Curved arch eyes ( ^  ^ )
      ctx.beginPath();
      ctx.arc(centerX - eyeDistance, eyeY, 36, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX + eyeDistance, eyeY, 36, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.stroke();

      // Soft happy open smile :D
      ctx.beginPath();
      ctx.arc(centerX, eyeY + 40, 32, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();
      ctx.fillStyle = '#ff6b81';
      ctx.fill();
      break;
    }

    case 'winking': {
      // Left eye: Wink (> shape)
      ctx.beginPath();
      ctx.moveTo(centerX - eyeDistance - 28, eyeY - 18);
      ctx.lineTo(centerX - eyeDistance + 22, eyeY);
      ctx.lineTo(centerX - eyeDistance - 28, eyeY + 18);
      ctx.stroke();

      // Right eye: Big sparkly eye
      ctx.beginPath();
      ctx.arc(centerX + eyeDistance, eyeY, 34, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      // Eye highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX + eyeDistance - 8, eyeY - 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeDistance + 10, eyeY + 8, 6, 0, Math.PI * 2);
      ctx.fill();

      // Cute tongue out blep mouth
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(centerX, eyeY + 30, 22, 0, Math.PI, false);
      ctx.stroke();
      // Tongue
      ctx.fillStyle = '#ff7690';
      ctx.beginPath();
      ctx.ellipse(centerX + 6, eyeY + 48, 16, 20, 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'shocked': {
      // Big round surprised eyes ( O  O )
      ctx.beginPath();
      ctx.arc(centerX - eyeDistance, eyeY, 38, 0, Math.PI * 2);
      ctx.arc(centerX + eyeDistance, eyeY, 38, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();

      // Highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - eyeDistance - 10, eyeY - 10, 14, 0, Math.PI * 2);
      ctx.arc(centerX + eyeDistance - 10, eyeY - 10, 14, 0, Math.PI * 2);
      ctx.fill();

      // Open oval mouth :o
      ctx.beginPath();
      ctx.ellipse(centerX, eyeY + 55, 20, 32, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff7690';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
      break;
    }

    case 'sleepy': {
      // Flat peaceful closed eyes ( -  - )
      ctx.beginPath();
      ctx.moveTo(centerX - eyeDistance - 30, eyeY);
      ctx.lineTo(centerX - eyeDistance + 30, eyeY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + eyeDistance - 30, eyeY);
      ctx.lineTo(centerX + eyeDistance + 30, eyeY);
      ctx.stroke();

      // Tiny sweet smile
      ctx.beginPath();
      ctx.arc(centerX, eyeY + 25, 18, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();

      // Cute 'z Z Z' floating
      ctx.font = 'bold 44px sans-serif';
      ctx.fillStyle = '#7a6b88';
      ctx.fillText('z', centerX + 150, eyeY - 60);
      ctx.font = 'bold 62px sans-serif';
      ctx.fillText('Z', centerX + 195, eyeY - 105);
      break;
    }

    case 'sparkle': {
      // Kawaii Anime Star Eyes ( ✧   ✧ )
      const drawStar = (x: number, y: number, r: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(Math.cos((i * Math.PI) / 2) * r, Math.sin((i * Math.PI) / 2) * r);
          ctx.lineTo(Math.cos((i * Math.PI) / 2 + Math.PI / 4) * (r * 0.35), Math.sin((i * Math.PI) / 2 + Math.PI / 4) * (r * 0.35));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      drawStar(centerX - eyeDistance, eyeY, 48);
      drawStar(centerX + eyeDistance, eyeY, 48);

      // Star sparkles inside
      ctx.fillStyle = '#fff';
      drawStar(centerX - eyeDistance - 8, eyeY - 8, 15);
      drawStar(centerX + eyeDistance - 8, eyeY - 8, 15);

      // Cute cat mouth :3 (ω)
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(centerX - 16, eyeY + 38, 16, 0, Math.PI, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX + 16, eyeY + 38, 16, 0, Math.PI, false);
      ctx.stroke();
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
