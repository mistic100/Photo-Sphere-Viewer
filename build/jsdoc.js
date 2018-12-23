(function() {
  // trianglify
  var header = $('.page-header');
  var pattern = Trianglify({
    width    : window.screen.width | header.outerWidth(),
    height   : header.outerHeight(),
    cell_size: 90,
    seed     : 'Photo Sphere Viewer',
    x_colors : ['#09B4E9', '#15884C']
  });

  header.css('background-image', 'url(' + pattern.png() + ')');

  // version
  var navbarNav = $('#topNavigation');
  navbarNav.append(
    '<ul class="nav navbar-nav" style="float:right">' +
    '  <li class="dropdown">' +
    '    <a href="#" class="dropdown-toggle" data-toggle="dropdown">v3<b class="caret"></b></a>' +
    '    <ul class="dropdown-menu">' +
    '      <li><a href="."><span class="glyphicon glyphicon-ok"></span> Latest (v3)</a></li>' +
    '      <li><a href="../v4/api">Next (v4)</a></li>' +
    '    </ul>' +
    '  </li>' +
    '</ul>'
  );
}());
