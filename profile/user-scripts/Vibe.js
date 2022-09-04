'use strict';

const pbo = { name: ['Default', 'Repeat (playlist)', 'Repeat (track)', 'Random', 'Shuffle (tracks)', 'Shuffle (albums)', 'Shuffle (folders)'], active: plman.PlaybackOrder, button: null };
const panel = new _panel;
const albumart = new _albumart;
const seekbar = new _seekbar;
const volume = new _volume;
const rating = new _rating;
const buttons = new _buttons;
pbo.button = new _pbo(pbo.name[pbo.active]);

on_playback_new_track(fb.GetNowPlaying());
panel.item_focus_change();

function _albumart() {
  this.colours_changed = () => this.get_album_art(this);
  this.get_album_art = async obj => { if (!panel.metadb) return; let result = await utils.GetAlbumArtAsyncV2(window.ID, panel.metadb, 0); if (result.image) { obj.path = result.path; obj.img = result.image; } else { obj.path = null; obj.img = panel.tfo['$if2(%__@%,%path%)'].EvalWithMetadb(panel.metadb).startsWith('http') ? _chr2img(icon_char.radio, panel.colours.normal & 0x48ffffff, this.cover_size, this.cover_size, panel.colours.background == 0xffffffff ? panel.colours.btnface : _blendColours(panel.colours.btnface, panel.colours.background, 0.9)) : _chr2img(icon_char.nocover, panel.colours.normal & 0x48ffffff, this.cover_size, this.cover_size, panel.colours.background == 0xffffffff ? panel.colours.btnface : _blendColours(panel.colours.btnface, panel.colours.background, 0.9)); } window.Repaint(); }
  this.mask = img => { let temp_bmp = gdi.CreateImage(img.Width, img.Height); let temp_gr = temp_bmp.GetGraphics(); temp_gr.FillSolidRect(0, 0, img.Width, img.Height, 0x96000000); temp_bmp.ReleaseGraphics(temp_gr); temp_gr = null; return temp_bmp; }
  this.metadb_changed = () => { panel.metadb ? this.get_album_art(this) : window.Repaint(); }
  this.leave = () => { if (this.hover) { this.hover = false; window.RepaintRect(this.x, this.y, this.cover_size, this.cover_size); } }
  this.move = (x, y) => { if (this.trace(x, y) && panel.metadb) { try { this.hover = true; window.RepaintRect(this.x, this.y, this.cover_size, this.cover_size); } catch (e) {} return true; } else { this.leave(); return false; } }
  this.size = () => { this.cover_size = panel.w - ma * 2; this.x = ma; if (Math.round((panel.h * 0.5) - this.cover_size) > (bs * 4)) { this.y = Math.round(panel.h * 0.5) - this.cover_size; } else { this.y = bs * 4; } }
  this.trace = (x, y) => x > this.x && x < this.x + this.cover_size && y > this.y && y < this.y + this.cover_size;
  this.paint = gr => {
    try {
      _drawImage(gr, this.img, this.x, this.y, this.cover_size, this.cover_size, image.centre, _blendColours(panel.colours.background, panel.colours.gray, 0.1));
      gr.GdiDrawText(panel.tf(tfo.album), panel.fonts.head, panel.colours.normal, this.x, this.y - panel.fonts.bold.Height - panel.fonts.head.Height * 2 - TM * 1.5, panel.w - ma * 2, 0, LEFT);
      gr.GdiDrawText(panel.tf(tfo.album_artist), panel.fonts.head, panel.colours.highlight, this.x, this.y - panel.fonts.bold.Height - panel.fonts.head.Height - TM, panel.w - ma * 2, 0, LEFT);
      gr.GdiDrawText(panel.tf(tfo.genre), panel.fonts.bold, panel.colours.gray, this.x, this.y - panel.fonts.bold.Height - TM * 0.5, panel.w - ma * 2, 0, LEFT);
      gr.GdiDrawText(panel.tf(tfo.title), panel.fonts.head, panel.colours.normal, this.x, seekbar.y + seekbar.h + panel.fonts.fixed.Height + TM * 2.5, panel.w - ma * 2, 0, LEFT);
      gr.GdiDrawText(panel.tf(tfo.artist), panel.fonts.head, panel.colours.highlight, this.x, seekbar.y + seekbar.h + panel.fonts.fixed.Height + panel.fonts.head.Height + TM * 3, panel.w - ma * 2, 0, LEFT);
      gr.GdiDrawText(panel.tf(tfo.count), panel.fonts.bold, panel.colours.gray, this.x, seekbar.y + seekbar.h + panel.fonts.fixed.Height + panel.fonts.head.Height * 2 + TM * 3.5, panel.w - ma * 2, 0, LEFT);
      gr.GdiDrawText(panel.tf(tfo.released), panel.fonts.normal, panel.colours.gray, this.x, seekbar.y + seekbar.h + panel.fonts.fixed.Height + panel.fonts.head.Height * 2 + panel.fonts.bold.Height + TM * 4, panel.w - ma * 2, 0, LEFT);
      gr.GdiDrawText(panel.tf(tfo.publisher), panel.fonts.normal, panel.colours.gray, this.x, seekbar.y + seekbar.h + panel.fonts.fixed.Height + panel.fonts.head.Height * 2 + panel.fonts.bold.Height + panel.fonts.normal.Height + TM * 4.5, panel.w - ma * 2, 0, LEFT);
      this.hover && _drawImage(gr, this.mask(this.img), this.x, this.y, this.cover_size, this.cover_size, image.centre, _blendColours(panel.colours.background, panel.colours.gray, 0.1));
    } catch (e) {}
  }
  this.img = null; this.path = null; this.hover = false;
}

