'use strict';

const hw = _scale(36); // hack button width
const hh = _scale(24); // hack button height
const sh = _scale(20); // status height
const panel = new _panel;
const jsp = new _jsp;
const plm = new _plm;
const esl = new _esl;
const hacks = new _hacks;
const status = new _status;
const buttons = new _buttons;

on_playback_new_track(fb.GetNowPlaying());
panel.item_focus_change();

function _jsp() {
  this.init = () => {
    this.now = window.GetPanel('now');
    this.lrc = window.GetPanel('lrc');
    this.pls = window.GetPanel('pls');
    this.bio = window.GetPanel('bio');
    this.now.ShowCaption = this.lrc.ShowCaption = this.pls.ShowCaption = this.bio.ShowCaption = false;
    this.exp = new _p('VIBE.PANEL.EXPAND', false);
    this.ltp = new _p('VIBE.PANEL.LEFT', false);
    this.rtp = new _p('VIBE.PANEL.RIGHT', 0);
  }
  this.size = () => {
    this.x = 0; this.y = 0; this.w = bs * (this.exp.b ? 5 : 1); this.h = panel.h - sh;
    this.now.X = this.lrc.X = this.x + this.w; this.now.Y = this.lrc.Y = hh; this.now.Width = this.lrc.Width = Math.max(bs * 6, panel.w * 0.25); this.now.Height = this.lrc.Height = panel.h - this.now.Y - sh;
    this.pls.X = this.bio.X = this.x + this.w + this.now.Width; this.pls.Y = this.bio.Y = this.now.Y; this.pls.Width = this.bio.Width = panel.w - this.w - this.now.Width; this.pls.Height = this.bio.Height = this.now.Height;
  }
  this.update = () => {
    if (this.ltp.b) {
      this.lrc.Show(); this.now.Hidden = true;
    } else {
      this.now.Show(); this.lrc.Hidden = true;
    }
    switch (this.rtp.b) {
      case 0: this.pls.Show(); this.bio.Hidden = true; break;
      case 1: this.bio.Show(); this.pls.Hidden = true; break;
      default: break;
    }
  }
  this.paint = gr => {
    if (this.exp.b) {
      gr.GdiDrawText('Playlist', panel.fonts.normal, panel.colours.normal, this.x + this.height, this.y + this.height * 2, this.w, this.height, LEFT);
      gr.GdiDrawText('Biography', panel.fonts.normal, panel.colours.normal, this.x + this.height, this.y + this.height * 3, this.w, this.height, LEFT);
      gr.GdiDrawText('Preferences', panel.fonts.normal, panel.colours.normal, this.x + this.height, this.y + this.h - this.height * 1, this.w, this.height, LEFT);
    }
    gr.FillSolidRect(this.x, this.y + this.height * (jsp.rtp.b + 2) + _scale(8), _scale(4), this.height - _scale(16), panel.colours.highlight);
  }
  this.repaint = () => window.RepaintRect(this.x, this.y, this.w, this.h);
  this.height = bs; this.init();
}

