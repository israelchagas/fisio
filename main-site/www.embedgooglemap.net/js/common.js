/*
 * Clean client-side logic for Google Maps embed generator
 * - no obfuscation
 * - no anti-debug / console hijack
 * - no random backlinks
 *
 * Requires:
 * - bootstrap-slider (Slider)
 */

var chosenMapKind = 'location';
var slider = null;   // zoom
var wslider = null;  // width
var hslider = null;  // height
var SITE_URL = 'https://www.embedgooglemap.net/?utm_source=embed&utm_medium=referral&utm_campaign=map_embed';

function $(id) {
    return document.getElementById(id);
}

function safeInt(v, fallback) {
    var n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function getSelectedMapKind() {
    var radios = document.getElementsByName('goverlayOption');
    if (!radios || !radios.length) return chosenMapKind || 'location';

    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) return radios[i].value;
    }
    return chosenMapKind || 'location';
}

function updateKindUI(kind) {
    var loc = $('locationConf');
    var dir = $('directionConf');
    var note = $('directionNote');

    if (loc) loc.style.display = (kind === 'location') ? 'block' : 'none';
    if (dir) dir.style.display = (kind === 'direction') ? 'block' : 'none';
    if (note) note.style.display = (kind === 'direction') ? 'block' : 'none';
}

function buildMapSrc(params) {
    // Simple embed URL without API key
    return (
        'https://maps.google.com/maps'
        + '?width=' + encodeURIComponent(String(params.width))
        + '&height=' + encodeURIComponent(String(params.height))
        + '&hl=' + encodeURIComponent(String(params.hl || 'en'))
        + '&q=' + encodeURIComponent(String(params.q))
        + '&t=' + encodeURIComponent(String(params.t || ''))
        + '&z=' + encodeURIComponent(String(params.z))
        + '&ie=UTF8&iwloc=B&output=embed'
    );
}
function getAddressText(kind) {
    if (kind === 'direction') {
        var d = $('dAddress') && $('dAddress').value.trim();
        if (d) return d;
        var s = $('sAddress') && $('sAddress').value.trim();
        return s || '';
    }
    return $('address') && $('address').value.trim();
}

function getInputs(kind) {
    var address = ($('address') && $('address').value) ? $('address').value.trim() : '';
    var sAddress = ($('sAddress') && $('sAddress').value) ? $('sAddress').value.trim() : '';
    var dAddress = ($('dAddress') && $('dAddress').value) ? $('dAddress').value.trim() : '';

    var mapType = ($('map_type') && $('map_type').value) ? $('map_type').value : '';
    var zoom = safeInt(($('mapZoom') && $('mapZoom').value) ? $('mapZoom').value : '', 14);
    zoom = clamp(zoom, 1, 20);

    var width = safeInt(($('widthValue') && $('widthValue').value) ? $('widthValue').value : '', 600);
    var height = safeInt(($('heightValue') && $('heightValue').value) ? $('heightValue').value : '', 400);
    width = clamp(width, 1, 2048);
    height = clamp(height, 1, 2048);

    var q = (kind === 'direction')
        ? ((sAddress || '') + ' to ' + (dAddress || '')).trim()
        : (address || '');

    return { q, mapType, zoom, width, height };
}

function renderPreview(kind) {
    kind = kind || getSelectedMapKind();
    chosenMapKind = kind;

    updateKindUI(kind);

    var inputs = getInputs(kind);
    if (!inputs.q) return; // don't blank preview if empty

    var iframe = $('map-canvas'); // expected to be an <iframe>
    if (!iframe) return;

    iframe.setAttribute('width', String(inputs.width));
    iframe.setAttribute('height', String(inputs.height));
    iframe.setAttribute('src', buildMapSrc({
        width: inputs.width,
        height: inputs.height,
        hl: 'en',
        q: inputs.q,
        t: inputs.mapType,
        z: inputs.zoom
    }));
}

/* ===== Inline HTML handlers ===== */

function updateConf() {
    chosenMapKind = getSelectedMapKind();
    updateKindUI(chosenMapKind);

    // Optional defaults switching like original script did
    if (chosenMapKind === 'direction') {
        if ($('widthValue')) $('widthValue').value = 600;
        if ($('heightValue')) $('heightValue').value = 450;
        if ($('mapZoom')) $('mapZoom').value = 10;

        if (wslider && wslider.setValue) wslider.setValue(600);
        if (hslider && hslider.setValue) hslider.setValue(450);
        if (slider && slider.setValue) slider.setValue(10);
    } else {
        if ($('widthValue')) $('widthValue').value = 600;
        if ($('heightValue')) $('heightValue').value = 400;
        if ($('mapZoom')) $('mapZoom').value = 14;

        if (wslider && wslider.setValue) wslider.setValue(600);
        if (hslider && hslider.setValue) hslider.setValue(400);
        if (slider && slider.setValue) slider.setValue(14);
    }

    refreshMap(chosenMapKind);
}

function refreshMap(kind) {
    renderPreview(kind);
}

