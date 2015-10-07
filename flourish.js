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

      // Helper function to reset potential dirty state of the collab box
      var cleanupCollabState = function() {
        $('.people-search').val('');
        $('.x-card-collaborators-select').show();
      };

      // On people picker open, fix up people items.
      $(document).on('click', '.x-card-collaborators-launch-area', function(e) {
        var $people = $('.x-card-collaborators-editor'),
          $peopleItems = $people.children('.x-card-collaborators-select');

        // Touch up collab picker on show, if it hasn't been done yet, or has been destroyed.
        if ($people.is(':visible') && !$people.data('fixed-up')) {
          addNames($peopleItems);
          $peopleItems.sort(function(a, b) {
            var an = $(a).find('.x-collaborator-select-tooltip-content').text().toUpperCase(),
              bn = $(b).find('.x-collaborator-select-tooltip-content').text().toUpperCase();
            if (an > bn) return 1;
            if (an < bn) return -1;
            return 0;
          });
          $peopleItems.detach().appendTo($people);

          // Add text search
          $people.prepend($('<input />')
            .attr('type', 'text')
            .attr('placeholder', 'Find someone...')
            .addClass('people-search')
          );

          $people.data('fixed-up', true);
        }

        // Auto-focus search
        cleanupCollabState();
        setTimeout(function() {
          $('.people-search').focus();
        }, 0);
      });

      // Respond to keystrokes in people search
      $(document).on('keyup', '.people-search', function(e) {
        var searchInput = e.currentTarget.value.toLowerCase();
        $('.x-card-collaborators-select').each(function(i, el) {
          var $el = $(el),
            $contentEl = $el.find('.name-text'),
            text = $contentEl.text().trim(),
            index = text.toLowerCase().indexOf(searchInput),
            isMatch = index > -1;
          if (isMatch) {
            $contentEl.html(makeHighlightHtml(text, index, index + searchInput.length));
            $el.show();
          }
          else {
            $el.hide();
            $contentEl.html($contentEl.text());
          }
        });
      });

      // Hack to fix people names upon selection/de-selection (since we can't use click listeners)
      setInterval(function() {
        if ($('.x-card-collaborators-editor').is(':hidden')) return;
        addNames($('.x-card-collaborators-select'));
      }, 111);
    }
  }

  function makeHighlightHtml(text, startIndex, endIndex) {
    var prefix = text.substring(0, startIndex),
      match = text.substring(startIndex, endIndex),
      suffix = text.substring(endIndex);
    return prefix + '<span class="match-highlight">' + match + '</span>' + suffix;
  }
}
