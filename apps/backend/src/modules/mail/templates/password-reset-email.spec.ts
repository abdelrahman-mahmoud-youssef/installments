import { buildPasswordResetEmail } from './password-reset-email';

describe('buildPasswordResetEmail', () => {
  const data = {
    name: 'Sara',
    resetUrl: 'https://app.qistak.com/reset-password?token=abc123',
    logoUrl: 'https://app.qistak.com/qistak-512.png',
    appName: 'Qistak',
    expiryMinutes: 30,
  };

  it('includes the reset link', () => {
    expect(buildPasswordResetEmail(data).html).toContain(data.resetUrl);
  });

  it('greets the user by name', () => {
    expect(buildPasswordResetEmail(data).html).toContain('Hi Sara');
  });

  it('states the expiry window', () => {
    expect(buildPasswordResetEmail(data).html).toContain('30 minutes');
  });

  it('includes the logo', () => {
    expect(buildPasswordResetEmail(data).html).toContain(data.logoUrl);
  });

  it('builds a clear subject line', () => {
    expect(buildPasswordResetEmail(data).subject).toBe('Reset your Qistak password');
  });
});
