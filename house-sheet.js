// House sheet — renders facts, public record, plan dimensions, floor plans,
// photo gallery, and the verified-vs-estimated notes for one house from
// houses.json. The house is picked by <body data-house-id="...">.
// Optional per-house blocks (planShows, floorSplit, planDims, condition,
// extra record fields) render only when the house's entry carries them.
(function () {
  var houseId = document.body.getAttribute('data-house-id');

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // "Fort Bend CAD acct R72814" -> "Fort Bend CAD"
  function cadName(house) {
    var src = (house.floorSplit && house.floorSplit.source) || '';
    return src.replace(/\s+acct\s+.*$/, '') || 'appraisal district';
  }

  function renderFacts(house) {
    var wrap = document.getElementById('sheet-facts');
    var card = el('article', 'exam-card');
    card.appendChild(el('h2', null, 'Facts'));

    var claimed = house.claimed || {};
    card.appendChild(el('p', null,
      'Claimed: ' + fmt(claimed.sqft) + ' sq ft \u00B7 ' + claimed.beds +
      ' bd \u00B7 ' + claimed.baths + ' ba (source: ' + claimed.source + ')'));

    var verified = house.verified || {};
    if (verified.sqft != null) {
      card.appendChild(el('p', null, 'Verified: ' + fmt(verified.sqft) + ' sq ft'));
      (verified.sources || []).forEach(function (s) {
        var p = el('p', 'history');
        p.appendChild(document.createTextNode(s.name + ' \u2014 ' + s.figure + ' \u2014 '));
        var a = el('a', null, s.url);
        a.href = s.url;
        p.appendChild(a);
        card.appendChild(p);
      });
    } else {
      card.appendChild(el('p', null, 'Verified: pending'));
    }

    if (verified.sqft != null && claimed.sqft) {
      var diff = Math.abs(verified.sqft - claimed.sqft) / claimed.sqft;
      if (diff > 0.01) {
        var pct = Math.round(diff * 1000) / 10;
        card.appendChild(el('p', 'flag',
          '\u26A0 Sq ft differs: claimed ' + fmt(claimed.sqft) +
          ' vs verified ' + fmt(verified.sqft) + ' (' + pct + '% off)'));
      }
    }

    if (house.floorSplit) {
      card.appendChild(el('p', null,
        cadName(house) + ' floor areas: 1st floor ' + fmt(house.floorSplit.floor1) +
        ' sq ft \u00B7 2nd floor ' + fmt(house.floorSplit.floor2) + ' sq ft'));
    }

    if (house.planShows) {
      var plan = house.planShows;
      card.appendChild(el('p', null,
        'Floor plan shows: ' + plan.beds + ' bd \u00B7 ' + plan.baths + ' ba \u2014 ' + plan.note));
    }

    if (house.hoa) {
      var hoa = 'HOA: $' + fmt(house.hoa.monthly) + '/mo';
      if (house.hoa.annual) hoa += ' \u00B7 $' + fmt(house.hoa.annual) + '/yr';
      if (house.hoa.name) hoa += ' \u00B7 ' + house.hoa.name;
      hoa += ' (source: ' + house.hoa.source + ')';
      card.appendChild(el('p', null, hoa));
    }

    if (house.condition) {
      card.appendChild(el('p', null, 'Condition: ' + house.condition));
    }

    wrap.appendChild(card);
  }

  function renderRecord(house) {
    var rec = house.records;
    if (!rec) return;
    var wrap = document.getElementById('sheet-record');
    var card = el('article', 'exam-card');
    card.appendChild(el('h2', null, 'Public record'));

    var head = [];
    if (rec.yearBuilt != null) head.push('Year built: ' + rec.yearBuilt);
    if (rec.stories != null) head.push('Stories: ' + rec.stories);
    if (rec.lotSqft != null) head.push('Lot: ' + fmt(rec.lotSqft) + ' sq ft');
    if (head.length) card.appendChild(el('p', null, head.join(' \u00B7 ')));

    if (rec.hcadAccount) {
      card.appendChild(el('p', null, 'HCAD account: ' + rec.hcadAccount));
    }
    if (rec.fbcadAccount) {
      var line = 'Fort Bend CAD account: ' + rec.fbcadAccount;
      if (rec.geoId) line += ' \u00B7 Geographic ID: ' + rec.geoId;
      card.appendChild(el('p', null, line));
    }
    if (rec.legal) {
      card.appendChild(el('p', null, 'Legal: ' + rec.legal));
    }
    var assessed = [];
    if (rec.assessed2025 != null) assessed.push('$' + fmt(rec.assessed2025) + ' (2025)');
    if (rec.assessed2026 != null) assessed.push('$' + fmt(rec.assessed2026) + ' (2026)');
    if (assessed.length) {
      card.appendChild(el('p', null, 'Assessed: ' + assessed.join(' \u00B7 ')));
    }
    if (rec.appraised2026 != null) {
      card.appendChild(el('p', null, 'Appraised: $' + fmt(rec.appraised2026) + ' (2026)'));
    }
    if (rec.garage) {
      card.appendChild(el('p', null, rec.garage));
    }
    if (rec.countsNote) {
      card.appendChild(el('p', null, rec.countsNote));
    }
    if (rec.priceHistory) {
      card.appendChild(el('p', null, rec.priceHistory));
    }
    wrap.appendChild(card);
  }

  function renderPlanDims(house) {
    var pd = house.planDims;
    if (!pd) return;
    var wrap = document.getElementById('sheet-plandims');
    if (!wrap) return;
    var card = el('article', 'exam-card');
    card.appendChild(el('h2', null, 'Plan dimensions'));
    if (pd.note) card.appendChild(el('p', null, pd.note));
    [['floor1', '1st floor'], ['floor2', '2nd floor']].forEach(function (pair) {
      var list = pd[pair[0]];
      if (!list || !list.length) return;
      card.appendChild(el('h3', null, pair[1]));
      var ul = el('ul');
      list.forEach(function (item) { ul.appendChild(el('li', null, item)); });
      card.appendChild(ul);
    });
    wrap.appendChild(card);
  }

  function photoFigure(house, idx) {
    var fig = el('figure');
    var img = el('img', 'photo-img');
    img.src = house.photos.dir + 'photo-' + idx + '.jpg';
    img.alt = house.photos.captions[idx] || '';
    img.loading = 'lazy';
    fig.appendChild(img);
    fig.appendChild(el('figcaption', null, house.photos.captions[idx] || ''));
    return fig;
  }

  function renderPlans(house) {
    var wrap = document.getElementById('sheet-plans');
    wrap.appendChild(el('h2', null, 'Floor plans'));
    (house.photos.planFiles || []).forEach(function (idx) {
      wrap.appendChild(photoFigure(house, idx));
    });
  }

  function renderPhotos(house) {
    var wrap = document.getElementById('sheet-photos');
    wrap.appendChild(el('h2', null, 'Photos'));
    Object.keys(house.photos.captions)
      .sort(function (a, b) { return Number(a) - Number(b); })
      .forEach(function (idx) { wrap.appendChild(photoFigure(house, idx)); });
  }

  function renderNotes(house) {
    var wrap = document.getElementById('sheet-notes');
    var card = el('article', 'exam-card');
    card.appendChild(el('h2', null, 'Verified vs estimated'));
    var verified = house.verified || {};
    if (verified.sqft != null) {
      card.appendChild(el('p', null,
        'Verified: ' + fmt(verified.sqft) +
        ' sq ft living area, per the named public-record sources above.'));
    } else {
      card.appendChild(el('p', null, 'Verified: sq ft verification pending.'));
    }
    if (verified.caveat) {
      card.appendChild(el('p', null, 'Caveat: ' + verified.caveat));
    }
    if (house.planDims) {
      card.appendChild(el('p', null,
        'Estimated: the 3D model\u2019s room layout is anchored to the room ' +
        'dimensions printed on the Cubicasa plan, and each floor is scaled ' +
        'to its ' + cadName(house) + ' floor area (garage excluded from the ' +
        'living total). Ceiling heights are assumed (9 ft floor 1, 8 ft ' +
        'floor 2); the registration of the second floor over the first, and ' +
        'the garage placement, are estimated.'));
    } else {
      card.appendChild(el('p', null,
        'Estimated: room proportions in the 3D model are read from the Cubicasa ' +
        'plan drawing, which prints no dimensions; ceiling heights are assumed ' +
        '(9 ft floor 1, 8 ft floor 2). The model footprint is scaled so the two ' +
        'floors total the verified sq ft (garage and utility excluded).'));
    }
    wrap.appendChild(card);
  }

  function render(house) {
    document.getElementById('sheet-title').textContent = house.address;
    document.title = house.address + ' \u2014 Houses';
    document.getElementById('sheet-price').textContent =
      '$' + fmt(house.price) + ' \u2014 ' + (house.priceNote || '');
    if (house.listingUrl) {
      var a = el('a', null, house.listingLabel || 'Listing');
      a.href = house.listingUrl;
      document.getElementById('sheet-listing').appendChild(a);
    }
    renderFacts(house);
    renderRecord(house);
    renderPlanDims(house);
    renderPlans(house);
    renderPhotos(house);
    renderNotes(house);
  }

  fetch('houses.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === houseId) { render(list[i]); return; }
      }
      document.getElementById('sheet-title').textContent = 'House not found.';
    })
    .catch(function () {
      document.getElementById('sheet-title').textContent = 'Could not load house data.';
    });
})();
