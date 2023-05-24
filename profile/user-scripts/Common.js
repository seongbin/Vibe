'use strict';

const _r = c => (c >> 16) & 0xff;
const _g = c => (c >> 8) & 0xff;
const _b = c => c & 0xff;
const _rgb = (r, g, b) => 0xff000000 | r << 16 | g << 8 | b;
const _n = c => _rgb(Math.abs(_r(c) - 255), Math.abs(_g(c) - 255), Math.abs(_b(c) - 255));
const tfo = { album: '$if(%length%,$if2(%album%,Single),Web Radios)', album_artist: '$if(%length%,$if2(%album artist%,Unknown album artist),Streams)', genre: '[$left(%date%, 4) \u00B7 ]$if2([%genre%],Unspecified)', title: '[%title%]', artist: '$if2([%artist%],Unknown artist)', count: '$ifequal(%play_count%,0,Never played,$ifequal(%play_count%,1,Played only once,$ifequal(%play_count%,2,Played twice,Played %play_count% times)))', released: 'Released $if3([%releasedate%],[%date%],[%last_modified%])', publisher: '$if3([%publisher%],%url%,Unspecified Publisher)', elap: '[%playback_time%]', remain: '[\'-\'%playback_time_remaining%]', status: '%codec% \u00B7 %bitrate% kbps [\u00B7 %samplerate% Hz ][\u00B7 %channels% ][\u00B7 %playback_time% / ][%length%]' };
const icon_name = _cf('Segoe Fluent Icons') ? 'Segoe Fluent Icons' : 'Segoe MDL2 Assets';
const icon_char = { min: '\ue921', max0: '\ue922', max1: '\ue923', ext: '\ue8bb', ltp: '\ue7c4', jsp: '\ue700', lst: '\ue90d', pip: '\uea5f', pls: '\ue189', bio: '\ueb68', plm: '\ue948', prf: '\ue713', npl: '\ue8a5', apl: '\ue8a6', lib: '\uf158', fav: '\ueb51', rct: '\ue823', prev: '\uf8ac', play: '\uf8ae', pause: '\uf5b0', next: '\uf8ad', shf0: '\ue14b', shf1: '\ue14b', rpt0: '\ue1cd', rpt1: '\ue1cc', radio: '\ue93e', nocover: '\ue93c', folder: '\ue838' };
const bs = _scale(36);
const ma = _scale(24);

function _panel() {
  this.item_focus_change = () => { if (this.metadb_func) { if (this.selection.b == 0) { this.metadb = fb.IsPlaying ? fb.GetNowPlaying() : fb.GetFocusItem(); } else { this.metadb = fb.GetFocusItem(); } on_metadb_changed(); if (!this.metadb) { _tt(''); } } }
  this.colours_changed = () => {
    if (window.InstanceType) {
      this.colours.normal = window.GetColourDUI(0);
      this.colours.background = window.GetColourDUI(1);
      this.colours.highlight = window.GetColourDUI(2);
    } else {
      this.colours.normal = window.GetColourCUI(0);
      this.colours.background = window.GetColourCUI(3);
      this.colours.highlight = window.GetColourCUI(4);
    }
    if (_r(this.colours.background) < 192 || _g(this.colours.background) < 192 || _b(this.colours.background) < 192) { this.colours.mode = 0; } else { this.colours.mode = 1; }
    this.colours.gray = 0xffb3b3b3;
    this.colours.btnface = utils.GetSysColour(15);
  }
  this.font_changed = () => {
    this.fonts.default = window.InstanceType ? window.GetFontDUI(0) : window.GetFontCUI(0);
    try { this.fonts.name = this.fonts.default.Name; this.fonts.size = this.fonts.default.Size; this.fonts.style = this.fonts.default.Style; } catch (e) { console.log(N, 'Cannot locate font name in SystemLink registery. Using', this.fonts.name, 'instead.'); this.fonts.name = 'arial'; this.fonts.size = 12; this.fonts.style = 0; }
    this.fonts.ratio = this.fonts.size / 12;
    this.fonts.normal = gdi.Font(this.fonts.name, this.fonts.size, this.fonts.style);
    this.fonts.bold = gdi.Font(this.fonts.name.toLowerCase() == 'segoe ui' ? 'Segoe UI Semibold' : this.fonts.name, this.fonts.size, 1);
    this.fonts.italic = gdi.Font(this.fonts.name, this.fonts.size, 2);
    this.fonts.head = gdi.Font(this.fonts.name.toLowerCase() == 'segoe ui' ? 'Segoe UI Semibold' : this.fonts.name, this.fonts.size + 8, 1);
    this.fonts.fixed = gdi.Font('Consolas', this.fonts.size, 0);
    this.fonts.rating = gdi.Font(_cf('guifx v2 transports') ? 'guifx v2 transports' : _cf('wingdings 2') ? 'wingdings 2' : 'arial', this.fonts.size + 12, 0);
  }
  this.rbtn_up = (x, y) => _menu(x, y);
  this.key_down = vkey => { switch (vkey) { case 0x25: fb.RunMainMenuCommand('Playback/Seek/Back by 5 seconds'); break; case 0x27: fb.RunMainMenuCommand('Playback/Seek/Ahead by 5 seconds'); break; default: break; } }
  this.paint = gr => gr.FillSolidRect(0, 0, this.w, this.h, this.colours.background);
  this.size = () => { this.w = window.Width; this.h = window.Height; }
  this.tf = (t, arg) => { if (!this.metadb) { return ''; } if (!this.tfo[t]) { this.tfo[t] = fb.TitleFormat(t); } const path = this.tfo['$if2(%__@%,%path%)'].EvalWithMetadb(this.metadb); if (fb.IsPlaying && (path.startsWith('http') || path.startsWith('mms') || arg)) { return this.tfo[t].Eval(); } else { return this.tfo[t].EvalWithMetadb(this.metadb); } }
  this.tfo = { '$if2(%__@%,%path%)': fb.TitleFormat('$if2(%__@%,%path%)') };
  this.colours = {};
  this.fonts = {};
  this.images = {};
  this.metadb = fb.GetFocusItem();
  this.metadb_func = typeof on_metadb_changed == 'function';
  if (this.metadb_func) { this.selection = new _p('VIBE.PANEL.SELECTION', 0); }
  this.colours_changed();
  this.font_changed();
}

function _chr2img(char, colour, w, h, isBgColour, isLeftAlgined, isMenu) {
  let bmp = gdi.CreateImage(w, h);
  let g = bmp.GetGraphics();
  let font = gdi.Font(icon_name, h / 3);
  g.SetTextRenderingHint(3);
  isBgColour && g.FillSolidRect(0, 0, w, h, isBgColour);
  g.DrawString(char, font, colour, isMenu ? h / 3 : 0, 0, isMenu ? w - h / 3 : w, h, isLeftAlgined ? SF.LC : SF.CENTRE);
  bmp.ReleaseGraphics(g);
  g = null;
  return bmp;
}