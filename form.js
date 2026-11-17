// "Send to Lainy" form: validates in the browser, then posts to FormSubmit,
// which emails the note to Lainy. Without JS the form still posts normally
// and FormSubmit redirects back to #thanks.
(function () {
  var ENDPOINT = 'https://formsubmit.co/ajax/LainyHarts@gmail.com';
  var MAX_MSG = 1000;

  var form = document.getElementById('hello-form');
  var thanks = document.getElementById('thanks');
  if (!form || !thanks) return;

  var msg = document.getElementById('f-msg');
  var count = document.getElementById('f-count');
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');

  function showThanks() {
    form.hidden = true;
    thanks.hidden = false;
  }
  if (location.hash === '#thanks') showThanks();

  function updateCount() {
    var n = msg.value.length;
    count.textContent = n;
    count.parentNode.classList.toggle('near', n > MAX_MSG * 0.9);
  }
  msg.addEventListener('input', updateCount);
  updateCount();

  function setStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle('error', !!isError);
  }

  function firstInvalid() {
    var fields = form.querySelectorAll('input:not([type=hidden]):not(.trap), select, textarea');
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (f.value.trim() === '') f.value = ''; // whitespace-only counts as empty
      if (!f.checkValidity()) return f;
    }
    return null;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('');

    var bad = firstInvalid();
    if (bad) {
      form.classList.add('tried');
      setStatus('Please fill in the highlighted fields.', true);
      bad.focus();
      return;
    }

    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = typeof value === 'string' ? value.trim() : value;
    });
    if (data._honey) { showThanks(); return; } // bot filled the trap: drop it quietly
    data._subject = 'Puffling note from ' + data.first_name + ' ' + data.last_name + ' (' + data.about + ')';
    data._replyto = data.email;

    button.disabled = true;
    button.textContent = 'Sending…';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok || String(body.success) !== 'true') throw new Error(body.message || 'Send failed');
        });
      })
      .then(function () {
        form.reset();
        updateCount();
        showThanks();
      })
      .catch(function () {
        setStatus('Sorry, that didn’t go through. Please try again, or email LainyHarts@gmail.com directly.', true);
      })
      .then(function () {
        button.disabled = false;
        button.textContent = 'Send to Lainy';
      });
  });
})();
