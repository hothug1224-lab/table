import rateLimit from 'express-rate-limit';

const build = (windowMs, max, message) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message } }
});

export const apiLimiter   = build(15 * 60_000, 300, 'มีคำขอมากเกินไป กรุณาลองใหม่ภายหลัง');
export const authLimiter  = build(15 * 60_000, 10,  'พยายามเข้าสู่ระบบบ่อยเกินไป รอ 15 นาที');
export const writeLimiter = build(60_000, 30, 'ส่งข้อมูลถี่เกินไป กรุณารอสักครู่');