function _seekbar() {
  this.interval_func = () => { if (fb.IsPlaying && !fb.IsPaused && fb.PlaybackLength > 0) { this.playback_seek(); } }
  this.lbtn_down = (x, y) => { if (this.trace(x, y)) { if (fb.IsPlaying && fb.PlaybackLength > 0) { this.drag = true; } return true; } else { return false; } }
  this.lbtn_up = (x, y) => { if (this.trace(x, y)) { if (this.drag) { this.drag = false; fb.PlaybackTime = fb.PlaybackLength * this.drag_seek; } return true; } else { return false; } }
  this.move = (x, y) => { this.mx = x; this.my = y; if (fb.IsPlaying || fb.IsPaused) { if (this.trace(x, y)) { if (fb.IsPlaying && fb.PlaybackLength > 0) { x -= this.x; this.drag_seek = x < 0 ? 0 : x > this.w ? 1 : x / this.w; _tt(utils.FormatDuration(fb.PlaybackLength * this.drag_seek)); if (this.drag) { this.playback_seek(); } } this.hover = true; } else { if (this.hover) { _tt(''); } this.hover = false; this.drag = false; } } }
  this.playback_seek = () => window.RepaintRect(this.x, this.y - this.mh * 0.5, this.w, this.h + this.mh + TM * 1.5 + panel.fonts.fixed.Height);
  this.playback_stop = () => this.playback_seek();
  this.pos = () => Math.ceil(this.w * (this.drag ? this.drag_seek : fb.PlaybackTime / fb.PlaybackLength));
  this.trace = (x, y) => { const m = this.drag ? this.h * 2 : this.h; return x > this.x - m && x < this.x + this.w + (m * 2) && y > this.y - m && y < this.y + this.h + (m * 2); }
  this.wheel = s => { if (this.trace(this.mx, this.my)) { switch (true) { case !fb.IsPlaying: case fb.PlaybackLength <= 0: break; case fb.PlaybackLength < 60: fb.PlaybackTime += s * 5; break; case fb.PlaybackLength < 600: fb.PlaybackTime += s * 10; break; default: fb.PlaybackTime += s * 60; break; } _tt(''); return true; } else { return false; } }
  this.size = () => { this.x = ma; this.y = albumart.y + albumart.cover_size + TM; this.w = albumart.cover_size; this.h = _scale(4); }
  this.paint = gr => {
    fb.IsPlaying && gr.FillSolidRect(this.x, this.y, this.w, this.h, _blendColours(panel.colours.background, panel.colours.gray, 0.25));
    if (fb.PlaybackLength > 0) {
      let elap_w = gr.CalcTextWidth(panel.tf(tfo.elap, true), panel.fonts.fixed);
      let remain_w = gr.CalcTextWidth(panel.tf(tfo.remain, true), panel.fonts.fixed);
      gr.FillSolidRect(this.x, this.y, this.pos(), this.h, this.hover ? panel.colours.highlight : _blendColours(panel.colours.background, panel.colours.gray, 0.5));
      if (this.hover && this.pos() > 0) {
        gr.FillSolidRect(this.x + this.pos(), this.y - this.mh * 0.5, this.mw, this.h + this.mh, panel.colours.highlight);
      }
      gr.GdiDrawText(panel.tf(tfo.elap, true), panel.fonts.fixed, panel.colours.gray, this.x, this.y + this.h + TM * 1.5, elap_w, 0, LEFT);
      gr.GdiDrawText(panel.tf(tfo.remain, true), panel.fonts.fixed, panel.colours.gray, this.x + this.w - remain_w, this.y + this.h + TM * 1.5, remain_w, 0, RIGHT);
    }
  }
  this.mx = 0; this.my = 0; this.mw = _scale(4); this.mh = _scale(8); this.hover = false; this.drag = false; this.drag_seek = 0; window.SetInterval(this.interval_func, 150);
}

