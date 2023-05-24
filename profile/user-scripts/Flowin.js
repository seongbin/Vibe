'use strict';

const panel = new _panel;
const pip = new _pip;
const seekbar = new _seekbar;
const volume = new _volume;
const hacks = new _hacks;
const buttons = new _buttons;

on_playback_new_track(fb.GetNowPlaying());
panel.item_focus_change();

function _pip() {
  this.get_album_art = async obj => { if (!panel.metadb) return; let result = await utils.GetAlbumArtAsyncV2(window.ID, panel.metadb, 0); if (result.image) { obj.path = result.path; obj.img = result.image; } else { obj.path = null; obj.img = panel.tfo['$if2(%__@%,%path%)'].EvalWithMetadb(panel.metadb).startsWith('http') ? _chr2img(icon_char.radio, panel.colours.normal & 0x48ffffff, this.cover_size, this.cover_size, panel.colours.background == 0xffffffff ? panel.colours.btnface : _blendColours(panel.colours.btnface, panel.colours.background, 0.9)) : _chr2img(icon_char.nocover, panel.colours.normal & 0x48ffffff, this.cover_size, this.cover_size, panel.colours.background == 0xffffffff ? panel.colours.btnface : _blendColours(panel.colours.btnface, panel.colours.background, 0.9)); } window.Repaint(); }
  this.lbtn_dblclk = (x, y) => this.trace(x, y) && hacks.normal();
  this.leave = () => { if (this.hover) { this.hover = false; window.RepaintRect(this.x, this.y, this.cover_size, this.cover_size); } }
  this.move = (x, y) => { if (this.trace(x, y) && panel.metadb) { try { this.hover = true; window.RepaintRect(this.x, this.y, this.cover_size, this.cover_size); } catch (e) {} return true; } else { this.leave(); return false; } }
  this.metadb_changed = () => { panel.metadb ? this.get_album_art(this) : window.Repaint(); }
  this.size = () => { this.x = 0; this.y = 0; this.cover_size = panel.w; }
  this.trace = (x, y) => x > this.x && x < this.x + this.cover_size && y > this.y && y < this.y + this.cover_size;
  this.paint = gr => {
    try {
      this.img_blur = this.img.Clone(0, 0, this.img.Width, this.img.Height);
      this.img_blur.StackBlur(254);
      _drawImage(gr, this.img_blur, this.x, this.y, this.cover_size, this.cover_size, image.stretch);
      _drawImage(gr, this.img, this.x, this.y, this.cover_size, this.cover_size, image.centre);
      if (this.hover) {
        gr.FillSolidRect(this.x, this.y, panel.w, panel.h, 0x96000000);
        gr.GdiDrawText(panel.tf(tfo.artist), panel.fonts.head, 0xffffffff, this.x + ma * 0.5, this.y + ma * 0.5, this.cover_size - ma, panel.fonts.head.Height, LEFT);
        gr.GdiDrawText(panel.tf(tfo.title), panel.fonts.head, 0xffffffff, this.x + ma * 0.5, this.y + ma * 0.5 + panel.fonts.head.Height, this.cover_size - ma, panel.fonts.head.Height, LEFT);
      }
    } catch (e) {}
  }
  this.img = null; this.img_blur = null; this.path = null; this.hover = false;
}

function _seekbar() {
  this.interval_func = () => { if (fb.IsPlaying && !fb.IsPaused && fb.PlaybackLength > 0) { this.repaint(); } }
  this.playback_pause = () => this.repaint();
  this.playback_stop = () => this.repaint();
  this.pos = () => Math.ceil(this.w * fb.PlaybackTime / fb.PlaybackLength);
  this.repaint = () => window.RepaintRect(this.x, this.y, this.w, this.h);
  this.size = () => { this.x = 0; this.y = 0; this.w = panel.w; this.h = _scale(4); }
  this.paint = gr => fb.PlaybackLength > 0 && gr.FillSolidRect(this.x, this.y, this.pos(), this.h, fb.IsPaused ? panel.colours.gray : panel.colours.highlight);
  window.SetInterval(this.interval_func, 150);
}

function _volume() {
  this.vol2percentage = v => (Math.pow(10, v / 50) - 0.01) / 0.99;
  this.size = () => { this.w = _textWidth('00000', panel.fonts.head); this.h = panel.fonts.head.Height; this.x = panel.w / 2 - this.w / 2; this.y = panel.h / 2 - this.h / 2; }
  this.paint = gr => {
    if (this.v_timer > 0) {
      this.percentage = Math.ceil(this.vol2percentage(fb.Volume) * 100) + '%';
      gr.SetSmoothingMode(2);
      gr.FillRoundRect(this.x - 5, this.y - 5, this.w + 10, this.h + 10, 5, 5, 0x96000000);
      gr.GdiDrawText(this.percentage, panel.fonts.head, 0xffffffff, this.x, this.y, this.w, this.h, CENTRE);
    }
  }
  this.v_timer = 0;
}