function _plm() {
  this.format_duration = s => {
    this.duration = { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: s, text: '' };
    if (this.duration.seconds > 0) {
      if (Math.floor(this.duration.seconds / 604800) > 0) { this.duration.weeks = Math.floor(this.duration.seconds / 604800); this.duration.seconds = this.duration.seconds - (this.duration.weeks * 604800); this.duration.text = this.duration.weeks + (this.duration.weeks > 1 ? ' weeks' : ' week'); }
      if (Math.floor(this.duration.seconds / 86400) > 0) { this.duration.days = Math.floor(this.duration.seconds / 86400); this.duration.seconds = this.duration.seconds - (this.duration.days * 86400); if (this.duration.text.length > 0) { this.duration.text = this.duration.text + ' ' + this.duration.days + (this.duration.days > 1 ? ' days' : ' day'); } else { this.duration.text = this.duration.days + (this.duration.days > 1 ? ' days' : ' day'); } }
      if (Math.floor(this.duration.seconds / 3600) > 0) { this.duration.hours = Math.floor(this.duration.seconds / 3600); this.duration.seconds = this.duration.seconds - (this.duration.hours * 3600); if (this.duration.text.length > 0) { this.duration.text = this.duration.text + ' ' + this.duration.hours + (this.duration.hours > 1 ? ' hours' : ' hour'); } else { this.duration.text = this.duration.hours + (this.duration.hours > 1 ? ' hours' : ' hour'); } }
      if (Math.floor(this.duration.seconds) > 0) { this.duration.minutes = Math.floor(this.duration.seconds / 60); this.duration.seconds = Math.round(this.duration.seconds - (this.duration.minutes * 60)); if (this.duration.text.length > 0) { this.duration.text = this.duration.text + ' ' + this.duration.minutes + (this.duration.minutes > 1 ? ' minutes' : ' minute'); } else { this.duration.text = this.duration.minutes + (this.duration.minutes > 1 ? ' minutes' : ' minute'); } }
      if (this.duration.text.length > 0) { if (Math.round(this.duration.seconds) > 0) { this.duration.text = this.duration.text + ' ' + Math.round(this.duration.seconds) + (Math.round(this.duration.seconds) > 1 ? ' seconds' : ' second'); } } else { this.duration.text = Math.round(this.duration.seconds) + (Math.round(this.duration.seconds) > 1 ? ' seconds' : ' second'); }
    } else {
      this.duration.text = '0:00';
    }
    return this.duration.text;
  }
  this.calc_cord = y => { this.p = Math.floor((y - this.y - this.height) / this.height); if (this.p >= 0 && this.p < plman.PlaylistCount) return this.p; else return null; }
  this.rename_playlist = () => fb.RunMainMenuCommand('File/Rename Playlist');
  this.context_menu = (x, y) => {
    let m = window.CreatePopupMenu();
    let n = window.CreatePopupMenu();
    let o = window.CreatePopupMenu();
    let p = plman.PlaylistRecycler;
    let ret = undefined;
    m.AppendMenuItem(0, 1, ('New Playlist\tCtrl+N'));
    m.AppendMenuItem(0, 2, ('New Autoplaylist'));
    n.AppendTo(m, 0, 'Autoplaylist Presets');
    n.AppendMenuItem(0, 3, 'Media Library');
    n.AppendMenuItem(0, 4, 'Favorite');
    n.AppendMenuItem(0, 5, 'Recently Added');
    n.AppendMenuItem(0, 6, 'Never Played');
    m.AppendMenuSeparator();
    m.AppendMenuItem(0, 7, ('Load playlist...'));
    m.AppendMenuItem(0, 8, ('Save all playlists'));
    o.AppendTo(m, p.Count > 0 ? 0 : 1 | 2, 'Restore');
    if (p.Count > 0) { o.AppendMenuItem(0, 100, 'Clear history'); o.AppendMenuSeparator(); for (let i = 0; i < p.Count; i++) { o.AppendMenuItem(0, 101 + i, p.GetName(i)); } }
    m.AppendMenuSeparator();
    m.AppendMenuItem(0, 9, ('Playlist Manager'));
    m.AppendMenuItem(0, 10, ('Album List'));
    m.AppendMenuItem(0, 11, ('ReFacets'));
    // m.AppendMenuItem(_cc('foo_podcatcher') ? 0 : 1, 12, ('Podcatcher Feed Manager'));
    m.AppendMenuSeparator();
    m.AppendMenuItem(0, 99, ('Items'));
    m.CheckMenuItem(99, this.items.b ? 1 : 0);
    ret = m.TrackPopupMenu(x, y);
    switch (ret) {
      case 1: plman.ActivePlaylist = plman.CreatePlaylist(plman.PlaylistCount, ''); this.rename_playlist(plman.ActivePlaylist); break;
      case 2: plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, '', ''); this.rename_playlist(plman.ActivePlaylist); plman.ShowAutoPlaylistUI(plman.ActivePlaylist); break;
      case 3: plman.CreateAutoPlaylist(0, 'Media Library', 'ALL', '%album artist%%date%%album%%discnumber%%subsong%', 1); break;
      case 4: plman.CreateAutoPlaylist(plman.PlaylistCount, 'Favorite', '%rating% IS 5', '%album artist%', 1); break;
      case 5: plman.CreateAutoPlaylist(plman.PlaylistCount, 'Recently Added', '%added% DURING LAST 1 WEEK SORT DESCENDING BY %added%', '', 1); break;
      case 6: plman.CreateAutoPlaylist(plman.PlaylistCount, 'Never Played', '%play_count% IS 0', '%album artist%', 1); break;
      case 7: fb.LoadPlaylist(); break;
      case 8: fb.RunMainMenuCommand('File/Save All Playlists...'); break;
      case 9: fb.RunMainMenuCommand('View/Playlist Manager'); break;
      case 10: fb.RunMainMenuCommand('Library/Album List'); break;
      case 11: fb.RunMainMenuCommand('Library/Refacets'); break;
      // case 12: fb.RunMainMenuCommand('View/Podcatcher Feed Manager'); break;
      case 99: this.items.toggle(); m.CheckMenuItem(8, this.items.b); window.Repaint(); break;
    }
    if (ret >= 100) {
      switch (ret) {
        case 100: let affectedItems = Array(); for (let i = 0; i < p.Count; i++) { affectedItems.push(i); } p.Purge(affectedItems); break;
        default: (p.Count >= 1) && p.Restore(ret - 101); break;
      }
    }
  }
  this.key_down = vkey => { this.t = plman.ActivePlaylist; switch (vkey) { case 0x25: fb.RunMainMenuCommand('Playback/Seek/Back by 5 seconds'); break; case 0x27: fb.RunMainMenuCommand('Playback/Seek/Ahead by 5 seconds'); break; case 0x26: if (utils.IsKeyPressed(0x11)) { this.t > 0 && plman.MovePlaylist(this.t, this.t - 1); } else { if (this.t != 0) { plman.ActivePlaylist = this.t - 1; } } break; case 0x28: if (utils.IsKeyPressed(0x11)) { this.t < plman.PlaylistCount && plman.MovePlaylist(this.t, this.t + 1); } else { if (this.t != plman.PlaylistCount - 1) { plman.ActivePlaylist = this.t + 1; } } break; case 0x71: if (this.t != null) this.rename_playlist(this.t); break; case 0x0D: plman.ExecutePlaylistDefaultAction(this.t, 0); break; case 0x2E: if (this.t != null) { plman.RemovePlaylist(this.t); } if (plman.PlaylistCount < 1) { plman.CreatePlaylist(0, ''); } if (this.t != 0) { plman.ActivePlaylist = this.t - 1; } if (plman.ActivePlaylist < 0) { plman.ActivePlaylist = 0; } break; default: break; } }
  this.lbtn_dblclk = (x, y) => { if (y > this.y + this.height && y < this.y + this.h) { this.t = this.calc_cord(y); if (this.t != null) { plman.PlayingPlaylist = this.t; fb.Play(); } else { fb.RunMainMenuCommand('File/New playlist'); plman.ActivePlaylist = plman.PlaylistCount - 1; this.rename_playlist(plman.ActivePlaylist); } } }
  this.lbtn_down = (x, y) => { if (y > this.y + this.height) { this.t = this.calc_cord(y); if (this.t != null) { plman.ActivePlaylist = this.t; } } }
  this.move = (x, y) => { if (y > this.y + this.height) { this.t = this.calc_cord(y); if (this.t != null) { /*_tt(plman.GetPlaylistName(this.t));*/ window.SetCursor(32649); } } if (y < this.y + this.height || y > this.y + this.height * (plman.PlaylistCount + 1)) { _tt(''); window.SetCursor(32512); } }
  this.rbtn_down = (x, y) => {
    this.t = this.calc_cord(y);
    if (this.t != null) {
      plman.ActivePlaylist = this.t;
      let m = window.CreatePopupMenu();
      let n = window.CreatePopupMenu();
      let ret = undefined;
      m.AppendMenuItem(this.t == 0 ? 1 : 0, 1, ('Move up\tCtrl+Up'));
      m.AppendMenuItem(this.t == plman.PlaylistCount - 1 ? 1 : 0, 2, ('Move down\tCtrl+Down'));
      m.AppendMenuSeparator();
      m.AppendMenuItem(0, 3, ('Rename playlist\tF2'));
      m.AppendMenuItem(0, 4, ('Remove playlist\tDelete'));
      m.AppendMenuSeparator();
      m.AppendMenuItem(0, 5, ('Save playlist...\tCtrl+S'));
      if (plman.IsAutoPlaylist(plman.ActivePlaylist)) {
        m.AppendMenuItem(0, 6, ('Convert to a normal playlist...'));
        m.AppendMenuSeparator();
        m.AppendMenuItem(0, 7, ('AutoPlaylist ...'));
      } else {
        m.AppendMenuItem(0, 6, ('Duplicate playlist...'));
        m.AppendMenuSeparator();
        n.AppendTo(m, 0, 'Sort');
        n.AppendMenuItem(0, 8, 'Sort by...');
        n.AppendMenuItem(0, 9, 'Randomize');
        n.AppendMenuItem(0, 10, 'Reverse');
        n.AppendMenuItem(0, 11, 'Sort by album');
        n.AppendMenuItem(0, 12, 'Sort by artist');
        n.AppendMenuItem(0, 13, 'Sort by file path');
        n.AppendMenuItem(0, 14, 'Sort by title');
        n.AppendMenuItem(0, 15, 'Sort by track number');
        n.AppendMenuItem(0, 16, 'Sort by genre');
        n.AppendMenuItem(0, 17, 'Sort by date');
        n.AppendMenuItem(0, 18, 'Sort by play count');
        n.AppendMenuItem(0, 19, 'Sort by duration');
        n.AppendMenuItem(0, 20, 'Sort by file size');
      }
      ret = m.TrackPopupMenu(x, y);
      switch (ret) {
        case 1: this.t > 0 && plman.MovePlaylist(this.t, this.t - 1); break;
        case 2: this.t < plman.PlaylistCount && plman.MovePlaylist(this.t, this.t + 1); break;
        case 3: this.rename_playlist(this.t); break;
        case 4: if (this.t != null) { plman.RemovePlaylist(this.t); } if (plman.PlaylistCount < 1) { plman.CreatePlaylist(0, ''); } if (this.t != 0) { plman.ActivePlaylist = this.t - 1; } if (plman.ActivePlaylist < 0) { plman.ActivePlaylist = 0; } break;
        case 5: fb.SavePlaylist(); break;
        case 6: this.t = plman.DuplicatePlaylist(this.t, plman.GetPlaylistName(this.t)); this.rename_playlist(this.t); break;
        case 7: plman.ShowAutoPlaylistUI(this.t); break;
        case 8: fb.RunMainMenuCommand('Edit/Sort/Sort by...'); break;
        case 9: fb.RunMainMenuCommand('Edit/Sort/Randomize'); break;
        case 10: fb.RunMainMenuCommand('Edit/Sort/Reverse'); break;
        case 11: fb.RunMainMenuCommand('Edit/Sort/Sort By Album'); break;
        case 12: fb.RunMainMenuCommand('Edit/Sort/Sort By Artist'); break;
        case 13: fb.RunMainMenuCommand('Edit/Sort/Sort By File Path'); break;
        case 14: fb.RunMainMenuCommand('Edit/Sort/Sort By Title'); break;
        case 15: fb.RunMainMenuCommand('Edit/Sort/Sort By Track Number'); break;
        case 16: plman.SortByFormat(this.t, '%genre%', false); break;
        case 17: plman.SortByFormat(this.t, '%date%', false); break;
        case 18: plman.SortByFormat(this.t, '%play_count%', false); fb.RunMainMenuCommand('Edit/Sort/Reverse'); break;
        case 19: plman.SortByFormat(this.t, '%length%', false); break;
        case 20: plman.SortByFormat(this.t, '%filesize%', false); break;
        default: break;
      }
    }
  }
  this.update = () => {
    for (let i = 0; i < plman.PlaylistCount; i++) {
      this.arr[i] = [plman.GetPlaylistName(i), plman.PlaylistItemCount(i)];
    }
    this.text = this.format_duration(plman.GetPlaylistItems(plman.ActivePlaylist).CalcTotalDuration());
    this.count = (this.h / this.height) | 0;
  }
  this.size = () => { this.x = jsp.x; this.y = jsp.y + this.height * 4; this.w = jsp.w; this.h = jsp.y + jsp.h - this.y - this.height; this.update(); }
  this.paint = gr => {
    let font = gdi.Font(icon_name, this.height / 3);
    gr.GdiDrawText(this.text, panel.fonts.normal, panel.colours.normal, this.x + bs, this.y, this.w - bs - ma, this.height, LEFT);
    for (let i = 0; (i < plman.PlaylistCount) && i <= this.count; i++) {
      let name = this.arr[i][0]/* + (plman.IsAutoPlaylist(i) ? ' (Auto)' : '')*/;
      let count = this.arr[i][1]/* + ((this.arr[i][1] > 1) ? ' tracks' : ' track')*/;
      let count_length = gr.CalcTextWidth(count, panel.fonts.normal);
      if (this.y + this.height * (i + 1) < this.y + this.h - this.height) {
        gr.FillSolidRect(this.x, this.y + this.height * (i + 1), this.w, this.height, i == plman.ActivePlaylist ? panel.colours.highlight : i == plman.PlayingPlaylist ? panel.colours.highlight & 0x24ffffff : 0);
        gr.SetTextRenderingHint(3);
        gr.DrawString(this.arr[i][0] == 'Media Library' ? icon_char.lib : this.arr[i][0] == 'Favorite' ? icon_char.fav : this.arr[i][0] == 'Recently Added' ? icon_char.rct : plman.IsAutoPlaylist(i) ? icon_char.apl : icon_char.npl, font, i == plman.ActivePlaylist ? 0xffffffff : i == plman.PlayingPlaylist ? panel.colours.normal : panel.colours.gray, this.x, this.y + this.height * (i + 1), jsp.exp.b ? this.height : this.w, this.height, SF.CENTRE);
        jsp.exp.b && gr.SetTextRenderingHint(0);
        jsp.exp.b && gr.GdiDrawText(name/*.toUpperCase()*/, panel.fonts.normal, i == plman.ActivePlaylist ? 0xffffffff : i == plman.PlayingPlaylist ? panel.colours.normal : panel.colours.gray, this.x + bs, this.y + this.height * (i + 1), this.w - this.height - (this.items.b ? count_length + ma : 0) - ma, this.height, LEFT);
        jsp.exp.b && this.items.b && gr.GdiDrawText(count, panel.fonts.normal, i == plman.ActivePlaylist ? 0xffffffff : i == plman.PlayingPlaylist ? panel.colours.normal : panel.colours.gray, this.x + this.w - ma - count_length, this.y + this.height * (i + 1), count_length, this.height, RIGHT);
      }
    }
  }
  this.height = bs; this.arr = []; this.items = new _p('VIBE.PLM.ITEMS', false);
}

