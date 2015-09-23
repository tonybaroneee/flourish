window.addEventListener("load", runFlourish, false);
// chrome.pageAction.show();
function runFlourish(evt) {
  var jsInitChecktimer = setInterval(checkForQuery, 111);

  function checkForQuery() {
    if (typeof window.jQuery !== "undefined") {
      clearInterval(jsInitChecktimer);
      var $ = window.jQuery;

      // Helper function for adding visible names besides pictures
      var addNames = function(peopleitems) {
        peopleitems.each(function(i, el) {
          var $el = $(el),
            $newNameSpot = $el.find('.x-collaborator-select-hover-area').children('div'),
            nameTextSpan = $('<span />');
          if ($newNameSpot.children('.name-text').length) return;
          nameTextSpan.text($el.find('.x-collaborator-select-tooltip-content').text()).addClass('name-text');
          $newNameSpot.append(nameTextSpan);
        });
      };

      // On people picker open, fix up people items.
      $(document).on('click', '.x-card-collaborators-launch-area', function(e) {
        var $people = $('.x-card-collaborators-editor'),
          $peopleli = $people.children('.x-card-collaborators-select');
        if ($people.is(':visible') && !$people.data('fixed-up')) {
          addNames($peopleli);
          $peopleli.sort(function(a, b) {
            var an = $(a).find('.x-collaborator-select-tooltip-content').text().toUpperCase(),
              bn = $(b).find('.x-collaborator-select-tooltip-content').text().toUpperCase();

            if (an > bn) {
              return 1;
            }
            if (an < bn) {
              return -1;
            }
            return 0;
          });

          $peopleli.detach().appendTo($people);
          $people.data('fixed-up', true);
        }
      });

      // Hack to fix people names upon selection/de-selection (since we can't use click listeners)
      setInterval(function() {
        if ($('.x-card-collaborators-editor').is(':hidden')) return;
        addNames($('.x-card-collaborators-select'));
      }, 111);
    }
  }
}