buttons.update = () => {
  buttons.buttons.shuffle = new _button(panel.w / 2 - bs * 2.5 , panel.h - bs, bs, bs, { normal : _chr2img( (plman.PlaybackOrder == 0) ? icon_char.shf0 : (plman.PlaybackOrder == 4) ? icon_char.shf1 : icon_char.shf0, (plman.PlaybackOrder == 0) ? panel.colours.gray : (plman.PlaybackOrder == 4) ? _blendColours(panel.colours.highlight, panel.colours.gray, 0.35) : panel.colours.gray, bs, bs), hover : _chr2img( (plman.PlaybackOrder == 0) ? icon_char.shf0 : (plman.PlaybackOrder == 4) ? icon_char.shf1 : icon_char.shf0, (plman.PlaybackOrder == 0) ? 0xffffffff : (plman.PlaybackOrder == 4) ? panel.colours.highlight : 0xffffffff, bs, bs, 0x96000000) }, (x, y) => { buttons.shuffle(); }, '');
  buttons.buttons.prev = new _button(panel.w / 2 - bs * 1.5 , panel.h - bs, bs, bs, {normal : _chr2img(icon_char.prev, panel.colours.gray, bs, bs), hover : _chr2img(icon_char.prev, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { fb.Prev(); }, '');
  buttons.buttons.play = new _button(panel.w / 2 - bs * 0.5, panel.h - bs, bs, bs, {normal : _chr2img(!fb.IsPlaying || fb.IsPaused ? icon_char.pause : icon_char.play, panel.colours.gray, bs, bs), hover : _chr2img(!fb.IsPlaying || fb.IsPaused ? icon_char.pause : icon_char.play, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { fb.PlayOrPause(); }, '');
  buttons.buttons.next = new _button(panel.w / 2 + bs * 0.5, panel.h - bs, bs, bs, {normal : _chr2img(icon_char.next, panel.colours.gray, bs, bs), hover : _chr2img(icon_char.next, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { fb.Next(); }, '');
  buttons.buttons.repeat = new _button(panel.w / 2 + bs * 1.5, panel.h - bs, bs, bs, { normal : _chr2img( (plman.PlaybackOrder == 0) ? icon_char.rpt0 : (plman.PlaybackOrder == 2) ? icon_char.rpt1 : icon_char.rpt0, (plman.PlaybackOrder == 0) ? panel.colours.gray : (plman.PlaybackOrder == 2) ? _blendColours(panel.colours.highlight, panel.colours.gray, 0.35) : panel.colours.gray, bs, bs), hover : _chr2img( (plman.PlaybackOrder == 0) ? icon_char.rpt0 : (plman.PlaybackOrder == 2) ? icon_char.rpt1 : icon_char.rpt0, (plman.PlaybackOrder == 0) ? 0xffffffff : (plman.PlaybackOrder == 2) ? panel.colours.highlight : 0xffffffff, bs, bs, 0x96000000) }, (x, y) => { buttons.repeat(); }, '');
  buttons.buttons.exit = new _button(panel.w - bs, 0, bs, bs, {normal : _chr2img(icon_char.ext, panel.colours.gray, bs, bs), hover : _chr2img(icon_char.ext, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { fb.RunMainMenuCommand('View/Flowin/Pip/Show'); }, '');
}

buttons.repeat = () => {
	if (plman.PlaybackOrder !== 2) {
		plman.PlaybackOrder = 2;
	}
	else {
		plman.PlaybackOrder = 0;
	}
	window.Repaint();
}

buttons.shuffle = () => {
	if (plman.PlaybackOrder !== 4) {
    plman.PlaybackOrder = 4;
	}
	else {
		plman.PlaybackOrder = 0;
	}
	window.Repaint();
}

function on_colours_changed() { panel.colours_changed(); buttons.update(); window.Repaint(); }
function on_font_changed() {}
function on_item_focus_change() { panel.item_focus_change(); }
function on_key_down(vkey) { panel.key_down(vkey); }
function on_metadb_changed() { pip.metadb_changed(); }
function on_mouse_lbtn_dblclk(x, y) { pip.lbtn_dblclk(x, y); }
function on_mouse_lbtn_down(x, y) {}
function on_mouse_lbtn_up(x, y) { buttons.lbtn_up(x, y); }
function on_mouse_leave() { pip.leave(); buttons.leave(); }
function on_mouse_move(x, y) { pip.move(x, y); buttons.move(x, y); }
function on_mouse_rbtn_up(x, y) { return true; }
function on_mouse_wheel(s) { if (s == 1) { fb.VolumeUp(); } else { fb.VolumeDown(); } }
function on_playback_dynamic_info_track() { panel.item_focus_change(); }
function on_playback_edited() {}
function on_playback_new_track() { panel.item_focus_change(); }
function on_playback_order_changed () { buttons.update(); }
function on_playback_stop(reason) { if (reason != 2) { panel.item_focus_change(); } buttons.update(); }
function on_playback_pause() { seekbar.playback_pause(); buttons.update(); }
function on_playback_starting() { buttons.update(); }
function on_playlist_switch() { panel.item_focus_change(); }
function on_volume_change() { if (volume.v_timer) window.ClearTimeout(volume.v_timer); volume.v_timer = window.SetTimeout(function() { volume.v_timer = 0; window.Repaint(); }, 1500); window.Repaint(); }
function on_size() { panel.size(); pip.size(); seekbar.size(); volume.size(); buttons.update(); }
function on_paint(gr) { panel.paint(gr); pip.paint(gr); seekbar.paint(gr); volume.paint(gr); pip.hover && buttons.paint(gr); }