function _esl() {
  this.colours_changed = () => {
    this.panels.SetBackgroundColor(panel.colours.background);
    this.panels.SetTextColor(_blendColours(panel.colours.background, panel.colours.normal, 0.25));
    this.panels.SetTextHighlightColor(panel.colours.normal);  
  }
  this.font_changed = () => this.panels.SetTextFont(panel.fonts.name, panel.fonts.size + 8, panel.fonts.style);
  this.size = () => {
    this.panels.SetTextRenderer(0);
    this.panels.SetTextAlign(0);
    this.panels.SetLineSpace(0);
    this.panels.SetHorizMargin(ma);
    this.panels.SetVertMargin(0);
    this.panels.SetSentenceSpace(_scale(4));
    // this.panels.SetVariesFontDeltaHeight(_scale(4));
  }
  this.obj = new ActiveXObject('ESLyric');
  this.panels = this.obj.GetAll();
  this.colours_changed();
  this.font_changed();
}

hacks.set_aeroeffect = () => {
  hacks.uih.Aero.Effect = 2; // 0 Default, 1 Disable, 2 GlassFrame
  hacks.uih.Aero.Left = 0;
  hacks.uih.Aero.Right = 0;
  hacks.uih.Aero.Top = 0;
  hacks.uih.Aero.Bottom = hacks.uih.MainWindowState == 2 ? 0 : hacks.uih.Aero.Effect == 2 ? 1 : 0;
}