function _rating() {
  this.lbtn_up = (x, y) => { if (this.trace(x, y)) { if (panel.metadb) { this.set_rating(); } return true; } else { return false; } }
  this.leave = () => { if (this.hover) { _tt(''); this.hover = false; window.RepaintRect(this.x, this.y, this.w, this.rating_size); } }
  this.metadb_changed = () => { try { this.hover = false; this.rating = this.get_rating(); this.hrating = this.rating; this.tiptext = panel.tf('Rate "%title%" by "%artist%".'); } catch (e) {} window.Repaint(); }
  this.move = (x, y) => { if (this.trace(x, y)) { try { _tt(this.tiptext); this.hover = true; this.hrating = Math.ceil((x - this.x) / this.rating_size); window.RepaintRect(this.x, this.y, this.w, this.rating_size); } catch (e) {} return true; } else { this.leave(); return false; } }
  this.get_rating = () => panel.tf('$if2(%rating%,0)');
  this.set_rating = () => fb.RunContextCommandWithMetadb('Rating/' + (this.hrating == this.rating ? '<not set>' : this.hrating), panel.metadb, 8);
  this.trace = (x, y) => x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.rating_size;
  this.size = () => { this.x = ma - _scale(2); this.y = seekbar.y + seekbar.h + panel.fonts.fixed.Height + panel.fonts.head.Height * 2 + panel.fonts.bold.Height + panel.fonts.normal.Height * 2 + TM * 4.5; }
  this.paint = gr => { if (panel.metadb) { gr.SetTextRenderingHint(3); try { for (let i = 0; i < 5; i++) { gr.DrawString(_cf('guifx v2 transports') ? 'b' : _cf('wingdings 2') ? String.fromCharCode(234) : String.fromCharCode(0x25CF), panel.fonts.rating, i + 1 > (this.hover ? this.hrating : this.rating) ? panel.colours.normal & 0x20ffffff : this.colour, this.x + (i * this.rating_size), this.y, this.rating_size, this.rating_size, SF.CENTRE); } } catch (e) {} } }
  this.rating_size = panel.fonts.rating.Size; this.w = this.rating_size * 5; this.colour = 0xffffa500; this.hover = false; this.rating = 0; this.hrating = 0;
}

