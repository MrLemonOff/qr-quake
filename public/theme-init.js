// Sets the theme before the page paints, so there is no flash. Kept as a file so the
// Content-Security-Policy can forbid inline scripts.
(function () {
  var theme = 'light';
  try {
    var saved = JSON.parse(localStorage.getItem('qr-quake:v2') || '{}').theme;
    theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', theme);
})();
