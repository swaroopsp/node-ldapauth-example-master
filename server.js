var express      = require('express'),
    passport     = require('passport'),
    bodyParser   = require('body-parser'),
    LdapStrategy = require('passport-ldapauth');
const cors = require('cors')

require('dotenv').config()

url = process.env.URL || 'ldap://localhost:389';
bindDN = process.env.BINDDN || 'cn=Directory Manager';
bindCredentials = process.env.BINDCREDENTIALS || 'admin';
searchBase = process.env.SEARCHBASE ||  'ou=People,dc=example,dc=com';
searchFilter = process.env.SEARCHFILTER || '(uid={{username}})';

 
var OPTS = {
  server: {
    url: url,
    bindDN:  bindDN,
    bindCredentials: bindCredentials,
    searchBase: searchBase,
    searchFilter: searchFilter
  }
};
 

port = process.env.PORT || 3000;

var app = express();
app.use(cors())
 
passport.use(new LdapStrategy(OPTS));
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
 
app.post('/login', passport.authenticate('ldapauth', {session: false}), function(req, res) {
	res.status(200).send({ id: 1, username: 'test', password: 'test', firstName: 'Test', lastName: 'User' });
    //res.send({status: 'ok'});	
});

app.post('/users/authenticate', (req, res) => {
  res.send({ id: 1, username: 'test', password: 'test', firstName: 'Test', lastName: 'User' });
  
});
 
app.listen(port);
console.log('Server listen on port: ' + port);