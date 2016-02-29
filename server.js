'use strict'

const loopback = require('loopback');
const explorer = require('loopback-component-explorer');
const debug = require('debug');


var app = module.exports = loopback();

app.set('legacyExplorer', false);

app.use('/api', loopback.rest());

app.get('/', (req, res) => {
  res.write(JSON.stringify(new Date()) + '\n');
  res.end('Hello from the Index Card DB Server.');
});

app.use('/explorer', explorer.routes(app, { basePath: '/index-cards/api' }));

//
// ADD DATASOURCES
//

app.dataSource('db', {
  "name": "db",
  "connector": "memory"
});

app.dataSource('mongo', {
  name: 'mongo',
  connector: 'mongodb',
  database: 'index_cards_loopback'
});

//
// DEFINE MODELS
//
//

var IndexCard = app.loopback.createModel({
  name: 'IndexCard',
  strict: 'throw',
  properties: {
    mitreCard: {
      type: Object,
      required: true
    },
    nxmlId: {
      type: String,
      required: true
    }
  },
  relations: {
    nxml: {
      type: 'belongsTo',
      model: 'NXML',
      foreignKey: 'nxmlId'
    }
  },
  // acls: [
  //   {
  //     // "accessType": "*",
  //     property: "findOne",
  //     "principalType": "ROLE",
  //     "principalId": "$everyone",
  //     "permission": "DENY"
  //   }
  // ],
  indexes: {
    nxml_id_index: {
      keys: { nxmlId: 1 }
    }
  },
  idInjection: false
});

var NXML = app.loopback.createModel({
  name: 'NXML',
  strict: 'throw',
  plural: 'NXML',
  properties: {
    articleFront: {
      type: Object,
      required: true
    },
    xmlBinary: {
      type: Object,
      required: true
    }
  },
  relations: {
    indexCards: {
      type: 'hasMany',
      model: 'IndexCard',
      foreignKey: 'nxmlId'
    }
  },
  // acls: [
  //   {
  //     // "accessType": "*",
  //     property: "WRITE",
  //     "principalType": "ROLE",
  //     "principalId": "$everyone",
  //     "permission": "DENY"
  //   }
  // ],
  idInjection: false
});

//
// Custom Remote Methods
//
//

IndexCard.greet = function(msg, cb) {
  cb(null, 'Greetings... ' + msg);
};
     
IndexCard.remoteMethod(
    'greet', 
    {
      accepts: {arg: 'msg', type: 'string'},
      returns: {arg: 'greeting', type: 'string'}
    }
);

IndexCard.compare = function(cardA, cardB, cb) {
  cb(null, 'Greetings... ' + cardA.pmc_id);
};
     
IndexCard.remoteMethod(
    'compare', 
    {
      accepts: {arg: 'cards', type: 'object', http: { source: 'body' } },
      returns: {arg: 'greeting', type: 'string'}
    }
);

//
// DISABLE STUFF
//
//

function disable_remote_write_methods(model) {
  model.disableRemoteMethod('deleteById', true);
  model.disableRemoteMethod('create', true);
  model.disableRemoteMethod("upsert", true);
  model.disableRemoteMethod("updateAll", true);
  model.disableRemoteMethod("updateAttributes", false);
  model.disableRemoteMethod("createChangeStream", true);
}

function disable_related_remote_write_methods(model, related) {
  // model.disableRemoteMethod(`__count__${related}`, false);
  // model.disableRemoteMethod(`__findById__${related}`, false);
  // model.disableRemoteMethod(`__get__${related}`, false);
  
  model.disableRemoteMethod(`__create__${related}`, false);
  model.disableRemoteMethod(`__updateById__${related}`, false);
  model.disableRemoteMethod(`__destroyById__${related}`, false);
  model.disableRemoteMethod(`__delete__${related}`, false);
}

disable_remote_write_methods(IndexCard);
disable_remote_write_methods(NXML);

disable_related_remote_write_methods(NXML, 'indexCards');

app.model(NXML, { dataSource: 'mongo' });
app.model(IndexCard, { dataSource: 'mongo' });

app.model(app.loopback.User, { "dataSource": "db", "public": false });
app.model(app.loopback.AccessToken, { "dataSource": "db", "public": false });
app.model(app.loopback.ACL, { "dataSource": "db", "public": false });
app.model(app.loopback.RoleMapping, { "dataSource": "db", "public": false });
app.model(app.loopback.Role, { "dataSource": "db", "public": false });

app.enableAuth();



IndexCard
  .findOne()
  .then(function(d) {
    d.isValid(e => debug('validate')(`one card is valid`));
  });

NXML
  .findOne()
  .then(function(d) {
    d.isValid(e => debug('validate')(`one nxml is valid`));
  });
