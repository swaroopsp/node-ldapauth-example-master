var express      = require('express'),
    passport     = require('passport'),
    bodyParser   = require('body-parser'),
    LdapStrategy = require('passport-ldapauth');
    fs = require('fs');
var moment = require('moment');
var jwt = require('jwt-simple');

require('dotenv').config()

url = process.env.URL || 'ldaps://ldaps.nix.octon.org.uk';
bindDN = process.env.BINDDN || 'uid=svc-fsm-squid,cn=users,cn=accounts,dc=nix,dc=octon,dc=org,dc=uk';
bindCredentials = process.env.BINDCREDENTIALS || '7IsOMbXZQlNl7mDY7yfZR5NQ';
//searchBase = process.env.SEARCHBASE ||  'cn=users,cn=accounts,dc=nix,dc=octon,dc=org,dc=uk';
searchBase = process.env.SEARCHBASE ||  'cn=users,cn=accounts,dc=nix,dc=octon,dc=org,dc=uk';
searchFilter = process.env.SEARCHFILTER || '(&(uid={{username}})(memberOf=cn=role-fsm-rco-search-sand,cn=groups,cn=accounts,dc=nix,dc=octon,dc=org,dc=uk))';



var OPTS = {
  server: {
    url: url,
    bindDN:  bindDN,
    bindCredentials: bindCredentials,
    searchBase: searchBase,
    searchFilter: searchFilter,
    //searchAttributes: ['displayName'],
    tlsOptions: {
      ca: [
        fs.readFileSync('/etc/ipa/chain.crt'),
        fs.readFileSync('/etc/ipa/ca.crt')
      ]
    }
}
};

port = process.env.PORT || 6000;

var app = express();

passport.use(new LdapStrategy(OPTS));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.set('jwtTokenSecret', "FCA_SECRET_KEY");

app.post('/login', passport.authenticate('ldapauth', {session: false}), function(req, res) {
        console.log("222222222222222" + req)
        //res.send({ id: 1, username: 'test', password: 'test', firstName: 'Test', lastName: 'User' });
    //res.send({status: 'ok'});
});

app.post('/fake',  function(req, res) {
        console.log("111111111111111111" + JSON.stringify(req.params), req.body)
        console.log("222222222222222" + req)
        const user = { uidNumber: 1528652297, givenName: 'Test', sn: 'User', cn: 'Test User', krbPrincipalName: 'test@user.com'};
        var expires = parseInt(moment().add(2, 'days').format("X"));
        var token = jwt.encode({
            exp: expires,
            user_name: user.uidNumber,
            full_name: user.cn,
            mail: user.krbPrincipalName
        }, app.get('jwtTokenSecret'));

        res.json({token: token, full_name: user.cn});
//res.send({status: 'ok'});
});

app.post('/login2', function(req, res, next) {
  passport.authenticate('ldapauth',{failureFlash: true, session: true} ,function(err, user, info) {
    console.log(err,user,info,456,bindDN,bindCredentials)
    if (err) { console.log(err,user,info,123); return next(err); }
    if (!user) {
// return res.redirect('/loginfail');
    }
//    req.logIn(user, function(err) {
//      if (err) { return next(err); }
      //return res.redirect('/users/' + user.username);
//    });
  })(req, res, next);
});


app.post('/loginOAuth', function(req, res, next) {
  passport.authenticate('ldapauth',{failureFlash: true, session: true} ,function(err, user, info) {
    console.log(err,user,info,456,bindDN,bindCredentials)
    if (err) {
        console.log(err,user,info,123);
        res.status(401).send({ error: 'Wrong user or password'});
    } else if (!user) {
        console.log("There is some issues");
        res.status(500).send({ error: 'Unexpected Error'});
    } else {
        var expires = parseInt(moment().add(2, 'days').format("X"));
        var token = jwt.encode({
            exp: expires,
            user_name: user.uid,
            full_name: user.cn,
            mail: user.mail
        }, app.get('jwtTokenSecret'));

        res.json({token: token, full_name: user.cn});
    }
  })(req, res, next);
});

app.post('/verify', function (req, res) {
	var token = req.body.token;
	console.log("23423423 v- " + JSON.stringify(req.body));
	if (token) {
		try {
			var decoded = jwt.decode(token, "FCA_SECRET_KEY");

			if (decoded.exp <= parseInt(moment().format("X"))) {
				res.status(400).send({ error: 'Access token has expired'});
			} else {
				res.json(decoded);
			}
		} catch (err) {
			res.status(500).send({ error: 'Access token could not be decoded'});
		}
	} else {
		res.status(400).send({ error: 'Access token is missing'});
	}
});


app.listen(port);
console.log('Server listen on port: ' + port);