hacks.size = () => {
  hacks.x = jsp.w;
  hacks.y = jsp.y;
  hacks.w = panel.w - jsp.w - hw * 3;
  hacks.h = hh;

  if (_cc('foo_ui_hacks')) {
    hacks.enable();
    hacks.set_caption(hacks.x, hacks.y, hacks.w, hacks.h);
    hacks.set_aeroeffect();
  }
}

function _status() {
  this.interval_func = () => { if (fb.IsPlaying && !fb.IsPaused && fb.PlaybackLength > 0) { this.repaint(); } }
  this.lbtn_dblclk = (x, y) => this.trace(x, y) && window.NotifyOthers('show_now_playing', '');
  this.repaint = () => window.RepaintRect(this.x, this.y, this.w, this.h);
  this.size = () => { this.x = 0; this.h = sh; this.y = panel.h - this.h; this.w = panel.w; }
  this.trace = (x, y) => x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
  this.paint = gr => {
    gr.FillSolidRect(this.x, this.y, this.w, this.h, panel.colours.highlight);
    panel.metadb && gr.GdiDrawText(fb.IsPlaying ? panel.tf(tfo.status, true).toUpperCase() : 'foobar2000 v' + fb.Version, panel.fonts.normal, 0xffffffff, this.x + LM, this.y, this.w, this.h, LEFT);
  }
  window.SetInterval(this.interval_func, 150);
}

