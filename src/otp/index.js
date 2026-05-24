import { initOtpSchema } from './schema.js';
import otpRoutes from './routes.js';
import { otpConfig, getPublicOtpConfig } from './config.js';

export { otpConfig, getPublicOtpConfig };
export { validateMobileForRegister, normalizedMobileForRegister } from './registerGuard.js';

export async function initOtpModule() {
  await initOtpSchema();
}

export function mountOtpRoutes(app) {
  app.use('/api/otp', otpRoutes);
}
