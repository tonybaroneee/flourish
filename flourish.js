window.addEventListener("load", runFlourish, false);
// chrome.pageAction.show();

function runFlourish(evt) {
  var jqueryReadyInterval = setInterval(isJQueryReady, 111);
  var activelyMovingCard = false;
  var activelyPollingStages = false;
  var resetStagesOnNextCall = false;
  var stages = [];

  var $;
  var pollStagesInterval;
  var sessionToken;
  var boardId;

  function isJQueryReady() {
    if (typeof window.jQuery !== "undefined") {
      clearInterval(jqueryReadyInterval);
      $ = window.jQuery;
      sessionToken = $('meta[name="session-token"]').attr('content'); // Needed for polling

      improveCollaborationBox();
      listenForCardClicks();
      pollStagesInterval = setInterval(pollStages, 60 * 1000); // 1 minute
    }
  }

  function improveCollaborationBox() {
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

  function makeHighlightHtml(text, startIndex, endIndex) {
    var prefix = text.substring(0, startIndex),
      match = text.substring(startIndex, endIndex),
      suffix = text.substring(endIndex);
    return prefix + '<span class="match-highlight">' + match + '</span>' + suffix;
  }

  function listenForCardClicks() {
    $('body').on('mousedown', '.click-area', function() {
      activelyMovingCard = true;
    });
    $('body').on('mouseup', '.click-area', function() {
      activelyMovingCard = false;
      // Reset stages. Since we potentiall moved a card, we
      // know the stages stored in memory will be different
      // so ensure don't trigger a reload
      resetStagesOnNextCall = true;
    });
  }

  function pollStages() {
    if (activelyPollingStages || activelyMovingCard) {
      return;
    }

    var urlParts = window.location.href.split('/');
    if (urlParts[urlParts.length - 1] !== 'board') {
      return;
    }

    // We've changed boards since last call so stages and cards
    // will be different. Don't trigger a reload
    if (boardId && boardId !== urlParts[urlParts.length - 2]) {
      resetStagesOnNextCall = true;
    }
    boardId = urlParts[urlParts.length - 2];
    activelyPollingStages = true;

    $.ajax({
      url: `https://blossom-hr.appspot.com/_ah/api/application/0_0_3/projects/${boardId}`,
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    })
    .done(afterGettingCurrentStages)
    .always(function() {
      activelyPollingStages = false;
    });
  };

  function afterGettingCurrentStages(response) {
    if (stages.length === 0 || resetStagesOnNextCall) {
      stages = response.stages;
      resetStagesOnNextCall = false;
    } else {
      if (stages.length !== response.stages.length) {
        return updateStages(response.stages);
      }

      response.stages.some(function(stage, i) {
                            // Cards in stage but no longer
        var changeToCards = (stages[i].cards === undefined && stage.cards !== undefined) ||
                            // No cards in stage before but now has some
                            (stages[i].cards !== undefined && stage.cards === undefined) ||
                            // The number of cards in the stage has changed
                            stages[i].cards && stage.cards && stages[i].cards.length !== stage.cards.length;

        if (changeToCards) {
          updateStages(response.stages);
        }

        return changeToCards;
      });
    }
  }

  function updateStages(newStages) {
    stages = newStages;
    Backbone.history.loadUrl();
  };
}