buttons.update = () => {
  buttons.buttons.min = new _button(panel.w - hw * 3, 0, hw, hh, { normal: _chr2img(icon_char.min, panel.colours.normal, hw, hh), hover: _chr2img(icon_char.min, panel.colours.normal, hw, hh, panel.colours.background == 0xffffffff ? panel.colours.btnface : _blendColours(panel.colours.background, panel.colours.btnface, 0.1)) }, () => { fb.RunMainMenuCommand('View/Hide'); }, '');
  buttons.buttons.max = new _button(panel.w - hw * 2, 0, hw, hh, { normal: _chr2img(hacks.uih.MainWindowState == 2 ? icon_char.max1 : icon_char.max0, panel.colours.normal, hw, hh), hover: _chr2img(hacks.uih.MainWindowState == 2 ? icon_char.max1 : icon_char.max0, panel.colours.normal, hw, hh, panel.colours.background == 0xffffffff ? panel.colours.btnface : _blendColours(panel.colours.background, panel.colours.btnface, 0.1)) }, () => { fb.RunMainMenuCommand('View/Maximize/Restore'); }, '');
  buttons.buttons.ext = new _button(panel.w - hw * 1, 0, hw, hh, { normal: _chr2img(icon_char.ext, panel.colours.normal, hw, hh), hover: _chr2img(icon_char.ext, 0xffffffff, hw, hh, 0xffc42b1c) }, () => { fb.RunMainMenuCommand('File/Exit'); }, '');
  buttons.buttons.ltp = new _button(jsp.x, jsp.y + bs * 0, bs, bs, { normal: _chr2img(icon_char.ltp, panel.colours.normal, bs, bs), hover: _chr2img(icon_char.ltp, panel.colours.normal, bs, bs, panel.colours.background == 0xff000000 ? 0xff202020 : panel.colours.background) }, (x, y) => { jsp.ltp.toggle(); jsp.update(); }, '');
  buttons.buttons.jsp = new _button(jsp.x, jsp.y + bs * 1, bs, bs, { normal: _chr2img(icon_char.jsp, panel.colours.normal, bs, bs), hover: _chr2img(icon_char.jsp, panel.colours.normal, bs, bs, panel.colours.background == 0xff000000 ? 0xff202020 : panel.colours.background) }, (x, y) => { jsp.exp.toggle(); on_size(); window.Repaint(); }, '');
  buttons.buttons.pls = new _button(jsp.x, jsp.y + bs * 2, jsp.w, bs, { normal: _chr2img(icon_char.pls, panel.colours.normal, jsp.w, bs, 0, true, true), hover: _chr2img(icon_char.pls, panel.colours.normal, jsp.w, bs, panel.colours.background == 0xff000000 ? 0xff202020 : panel.colours.background, true, true) }, (x, y) => { jsp.rtp.b = 0; jsp.update(); jsp.repaint(); }, '');
  buttons.buttons.bio = new _button(jsp.x, jsp.y + bs * 3, jsp.w, bs, { normal: _chr2img(icon_char.bio, panel.colours.normal, jsp.w, bs, 0, true, true), hover: _chr2img(icon_char.bio, panel.colours.normal, jsp.w, bs, panel.colours.background == 0xff000000 ? 0xff202020 : panel.colours.background, true, true) }, (x, y) => { jsp.rtp.b = 1; jsp.update(); jsp.repaint(); }, '');
  buttons.buttons.plm = new _button(jsp.x, jsp.y + bs * 4, bs, bs, { normal: _chr2img(icon_char.plm, panel.colours.normal, bs, bs), hover: _chr2img(icon_char.plm, panel.colours.highlight, bs, bs) }, (x, y) => { plm.context_menu(x, y); }, '');
  buttons.buttons.prf = new _button(jsp.x, jsp.y + jsp.h - bs, jsp.w, bs, { normal: _chr2img(icon_char.prf, panel.colours.normal, jsp.w, bs, 0, true, true), hover: _chr2img(icon_char.prf, panel.colours.normal, jsp.w, bs, panel.colours.background == 0xff000000 ? 0xff202020 : panel.colours.background, true, true) }, (x, y) => { fb.RunMainMenuCommand('File/Preferences'); }, '');
}

