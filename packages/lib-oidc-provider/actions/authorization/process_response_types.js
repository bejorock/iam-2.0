const { get } = require('lodash');
const instance = require('../../helpers/weak_cache');

module.exports = (provider) => {
  const { IdToken, AccessToken, AuthorizationCode } = provider;

  const {
    features: { pkce, backchannelLogout, frontchannelLogout },
    audiences,
  } = instance(provider).configuration();

  async function tokenHandler(ctx) {
    const at = new AccessToken({
      accountId: ctx.oidc.session.accountId(),
      claims: ctx.oidc.claims,
      clientId: ctx.oidc.client.clientId,
      grantId: ctx.oidc.uuid,
      scope: ctx.oidc.params.scope,
      sid: ctx.oidc.session.sidFor(ctx.oidc.client.clientId)
    });

    return {
      access_token: await at.save(),
      expires_in: at.expiration,
      token_type: 'Bearer',
    };
  }

  async function codeHandler(ctx) {
    const { cookies } = ctx
    const apiToken = cookies.get('$LoopBackSDK$id')

    const ac = new AuthorizationCode({
      accountId: ctx.oidc.session.accountId(),
      acr: ctx.oidc.acr,
      amr: ctx.oidc.amr,
      authTime: ctx.oidc.session.authTime(),
      claims: ctx.oidc.claims,
      clientId: ctx.oidc.client.clientId,
      grantId: ctx.oidc.uuid,
      nonce: ctx.oidc.params.nonce,
      redirectUri: ctx.oidc.params.redirect_uri,
      scope: ctx.oidc.params.scope,
      refId: apiToken
    });

    if (pkce) {
      ac.codeChallenge = ctx.oidc.params.code_challenge;
      ac.codeChallengeMethod = ctx.oidc.params.code_challenge_method;
    }

    if (backchannelLogout || frontchannelLogout) {
      ac.sid = ctx.oidc.session.sidFor(ctx.oidc.client.clientId);
    }

    //const { expiresIn } = AccessToken;

    const encodedCode = await ac.save()

    // set domain cookie
    //ctx.cookies.set(`${ctx.oidc.client.clientId}_code`, encodedCode, {domain: '.pln.co.id', maxAge: expiresIn * 1000, secure: false})

    return { code: encodedCode };
  }

  async function idTokenHandler(ctx) {
    const token = new IdToken(Object.assign({}, await ctx.oidc.account.claims(), {
      acr: ctx.oidc.acr,
      amr: ctx.oidc.amr,
      auth_time: ctx.oidc.session.authTime(),
    }), ctx.oidc.client.sectorIdentifier);

    token.scope = ctx.oidc.params.scope;
    token.mask = get(ctx.oidc.claims, 'id_token', {});

    token.set('nonce', ctx.oidc.params.nonce);

    if (backchannelLogout || frontchannelLogout) {
      token.set('sid', ctx.oidc.session.sidFor(ctx.oidc.client.clientId));
    }

    return { id_token: token };
  }

  /*
   * Resolves each requested response type to a single response object. If one of the hybrid
   * response types is used an appropriate _hash is also pushed on to the id_token.
   */
  return async function processResponseTypes(ctx) {
    const responses = ctx.oidc.params.response_type.split(' ');
    const res = Object.assign({}, ...await Promise.all(responses.map((responseType) => {
      switch (responseType) {
        case 'code':
          return codeHandler(ctx);
        case 'token':
          return tokenHandler(ctx);
        case 'id_token':
          return idTokenHandler(ctx);
        default:
          return {};
      }
    })));

    if (res.access_token && res.id_token) {
      res.id_token.set('at_hash', res.access_token);
    }

    if (res.code && res.id_token) {
      res.id_token.set('c_hash', res.code);
    }

    if (ctx.oidc.params.state && res.id_token) {
      res.id_token.set('s_hash', ctx.oidc.params.state);
    }

    if (res.id_token) {
      res.id_token = await res.id_token.sign(ctx.oidc.client, {
        audiences: await audiences(ctx, ctx.oidc.account.accountId),
      });
    }

    return res;
  };
};
