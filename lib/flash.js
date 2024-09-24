/**
 * Module dependencies.
 */
const { format } = require('util');
const { Buffer } = require('buffer');

function base64Encode(str) {
  return Buffer.from(str).toString('base64');
}

function base64Decode(str) {
  return Buffer.from(str, 'base64').toString();
}

/**
 * Expose `flash()` function on requests.
 *
 * @return {Function}
 * @api public
 */
module.exports = function flash(options) {
  options = options || {};
  const safe = (options.unsafe === undefined) ? true : !options.unsafe;
  
  return function(req, res, next) {
    if (req.flash && safe) { return next(); }
    req.flash = _flash;
    next();
  }
}

/**
 * Queue flash `msg` of the given `type`.
 *
 * Examples:
 *
 *      req.flash('info', 'email sent');
 *      req.flash('error', 'email delivery failed');
 *      req.flash('info', 'email re-sent');
 *      // => 2
 *
 *      req.flash('info');
 *      // => ['email sent', 'email re-sent']
 *
 *      req.flash('info');
 *      // => []
 *
 *      req.flash();
 *      // => { error: ['email delivery failed'], info: [] }
 *
 * Formatting:
 *
 * Flash notifications also support arbitrary formatting support.
 * For example you may pass variable arguments to `req.flash()`
 * and use the %s specifier to be replaced by the associated argument:
 *
 *     req.flash('info', 'email has been sent to %s.', userName);
 *
 * Formatting uses `util.format()`, which is available on Node 0.6+.
 *
 * @param {String} type
 * @param {String} msg
 * @return {Array|Object|Number}
 * @api public
 */
function _flash(type, msg) {
  if (this.session === undefined) throw Error('req.flash() requires sessions');
  const msgs = this.session.flash = this.session.flash || {};
  if (type && msg) {
    // util.format is available in Node.js 0.6+
    if (arguments.length > 2 && format) {
      const args = Array.prototype.slice.call(arguments, 1);
      msg = format.apply(undefined, args);
    } else if (Array.isArray(msg)) {
      msg.forEach(function(_val){
        // encode msg to base64
        const val = base64Encode(_val);
        (msgs[type] = msgs[type] || []).push(val);
      });
      return msgs[type].length;
    }
    // encode msg to base64
    msg = base64Encode(msg);
    return (msgs[type] = msgs[type] || []).push(msg);
  } else if (type) {
    const arr = msgs[type];
    delete msgs[type];
    // decode msg from base64
    if (Array.isArray(arr)) {
      return arr.map(base64Decode);
    }
    return [];
  } else {
    this.session.flash = {};
    return msgs;
  }
}
