var URL = require('url');

var oauth2 = require('./oauth2')
  , RFactory = require('./model').RFactory
  , tools = require('./tools')
  ;


var get_auths = function(req, res) {
  /* Returns basic information about a user + its authorizations (roles)
   * for the client (user_id and client_id in given oauth_token).
   *
   * This is kind of specific to auth_server API.
   *
   * TODO: The reply needs some work to be compliant.
   * (have to include token in reply headers?)
   * cf. http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-5.2
   *
   */
  oauth2.check_token(req, res, function(token_info) {
    var R = RFactory()
      , user_id = token_info.user_id
      , client_id = token_info.client_id
      , info = {id: user_id, authorizations: {}}
      ;
    R.User.get({ids: user_id}, function(user) {
      if(!user) { // The user doesn't exist anymore.
        res.writeHead('404', {});
        res.end();
        return;
      }
      info.email = user.email;
      R.Authorization.index({query: {
        'client.id': client_id,
        'email': user.email
      }}, function(authorizations) {
        authorizations.forEach(function(auth) {
          info.authorizations[auth.context] = auth.roles;
        });
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(JSON.stringify(info));
      }, function() {res.writeHead(500, {}); res.end()});
    }, function() {res.writeHead(500, {}); res.end()});
  });
};

exports.connector = function() {
  /* Returns OAuth2 resources server connect middleware.
   *
   */
  var routes = {GET: {}};
  routes.GET['/auth'] = get_auths;
  return tools.get_connector_from_routes(routes);
}

