import { buildPasswordChangedEmail } from './password-changed-email';

describe('buildPasswordChangedEmail', () => {
  const data = {
    name: 'Sara',
    logoUrl: 'https://app.qistak.com/qistak-512.png',
    appName: 'Qistak',
  };

  it('greets the user by name', () => {
    expect(buildPasswordChangedEmail(data).html).toContain('Hi Sara');
  });

  it('includes a security warning to act if this wasn\'t them', () => {
    expect(buildPasswordChangedEmail(data).html).toContain("wasn't you");
  });

  it('builds a clear subject line', () => {
    expect(buildPasswordChangedEmail(data).subject).toBe('Your Qistak password was changed');
  });
});