function mapCanvas(changedId) {
    // keep sliders in sync with numeric inputs
    if (changedId === 'widthValue') {
        var w = clamp(safeInt($('widthValue') ? $('widthValue').value : '', 600), 1, 2048);
        if (wslider && wslider.setValue) wslider.setValue(w);
    }
    if (changedId === 'heightValue') {
        var h = clamp(safeInt($('heightValue') ? $('heightValue').value : '', 400), 1, 2048);
        if (hslider && hslider.setValue) hslider.setValue(h);
    }

    renderPreview(getSelectedMapKind());
}

function setSliderVal(inputId) {
    // called from keyup on numeric inputs
    mapCanvas(inputId);
}

function isNumber(evt) {
    var code = evt && (evt.which || evt.keyCode);
    if (!code) return true;
    // allow backspace, delete, arrows, tab
    if ([8, 9, 37, 39, 46].indexOf(code) !== -1) return true;
    return code >= 48 && code <= 57;
}

function goverlayFn() {
    // if an overlay block exists, toggle it
    var el = $('goverlayOption');
    if (!el) return;
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

function generateCode() {
    var kind = getSelectedMapKind();
    var inputs = getInputs(kind);
    var out = $('codeOutput');
    if (!out) return;

    if (!inputs.q) {
        out.value = '';
        return;
    }

    var responsive = $('isResponsive') ? $('isResponsive').checked : false;

    var src = buildMapSrc({
        width: inputs.width,
        height: inputs.height,
        hl: 'en',
        q: inputs.q,
        t: inputs.mapType,
        z: inputs.zoom
    });

    var code;
    if (responsive) {
        var ratio = Math.round((inputs.height / inputs.width) * 10000) / 100;
        code =
            '<div style="width:100%;">\n' +
            '  <div style="position:relative; padding-bottom:' + ratio + '%; height:0; overflow:hidden;">\n' +
            '    <iframe src="' + src + '" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>\n' +
            '  </div>\n' +
            '</div>\n' +
            '<div style="font-size: 10px;opacity:.75;line-height: 10px;">' +
            '<a href="' + SITE_URL + '" target="_blank" rel="noopener">Embed Google Map</a>' +
            '</div>';
    } else {
        code =
            '<iframe width="' + inputs.width + '" height="' + inputs.height + '" ' +
            'src="' + src + '" style="border:0;" allowfullscreen loading="lazy" ' +
            'referrerpolicy="no-referrer-when-downgrade"></iframe>\n' +
            '<div style="font-size: 10px;opacity:.75;line-height: 10px;">' +
            '<a href="' + SITE_URL + '" target="_blank" rel="noopener">Embed Google Map</a>' +
            '</div>';
    }

    out.value = code;
    renderPreview(kind);
}

function copyToClip() {
    var el = $('codeOutput');
    if (!el || !el.value) return;
function debounce(fn, wait) {
    var t = null;
    return function () {
        var args = arguments;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
}

function bindFormListeners() {
    var ids = [
        'address', 'sAddress', 'dAddress',
        'map_type', 'mapZoom',
        'widthValue', 'heightValue',
        'isResponsive'
    ];

    var handler = debounce(function () {
        refreshMap(getSelectedMapKind());
    }, 120);

    ids.forEach(function (id) {
        var el = $(id);
        if (!el) return;

        // input covers typing/paste/mobile; change covers selects/checkboxes
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    });
}

    var btn = $('copyToClip');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.value).then(function () {
            if (btn) btn.textContent = 'Copied';
            setTimeout(function () { if (btn) btn.textContent = 'Copy code to clipboard'; }, 2000);
        }).catch(function () {
            el.focus(); el.select();
            try { document.execCommand('copy'); } catch (e) {}
        });
        return;
    }

    el.focus(); el.select();
    try {
        document.execCommand('copy');
        if (btn) btn.textContent = 'Copied';
        setTimeout(function () { if (btn) btn.textContent = 'Copy code to clipboard'; }, 2000);
    } catch (e) {}
}

/* ===== Init ===== */

document.addEventListener('DOMContentLoaded', function () {
    // Sliders are optional: don't crash the page if missing
    try {
        if (window.Slider) {
            slider = new Slider('#mapZoom', {
                formatter: function (v) { return 'Current value: ' + v; }
            });

            wslider = new Slider('#mapWidth');
            hslider = new Slider('#mapHeight');

            if (wslider && wslider.on) {
                wslider.on('change', function (e) {
                    if ($('widthValue')) $('widthValue').value = e.newValue;
                    renderPreview(getSelectedMapKind());
                });
            }

            if (hslider && hslider.on) {
                hslider.on('change', function (e) {
                    if ($('heightValue')) $('heightValue').value = e.newValue;
                    renderPreview(getSelectedMapKind());
                });
            }

            if (slider && slider.on) {
                slider.on('change', function () {
                    renderPreview(getSelectedMapKind());
                });
            }
        }
    } catch (e) {
        console.warn('Slider init failed:', e);
    }

    bindFormListeners();
    renderPreview(getSelectedMapKind());
});