// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license

;(function() {
    let lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        x, currTime, timeToCall, id;
        
    for(x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {

        window.requestAnimationFrame = (callback) => {
            
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            id = window.setTimeout(() => {
                    callback(currTime + timeToCall);
                },
                timeToCall);

            lastTime = currTime + timeToCall;

            return id;
        };
    }

    if (!window.cancelAnimationFrame) {

        window.cancelAnimationFrame = (id) => {
            clearTimeout(id);
        };
    }

}());

/* ^^^
 * https://github.com/nk-components/time-now
 * ========================================================================== */
window.now = () => {
  const perf = window && window.performance;

  if (perf && perf.now) {
    return perf.now();
  }

  return () => new Date().getTime();
};


/* ^^^
 * https://github.com/nk-components/request-interval
 * ========================================================================== */
window.requestInterval = (fn, delay) => {
  const data = {};
  let start = Date.now();

  data.id = requestAnimationFrame(loop);

  return data;

  function loop() {
    data.id = requestAnimationFrame(loop);

    if (Date.now() - start >= delay) {
      fn();
      start = Date.now();
    }
  }
};

window.clearRequestInterval = (data) => {
  if (data) {
    cancelAnimationFrame(data.id);
  }
};


/* ^^^
 * https://github.com/nk-components/request-timeout
 * ========================================================================== */
window.requestTimeout = (fn, delay, ctx) => {
  const start = window.now();
  const data = Object.create(null);

  data.id = requestAnimationFrame(loop);

  return data;

  function loop() {
    (window.now() - start) >= delay ? fn.call(ctx) : data.id = requestAnimationFrame(loop);
  }
};

window.clearRequestTimeout = (data) => {
  if (data) {
    cancelAnimationFrame(data.id);
  }
};
