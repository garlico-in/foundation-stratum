/*
 *
 * Algorithms (Updated)
 *
 */

const equihash = require('foundation-equihash');
const kawpow = require('foundation-kawpow');
const multiHashing = require('foundation-multi-hashing');
const utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////

// Main Algorithms Function
const Algorithms = {

  // Sha256d Algorithm
  'sha256d': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return utils.sha256d.apply(this, arguments);
      };
    }
  },

  // Scrypt Algorithm
  'scrypt': {
    multiplier: Math.pow(2, 16),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function(coinConfig){
      const nValue = coinConfig.nValue || 1024;
      const rValue = coinConfig.rValue || 1;
      return function(data){
        return multiHashing.scrypt(data,nValue,rValue);
      };
    }
  },

  // Scrypt Algorithm
  'allium': {
    multiplier: Math.pow(2, 16),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function(){
      return function(){
        return multiHashing.allium.apply(this, arguments);
      };
    }
  },

  // C11 Algorithm
  'c11': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.c11.apply(this, arguments);
      };
    }
  },

  // X11 Algorithm
  'x11': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.x11.apply(this, arguments);
      };
    }
  },

  // X13 Algorithm
  'x13': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.x13.apply(this, arguments);
      };
    }
  },

  // X15 Algorithm
  'x15': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.x15.apply(this, arguments);
      };
    }
  },

  // X16R Algorithm
  'x16r': {
    multiplier: Math.pow(2, 8),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.x16r.apply(this, arguments);
      };
    }
  },

  // X16R Algorithm
  'x16rt': {
    multiplier: Math.pow(2, 8),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.x16rt.apply(this, arguments);
      };
    }
  },

  // X16Rv2 Algorithm
  'x16rv2': {
    multiplier: Math.pow(2, 8),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.x16rv2.apply(this, arguments);
      };
    }
  },

  // Nist5 Algorithm
  'nist5': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.nist5.apply(this, arguments);
      };
    }
  },

  // Quark Algorithm
  'quark': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.quark.apply(this, arguments);
      };
    }
  },

  // Keccak Algorithm
  'keccak': {
    multiplier: Math.pow(2, 8),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function(coinConfig){
      if (coinConfig.normalHashing === true) {
        return function(data, nTimeInt) {
          return multiHashing.keccak(multiHashing.keccak(Buffer.concat([data, Buffer.from(nTimeInt.toString(16), 'hex')])));
        };
      } else {
        return function() {
          return multiHashing.keccak.apply(this, arguments);
        };
      }
    }
  },

  // Blake Algorithm
  'blake': {
    multiplier: Math.pow(2, 8),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.blake.apply(this, arguments);
      };
    }
  },

  // Skein Algorithm
  'skein': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.skein.apply(this, arguments);
      };
    }
  },

  // Groestl Algorithm
  'groestl': {
    multiplier: Math.pow(2, 8),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.groestl.apply(this, arguments);
      };
    }
  },

  // Fugue Algorithm
  'fugue': {
    multiplier: Math.pow(2, 8),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.fugue.apply(this, arguments);
      };
    }
  },

  // Qubit Algorithm
  'qubit': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.qubit.apply(this, arguments);
      };
    }
  },

  // Equihash Algorithm (WIP)
  'equihash': {
    multiplier: 1,
    diff: parseInt('0x0007ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
    hash: function(options) {
      const parameters = options.parameters || {};
      const N = parameters.N || 200;
      const K = parameters.K || 9;
      const P = parameters.P || 'ZcashPoW';
      return function() {
        return equihash.verify.apply(this, [arguments[0], arguments[1], P, N, K]);
      };
    }
  },

  // Kawpow Algorithm
  'kawpow': {
    multiplier: 1,
    diff: parseInt('0x00000000ff000000000000000000000000000000000000000000000000000000'),
    epochLength: 7500,
    hash: function() {
      return function() {
        return kawpow.verify.apply(this, arguments);
      };
    }
  },

  // Ghostrider Algorithm
  'ghostrider': {
    multiplier: Math.pow(2, 16),
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.ghostrider.apply(this, arguments);
      };
    }
  },

  // Verthash Algorithm
  'verthash': {
    multiplier: Math.pow(2, 8),
    diff: parseInt('0x00000000ff000000000000000000000000000000000000000000000000000000'),
    hash: /* istanbul ignore next */ function() {
      // Can't test due to "verthash.dat" file
      return function() {
        return multiHashing.verthash.apply(this, arguments);
      };
    }
  },

  // Minotaur Algorithm
  'minotaur': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.minotaur.apply(this, arguments);
      };
    }
  },

  // MinotaurX Algorithm
  'minotaurx': {
    multiplier: 1,
    diff: parseInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'),
    hash: function() {
      return function() {
        return multiHashing.minotaurx.apply(this, arguments);
      };
    }
  }
};

module.exports = Algorithms;
