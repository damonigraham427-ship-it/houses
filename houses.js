// Houses portal — one card per house from houses.json.
// Each card doors into the house's sheet page (house-<id>.html).
(function () {
  var wrap = document.getElementById('house-cards');

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function renderCard(house) {
    var card = document.createElement('article');
    card.className = 'exam-card';

    var h = document.createElement('h2');
    h.textContent = house.address || '';
    card.appendChild(h);

    if (house.photos && house.photos.dir && house.photos.captions) {
      var keys = Object.keys(house.photos.captions)
        .sort(function (a, b) { return Number(a) - Number(b); });
      var img = document.createElement('img');
      img.className = 'house-cover';
      img.src = house.photos.dir + 'photo-' + keys[0] + '.jpg';
      img.alt = house.address || 'House photo';
      card.appendChild(img);
    }

    var price = document.createElement('p');
    price.textContent = '$' + fmt(house.price || 0);
    card.appendChild(price);

    var sq = document.createElement('p');
    var claimed = house.claimed ? house.claimed.sqft : null;
    var verified = house.verified ? house.verified.sqft : null;
    var line = 'Claimed ' + (claimed != null ? fmt(claimed) : '?') + ' sq ft';
    line += ' \u00B7 Verified ' + (verified != null ? fmt(verified) + ' sq ft' : 'pending');
    sq.textContent = line;
    card.appendChild(sq);

    var link = document.createElement('a');
    link.className = 'start-btn';
    link.href = 'house-' + house.id + '.html';
    link.textContent = 'View sheet';
    card.appendChild(link);

    return card;
  }

  function render(data) {
    var list = data || [];
    if (!list.length) {
      var p = document.createElement('p');
      p.className = 'cl-empty';
      p.textContent = 'No houses yet.';
      wrap.appendChild(p);
      return;
    }
    list.forEach(function (house) { wrap.appendChild(renderCard(house)); });
  }

  fetch('houses.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () { render([]); });
})();