function on_colours_changed() { panel.colours_changed(); buttons.update(); esl.colours_changed(); window.Repaint(); }
function on_font_changed() { panel.font_changed(); buttons.update(); esl.font_changed(); window.Repaint(); }
function on_item_focus_change() { panel.item_focus_change(); }
function on_key_down(vkey) { panel.key_down(vkey); plm.key_down(vkey); }
function on_mouse_lbtn_dblclk(x, y) { plm.lbtn_dblclk(x, y); if (fb.IsPlaying && status.lbtn_dblclk(x, y)) { return; } }
function on_mouse_lbtn_down(x, y) { plm.lbtn_down(x, y); }
function on_mouse_lbtn_up(x, y) { buttons.lbtn_up(x, y); }
function on_mouse_leave() { buttons.leave(); }
function on_mouse_move(x, y) { plm.move(x, y); buttons.move(x, y); }
function on_mouse_rbtn_down(x, y) { plm.rbtn_down(x, y); }
function on_mouse_rbtn_up(x, y) { return panel.rbtn_up(x, y); }
function on_playlist_items_added(playlist) { if (playlist === plman.ActivePlaylist) { plm.current = plman.GetPlaylistItems(plman.ActivePlaylist); plm.update(); } window.Repaint(); }
function on_playlist_items_removed(playlist) { if (playlist === plman.ActivePlaylist) { plm.current = plman.GetPlaylistItems(plman.ActivePlaylist); plm.update(); } window.Repaint(); }
function on_playlist_items_selection_change() { plm.update(); window.Repaint(); }
function on_playlist_switch() { plm.update(); window.Repaint(); }
function on_playlists_changed() { plm.update(); window.Repaint(); }
function on_playback_dynamic_info() { window.Repaint(); }
function on_playback_dynamic_info_track() { panel.item_focus_change(); window.Repaint(); }
function on_playback_new_track() { panel.item_focus_change(); }
function on_playback_starting() { window.Repaint(); }
function on_playback_stop() { buttons.update(); window.Repaint(); }
function on_playback_pause() { buttons.update(); }
function on_playback_starting() { buttons.update(); }
function on_size() { panel.size(); jsp.size(); jsp.update(); plm.size(); buttons.update(); esl.size(); hacks.size(); status.size(); }
function on_paint(gr) { panel.paint(gr); gr.FillSolidRect(jsp.x, jsp.y, jsp.w, jsp.h, panel.colours.background == 0xffffffff ? 0xfff0f3f9 : 0xff000000); buttons.paint(gr); jsp.paint(gr); plm.paint(gr); status.paint(gr); }