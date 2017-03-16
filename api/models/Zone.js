/**
 * Zone.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: http://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    x: { type: 'number', required: true },
    y: { type: 'number', required: true },
    nearbyUsers: { collection: 'User', via: 'currentZone' },

  },

};