function _volume() {
	this.lbtn_down = (x, y) => { if (this.v_drag_hov) { this.v_drag = true; on_mouse_move(x, y); } else { this.v_drag = false; } }
	this.lbtn_up = () => { this.v_drag = false; }
	this.leave = () => { this.v_hover = false; this.repaint(); }
	this.move = (x, y) => {
    let hover = x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	  let hover1 = x > this.vx1 && x < this.vx1 + this.vw1 && y > this.vy1 && y < this.vy1 + this.vh1 + this.h * 3;
    let hover2 = x > this.vx2 && x < this.vx2 + this.vw2 && y > this.vy2 && y < this.vy2 + this.vh2 + this.vw2;
	  let tmp = this.v_drag_hov;
	  if (this.v_drag) { this.v_hover = true; } else { let tmp = this.v_hover; if (hover) { this.v_hover = true; } else if (!hover1) { this.v_hover = false; } if (this.v_hover != tmp || this.v_hover) { this.repaint(); } }
	  if (hover2 && this.v_hover) { this.v_drag_hov = true; window.SetCursor(IDC_HAND); } else { this.v_drag_hov = false; window.SetCursor(IDC_ARROW); }
	  if (tmp != this.v_drag_hov) this.repaint();
	  if (this.v_drag) { this.v = this.pos2vol(y); if (this.v <= -100) this.v = -100; if (this.v >= 0) this.v = 0; fb.Volume = this.v; }
	}
	this.pos2vol = pos => { return (50 * Math.log(0.99 * ((this.vy2 + this.vh2 + (this.vw2 / 2) - pos) / this.vh2 < 0 ? 0 : (this.vy2 + this.vh2 + (this.vw2 / 2) - pos) / this.vh2) + 0.01) / Math.LN10); }
	this.vol2pos = (v, h2) => { return (h2 - Math.round(((Math.pow(10, v / 50) - 0.01) / 0.99) * h2)); }
	this.vol2per = v => { return ((Math.pow(10, v / 50) - 0.01) / 0.99); }
	this.repaint = () => window.RepaintRect(this.vx1, this.vy1, this.vw1, this.vh1 + this.h * 2);
	this.size = () => {
	  this.x = panel.w - ma * 2;
	  this.y = panel.h - bs;
	  this.w = _textWidth('0'.repeat(5), panel.fonts.normal);
	  this.h = panel.fonts.normal.Height;
    this.vx1 = this.x - ma * 0.25;
    this.vh1 = _scale(120);
    this.vy1 = this.y - this.vh1 - ma * 0.5;
    this.vw1 = this.w + ma * 0.5;
    this.vy2 = this.vy1 + panel.fonts.normal.Height * 3;
    this.vw2 = ma * 0.35;
    this.vx2 = this.vx1 + this.vw1 * 0.5 - this.vw2 * 0.5;
    this.vh2 = this.vh1 - panel.fonts.normal.Height * 5;
	}
	this.paint = gr => {
		this.volume = fb.Volume; this.vol_pos = this.vol2pos(this.volume, this.vh2); this.percentage = this.vol2per(this.volume); this.vol_per = Math.ceil(this.percentage * 100) + '%'; this.vol_dbs = Math.ceil(this.volume);
		if (this.v_hover) {
      gr.FillSolidRect(this.vx1, this.vy1, this.vw1, this.vh1, panel.colours.mode == 1 ? 0xccf0f3f9 : 0x48000000);
      gr.DrawRect(this.vx1, this.vy1, this.vw1 - 1, this.vh1 - 1, 1, panel.colours.mode == 1 ? panel.colours.btnface : _blendColours(panel.colours.btnface, 0xff000000, 0.90));
      gr.FillSolidRect(this.vx2, this.vy2, this.vw2, this.vh2 + this.vw2, _blendColours(panel.colours.background, panel.colours.highlight, 0.5));
			gr.FillSolidRect(this.vx2, this.vy2, this.vw2, this.vw2 + this.vol_pos, panel.colours.btnface && 0xccffffff);
			gr.FillSolidRect(this.vx2, this.vy2 + this.vol_pos, this.vw2, this.vw2, panel.colours.highlight);
      gr.GdiDrawText(this.vol_dbs, panel.fonts.normal, panel.colours.normal, this.x, this.vy1 + panel.fonts.normal.Height, this.w, this.h, CENTRE);
		}
		gr.GdiDrawText(this.vol_per, panel.fonts.normal, this.v_hover ? panel.colours.highlight : panel.colours.normal, this.x, this.y, this.w, this.h, CENTRE);
	}
	this.v_drag = false; this.v_drag_hov = false; this.v_hover = false;
}

