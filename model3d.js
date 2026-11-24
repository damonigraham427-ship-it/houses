// 3D model for a house sheet — Three.js (global THREE, r128 UMD).
// Geometry comes from the house's own entry in houses.json (normalized room
// boxes read from the house's Cubicasa plan drawing). Two scaling shapes:
//  - shared-width floors: floorAreas split the verified total, floor 2 uses
//    floor 1's width and a lengthRatio, set offsetY down floor 1's length.
//  - independent floors (aspectWH.floor2 present): each floor is scaled to
//    its own recorded floor area with its own aspect ratio.
// The garage is drawn but excluded from the living total. Floor "voids"
// (open-to-below) render as a flat outlined rectangle with a label, no box.
(function () {
  // Built-in fallback (Unit B) if houses.json cannot be fetched at all.
  var FALLBACK = {
    id: '12251-w-village-dr-unit-b',
    claimed: { sqft: 1623 }, verified: { sqft: 1623 },
    geometry: {
      floorAreas: { floor1: 984, floor2: 639 },
      aspectWH: { floor1: 0.488 },
      floor1: { rooms: [
        { name: 'Kitchen',         x: 0.52, y: 0.00, w: 0.48, d: 0.39 },
        { name: 'Dining Area',     x: 0.30, y: 0.10, w: 0.70, d: 0.45 },
        { name: 'Living Room',     x: 0.00, y: 0.39, w: 0.46, d: 0.37 },
        { name: 'Half Bath',       x: 0.46, y: 0.39, w: 0.14, d: 0.14 },
        { name: 'Stairs',          x: 0.14, y: 0.62, w: 0.30, d: 0.14 },
        { name: 'Hall',            x: 0.44, y: 0.62, w: 0.26, d: 0.14 },
        { name: 'Foyer',           x: 0.00, y: 0.62, w: 0.14, d: 0.38 },
        { name: 'Primary Bedroom', x: 0.14, y: 0.76, w: 0.56, d: 0.24 },
        { name: 'Bath',            x: 0.70, y: 0.76, w: 0.30, d: 0.15 },
        { name: 'W.I.C.',          x: 0.70, y: 0.91, w: 0.30, d: 0.09 }
      ] },
      garage: { name: 'Garage + Utility',
                label: 'Garage + Utility (not in living sq ft)',
                wRatioToLivingW: 1.11, dRatioToLivingL: 0.39 },
      floor2: { offsetY: 0.35, lengthRatio: 0.65, rooms: [
        { name: 'Bedroom', x: 0.25, y: 0.00, w: 0.75, d: 0.42 },
        { name: 'Stairs',  x: 0.25, y: 0.42, w: 0.27, d: 0.15 },
        { name: 'Hall',    x: 0.52, y: 0.42, w: 0.28, d: 0.22 },
        { name: 'Bedroom', x: 0.00, y: 0.55, w: 0.64, d: 0.40 },
        { name: 'Bath',    x: 0.68, y: 0.64, w: 0.32, d: 0.31 },
        { name: 'Closet',  x: 0.64, y: 0.55, w: 0.10, d: 0.20 }
      ] },
      heightsFt: { floor1: 9, floor2: 8 }
    }
  };

  var COLORS = [0x93c5fd, 0xfca5a5, 0x86efac, 0xfcd34d, 0xc4b5fd,
                0xf9a8d4, 0x67e8f9, 0xfdba74, 0xa5b4fc, 0xbef264];

  function fmt(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function makeLabel(text, wide) {
    var canvas = document.createElement('canvas');
    canvas.width = wide ? 512 : 256;
    canvas.height = 80;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, 8, canvas.width, 64);
    ctx.font = 'bold ' + (wide ? 30 : 38) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(text, canvas.width / 2, 42);
    var tex = new THREE.CanvasTexture(canvas);
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    spr.scale.set(wide ? 16 : 8, 2.5, 1);
    return spr;
  }

  function roomBox(room, cx, cz, wFt, dFt, baseY, height, color, label) {
    var group = new THREE.Group();
    var geo = new THREE.BoxGeometry(wFt, height, dFt);
    var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      color: color, transparent: true, opacity: 0.55
    }));
    mesh.position.set(cx, baseY + height / 2, cz);
    group.add(mesh);
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x1f2937 }));
    edges.position.copy(mesh.position);
    group.add(edges);
    var text = label || room.name;
    var spr = makeLabel(text, text.length > 18);
    spr.position.set(cx, baseY + height + 1.6, cz);
    group.add(spr);
    return group;
  }

  // Flat outlined rectangle lying at baseY, with a floating label.
  function voidOutline(v, cx, cz, wFt, dFt, baseY) {
    var group = new THREE.Group();
    var y = baseY + 0.03;
    var pts = [
      new THREE.Vector3(cx - wFt / 2, y, cz - dFt / 2),
      new THREE.Vector3(cx + wFt / 2, y, cz - dFt / 2),
      new THREE.Vector3(cx + wFt / 2, y, cz + dFt / 2),
      new THREE.Vector3(cx - wFt / 2, y, cz + dFt / 2)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.LineLoop(geo,
      new THREE.LineBasicMaterial({ color: 0x1f2937 })));
    var spr = makeLabel(v.name, v.name.length > 18);
    spr.position.set(cx, baseY + 1.6, cz);
    group.add(spr);
    return group;
  }

  function build(house) {
    var container = document.getElementById('model');
    if (!container) return;
    if (typeof THREE === 'undefined') {
      container.textContent = '3D model could not load (Three.js unavailable).';
      return;
    }
    var geom = house.geometry;
    if (!geom || !geom.floorAreas) {
      container.textContent = 'No 3D geometry for this house yet.';
      return;
    }

    var fa = geom.floorAreas;
    var a1 = fa.floor1;
    var a2 = fa.floor2;
    var aTotal = a1 + a2;
    var h1 = (geom.heightsFt && geom.heightsFt.floor1) || 9;
    var h2 = (geom.heightsFt && geom.heightsFt.floor2) || 8;

    var w1 = Math.sqrt(a1 * geom.aspectWH.floor1);
    var l1 = a1 / w1;
    var independent2 = !!(geom.aspectWH && geom.aspectWH.floor2);
    var w2, l2;
    if (independent2) {
      w2 = Math.sqrt(a2 * geom.aspectWH.floor2);
      l2 = a2 / w2;
    } else {
      w2 = w1;
      l2 = l1 * ((geom.floor2 && geom.floor2.lengthRatio) || 1);
    }
    var off2 = ((geom.floor2 && geom.floor2.offsetY) || 0) * l1;
    var totalLen = Math.max(l1, off2 + l2);
    var wMax = Math.max(w1, w2);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45,
      container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(wMax * 1.35, totalLen * 0.95, totalLen * 1.05);

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0xe8edf3);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.95));
    var sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(40, 60, 25);
    scene.add(sun);

    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      new THREE.MeshLambertMaterial({ color: 0xdde5ee }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);

    // Floor 1 group (garage rides along with floor 1). Plan y runs
    // north->south; scene z runs -len/2 (north) .. +len/2 (south).
    var g1 = new THREE.Group();
    (geom.floor1.rooms || []).forEach(function (room, i) {
      var cx = (room.x + room.w / 2) * w1 - w1 / 2;
      var cz = (room.y + room.d / 2) * l1 - l1 / 2;
      g1.add(roomBox(room, cx, cz, room.w * w1, room.d * l1,
        0, h1, COLORS[i % COLORS.length]));
    });
    if (geom.garage) {
      var gar = geom.garage;
      if (gar.wRatioToLivingW) {
        var gw = gar.wRatioToLivingW * w1;
        var gd = gar.dRatioToLivingL * l1;
        var gCx = (0.86 * w1 - w1 / 2) - gw / 2;
        var gCz = -l1 / 2 - gd / 2;
        g1.add(roomBox(gar, gCx, gCz, gw, gd, 0, h1, 0x9ca3af,
          gar.label || gar.name));
      } else if (gar.sqft) {
        var gw2 = 20, gd2 = gar.sqft / 20;
        var gCx2 = -w1 / 2 - gw2 / 2;
        var gCz2 = -l1 / 2 + gd2 / 2;
        g1.add(roomBox(gar, gCx2, gCz2, gw2, gd2, 0, h1, 0x9ca3af,
          gar.label || gar.name));
      }
    }
    scene.add(g1);

    // Floor 2 group: north edge off2 south of floor 1's north edge.
    var g2 = new THREE.Group();
    var f2 = geom.floor2 || {};
    (f2.rooms || []).forEach(function (room, i) {
      var cx = (room.x + room.w / 2) * w2 - w2 / 2;
      var cz = -l1 / 2 + off2 + (room.y + room.d / 2) * l2;
      g2.add(roomBox(room, cx, cz, room.w * w2, room.d * l2,
        h1, h2, COLORS[(i + 3) % COLORS.length]));
    });
    (f2.voids || []).forEach(function (v) {
      var cx = (v.x + v.w / 2) * w2 - w2 / 2;
      var cz = -l1 / 2 + off2 + (v.y + v.d / 2) * l2;
      g2.add(voidOutline(v, cx, cz, v.w * w2, v.d * l2, h1));
    });
    scene.add(g2);

    // Floor toggle buttons.
    var btns = document.querySelectorAll('.floor-btns button');
    function setFloor(which) {
      g1.visible = which !== '2';
      g2.visible = which !== '1';
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].getAttribute('data-floor') === which) btns[i].classList.add('on');
        else btns[i].classList.remove('on');
      }
    }
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        setFloor(this.getAttribute('data-floor'));
      });
    }

    var readout = document.getElementById('model-readout');
    if (readout) {
      if (independent2) {
        var src = ((house.floorSplit && house.floorSplit.source) || '')
          .replace(/\s+acct\s+.*$/, '') || 'appraisal district';
        readout.textContent = 'Footprints: 1st floor \u2248 ' + w1.toFixed(1) +
          ' \u00D7 ' + l1.toFixed(1) + ' ft \u00B7 2nd floor \u2248 ' + w2.toFixed(1) +
          ' \u00D7 ' + l2.toFixed(1) + ' ft \u00B7 scaled to ' +
          (house.verified && house.verified.sqft === aTotal ? 'verified ' : '') +
          fmt(aTotal) + ' sq ft (' + src + ' floor areas)';
      } else {
        var verifiedSqft = house.verified ? house.verified.sqft : null;
        readout.textContent = 'Footprint \u2248 ' + w1.toFixed(1) + ' \u00D7 ' +
          l1.toFixed(1) + ' ft \u00B7 scaled to ' + fmt(aTotal) + ' sq ft (' +
          (verifiedSqft != null ? 'verified' : 'claimed \u2014 verification pending') + ')';
      }
    }

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 4, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.update();

    window.addEventListener('resize', function () {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    (function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    })();
  }

  var houseId = document.body.getAttribute('data-house-id');
  fetch('houses.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === houseId) { build(list[i]); return; }
      }
      var c = document.getElementById('model');
      if (c) c.textContent = 'House data not found.';
    })
    .catch(function () { build(FALLBACK); });
})();
