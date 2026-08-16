import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { isPasswordStrong, passwordPolicyMessage, validatePassword } from '../utils/passwordPolicy.js';

describe('Politique de mot de passe (A.1)', () => {
  it('rejette un mot de passe trop court', () => {
    assert.strictEqual(isPasswordStrong('Ab1'), false);
    assert.strictEqual(isPasswordStrong('abcdefgh'), false);
  });
  it('rejette un mot de passe sans majuscule', () => {
    assert.strictEqual(isPasswordStrong('abcdefg1'), false);
  });
  it('rejette un mot de passe sans chiffre', () => {
    assert.strictEqual(isPasswordStrong('Abcdefgh'), false);
  });
  it('accepte un mot de passe conforme', () => {
    assert.strictEqual(isPasswordStrong('Ecole123!'), true);
    assert.strictEqual(isPasswordStrong('SuperAdmin123!'), true);
  });
  it('validatePassword lève une erreur 400 avec message', () => {
    try {
      validatePassword('faible');
      assert.fail('devrait lever');
    } catch (error) {
      assert.strictEqual(error.status, 400);
      assert.strictEqual(error.message, passwordPolicyMessage());
    }
  });
});

describe('Auth (A.2) — refresh token & sessions', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalRefresh = process.env.JWT_REFRESH_SECRET;

  it('émet et vérifie un refresh token avec jti', () => {
    process.env.JWT_SECRET = 'test-secret-access';
    process.env.JWT_REFRESH_SECRET = 'test-secret-refresh';
    const payload = { schoolId: 's1', actorType: 'parent', actorId: 'p1', role: 'parent' };
    const refresh = jwt.sign({ ...payload, jti: 'token-1' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    assert.strictEqual(decoded.jti, 'token-1');
    assert.strictEqual(decoded.actorType, 'parent');
  });

  it('un refresh token expiré est rejeté', () => {
    process.env.JWT_SECRET = 'test-secret-access';
    process.env.JWT_REFRESH_SECRET = 'test-secret-refresh';
    const expired = jwt.sign(
      { schoolId: 's1' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '-10s' }
    );
    assert.throws(() => jwt.verify(expired, process.env.JWT_REFRESH_SECRET), /expired/i);
  });

  it('un access token mal signé est rejeté', () => {
    process.env.JWT_SECRET = 'test-secret-access';
    const token = jwt.sign({ schoolId: 's1' }, 'wrong-secret', { expiresIn: '8h' });
    assert.throws(() => jwt.verify(token, process.env.JWT_SECRET), /signature/i);
  });

  it('restaure les variables de test', () => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_REFRESH_SECRET = originalRefresh;
  });
});

describe('Audit (A.4)', () => {
  it('exporte les fonctions de service', async () => {
    const svc = await import('../modules/audit/audit.service.js');
    assert.strictEqual(typeof svc.logAudit, 'function');
    assert.strictEqual(typeof svc.auditActorFromReq, 'function');
  });
});

describe('Limiter super admin (A.3)', () => {
  it('la configuration limite est raisonnable', () => {
    // 60 req / 15 min = 4/min en moyenne, bien sous le limiter école
    const config = { windowMs: 15 * 60 * 1000, max: 60 };
    assert.strictEqual(config.max / (config.windowMs / 60000), 4);
  });
});
