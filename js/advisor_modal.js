(function () {
  'use strict';

  var cfg = window.__advisorConfig || {};
  var advisors = cfg.advisors || [];
  var topic = cfg.topic || 'your project';
  var matched = null;
  var boatType = '';
  var boatLength = '';
  var boatNotes = '';

  function el(id) { return document.getElementById(id); }

  function pushEvent(event, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, params || {}));
  }

  // ---- Open / close ----

  function open() {
    el('advisorModal').hidden = false;
    document.body.style.overflow = 'hidden';
    showStep(1);
    pushEvent('advisor_open', { topic: topic });
  }

  function close() {
    el('advisorModal').hidden = true;
    document.body.style.overflow = '';
  }

  // ---- Step management ----

  function showStep(n) {
    [1, 2, 3, 4, 5].forEach(function (i) {
      var s = el('advisorStep' + i);
      if (s) s.hidden = (i !== n);
    });
    document.querySelectorAll('.advisor-progress-dot').forEach(function (dot) {
      var d = parseInt(dot.dataset.step, 10);
      dot.classList.toggle('is-active', d === n && n < 5);
      dot.classList.toggle('is-done', d < n && n < 5);
    });
  }

  // ---- Advisor matching ----

  function pick() {
    if (!advisors.length) return { name: 'an expert', specialty: '', bio: '', avatar: '' };
    return advisors[Math.floor(Math.random() * advisors.length)];
  }

  function fillAdvisor(a) {
    el('advisorAvatar').src = a.avatar;
    el('advisorAvatar').alt = a.name;
    el('advisorName').textContent = a.name;
    el('advisorSpecialty').textContent = a.specialty;
    el('advisorBio').textContent = a.bio;
    el('advisorMatchEyebrow').textContent = 'We found your ' + topic + ' specialist';
    el('advisorStep3Btn').textContent = 'Connect with ' + a.name + ' \u2192';

    el('advisorMiniAvatar').src = a.avatar;
    el('advisorMiniAvatar').alt = a.name;
    el('advisorMiniName').textContent = a.name;
    el('advisorMiniSpecialty').textContent = a.specialty;
    el('advisorSubmitBtn').textContent = 'Send my details to ' + a.name;
  }

  // ---- Init ----

  function init() {
    // Set topic-aware copy
    el('advisorTopicLine').textContent =
      "We'll match you with the right expert for your " + topic + '.';
    el('advisorMatchingText').textContent =
      'Finding the right expert for your ' + topic + '...';

    // All "get advice" triggers
    document.querySelectorAll('[data-open-advisor]').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });

    // Close button
    el('advisorClose').addEventListener('click', close);

    // Click outside card
    el('advisorModal').addEventListener('click', function (e) {
      if (e.target === el('advisorModal')) close();
    });

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    // Step 1 submit → matching animation → step 3
    el('advisorForm1').addEventListener('submit', function (e) {
      e.preventDefault();
      boatType = el('advisorBoatType').value;
      boatLength = el('advisorBoatLength').value;
      boatNotes = el('advisorDetails').value;
      pushEvent('advisor_boat_details', { topic: topic, boat_type: boatType, boat_length: boatLength });
      matched = pick();
      showStep(2);
      setTimeout(function () {
        fillAdvisor(matched);
        showStep(3);
        pushEvent('advisor_matched', { topic: topic, advisor: matched.name });
      }, 1600);
    });

    // Step 3 → step 4
    el('advisorStep3Btn').addEventListener('click', function () {
      showStep(4);
      pushEvent('advisor_contact_form', { topic: topic, advisor: matched ? matched.name : '' });
    });

    // Step 4 submit → POST to /api/lead → success
    el('advisorForm4').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = el('advisorYourName').value.trim() || 'there';
      var email = el('advisorEmail').value.trim();
      var btn = el('advisorSubmitBtn');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          boat_type: boatType,
          boat_length: boatLength,
          notes: boatNotes,
          topic: topic,
          advisor: matched ? matched.name : ''
        })
      })
        .then(function (res) { return res.json(); })
        .then(function () {
          pushEvent('generate_lead', { topic: topic });
          el('advisorSuccessMsg').textContent =
            'Thanks, ' + name + '. ' +
            (matched ? matched.name : 'Your expert') +
            ' will be in touch within 24 hours.';
          showStep(5);
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'Try again';
          el('advisorNote').textContent = 'Something went wrong — please try again.';
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