function _pbo(str) {
  this.context_menu = (x, y) => {
    let m = window.CreatePopupMenu();
    let i = 1;
    let ret = undefined;
    m.AppendMenuItem(0, i++, 'Default');
    m.AppendMenuItem(0, i++, 'Repeat (playlist)');
    m.AppendMenuItem(0, i++, 'Repeat (track)');
    m.AppendMenuItem(0, i++, 'Random');
    m.AppendMenuItem(0, i++, 'Shuffle (tracks)');
    m.AppendMenuItem(0, i++, 'Shuffle (albums)');
    m.AppendMenuItem(0, i, 'Shuffle (folders)');
    m.CheckMenuRadioItem(1, i, plman.PlaybackOrder + 1);
    ret = m.TrackPopupMenu(x, y);
    if (ret >= 1 && ret <= i) { plman.PlaybackOrder = ret - 1; this.active = plman.PlaybackOrder; this.update(0, this.active); }
  }
  this.colours_changed = () => this.col = [panel.colours.normal, panel.colours.highlight, panel.colours.normal];
  this.lbtn_down = (x, y) => { this.old = this.state; switch (this.state) { case 0: case 1: this.state = this.trace(x, y) ? 2 : 0; break; } if (this.state != this.old) this.repaint(); return this.state; }
  this.lbtn_up = (x, y) => { this.old = this.state; this.state = this.trace(x, y) ? 1 : 0; if (this.state != this.old) this.repaint(); return this.state; }
  this.leave = () => { this.old = this.state; this.state = this.isdown ? 2 : 0; if (this.state != this.old) this.repaint(); return this.state; }
  this.move = (x, y) => { this.old = this.state; switch (this.state) { case 0: case 1: this.state = this.trace(x, y) ? 1 : 0; break; } if (this.state != this.old) this.repaint(); return this.state; }
  this.repaint = () => window.RepaintRect(this.x, this.y, this.w, this.h);
  this.trace = (x, y) => x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
  this.update = (active, str) => { this.active = active; if (str) this.str = str; this.size(); this.repaint(); }
  this.size = () => { this.x = ma, this.y = panel.h - bs; this.w = _textWidth(this.str, panel.fonts.normal); this.h = panel.fonts.normal.Height; }
  this.paint = gr => gr.GdiDrawText(this.str, panel.fonts.normal, this.col[this.state], this.x, this.y, this.w, this.h, LEFT);
  this.str = str; this.state = 0; this.col = [];
  this.colours_changed();
}

