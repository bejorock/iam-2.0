const { get } = require('lodash');
const assert = require('assert');
const base64url = require('base64url');
const crypto = require('crypto');
const { InvalidGrantError } = require('../../helpers/errors');
const presence = require('../../helpers/validate_presence');
const instance = require('../../helpers/weak_cache');

module.exports.handler = function getAuthorizationCodeHandler(provider) {
  const { features: { pkce, alwaysIssueRefresh }, audiences } = instance(provider).configuration();
  return async function authorizationCodeResponse(ctx, next) {
    presence(ctx, ['code', 'redirect_uri']);
    
    const code = await provider.AuthorizationCode.find(ctx.oidc.params.code, {
      ignoreExpiration: true,
    });
    
    if (!code) {
      ctx.throw(new InvalidGrantError('authorization code not found'));
    }

    if (code.isExpired) {
      ctx.throw(new InvalidGrantError('authorization code is expired'));
    }

    // PKCE check
    if (pkce && (ctx.oidc.params.code_verifier || code.codeChallenge)) {
      try {
        let expected = ctx.oidc.params.code_verifier;
        assert(expected);

        if (code.codeChallengeMethod === 'S256') {
          expected = base64url(crypto.createHash('sha256').update(expected).digest());
        }

        assert.equal(code.codeChallenge, expected);
      } catch (err) {
        ctx.throw(new InvalidGrantError('PKCE verification failed'));
      }
    }
    
    try {
      if (code.consumed) {
        ctx.throw(new InvalidGrantError('authorization code already consumed'));
      }
      
      await code.consume();
    } catch (err) {
      await code.destroy();
      throw err;
    }
    
    if (code.clientId !== ctx.oidc.client.clientId) {
      ctx.throw(new InvalidGrantError('authorization code client mismatch'));
    }

    if (code.redirectUri !== ctx.oidc.params.redirect_uri) {
      ctx.throw(new InvalidGrantError('authorization code redirect_uri mismatch'));
    }

    const account = await provider.Account.findById(ctx, code.accountId, code);
    
    if (!account) {
      ctx.throw(new InvalidGrantError('authorization code invalid (referenced account not found)'));
    }
    //console.log(ctx.req.useragent)
    const { AccessToken, IdToken, RefreshToken } = provider;
    const at = new AccessToken({
      accountId: account.accountId,
      claims: code.claims,
      clientId: ctx.oidc.client.clientId,
      grantId: code.grantId,
      scope: code.scope,
      sid: code.sid,
      refId: code.refId,
      device: {
        userAgent: ctx.req.useragent.source,
        //ipAddress: (ctx.req.headers['x-forwarded-for'] || ctx.req.connection.remoteAddress || ctx.req.socket.remoteAddress || ctx.req.connection.socket.remoteAddress).split(",")[0]
        ipAddress: ctx.req.ip
      }
    });
    
    const accessToken = await at.save();
    const { expiresIn } = AccessToken;

    let refreshToken;
    const grantPresent = ctx.oidc.client.grantTypes.includes('refresh_token');

    if (grantPresent && (alwaysIssueRefresh || code.scope.split(' ').includes('offline_access'))) {
      const rt = new RefreshToken({
        accountId: account.accountId,
        acr: code.acr,
        amr: code.amr,
        authTime: code.authTime,
        claims: code.claims,
        clientId: ctx.oidc.client.clientId,
        grantId: code.grantId,
        nonce: code.nonce,
        scope: code.scope,
        sid: code.sid,
      });

      refreshToken = await rt.save();
    }

    const token = new IdToken(Object.assign({}, await account.claims(), {
      acr: code.acr,
      amr: code.amr,
      auth_time: code.authTime,
    }), ctx.oidc.client.sectorIdentifier);

    token.scope = code.scope;
    token.mask = get(code.claims, 'id_token', {});

    token.set('nonce', code.nonce);
    token.set('at_hash', accessToken);
    token.set('rt_hash', refreshToken);
    token.set('sid', code.sid);

    const idToken = await token.sign(ctx.oidc.client, {
      audiences: await audiences(ctx, code.accountId, code),
    });

    ctx.body = {
      access_token: accessToken,
      expires_in: expiresIn,
      id_token: idToken,
      refresh_token: refreshToken,
      scope: code.scope,
      token_type: 'Bearer',
      api_token: (code.scope.split(' ').includes('apitoken') ? code.refId : undefined)
    };

    //ctx.req.cookie(`token_${ctx.oidc.client.clientId}`, accessToken, {domain: '.pln.co.id', maxAge: (expiresIn * 1000)})

    await next();
  };
};

module.exports.parameters = ['code', 'redirect_uri', 'code_verifier'];