buttons.update = () => {
  buttons.buttons.prev = new _button(albumart.x + albumart.cover_size / 2 - bs * 1.5, albumart.y + albumart.cover_size / 2 - bs * 0.5, bs, bs, {normal : _chr2img(icon_char.prev, panel.colours.gray, bs, bs), hover : _chr2img(icon_char.prev, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { fb.Prev(); }, '');
  buttons.buttons.play = new _button(albumart.x + albumart.cover_size / 2 - bs * 0.5, albumart.y + albumart.cover_size / 2 - bs * 0.5, bs, bs, {normal : _chr2img(!fb.IsPlaying || fb.IsPaused ? icon_char.pause : icon_char.play, panel.colours.gray, bs, bs), hover : _chr2img(!fb.IsPlaying || fb.IsPaused ? icon_char.pause : icon_char.play, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { fb.PlayOrPause(); }, '');
  buttons.buttons.next = new _button(albumart.x + albumart.cover_size / 2 + bs * 0.5, albumart.y + albumart.cover_size / 2 - bs * 0.5, bs, bs, {normal : _chr2img(icon_char.next, panel.colours.gray, bs, bs), hover : _chr2img(icon_char.next, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { fb.Next(); }, '');
  buttons.buttons.folder = new _button(albumart.x, albumart.y, bs, bs, {normal : _chr2img(icon_char.folder, panel.colours.gray, bs, bs), hover : _chr2img(icon_char.folder, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { if (panel.metadb && panel.metadb.Path == albumart.path) { _explorer(albumart.path); } else if (_isFile(albumart.path)) { _run(this.path); } return true; }, 'Open containing folder');
  buttons.buttons.pip = new _button(albumart.x + albumart.cover_size - bs, albumart.y, bs, bs, {normal : _chr2img(icon_char.pip, panel.colours.gray, bs, bs), hover : _chr2img(icon_char.pip, 0xffffffff, bs, bs, 0x96000000)}, (x, y) => { fb.RunMainMenuCommand('View/Flowin/Pip/Show'); }, 'Picture in picture');
}

function on_colours_changed() { panel.colours_changed(); albumart.colours_changed(); buttons.update(); pbo.button.colours_changed(); window.Repaint(); }
function on_font_changed() { panel.font_changed(); window.Reload(); } // reload for rating fonts
function on_item_focus_change() { panel.item_focus_change(); }
function on_key_down(vkey) { panel.key_down(vkey); }
function on_metadb_changed() { albumart.metadb_changed(); rating.metadb_changed(); }
function on_mouse_lbtn_dblclk(x, y) {}
function on_mouse_lbtn_down(x, y) { seekbar.lbtn_down(x, y); volume.lbtn_down(x, y); pbo.button.lbtn_down(x, y); }
function on_mouse_lbtn_up(x, y) { if (seekbar.lbtn_up(x, y)) { return; } if (volume.lbtn_up()) { return; } if (fb.IsPlaying && rating.lbtn_up(x, y)) { return; } buttons.lbtn_up(x, y); if (pbo.button.lbtn_up(x, y)) { pbo.button.context_menu(x, y); } }
function on_mouse_leave() { albumart.leave(); volume.leave(); rating.leave(); buttons.leave(); pbo.button.leave(); }
function on_mouse_move(x, y) { albumart.move(x, y); seekbar.move(x, y); volume.move(x, y); rating.move(x, y); buttons.move(x, y); pbo.button.move(x, y); }
function on_mouse_rbtn_up(x, y) { return panel.rbtn_up(x, y); }
function on_mouse_wheel(s) { if (s == 1) { fb.VolumeUp(); } else { fb.VolumeDown(); } }
function on_playback_dynamic_info_track() { panel.item_focus_change(); }
function on_playback_edited() { window.Repaint(); }
function on_playback_new_track() { panel.item_focus_change(); }
function on_playback_order_changed() { pbo.active = plman.PlaybackOrder; pbo.button.update(0, pbo.name[pbo.active]); window.Repaint(); }
function on_playback_stop(reason) { if (reason != 2) { panel.item_focus_change(); } buttons.update(); }
function on_playback_pause() { buttons.update(); }
function on_playback_starting() { buttons.update(); }
function on_playlist_switch() { panel.item_focus_change(); }
function on_volume_change() { volume.repaint(); }
function on_size() { panel.size(); albumart.size(); seekbar.size(); rating.size(); volume.size(); buttons.update(); pbo.button.size(); }
function on_paint(gr) { panel.paint(gr); albumart.paint(gr); seekbar.paint(gr); rating.paint(gr); volume.paint(gr); albumart.hover && buttons.paint(gr); pbo.button.paint(gr); }
