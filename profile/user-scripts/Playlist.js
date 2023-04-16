var need_repaint = false;
ppt = {
  tf_artist: fb.TitleFormat("%artist%"),
  tf_albumartist: fb.TitleFormat("%album artist%"),
  tf_groupkey: fb.TitleFormat("$if2(%album artist%,$if(%length%,'?',%title%)) ^^ $if2(%album% $ifgreater(%totaldiscs%,1,- Disc #%discnumber%,),$if(%length%,'?',%path%)) ^^ %discnumber% ## [%artist%] ^^ %title% ^^ $if3([%publisher%],%url%,Unspecified Publisher) ^^ %track artist% ^^ %album artist% ^^ %genre% ^^ [%date%]"),
  tf_track: fb.TitleFormat("%tracknumber% ^^ [%length%] ^^ $if2(%rating%,0) ^^ %mood%"),
  tf_disc: fb.TitleFormat("Disc %discnumber% / %totaldiscs%"),
  tf_path: fb.TitleFormat("$directory_path(%path%)\\"),
  tf_crc: fb.TitleFormat("$crc32(%path%)"),
  tf_time_remaining: fb.TitleFormat("$if(%length%,-%playback_time_remaining%,'ON AIR')"),
  refresh_rate: 40,
  group_header_row_num: 3,
  group_header_row_num_min: 0,
  scroll_step: 3,
  scroll_smoothness: 1.25,
  row_height: scale(20),
  auto_collapse: window.GetProperty("_DISPLAY: Autocollapse Groups", false),
  show_cover: window.GetProperty("_DISPLAY: Show Cover Art", true),
  show_filter: window.GetProperty("_DISPLAY: Show Filter Box", false),
  show_group_headers: window.GetProperty("_DISPLAY: Show Group Headers", true),
  show_group_header_bg: window.GetProperty("_DISPLAY: Show Group Headers Background", false),
  show_stripes: window.GetProperty("_DISPLAY: Show Row Stripes", false),
  show_rating: window.GetProperty("_DISPLAY: Show Rating in Track Row", false)
};
cTouch = {
  down: false,
  y_start: 0,
  y_end: 0,
  y_current: 0,
  y_prev: 0,
  y_move: 0,
  scroll_delta: 0,
  t1: null,
  timer: false,
  multiplier: 0,
  delta: 0
};
cPlaylistManager = {
  width: scale(200),
  topbar_h: scale(25),
  botbar_h: scale(2),
  scrollbar_w: get_system_scrollbar_width(),
  row_height: scale(25),
  blink_timer: false,
  blink_counter: -1,
  blink_id: null,
  blink_row: null,
  blink_totaltracks: 0,
  show_total_items: window.GetProperty("_DISPLAY: Show TotalItems in PlaylistManager", true)
};
clipboard = {
  selection: null
};
cover = {
  masks: window.GetProperty("_PROPERTY: Cover art masks (used for the cache)", "cover.jpg;*.jpg"),
  margin: scale(8),
  w: ppt.group_header_row_num * ppt.row_height,
  h: ppt.group_header_row_num * ppt.row_height
};
images = {
  noart: null,
  stream: null
};
cList = {
  search_string: "",
  inc_search_nofilter_result: false,
  clear_incsearch_timer: false,
  incsearch_timer: false
};
timers = {
  cover_load: false,
  cover_done: false,
  cover_save: false,
  mouse_wheel: false,
  mouse_down: false,
  show_playlist_manager: false,
  hide_playlist_manager: false
};
dragndrop = {
  enabled: true,
  contigus_sel: null,
  x: 0,
  y: 0,
  drag_id: -1,
  drop_id: -1,
  timerID: false,
  drag_in: false,
  drag_out: false,
  clicked: false,
  moved: false
};
// Images cache
function reset_cover_timers() {
  if (timers.cover_done) {
    timers.cover_done && window.ClearTimeout(timers.cover_done);
    timers.cover_done = false;
  }
}
function on_load_image_done(tid, image) {
  var tot = brw.groups.length;
  for (var k = 0; k < tot; k++) {
    if (brw.groups[k].metadb) {
      if (brw.groups[k].tid == tid && brw.groups[k].load_requested == 1) {
        brw.groups[k].load_requested = 2;
        brw.groups[k].cover_img = cache.getit(brw.groups[k].metadb, k, image);
        if (k < brw.groups.length && brw.groups[k].row_id >= g_start_ && brw.groups[k].row_id <= g_end_) {
          if (!timers.cover_done) {
            timers.cover_done = window.SetTimeout(() => {
              brw.repaint();
              timers.cover_done && window.ClearTimeout(timers.cover_done);
              timers.cover_done = false;
            }, 5);
          }
        }
        break;
      }
    }
  }
}
function on_get_album_art_done(metadb, art_id, image, image_path) {
  var tot = brw.groups.length;
  for (var i = 0; i < tot; i++) {
    if (brw.groups[i].metadb && brw.groups[i].metadb.Compare(metadb)) {
      brw.groups[i].cover_img = cache.getit(metadb, i, image);
      if (i < brw.groups.length && i >= g_start_ && i <= g_end_) {
        if (!timers.cover_done) {
          timers.cover_done = window.SetTimeout(() => {
            brw.repaint();
            timers.cover_done && window.ClearTimeout(timers.cover_done);
            timers.cover_done = false;
          }, 5);
        }
      }
      break;
    }
  }
}
// Cover Tools
function format_cover(image, w, h) {
  if (!image || w <= 0 || h <= 0) return image;
  return image.Resize(w, h, 2);
}
function _cache() {
  this._cachelist = {}
  this.hit = (metadb, albumIndex) => {
    var img = this._cachelist[brw.groups[albumIndex].cachekey];
    if (typeof (img) == "undefined" || img == null) { // if image not in cache, we load it asynchronously
      brw.groups[albumIndex].crc = check_cache(metadb, albumIndex);
      if (brw.groups[albumIndex].crc && brw.groups[albumIndex].load_requested == 0) {
        // load img from cache
        if (!timers.cover_load) {
          timers.cover_load = window.SetTimeout(() => {
            try {
              brw.groups[albumIndex].tid = load_image_from_cache(metadb, brw.groups[albumIndex].crc);
              brw.groups[albumIndex].load_requested = 1;
            } catch (e) {}
            timers.cover_load && window.ClearTimeout(timers.cover_load);
            timers.cover_load = false;
          }, (!is_scrolling && !brw.scrollbar.timer ? 5 : 25));
        }
      } else if (brw.groups[albumIndex].load_requested == 0) {
        // load img default method
        if (!timers.cover_load) {
          try {
            timers.cover_load = window.SetTimeout(() => {
              brw.groups[albumIndex].load_requested = 1;
              utils.GetAlbumArtAsync(window.ID, metadb, 0, true, false, false);
              timers.cover_load && window.ClearTimeout(timers.cover_load);
              timers.cover_load = false;
            }, (!is_scrolling && !brw.scrollbar.timer ? 5 : 25));
          } catch (e) {}
        }
      }
      //}
    }
    return img;
  }
  this.reset = key => {
    this._cachelist[key] = null;
  }
  this.getit = (metadb, albumId, image) => {
    var cw = cover.w;
    var ch = cw;
    var img = null;
    var cover_type = null;
    if (!image) {
      var pw = cw - cover.margin * 2;
      var ph = ch - cover.margin * 2;
    } else {
      if (image.Height >= image.Width) {
        var ratio = image.Width / image.Height;
        var pw = (cw - cover.margin * 2) * ratio;
        var ph = ch - cover.margin * 2;
      } else {
        var ratio = image.Height / image.Width;
        var pw = cw - cover.margin * 2;
        var ph = (ch - cover.margin * 2) * ratio;
      }
    }
    // cover.type : 0 = nocover, 1 = external cover, 2 = embedded cover, 3 = stream
    if (brw.groups[albumId].tracktype != 3) {
      if (metadb) {
        if (image) {
          img = format_cover(image, pw, ph);
          cover_type = 1;
        } else {
          cover_type = 0;
        }
      }
    } else {
      cover_type = 3;
    }
    if (cover_type == 1) {
      this._cachelist[brw.groups[albumId].cachekey] = img;
    }
    // save img to cache
    if (cover_type == 1 && !brw.groups[albumId].save_requested) {
      if (!timers.cover_save) {
        brw.groups[albumId].save_requested = true;
        save_image_to_cache(metadb, albumId);
        timers.cover_save = window.SetTimeout(() => {
          window.ClearTimeout(timers.cover_save);
          timers.cover_save = false;
        }, 50);
      }
    }
    brw.groups[albumId].cover_type = cover_type;
    return img;
  }
}
// Objects
function _pls(idx, row_id) {
  this.idx = idx;
  this.row_id = row_id;
  this.name = plman.GetPlaylistName(idx);
  this.y = -1;
}
function _plm(name) {
  this.name = name;
  this.playlists = [];
  this.state = 0; // 0 = hidden, 1 = visible
  // metrics
  this.scroll = 0;
  this.offset = 0;
  this.total_playlists = null;
  this.rowTotal = -1;
  this.drop_done = false;
  this.adjustPanelHeight = () => {
    // adjust panel height to avoid blank area under last visible item in the displayed list
    var target_total_rows = Math.floor((this.h - cPlaylistManager.topbar_h) / cPlaylistManager.row_height);
    if (this.rowTotal != -1 && this.rowTotal < target_total_rows)
      target_total_rows = this.rowTotal;
    this.h = cPlaylistManager.topbar_h + (target_total_rows * cPlaylistManager.row_height);
    this.total_rows = Math.floor((this.h - cPlaylistManager.topbar_h) / cPlaylistManager.row_height);
    this.max = (this.rowTotal > this.total_rows ? this.total_rows : this.rowTotal);
  }
  this.size = (x, y, w, h) => {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.total_rows = Math.floor((this.h - cPlaylistManager.topbar_h) / cPlaylistManager.row_height);
    // adjust panel height / row_height + rowTotal (! refresh must have been executed once to have a valide rowTotal)
    this.adjustPanelHeight();
  }
  this.showPanel = () => {
    if (pman.offset < pman.w) {
      var delta = Math.ceil((pman.w - pman.offset) / 2);
      pman.offset += delta;
      brw.repaint();
    }
    if (pman.offset >= pman.w) {
      pman.offset = pman.w;
      window.ClearInterval(timers.show_playlist_manager);
      timers.show_playlist_manager = false;
      brw.repaint();
    }
  }
  this.hidePanel = () => {
    if (pman.offset > 0) {
      var delta = Math.ceil((pman.w - (pman.w - pman.offset)) / 2);
      pman.offset -= delta;
      brw.repaint();
    }
    if (pman.offset < 1) {
      pman.offset = 0;
      pman.state = 0;
      window.ClearInterval(timers.hide_playlist_manager);
      timers.hide_playlist_manager = false;
      brw.repaint();
    }
  }
  this.populate = (exclude_active, reset_scroll) => {
    this.playlists.splice(0, this.playlists.length);
    this.total_playlists = plman.PlaylistCount;
    var row_id = 0;
    for (var idx = 0; idx < this.total_playlists; idx++) {
      if (!plman.IsAutoPlaylist(idx)) {
        if (idx == plman.ActivePlaylist) {
          if (!exclude_active) {
            this.playlists.push(new _pls(idx, row_id));
            row_id++;
          }
        } else {
          this.playlists.push(new _pls(idx, row_id));
          row_id++;
        }
      }
    }
    this.rowTotal = row_id;
    // adjust panel height / row_height + rowTotal
    this.adjustPanelHeight();
    if (reset_scroll || this.rowTotal <= this.total_rows) {
      this.scroll = 0;
    } else {
      // check it total playlist is coherent with scroll value
      if (this.scroll > this.rowTotal - this.total_rows) {
        this.scroll = this.rowTotal - this.total_rows;
      }
    }
  }
  this.paint = gr => {
    if (this.offset > 0) {
      // metrics
      var cx = this.x - this.offset;
      var ch = cPlaylistManager.row_height;
      var cw = this.w;
      var bg_margin_top = 2;
      var bg_margin_left = 6;
      var txt_margin = 10;
      var bg_colour = RGB(0, 0, 0);
      var txt_colour = RGB(255, 255, 255);
      // scrollbar metrics
      if (this.rowTotal > this.total_rows) {
        this.scr_y = this.y + cPlaylistManager.topbar_h;
        this.scr_w = cPlaylistManager.scrollbar_w;
        this.scr_h = this.h - cPlaylistManager.topbar_h;
      } else {
        this.scr_y = 0;
        this.scr_w = 0;
        this.scr_h = 0;
      }
      // panel background
      gr.SetSmoothingMode(2);
      gr.FillSolidRect(cx, this.y, this.w + 12, this.h + cPlaylistManager.botbar_h + 1, 0xff000000 & 0xaeffffff);
      gr.FillSolidRect(cx, this.y, this.w + 12, this.h + cPlaylistManager.botbar_h, 0xff000000 & 0xaeffffff);
      gr.SetSmoothingMode(0);
      gr.FillSolidRect(cx + bg_margin_left, this.y + cPlaylistManager.topbar_h - 2, this.w - bg_margin_left * 2, 1, RGBA(255, 255, 255, 25));
      // items
      var row_idx = 0;
      var totalp = this.playlists.length;
      var start_ = this.scroll;
      var end_ = this.scroll + this.total_rows;
      if (end_ > totalp)
        end_ = totalp;
      for (var i = start_; i < end_; i++) {
        cy = this.y + cPlaylistManager.topbar_h + row_idx * ch;
        this.playlists[i].y = cy;
        // item text
        // playlist total items
        if (cPlaylistManager.show_total_items) {
          t = plman.PlaylistItemCount(this.playlists[i].idx);
          tw = gr.CalcTextWidth(t + "  ", g_font_normal);
          gr.GdiDrawText(t, g_font_normal, blendColours(txt_colour, bg_colour, 0.2), cx + bg_margin_left + txt_margin, cy, cw - bg_margin_left * 2 - txt_margin * 2 - this.scr_w, ch, DT_RIGHT | DT_CALCRECT | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);
        } else {
          tw = 0;
        }
        // draw playlist name
        if ((this.activeIndex == i + 1 && cPlaylistManager.blink_counter < 0) || (cPlaylistManager.blink_id == i + 1 && cPlaylistManager.blink_row != 0)) {
          gr.GdiDrawText("+ " + this.playlists[i].name, g_font_bold, txt_colour, cx + bg_margin_left + txt_margin, cy, cw - bg_margin_left * 2 - txt_margin * 2 - tw - this.scr_w, ch, DT_LEFT | DT_CALCRECT | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);
        } else {
          gr.GdiDrawText(this.playlists[i].name, g_font_normal, blendColours(txt_colour, bg_colour, 0.2), cx + bg_margin_left + txt_margin, cy, cw - bg_margin_left * 2 - txt_margin * 2 - tw - this.scr_w, ch, DT_LEFT | DT_CALCRECT | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);
        }
        // draw flashing item on lbtn_up after a drag'n drop
        if (cPlaylistManager.blink_counter > -1) {
          if (cPlaylistManager.blink_row != 0) {
            if (i == cPlaylistManager.blink_id - 1) {
              if (cPlaylistManager.blink_counter <= 6 && Math.floor(cPlaylistManager.blink_counter / 2) == Math.ceil(cPlaylistManager.blink_counter / 2)) {
                gr.FillSolidRect(cx + bg_margin_left, cy + bg_margin_top, cw - bg_margin_left * 2 - this.scr_w, ch - bg_margin_top * 2, RGBA(255, 255, 255, 75));
              }
            }
          }
        }
        row_idx++;
      }
      // filter box
      // draw flashing filter box item on lbtn_up after a drag'n drop
      if (cPlaylistManager.blink_counter > -1) {
        if (cPlaylistManager.blink_row == 0) {
          if (cPlaylistManager.blink_counter <= 6 && Math.floor(cPlaylistManager.blink_counter / 2) == Math.ceil(cPlaylistManager.blink_counter / 2)) {
            gr.GdiDrawText("+ Sent to a New Playlist", g_font_bold, txt_colour, cx + bg_margin_left + txt_margin, this.y, cw - bg_margin_left * 2 - txt_margin * 2 - tw - this.scr_w, ch, DT_LEFT | DT_CALCRECT | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);
          }
        } else {
          gr.GdiDrawText("Send to ...", g_font_normal, txt_colour, cx + bg_margin_left + txt_margin, this.y, cw - bg_margin_left * 2 - txt_margin * 2 - tw - this.scr_w, ch, DT_LEFT | DT_CALCRECT | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);
        }
      } else {
        if (this.active_row == 0) {
          gr.GdiDrawText("+ Send to a New Playlist", g_font_bold, txt_colour, cx + bg_margin_left + txt_margin, this.y, cw - bg_margin_left * 2 - txt_margin * 2 - tw - this.scr_w, ch, DT_LEFT | DT_CALCRECT | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);
        } else {
          gr.GdiDrawText("Send to ...", g_font_normal, txt_colour, cx + bg_margin_left + txt_margin, this.y, cw - bg_margin_left * 2 - txt_margin * 2 - tw - this.scr_w, ch, DT_LEFT | DT_CALCRECT | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);
        }
      }
      // draw activeIndex hover frame
      if (cPlaylistManager.blink_counter > -1 && cPlaylistManager.blink_row > 0) {
        cy_ = this.y + cPlaylistManager.blink_row * ch;
        gr.DrawRect(cx + bg_margin_left + 1, cy_ + bg_margin_top + 1, cw - bg_margin_left * 2 - this.scr_w - 2, ch - bg_margin_top * 2 - 2, 2.0, RGBA(255, 255, 255, 240));
      } else {
        if (this.active_row > 0 && this.activeIndex > 0) {
          if (cPlaylistManager.blink_counter < 0) {
            cy_ = this.y + this.active_row * ch;
            gr.DrawRect(cx + bg_margin_left + 1, cy_ + bg_margin_top + 1, cw - bg_margin_left * 2 - this.scr_w - 2, ch - bg_margin_top * 2 - 2, 2.0, RGBA(255, 255, 255, 240));
          }
        }
      }
      // scrollbar
      if (this.scr_w > 0) {
        this.scr_cursor_h = (this.scr_h / (ch * this.rowTotal)) * this.scr_h;
        if (this.scr_cursor_h < 20)
          this.scr_cursor_h = 20;
        // set cursor y pos
        var ratio = (this.scroll * ch) / (this.rowTotal * ch - this.scr_h);
        this.scr_cursor_y = this.scr_y + Math.round((this.scr_h - this.scr_cursor_h) * ratio);
        gr.FillSolidRect(cx + cw - this.scr_w, this.scr_cursor_y, this.scr_w - 4, this.scr_cursor_h, RGBA(255, 255, 255, 100));
      }
    }
  }
  this.hover = (x, y) => {
    return (x >= this.x - this.offset && x <= this.x - this.offset + this.w && y >= this.y && y <= this.y + this.h - 1);
  }
  this.on_mouse = (event, x, y, delta) => {
    this.ishover = this.hover(x, y);
    switch (event) {
      case "move":
        // get active item index at x,y coords
        this.activeIndex = -1;
        if (this.ishover) {
          this.active_row = Math.ceil((y - this.y) / cPlaylistManager.row_height) - 1;
          this.activeIndex = Math.ceil((y - this.y) / cPlaylistManager.row_height) + this.scroll - 1;
        }
        if (this.activeIndex != this.activeIndexSaved) {
          this.activeIndexSaved = this.activeIndex;
          brw.repaint();
        }
        if (this.scr_w > 0 && x > this.x - this.offset && x <= this.x - this.offset + this.w) {
          if (y < this.y && pman.scroll > 0) {
            if (!timers.scrollPman && cPlaylistManager.blink_counter < 0) {
              timers.scrollPman = window.SetInterval(() => {
                pman.scroll--;
                if (pman.scroll < 0) {
                  pman.scroll = 0;
                  window.ClearInterval(timers.scrollPman);
                  timers.scrollPman = false;
                } else {
                  brw.repaint();
                }
              }, 100);
            }
          } else if (y > this.scr_y + this.scr_h && pman.scroll < this.rowTotal - this.total_rows) {
            if (!timers.scrollPman && cPlaylistManager.blink_counter < 0) {
              timers.scrollPman = window.SetInterval(() => {
                pman.scroll++;
                if (pman.scroll > pman.rowTotal - pman.total_rows) {
                  pman.scroll = pman.rowTotal - pman.total_rows;
                  window.ClearInterval(timers.scrollPman);
                  timers.scrollPman = false;
                } else {
                  brw.repaint();
                }
              }, 100);
            }
          } else {
            if (timers.scrollPman) {
              window.ClearInterval(timers.scrollPman);
              timers.scrollPman = false;
            }
          }
        }
        break;
      case "lbtn_up":
        brw.drag_clicked = false;
        if (brw.drag_moving) {
          window.SetCursor(IDC_ARROW);
          this.drop_done = false;
          if (this.activeIndex > -1) {
            brw.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
            if (this.active_row == 0) {
              // send to a new playlist
              this.drop_done = true;
              window.NotifyOthers("JSSmoothPlaylist->JSSmoothBrowser:avoid_on_playlist_switch_callbacks_on_sendItemToPlaylist", true);
              plman.CreatePlaylist(plman.PlaylistCount, "");
              plman.ActivePlaylist = plman.PlaylistCount - 1;
              plman.InsertPlaylistItems(plman.PlaylistCount - 1, 0, brw.metadblist_selection, false);
            } else {
              // send to selected (hover) playlist
              this.drop_done = true;
              var row_idx = this.activeIndex - 1;
              var playlist_idx = this.playlists[row_idx].idx;
              var insert_index = plman.PlaylistItemCount(playlist_idx);
              plman.InsertPlaylistItems(playlist_idx, insert_index, brw.metadblist_selection, false);
            }
            // timer to blink the playlist item where tracks have been droped!
            if (this.drop_done) {
              if (!cPlaylistManager.blink_timer) {
                cPlaylistManager.blink_x = x;
                cPlaylistManager.blink_y = y;
                cPlaylistManager.blink_totaltracks = brw.metadblist_selection.Count;
                cPlaylistManager.blink_id = this.activeIndex;
                cPlaylistManager.blink_row = this.active_row;
                cPlaylistManager.blink_counter = 0;
                cPlaylistManager.blink_timer = window.SetInterval(() => {
                  cPlaylistManager.blink_counter++;
                  if (cPlaylistManager.blink_counter > 6) {
                    window.ClearInterval(cPlaylistManager.blink_timer);
                    cPlaylistManager.blink_timer = false;
                    cPlaylistManager.blink_counter = -1;
                    cPlaylistManager.blink_id = null;
                    pman.drop_done = false;
                    // close pman
                    if (!timers.hide_playlist_manager) {
                      timers.hide_playlist_manager = window.SetInterval(pman.hidePanel, 25);
                    }
                    brw.drag_moving = false;
                  }
                  brw.repaint();
                }, 150);
              }
            }
          } else {
            if (timers.show_playlist_manager) {
              window.ClearInterval(timers.show_playlist_manager);
              timers.show_playlist_manager = false;
            }
            if (!timers.hide_playlist_manager) {
              timers.hide_playlist_manager = window.SetInterval(this.hidePanel, 25);
            }
            brw.drag_moving = false;
          }
          brw.drag_moving = false;
        }
        break;
      case "rbtn_up":
        brw.drag_clicked = false;
        if (brw.drag_moving) {
          if (timers.show_playlist_manager) {
            window.ClearInterval(timers.show_playlist_manager);
            timers.show_playlist_manager = false;
          }
          if (!timers.hide_playlist_manager) {
            timers.hide_playlist_manager = window.SetInterval(this.hidePanel, 25);
          }
          brw.drag_moving = false;
        }
        break;
      case "wheel":
        var scroll_prev = this.scroll;
        this.scroll -= delta;
        if (this.scroll < 0)
          this.scroll = 0;
        if (this.scroll > (this.rowTotal - this.total_rows))
          this.scroll = (this.rowTotal - this.total_rows);
        if (this.scroll != scroll_prev) {
          this.on_mouse("move", m_x, m_y);
        }
        break;
      case "leave":
        brw.drag_clicked = false;
        if (brw.drag_moving) {
          if (timers.show_playlist_manager) {
            window.ClearInterval(timers.show_playlist_manager);
            timers.show_playlist_manager = false;
          }
          if (!timers.hide_playlist_manager) {
            timers.hide_playlist_manager = window.SetInterval(this.hidePanel, 25);
          }
          brw.drag_moving = false;
        }
        break;
    }
  }
}
function _filter() {
  this.on_init = () => {
    this.inputbox = new _inputbox("", "Type here to search", g_colour_normal_txt, 0, 0, g_colour_highlight, send_response, "brw");
    this.inputbox.autovalidation = true;
  }
  this.on_init();
  this.images = {
    magnify: null,
    reset_normal: null,
    reset_hover: null,
    reset_down: null
  }
  this.get_images = () => {
    var gb;
    var w = this.inputbox.h;
    var font = gdi.Font(g_font_icon.Name, w / 2, 0);

    this.images.magnify = gdi.CreateImage(w, w);
    gb = this.images.magnify.GetGraphics();
    gb.SetTextRenderingHint(3);
    gb.DrawString('\uf78b', font, g_colour_gray_txt, 0, 0, w, w, SF.CENTRE);
    gb.SetSmoothingMode(0);
    this.images.magnify.ReleaseGraphics(gb);
   
    this.images.reset_normal = gdi.CreateImage(w, w);
    gb = this.images.reset_normal.GetGraphics();
    gb.SetTextRenderingHint(3);
    gb.DrawString('\ue894', font, g_colour_gray_txt, 0, 0, w, w, SF.CENTRE);
    gb.SetSmoothingMode(0);
    this.images.reset_normal.ReleaseGraphics(gb);

    this.images.reset_hover = gdi.CreateImage(w, w);
    gb = this.images.reset_hover.GetGraphics();
    // gb.FillSolidRect(0, 0, w - 1, w - 1, blendColours(g_colour_normal_bg, g_colour_normal_txt, 0.05));
    gb.SetTextRenderingHint(3);
    gb.DrawString('\ue894', font, g_colour_normal_txt, 0, 0, w, w, SF.CENTRE);
    gb.SetSmoothingMode(0);
    this.images.reset_hover.ReleaseGraphics(gb);

    this.images.reset_down = gdi.CreateImage(w, w);
    gb = this.images.reset_down.GetGraphics();
    // gb.FillSolidRect(0, 0, w - 1, w - 1, blendColours(g_colour_normal_bg, g_colour_normal_txt, 0.10));
    gb.SetTextRenderingHint(3);
    gb.DrawString('\ue894', font, g_colour_normal_txt, 0, 0, w, w, SF.CENTRE);
    gb.SetSmoothingMode(0);
    this.images.reset_down.ReleaseGraphics(gb);

    this.reset_bt = new button(this.images.reset_normal, this.images.reset_hover, this.images.reset_down);
  }
  this.get_images();
  this.colours_changed = () => {
    this.inputbox.text_colour = g_colour_normal_txt;
    this.inputbox.backselection_colour = g_colour_highlight;
  }
  this.size = (w, h) => {
    this.inputbox.size(w, h);
    this.get_images();
  }
  this.clear_contents = () => {
    if (this.inputbox.text.length > 0) {
      this.inputbox.text = "";
      this.inputbox.offset = 0;
      filter_text = "";
    }
  }
  this.paint = gr => {
    var background_colour = undefined;
    if (this.inputbox.edit) {
      background_colour = g_colour_normal_bg == 0xffffffff ? blendColours(g_colour_highlight, 0xffffffff, 0.9) : g_colour_normal_bg == 0xff000000 ? 0xff161616 : 0xff000000;
    } else {
      background_colour = g_colour_normal_bg == 0xffffffff ? 0xfff0f3f9 : g_colour_normal_bg == 0xff000000 ? 0xff101010 : blendColours(g_colour_normal_bg, 0xff000000, 0.25);
    }
    gr.FillSolidRect(this.inputbox.x - this.inputbox.h, this.inputbox.y, this.inputbox.w + this.inputbox.h * 2, this.inputbox.h - 1, background_colour);
    gr.DrawImage(this.images.magnify.Resize(this.inputbox.h, this.inputbox.h, 2), 0, 0, this.inputbox.h, this.inputbox.h, 0, 0, this.inputbox.h, this.inputbox.h, 0, 255);
    if (this.inputbox.text.length > 0) {
      this.reset_bt.paint(gr, this.inputbox.x + this.inputbox.w, 0, 255);
    } else {}
    this.inputbox.paint(gr);
  }
  this.on_mouse = (event, x, y, delta) => {
    switch (event) {
      case "lbtn_down":
        this.inputbox.check("lbtn_down", x, y);
        if (this.inputbox.text.length > 0)
          this.reset_bt.checkstate("lbtn_down", x, y);
        break;
      case "lbtn_up":
        this.inputbox.check("lbtn_up", x, y);
        if (this.inputbox.text.length > 0) {
          if (this.reset_bt.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
            this.inputbox.text = "";
            this.inputbox.offset = 0;
            send_response();
            this.reset_bt.state = ButtonStates.normal;
            if (fb.IsPlaying && plman.PlayingPlaylist == plman.ActivePlaylist) {
              brw.show_now_playing();
            }
          }
        }
        break;
      case "lbtn_dblclk":
        this.inputbox.check("lbtn_dblclk", x, y);
        break;
      case "rbtn_up":
        this.inputbox.check("rbtn_up", x, y);
        break;
      case "move":
        this.inputbox.check("move", x, y);
        if (this.inputbox.text.length > 0)
          this.reset_bt.checkstate("move", x, y);
        break;
    }
  }
  this.on_key = (event, vkey) => {
    switch (event) {
      case "lbtn_down":
        this.inputbox.on_key_down(vkey);
        break;
    }
  }
  this.on_char = code => {
    this.inputbox.on_char(code);
  }
  this.on_focus = is_focused => {
    this.inputbox.on_focus(is_focused);
  }
}
function _grp(index, start, handle, groupkey) {
  this.index = index;
  this.start = start;
  this.count = 1;
  this.metadb = handle;
  this.groupkey = groupkey;
  this.cachekey = process_cachekey(ppt.tf_crc.EvalWithMetadb(handle));
  this.cover_img = null;
  this.cover_type = null;
  this.tracktype = TrackType(handle.RawPath.substring(0, 4));
  this.tra = [];
  this.load_requested = 0;
  this.save_requested = false;
  this.collapsed = ppt.auto_collapse;
  this.finalize = (count, tracks) => {
    this.tra = tracks.slice(0);
    this.count = count;
    if (count < ppt.group_header_row_num_min) {
      this.rowsToAdd = ppt.group_header_row_num_min - count;
    } else {
      this.rowsToAdd = 0;
    }
    if (this.collapsed) {
      if (brw.focusedTrackId >= this.start && brw.focusedTrackId < this.start + count) { // focused track is in this group!
        this.collapsed = false;
        g_group_id_focused = this.index;
      }
    }
  }
}
function _brw(obj) {
  this.obj = obj;
  this.groups = [];
  this.rows = [];
  this.shift_start_id = null;
  this.shift_count = 0;
  this.scrollbar = new _scrollbar(this.obj);
  this.keypressed = false;
  this.columns = {};
  this.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
  this.launch_populate = () => {
    var launch_timer = window.SetTimeout(() => {
      // populate browser with items
      brw.populate(true);
      // populate playlist popup panel list
      pman.populate(false, true);
      // kill Timeout
      launch_timer && window.ClearTimeout(launch_timer);
      launch_timer = false;
    }, 5);
  }
  this.repaint = () => {
    need_repaint = true;
  }
  this.size = (x, y, w, h) => {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.group_header_row_height = ppt.group_header_row_num;
    this.total_rows = Math.ceil(this.h / ppt.row_height);
    this.total_rows_vis = Math.floor(this.h / ppt.row_height);
    if (g_first_populate_done)
      this.get_tags();
    filter.size();
    this.scrollbar.size();
    scroll = Math.round(scroll / ppt.row_height) * ppt.row_height;
    scroll = check_scroll(scroll);
    scroll_ = scroll;
    // scrollbar update
    this.scrollbar.update();
    pman.size(ww, y + h * 0.25, (cPlaylistManager.width < ww ? cPlaylistManager.width : ww), h);
  }
  this.collapse_all = bool => { // bool = true to collapse all groups otherwise expand them all
    var end = this.groups.length;
    for (i = 0; i < end; i++) {
      this.groups[i].collapsed = bool;
    }
    this.set_list(true);
    g_focus_row = this.get_offset_focus_item(g_focus_id);
    // if focused track not totally visible, we scroll to show it centered in the panel
    if (g_focus_row < scroll / ppt.row_height || g_focus_row > scroll / ppt.row_height + brw.total_rows_vis - 1) {
      scroll = (g_focus_row - Math.floor(brw.total_rows_vis / 2)) * ppt.row_height;
      scroll = check_scroll(scroll);
      scroll_ = scroll;
    }
    if (this.row_count > 0)
      brw.get_tags(true);
    this.scrollbar.update();
    this.repaint();
  }
  this.set_list = () => {
    this.rows.splice(0, this.rows.length);
    var r = 0, i = 0, j = 0, m = 0, n = 0, s = 0, p = 0;
    var grp_tags = "";
    var header_total_rows = ppt.group_header_row_num;
    var end = this.groups.length;
    for (i = 0; i < end; i++) {
      this.groups[i].load_requested = 0;
      grp_tags = this.groups[i].groupkey;
      s = this.groups[i].start;
      if (this.groups[i].collapsed) {
        if (ppt.show_group_headers) {
          this.groups[i].row_id = r;
          for (k = 0; k < header_total_rows; k++) {
            this.rows[r] = new Object();
            this.rows[r].type = k + 1; // 1st line of group header
            this.rows[r].metadb = this.groups[i].metadb;
            this.rows[r].albumId = i;
            this.rows[r].albumTrackId = 0;
            this.rows[r].playlistTrackId = s;
            this.rows[r].groupkey = grp_tags;
            r++;
          }
        }
      } else {
        if (ppt.show_group_headers) {
          this.groups[i].row_id = r;
          for (k = 0; k < header_total_rows; k++) {
            this.rows[r] = new Object();
            this.rows[r].type = k + 1; // 1st line of group header
            this.rows[r].metadb = this.groups[i].metadb;
            this.rows[r].albumId = i;
            this.rows[r].albumTrackId = 0;
            this.rows[r].playlistTrackId = s;
            this.rows[r].groupkey = grp_tags;
            r++;
          }
        }
        // tracks
        m = this.groups[i].count;
        for (j = 0; j < m; j++) {
          this.rows[r] = new Object();
          this.rows[r].type = 0; // track
          this.rows[r].metadb = this.list[s + j];
          this.rows[r].albumId = i;
          this.rows[r].albumTrackId = j;
          this.rows[r].playlistTrackId = s + j;
          this.rows[r].groupkey = grp_tags;
          this.rows[r].tracktype = TrackType(this.rows[r].metadb.RawPath.substring(0, 4));
          this.rows[r].rating = -1;
          r++;
        }
        // empty extra rows
        p = this.groups[i].rowsToAdd;
        for (n = 0; n < p; n++) {
          this.rows[r] = new Object();
          this.rows[r].type = 99; // extra row at bottom of the album/group
          r++;
        }
      }
    }
    this.row_count = r;
  }
  this.show_now_playing = () => {
    if (fb.IsPlaying) {
      try {
        this.nowplaying = plman.GetPlayingItemLocation();
        if (this.nowplaying.IsValid) {
          if (plman.PlayingPlaylist != g_active_playlist) {
            g_active_playlist = plman.ActivePlaylist = plman.PlayingPlaylist;
          }
          // set focus on the now playing item
          g_focus_id_prev = g_focus_id;
          g_focus_id = this.nowplaying.PlaylistItemIndex;
          g_focus_row = this.get_offset_focus_item(g_focus_id);
          plman.ClearPlaylistSelection(g_active_playlist);
          plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
          plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
          this.show_focused_item();
        }
      } catch (e) {}
    }
  }
  this.show_focused_item = () => {
    g_focus_row = this.get_offset_focus_item(g_focus_id);
    scroll = (g_focus_row - Math.floor(this.total_rows_vis / 2)) * ppt.row_height;
    scroll = check_scroll(scroll);
    this.scrollbar.update();
  }
  this.select_a_to_b = (start_id, end_id) => {
    var affected_items = Array();
    if (this.shift_start_id == null) {
      this.shift_start_id = start_id;
    }
    plman.ClearPlaylistSelection(g_active_playlist);
    var previous_focus_id = g_focus_id;
    if (start_id < end_id) {
      var deb = start_id;
      var fin = end_id;
    } else {
      var deb = end_id;
      var fin = start_id;
    }
    for (var i = deb; i <= fin; i++) {
      affected_items.push(i);
    }
    plman.SetPlaylistSelection(g_active_playlist, affected_items, true);
    plman.SetPlaylistFocusItem(g_active_playlist, end_id);
    if (affected_items.length > 1) {
      if (end_id > previous_focus_id) {
        var delta = end_id - previous_focus_id;
        this.shift_count += delta;
      } else {
        var delta = previous_focus_id - end_id;
        this.shift_count -= delta;
      }
    }
  }
  this.get_albumId_from_trackId = valeur => {
    if (valeur < 0) {
      return -1;
    } else {
      var mediane = 0;
      var deb = 0;
      var fin = this.groups.length - 1;
      while (deb <= fin) {
        mediane = Math.floor((fin + deb) / 2);
        if (valeur >= this.groups[mediane].start && valeur < this.groups[mediane].start + this.groups[mediane].count) {
          return mediane;
        } else if (valeur < this.groups[mediane].start) {
          fin = mediane - 1;
        } else {
          deb = mediane + 1;
        }
      }
      return -1;
    }
  }
  this.get_offset_focus_item = fid => {
    var row_idx = 0;
    if (fid > -1) {
      if (ppt.show_group_headers) {
        // fid = no item dans la playlist (focus id)
        // this.rows[] => albumId
        // 1. rech album id contenant le focus_id
        g_focus_album_id = this.get_albumId_from_trackId(fid);
        // 2. rech row id
        for (i = 0; i < this.rows.length; i++) {
          if (this.rows[i].type != 0 && this.rows[i].type != 99 && this.rows[i].albumId == g_focus_album_id) {
            if (this.groups[g_focus_album_id].collapsed) {
              row_idx = i;
            } else {
              var albumTrackId = g_focus_id - this.groups[g_focus_album_id].start;
              row_idx = i + this.group_header_row_height + albumTrackId;
            }
            break;
          }
        }
      } else {
        // 1 . rech album id contenant le focus_id
        g_focus_album_id = this.get_albumId_from_trackId(fid);
        // 2. rech row id
        for (i = 0; i < this.rows.length; i++) {
          if (this.rows[i].type == 0 && this.rows[i].albumId == g_focus_album_id) {
            var albumTrackId = g_focus_id - this.groups[g_focus_album_id].start;
            row_idx = i + albumTrackId;
            break;
          }
        }
      }
    }
    return row_idx;
  }
  this.init_groups = () => {
    var handle = null;
    var current = "";
    var previous = "";
    var g = 0, t = 0;
    var arr = [];
    var tr = [];
    var total = this.list.Count;
    if (plman.PlaylistItemCount(g_active_playlist) > 0) {
      this.focusedTrackId = plman.GetPlaylistFocusItemIndex(g_active_playlist);
    } else {
      this.focusedTrackId = -1;
    }
    var d1 = new Date();
    var t1 = d1.getSeconds() * 1000 + d1.getMilliseconds();
    this.groups.splice(0, this.groups.length);
    var tf = ppt.tf_groupkey;
    var str_filter = process_string(filter_text);
    for (var i = 0; i < total; i++) {
      handle = this.list[i];
      arr = tf.EvalWithMetadb(handle).split(" ## ");
      current = arr[0].toLowerCase();
      if (str_filter.length > 0) {
        var toAdd = match(arr[0] + " " + arr[1], str_filter);
      } else {
        var toAdd = true;
      }
      if (toAdd) {
        if (current != previous) {
          if (g > 0) {
            // update current group
            this.groups[g - 1].finalize(t, tr);
            tr.splice(0, t);
            t = 0;
          }
          if (i < total) {
            // add new group
            tr.push(arr[1]);
            t++;
            this.groups.push(new _grp(g, i, handle, arr[0]));
            g++;
            previous = current;
          }
        } else {
          // add track to current group
          tr.push(arr[1]);
          t++;
        }
      }
    }
    // update last group properties
    if (g > 0)
      this.groups[g - 1].finalize(t, tr);
    var d2 = new Date();
    var t2 = d2.getSeconds() * 1000 + d2.getMilliseconds();
  }
  this.populate = is_first_populate => {
    this.list = plman.GetPlaylistItems(g_active_playlist);
    this.init_groups();
    this.set_list();
    g_focus_row = brw.get_offset_focus_item(g_focus_id);
    if (g_focus_id < 0) { // focused item not set
      if (is_first_populate) {
        scroll = scroll_ = 0;
      }
    } else {
      if (is_first_populate) {
        // if focused track not totally visible, we scroll to show it centered in the panel
        if (g_focus_row < scroll / ppt.row_height || g_focus_row > scroll / ppt.row_height + brw.total_rows_vis - 1) {
          scroll = (g_focus_row - Math.floor(brw.total_rows_vis / 2)) * ppt.row_height;
          scroll = check_scroll(scroll);
          scroll_ = scroll;
        }
      }
    }
    if (brw.row_count > 0)
      brw.get_tags(true);
    this.scrollbar.update();
    this.repaint();
    g_first_populate_done = true;
  }
  this.get_limits = () => {
    if (this.rows.length <= this.total_rows_vis) {
      var start_ = 0;
      var end_ = this.rows.length - 1;
    } else {
      if (scroll_ < 0)
        scroll_ = scroll;
      var start_ = Math.round(scroll_ / ppt.row_height + 0.4);
      var end_ = start_ + this.total_rows + (ppt.group_header_row_num - 1);
      // check boundaries
      start_ = start_ > 0 ? start_ - 1 : start_;
      if (start_ < 0)
        start_ = 0;
      if (end_ >= this.rows.length)
        end_ = this.rows.length - 1;
    }
    g_start_ = start_;
    g_end_ = end_;
  }
  this.get_tags = all => {
    var start_prev = g_start_;
    var end_prev = g_end_;
    this.get_limits();
    // force full list refresh especially when library is populating (call from 'on_item_focus_change')
    if (Math.abs(g_start_ - start_prev) > 1 || Math.abs(g_end_ - end_prev) > 1)
      all = true;
    var tf_grp = ppt.tf_groupkey;
    var tf_trk = ppt.tf_track;
    if (all) {
      for (var i = g_start_; i <= g_end_; i++) {
        switch (this.rows[i].type) {
          case this.group_header_row_height: // last group header row
            // group tags
            this.rows[i].groupkey = tf_grp.EvalWithMetadb(this.rows[i].metadb);
            // track tags
            this.rows[i].tracktags = tf_trk.EvalWithMetadb(this.rows[i].metadb);
            break;
          case 0: // track row
            // group tags
            this.rows[i].groupkey = tf_grp.EvalWithMetadb(this.rows[i].metadb);
            // track tags
            this.rows[i].tracktags = tf_trk.EvalWithMetadb(this.rows[i].metadb);
            break;
        }
      }
    } else {
      if (g_start_ < start_prev) {
        switch (this.rows[g_start_].type) {
          case this.group_header_row_height: // last group header row
            // track tags
            this.rows[g_start_].tracktags = tf_trk.EvalWithMetadb(this.rows[g_start_].metadb);
            break;
          case 0: // track row
            // track tags
            this.rows[g_start_].tracktags = tf_trk.EvalWithMetadb(this.rows[g_start_].metadb);
            break;
        }
      } else if (g_start_ > start_prev || g_end_ > end_prev) {
        switch (this.rows[g_end_].type) {
          case this.group_header_row_height: // last group header row
            // track tags
            this.rows[g_end_].tracktags = tf_trk.EvalWithMetadb(this.rows[g_end_].metadb);
            break;
          case 0: // track row
            // track tags
            this.rows[g_end_].tracktags = tf_trk.EvalWithMetadb(this.rows[g_end_].metadb);
            break;
        }
      }
    }
  }
  this.paint = gr => {
    var cover_w = 0;
    var arr_g = [];
    var arr_t = [];
    var arr_e = [];
    var nowplaying_group = undefined;
    var group_colour_txt_normal = undefined;
    var group_colour_txt_fader = undefined;
    if (this.rows.length > 0) {
      var ax = 0;
      var ay = 0;
      var aw = this.w;
      var ah = ppt.row_height;
      var ghrh = this.group_header_row_height;
      var g = 0;
      cover_w = cover.w;
      // get nowplaying track
      if (fb.IsPlaying && plman.PlayingPlaylist == g_active_playlist) {
        this.nowplaying = plman.GetPlayingItemLocation();
      } else {
        this.nowplaying = null;
      }
      for (var i = g_start_; i <= g_end_; i++) {
        ay = Math.floor(this.y + (i * ah) - scroll_);
        this.rows[i].x = ax;
        this.rows[i].y = ay;
        switch (this.rows[i].type) {
          case ghrh: // last group header row
            if (ay > 0 - (ghrh * ah) && ay < this.h + (ghrh * ah)) {
              try {
                arr_g = this.rows[i].groupkey.split(" ^^ ");
                arr_e = this.groups[this.rows[i].albumId].tra[0].split(" ^^ ");
              } catch (e) {}
              // nowplaying group
              if (this.nowplaying && this.nowplaying.PlaylistItemIndex >= this.groups[this.rows[i].albumId].start && this.nowplaying.PlaylistItemIndex < this.groups[this.rows[i].albumId].start + this.groups[this.rows[i].albumId].count) {
                nowplaying_group = true;
              } else {
                nowplaying_group = false;
              }
              // group id
              g = this.rows[i].albumId;
              // group header bg
              // if group collapsed, check if 1st track of the group is selected to highlight the group as a selected track]
              var g_selected = false;
              if (this.groups[g].collapsed) {
                var deb = this.groups[g].start;
                var fin = this.groups[g].start + this.groups[g].count;
                for (var p = deb; p < fin; p++) {
                  if (plman.IsPlaylistItemSelected(g_active_playlist, p)) {
                    g_selected = true;
                    break;
                  }
                }
              }
              if (g_selected) {
                group_colour_txt_normal = 0xffffffff;
                group_colour_txt_fader = blendColours(group_colour_txt_normal, g_colour_highlight, 0.5);
                gr.FillSolidRect(ax, ay - ((ghrh - 1) * ah), aw, ah * ghrh, g_colour_highlight);
              } else {
                group_colour_txt_normal = g_colour_normal_txt;
                group_colour_txt_fader = blendColours(group_colour_txt_normal, g_colour_normal_bg, 0.5);
                ppt.show_group_header_bg && gr.FillSolidRect(ax, ay - ((ghrh - 1) * ah), aw, ah * ghrh, g_colour_normal_bg == 0xffffffff ? 0xfff0f3f9 : blendColours(g_colour_normal_bg, 0xff000000, 0.15));
              }
              // cover art
              if (ghrh > 1 && ppt.show_cover) {
                if (this.groups[g].cover_type == null) {
                  if (this.groups[g].load_requested == 0) {
                    this.groups[g].cover_img = cache.hit(this.rows[i].metadb, g);
                  }
                } else if (this.groups[g].cover_type == 0) {
                  this.groups[g].cover_img = format_cover(images.noart, cover_w - cover.margin * 2, cover_w - cover.margin * 2);
                } else if (this.groups[g].cover_type == 3) {
                  this.groups[g].cover_img = format_cover(images.stream, cover_w - cover.margin * 2, cover_w - cover.margin * 2);
                }
                if (this.groups[g].cover_img != null) {
                  var cv_w = this.groups[g].cover_img.Width;
                  var cv_h = this.groups[g].cover_img.Height;
                  var dx = (cover.w - cv_w) / 2;
                  var dy = (cover.h - cv_h) / 2;
                  var cv_x = Math.floor(ax + dx);
                  var cv_y = Math.floor(ay + dy - ((ghrh - 1) * ah));
                  gr.DrawImage(this.groups[g].cover_img, cv_x, cv_y, cv_w, cv_h, 0, 0, cv_w, cv_h, 0, 255);
                  gr.DrawRect(cv_x, cv_y, cv_w - 1, cv_h - 1, 1.0, g_colour_normal_txt & 0x24ffffff);
                }
                var text_left_margin = cover.w;
              } else {
                var text_left_margin = cover.margin;
              }
              // text
              // right area
              this.columns.album_date_part = gr.CalcTextWidth(arr_e[arr_e.length - 1].substring(0, 4), g_font_group1);
              gr.GdiDrawText(arr_e[arr_e.length - 1].substring(0, 4), g_font_group1, group_colour_txt_normal, ax + aw - this.columns.album_date_part - cover.margin, ay - ((ghrh - 1.55) * ah), this.columns.album_date_part, Math.round(ah * 2 / 3), DT_RIGHT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
              this.columns.album_publisher_part = Math.min(gr.CalcTextWidth(arr_e[2], g_font_group2), aw * 0.25);
              gr.GdiDrawText(arr_e[2], g_font_group2, group_colour_txt_fader, ax + aw - this.columns.album_publisher_part - cover.margin, ay - ((ghrh - 2.65) * ah), this.columns.album_publisher_part, Math.round(ah * 2 / 3), DT_RIGHT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
              gr.FillSolidRect(0, ay - ((ghrh - 1) * ah), cover.margin * 0.5, ghrh * ah, nowplaying_group ? g_colour_highlight : ppt.show_cover ? 0 : group_colour_txt_fader & 0x20ffffff);
              // left area
              var album_name = "";
              if (arr_g[1] == "?") {
                if (this.groups[g].count > 1) {
                  album_name = "(Singles)"
                } else {
                  var arr_tmp = this.groups[g].tra[0].split(" ^^ ");
                  album_name = "(Single) " + arr_tmp[1];
                }
              } else {
                album_name = arr_g[1];
              }
              gr.GdiDrawText(album_name, g_font_group1, group_colour_txt_normal, ax + text_left_margin + cover.margin * 0.25, ay - ((ghrh - 1.55) * ah), aw - text_left_margin - this.columns.album_date_part - cover.margin * 1.75, Math.round(ah * 2 / 3), DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
              gr.GdiDrawText(arr_g[0], g_font_group2, group_colour_txt_fader, ax + text_left_margin + cover.margin * 0.25, ay - ((ghrh - 2.65) * ah), aw - text_left_margin - this.columns.album_publisher_part - cover.margin * 1.75, Math.round(ah * 2 / 3), DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
              // draw lines
              gr.DrawLine(ax + text_left_margin + cover.margin * 0.25, ay - ((ghrh - 2.55) * ah), ax + aw - 6, ay - ((ghrh - 2.55) * ah), 1.0, group_colour_txt_fader & 0x20ffffff);
            }
            break;
          case 0: // track row
            if (ay > this.y - filter.inputbox.h - ah && ay < this.y + this.h) {
              try {
                arr_t = this.rows[i].tracktags.split(" ^^ ");
                arr_g = this.rows[i].groupkey.split(" ^^ ");
                arr_e = this.groups[this.rows[i].albumId].tra[this.rows[i].albumTrackId].split(" ^^ ");
              } catch (e) {}
              // track bg
              var num_colour = g_colour_gray_txt;
              var track_colour = g_colour_normal_txt;
              var track_artist_colour = g_colour_gray_txt;
              var time_colour = g_colour_normal_txt;
              var rating_colour = g_colour_rating;
              // selected track bg
              var t_selected = plman.IsPlaylistItemSelected(g_active_playlist, this.rows[i].playlistTrackId);
              if (t_selected) {
                time_colour = 0xffffffff;
                track_colour = 0xffffffff;
                track_artist_colour = blendColours(track_colour, g_colour_highlight, 0.5);
                time_colour = 0xffffffff;
                gr.FillSolidRect(ax, ay, aw, ah, g_colour_highlight);
              } else {
                // default track bg (odd/even)
                if (ppt.show_group_headers) {
                  if (this.rows[i].albumTrackId % 2 == 0 && ppt.show_stripes) {
                    gr.FillSolidRect(ax, ay, aw, ah, g_colour_normal_txt & 0x08ffffff);
                  }
                } else {
                  if (this.rows[i].playlistTrackId % 2 == 0 && ppt.show_stripes) {
                    gr.FillSolidRect(ax, ay, aw, ah, g_colour_normal_txt & 0x08ffffff);
                  }
                }
              }
              // focused track bg
              if (this.rows[i].playlistTrackId == g_focus_id) {
                gr.DrawRect(ax + 1, ay + 1, aw - 2, ah - 2, 2.0, g_colour_highlight & 0xd0ffffff);
              }
              // text
              if (ay >= (0 - ah) && ay < this.y + this.h) {
                var track_type = this.groups[this.rows[i].albumId].tracktype;
                var nbc = this.groups[this.rows[i].albumId].count.toString().length;
                if (nbc == 1)
                  nbc++;
                // fields
                var track_num = arr_t[0] == "?" ? this.rows[i].albumTrackId + 1 : arr_t[0];
                // var track_num_part = num(track_num, nbc) + "    ";
                var track_num_part = ppt.show_group_headers ? "  " + num(track_num, nbc) + "    " : "  " + (i + 1) + "    ";
                var track_artist_part = "";
                if (!ppt.show_group_headers || arr_e[0].toLowerCase() != arr_g[0].toLowerCase()) {
                  track_artist_part = arr_e[0];
                } else {
                  track_artist_part = "";
                }
                var track_title_part = arr_e[1];
                var track_time_part = arr_t[1];
                // rating tag fixing & formatting
                var track_rating_part = 0;
                if (this.rows[i].rating == -1) {
                  if (isNaN(arr_t[2])) {
                    track_rating_part = 0;
                  } else if (Math.abs(arr_t[2]) > 0 && Math.abs(arr_t[2]) < 6) {
                    track_rating_part = Math.abs(arr_t[2]);
                  } else {
                    track_rating_part = 0;
                  }
                  this.rows[i].rating = track_rating_part;
                } else {
                  track_rating_part = this.rows[i].rating;
                }
                if (ppt.show_rating && track_type != 3) {
                  this.columns.track_rating_part = gr.CalcTextWidth(g_font_rating_char.repeat(5), g_font_rating);
                } else {
                  this.columns.track_rating_part = 0;
                }
                gr.SetTextRenderingHint(4);
                // track row part
                if (track_artist_part.length > 0) {
                  track_artist_part = " \u00B7 " + track_artist_part;
                }
                // calc text part width + draw text
                if (this.nowplaying && this.rows[i].playlistTrackId == this.nowplaying.PlaylistItemIndex) { // now playing track
                  gr.FillSolidRect(ax, ay, aw, ah, g_colour_highlight & 0x24ffffff);
                  this.nowplaying_y = ay;
                  if (!g_time_remaining) {
                    g_time_remaining = ppt.tf_time_remaining.Eval(true);
                  }
                  track_time_part = g_time_remaining;
                  // streaming
                  if (track_time_part == "ON AIR") {
                    if (g_radio_artist.length > 0) {
                      g_radio_artist = " \u00B7 " + g_radio_artist;
                    }
                  }
                  this.columns.track_num_part = gr.CalcTextWidth(track_num_part, g_font_normal);
                  this.columns.track_title_part = gr.CalcTextWidth(track_title_part, g_font_normal);
                  this.columns.track_time_part = gr.CalcTextWidth("00:00:00", g_font_normal);
                  if (track_time_part == "ON AIR") {
                    this.columns.track_artist_part = g_radio_artist.length > 0 ? gr.CalcTextWidth(g_radio_artist, g_font_normal) : 0;
                  } else {
                    this.columns.track_artist_part = track_artist_part.length > 0 ? gr.CalcTextWidth(track_artist_part, g_font_normal) : 0;
                  }
                  var tx = ax + this.columns.track_num_part;
                  var tw = aw - this.columns.track_num_part;
                  gr.GdiDrawText(track_num_part, g_font_normal, num_colour, ax, ay, this.columns.track_num_part, ah, DT_RIGHT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                  if (track_time_part == "ON AIR") {
                    gr.GdiDrawText(g_radio_title, g_font_normal, track_colour, tx, ay, tw - this.columns.track_time_part - this.columns.track_rating_part - 15, ah, DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                  } else {
                    gr.GdiDrawText(track_title_part, g_font_normal, track_colour, tx, ay, tw - this.columns.track_time_part - this.columns.track_rating_part - 15, ah, DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                  }
                  if (this.columns.track_artist_part > 0) {
                    if (track_time_part == "ON AIR") {
                    } else {
                      gr.GdiDrawText(track_artist_part, g_font_normal, track_artist_colour, tx + this.columns.track_title_part, ay, tw - this.columns.track_title_part - this.columns.track_time_part - this.columns.track_rating_part - 15, ah, DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                    }
                  }
                  gr.GdiDrawText(track_time_part + "  ", g_font_normal, time_colour, tx + tw - this.columns.track_time_part, ay, this.columns.track_time_part, ah, DT_RIGHT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                  // rating
                  if (ppt.show_rating && track_type != 3) {
                    gr.DrawString(g_font_rating_char.repeat(5), g_font_rating, track_colour & 0x20ffffff, tx + tw - this.columns.track_time_part - this.columns.track_rating_part, ay, this.columns.track_rating_part, ah, SF.LC);
                    gr.DrawString(g_font_rating_char.repeat(track_rating_part), g_font_rating, rating_colour, tx + tw - this.columns.track_time_part - this.columns.track_rating_part, ay, this.columns.track_rating_part, ah, SF.LC);
                  }
                } else { // default track
                  this.columns.track_num_part = gr.CalcTextWidth(track_num_part, g_font_normal);
                  this.columns.track_artist_part = track_artist_part.length > 0 ? gr.CalcTextWidth(track_artist_part, g_font_normal) : 0;
                  this.columns.track_title_part = gr.CalcTextWidth(track_title_part, g_font_normal);
                  this.columns.track_time_part = gr.CalcTextWidth("00:00:00", g_font_normal);
                  var tx = ax + this.columns.track_num_part;
                  var tw = aw - this.columns.track_num_part;
                  gr.GdiDrawText(track_num_part, g_font_normal, num_colour, ax, ay, this.columns.track_num_part, ah, DT_RIGHT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                  gr.GdiDrawText(track_title_part, g_font_normal, track_colour, tx, ay, tw - this.columns.track_time_part - this.columns.track_rating_part - 15, ah, DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                  gr.GdiDrawText(track_artist_part, g_font_normal, track_artist_colour, tx + this.columns.track_title_part, ay, tw - this.columns.track_title_part - this.columns.track_time_part - this.columns.track_rating_part - 15, ah, DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                  gr.GdiDrawText(track_time_part + "  ", g_font_normal, time_colour, tx + tw - this.columns.track_time_part, ay, this.columns.track_time_part, ah, DT_RIGHT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX);
                  // rating
                  if (ppt.show_rating && track_type != 3) {
                      gr.DrawString(g_font_rating_char.repeat(5), g_font_rating, track_colour & 0x20ffffff, tx + tw - this.columns.track_time_part - this.columns.track_rating_part, ay, this.columns.track_rating_part, ah, SF.LC);
                      gr.DrawString(g_font_rating_char.repeat(track_rating_part), g_font_rating, rating_colour, tx + tw - this.columns.track_time_part - this.columns.track_rating_part, ay, this.columns.track_rating_part, ah, SF.LC);
                  }
                }
              }
            }
            break;
          case 99: // extra bottom row
            if (ay > -1 && ay < this.h) {
              if (this.rows[i].albumTrackId % 2 == 0) {
                gr.FillSolidRect(ax, ay, aw, ah, RGBA(255, 255, 255, 3));
              } else {
                gr.FillSolidRect(ax, ay, aw, ah, RGBA(0, 0, 0, 3));
              }
            }
            break;
        }
      }
      // draw scrollbar
      if (this.scrollbar.enabled) {
        this.scrollbar && this.scrollbar.paint(gr);
      }
      // incremental Search Display
      if (cList.search_string.length > 0) {
        gr.SetSmoothingMode(2);
        brw.tt_x = Math.floor(((brw.w) / 2) - (((cList.search_string.length * 13) + (40 * 2)) / 2));
        brw.tt_y = brw.y + Math.floor((brw.h / 2) - 40);
        brw.tt_w = Math.round((cList.search_string.length * 13) + (40 * 2));
        brw.tt_h = 80;
        gr.FillSolidRect(brw.tt_x, brw.tt_y, brw.tt_w, brw.tt_h, RGBA(0, 0, 0, 150));
        gr.DrawRect(brw.tt_x, brw.tt_y, brw.tt_w, brw.tt_h, 1.0, RGBA(0, 0, 0, 100));
        gr.DrawRect(brw.tt_x + 1, brw.tt_y + 1, brw.tt_w - 2, brw.tt_h - 2, 1.0, RGBA(255, 255, 255, 50));
        try {
          gr.GdiDrawText(cList.search_string, g_font_incsearch, cList.inc_search_nofilter_result ? RGB(255, 70, 70) : RGB(250, 250, 250), brw.tt_x, brw.tt_y, brw.tt_w, brw.tt_h, DT_CENTER | DT_NOPREFIX | DT_CALCRECT | DT_VCENTER);
        } catch (e) {}
      }
    } else { // no track, playlist is empty
      var text = "";
      var icon_colour = g_colour_normal_bg == 0xffffffff ? 0xfff0f3f9 : g_colour_normal_bg == 0xff000000 ? 0xff101010 : blendColours(g_colour_normal_bg, 0xff000000, 0.25);
      if (plman.PlaylistItemCount(plman.ActivePlaylist) == 0) {
        gr.SetTextRenderingHint(3);
        gr.DrawString('\ue838', gdi.Font(g_font_icon.Name, scale(172)), icon_colour, 0, 0, ww, wh, SF.CENTRE);
        plman.IsAutoPlaylist(plman.ActivePlaylist) ? text = "AutoPlaylist <" + plman.GetPlaylistName(plman.ActivePlaylist) + "> is empty.\nClick to edit the query!" : text = "<" + plman.GetPlaylistName(plman.ActivePlaylist) + "> is empty.\nClick to add a folder or\ndrag files and folders.";
      }
      gr.GdiDrawText(text, g_font_head, g_colour_gray_txt, 0, 0, ww, wh, DT_CENTER | DT_NOPREFIX | DT_CALCRECT | DT_VCENTER);
    }
    // draw filter box
    if (ppt.show_filter) {
      gr.FillSolidRect(0, 0, ww, brw.y, g_colour_normal_bg);
      var filter_count = 0;
      for (i = 0; i < this.rows.length; i++) {
        this.rows[i].type == 0 && filter_count++;
      }
      var filter_result = 'Filter out ' + filter_count + ' item' + (filter_count > 1 ? 's' : '');
      var filter_result_x = filter.inputbox.x + filter.inputbox.w + filter.inputbox.h + scale(4);
      filter.inputbox.text.length > 0 && gr.GdiDrawText(filter_result, g_font_normal, g_colour_gray_txt, filter_result_x, 0, ww - filter_result_x - scale(8), filter.inputbox.h, DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX | DT_END_ELLIPSIS);
    }
  }
  this.select_group_tracks = aId => {
    var affected_items = [];
    var end = this.groups[aId].start + this.groups[aId].count;
    for (var i = this.groups[aId].start; i < end; i++) {
      affected_items.push(i);
    }
    plman.SetPlaylistSelection(g_active_playlist, affected_items, true);
  }
  this.hover = (x, y) => {
    return (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h);
  }
  this.check_dragndrop = (x, y, row_id) => {
    if (this.active_row > -1 && row_id == this.active_row) {
      g_dragndrop_trackId = this.rows[row_id].playlistTrackId;
    }
  }
  this.on_mouse = (event, x, y) => {
    this.ishover = (x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h);
    // get hover row index (mouse cursor hover)
    if (y > this.y && y < this.y + this.h) {
      this.active_row = Math.ceil((y + scroll_ - this.y) / ppt.row_height - 1);
      if (this.active_row >= this.rows.length)
        this.active_row = -1;
    } else {
      this.active_row = -1;
    }
    // rating check
    this.ishover_rating_prev = this.ishover_rating;
    if (this.active_row > -1) {
      var rating_x = this.x + this.w - this.columns.track_time_part - this.columns.track_rating_part;
      var rating_y = Math.floor(this.y + (this.active_row * ppt.row_height) - scroll_);
      if (ppt.show_rating) {
        this.ishover_rating = (this.rows[this.active_row].type == 0 && x >= rating_x && x <= rating_x + this.columns.track_rating_part && y >= rating_y && y <= rating_y + ppt.row_height);
      } else {
        this.ishover_rating = false;
      }
    } else {
      this.ishover_rating = false;
    }
    switch (event) {
    case "lbtn_down":
      this.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
      if (!cTouch.down && !timers.mouse_down && this.ishover && this.active_row > -1 && Math.abs(scroll - scroll_) < 2) {
        var rowType = this.rows[this.active_row].type;
        //
        this.drag_clicked = true;
        this.drag_clicked_x = x;
        //
        switch (true) {
          case (rowType > 0 && rowType < 99): // group header row
            var playlistTrackId = this.rows[this.active_row].playlistTrackId;
            if (utils.IsKeyPressed(VK_SHIFT)) {
              if (g_focus_id != playlistTrackId) {
                if (this.shift_start_id != null) {
                  this.select_a_to_b(this.shift_start_id, playlistTrackId);
                } else {
                  this.select_a_to_b(g_focus_id, playlistTrackId);
                }
              }
            } else if (utils.IsKeyPressed(VK_CONTROL)) {
              this.select_group_tracks(this.rows[this.active_row].albumId);
              this.shift_start_id = null;
            } else {
              plman.ClearPlaylistSelection(g_active_playlist);
              if (!(ppt.auto_collapse && this.groups[this.rows[this.active_row].albumId].collapsed)) {
                this.select_group_tracks(this.rows[this.active_row].albumId);
              }
              this.shift_start_id = null;
            }
            plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
            break;
          case (rowType == 0): // track row
            var playlistTrackId = this.rows[this.active_row].playlistTrackId;
            if (utils.IsKeyPressed(VK_SHIFT)) {
              if (g_focus_id != playlistTrackId) {
                if (this.shift_start_id != null) {
                  this.select_a_to_b(this.shift_start_id, playlistTrackId);
                } else {
                  this.select_a_to_b(g_focus_id, playlistTrackId);
                }
              }
            } else if (utils.IsKeyPressed(VK_CONTROL)) {
              if (plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
                plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, false);
              } else {
                plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
                plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
              }
              this.shift_start_id = null;
            } else {
              // check if rating to update ?
              if (this.ishover_rating) {
                // calc new rating
                var l_rating = Math.ceil((x - rating_x) / (this.columns.track_rating_part / 5) + 0.1);
                if (l_rating > 5)
                  l_rating = 5;
                // update if new rating <> current track rating
                if (this.rows[this.active_row].tracktype < 2) {
                  g_rating_updated = true;
                  g_rating_row_id = this.active_row;
                  if (cc('foo_playcount')) {
                    if (l_rating != this.rows[this.active_row].rating) {
                      if (this.rows[this.active_row].metadb) {
                        this.rows[this.active_row].rating = l_rating;
                        window.Repaint();
                        fb.RunContextCommandWithMetadb("Playback Statistics/Rating/" + ((l_rating == 0) ? "<not set>" : l_rating), this.rows[this.active_row].metadb);
                      }
                    } else {
                      this.rows[this.active_row].rating = 0;
                      window.Repaint();
                      fb.RunContextCommandWithMetadb("Playback Statistics/Rating/<not set>", this.rows[this.active_row].metadb);
                    }
                  } else {
                    var handles = new FbMetadbHandleList(this.rows[this.active_row].metadb);
                    // Rate to file
                    if (l_rating != this.rows[this.active_row].rating) {
                      this.rows[this.active_row].rating = l_rating;
                      window.Repaint();
                      handles.UpdateFileInfoFromJSON(JSON.stringify({ "RATING": l_rating }));
                    } else {
                      this.rows[this.active_row].rating = 0;
                      window.Repaint();
                      handles.UpdateFileInfoFromJSON(JSON.stringify({ "RATING": "" }));
                    }
                  }
                }
              } else {
                if (plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
                  if (this.metadblist_selection.Count > 1) {
                    // plman.ClearPlaylistSelection(g_active_playlist);
                    // plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
                    // plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
                  } else {
                    // nothing, single track already selected
                  }
                } else {
                  plman.ClearPlaylistSelection(g_active_playlist);
                  plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
                  plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
                }
                this.shift_start_id = null;
              }
            }
            break;
          case (rowType == 99): // extra empty row
            break;
        }
        this.repaint();
      } else {
        // scrollbar
        if (this.scrollbar.enabled && this.scrollbar.visible) {
          this.scrollbar && this.scrollbar.on_mouse(event, x, y);
        }
      }
      break;
    case "lbtn_up":
      this.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
      if (this.drag_clicked && this.active_row > -1) {
        var rowType = this.rows[this.active_row].type;
        //
        switch (true) {
          case (rowType > 0 && rowType < 99): // group header row
            break;
          case (rowType == 0): // track row
            var playlistTrackId = this.rows[this.active_row].playlistTrackId;
            if (!utils.IsKeyPressed(VK_SHIFT) && !utils.IsKeyPressed(VK_CONTROL)) {
              if (plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
                if (this.metadblist_selection.Count > 1) {
                  plman.ClearPlaylistSelection(g_active_playlist);
                  plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
                  plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
                }
              }
            }
            break;
          case (rowType == 99): // extra empty row
            break;
        }
        this.repaint();
      }
      // add folder when playlist is empty
      if (y > this.y + (ppt.show_filter ? filter.inputbox.h : 0)) {
        if (plman.PlaylistItemCount(plman.ActivePlaylist) == 0) {
          plman.IsAutoPlaylist(plman.ActivePlaylist) ? plman.ShowAutoPlaylistUI(plman.ActivePlaylist) : fb.RunMainMenuCommand("File/Add folder...");
        }
      }
      this.drag_clicked = false;
      // scrollbar
      if (this.scrollbar.enabled && this.scrollbar.visible) {
        this.scrollbar && this.scrollbar.on_mouse(event, x, y);
      }
      break;
    case "lbtn_dblclk":
      if (this.ishover && this.active_row > -1 && Math.abs(scroll - scroll_) < 2) {
        var rowType = this.rows[this.active_row].type;
        switch (true) {
          case (rowType > 0 && rowType < 99): // group header
            this.groups[this.rows[this.active_row].albumId].collapsed = !this.groups[this.rows[this.active_row].albumId].collapsed;
            this.set_list(true);
            ///*
            g_focus_row = this.get_offset_focus_item(g_focus_id);
            // if focused track not totally visible, we scroll to show it centered in the panel
            if (g_focus_row < scroll / ppt.row_height || g_focus_row > scroll / ppt.row_height + brw.total_rows_vis - 1) {
              scroll = (g_focus_row - Math.floor(brw.total_rows_vis / 2)) * ppt.row_height;
              scroll = check_scroll(scroll);
              scroll_ = scroll;
            }
            //*/
            if (this.row_count > 0)
              brw.get_tags(true);
            this.scrollbar.update();
            brw.repaint();
            break;
          case (rowType == 0): // track
            plman.ExecutePlaylistDefaultAction(g_active_playlist, this.rows[this.active_row].playlistTrackId);
            break;
          case (rowType == 99): // extra empty row
            break;
        }
        this.repaint();
      } else {
        // scrollbar
        if (this.scrollbar.enabled && this.scrollbar.visible) {
          this.scrollbar && this.scrollbar.on_mouse(event, x, y);
        }
      }
      break;
    case "move":
      if (g_lbtn_click && this.drag_clicked && !this.drag_moving) {
        if (x - this.drag_clicked_x > 30 && this.h > cPlaylistManager.row_height * 6) {
          this.drag_moving = true;
          window.SetCursor(IDC_HELP);
          pman.state = 1;
          if (timers.hide_playlist_manager) {
            window.ClearInterval(timers.hide_playlist_manager);
            timers.hide_playlist_manager = false;
          }
          if (!timers.show_playlist_manager) {
            timers.show_playlist_manager = window.SetInterval(pman.showPanel, 25);
          }
        }
      }
      if (this.drag_moving && !timers.hide_playlist_manager && !timers.show_playlist_manager) {
        pman.on_mouse("move", x, y);
      }
      // scrollbar
      if (this.ishover_rating) {
        if (!this.ishover_rating_prev)
          window.SetCursor(IDC_HAND);
      } else {
        if (this.ishover_rating_prev)
          window.SetCursor(IDC_ARROW);
        if (this.scrollbar.enabled && this.scrollbar.visible) {
          this.scrollbar && this.scrollbar.on_mouse(event, x, y);
        }
      }
      break;
    case "rbtn_up":
      this.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
      if (this.ishover && this.active_row > -1 && Math.abs(scroll - scroll_) < 2) {
        var rowType = this.rows[this.active_row].type;
        switch (true) {
          case (rowType > 0 && rowType < 99): // group header row
            var playlistTrackId = this.rows[this.active_row].playlistTrackId;
            if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
              plman.ClearPlaylistSelection(g_active_playlist);
              this.select_group_tracks(this.rows[this.active_row].albumId);
              plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
              this.shift_start_id = null;
            }
            this.context_menu(x, y, this.track_index, this.row_index);
            break;
          case (rowType == 0): // track row
            var playlistTrackId = this.rows[this.active_row].playlistTrackId;
            if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
              plman.ClearPlaylistSelection(g_active_playlist);
              plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
              plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
            }
            this.context_menu(x, y, playlistTrackId, this.active_row);
            break;
          case (rowType == 99): // extra empty row
            break;
        }
        this.repaint();
      } else {
        // scrollbar
        if (this.scrollbar.enabled && this.scrollbar.visible) {
          this.scrollbar && this.scrollbar.on_mouse(event, x, y);
        }
        if (!filter.inputbox.hover) {
          // this.context_menu_settings(x, y);
        }
      }
      break;
    case "drag_over":
      g_dragndrop_bottom = false;
      if (this.groups.length > 0) {
        var fin = this.rows.length;
        for (var i = 0; i < fin; i++) {
          this.check_dragndrop(x, y, i);
        }
        var row_id = fin - 1;
        var item_height_row = (this.rows[row_id].type == 0 ? 1 : ppt.group_header_row_num);
        var limit = this.rows[row_id].y + (item_height_row * ppt.row_height);
        if (y > limit) {
          g_dragndrop_bottom = true;
          g_dragndrop_trackId = this.rows[row_id].playlistTrackId;
        }
      } else {
        g_dragndrop_bottom = true;
        g_dragndrop_trackId = 0;
      }
      break;
    }
  }
  this.g_time = window.SetInterval(() => {
    if (!window.IsVisible) {
      need_repaint = true;
      return;
    }
    if (!g_first_populate_launched) {
      g_first_populate_launched = true;
      brw.launch_populate();
    }
    // get hover row index (mouse cursor hover)
    if (m_y > brw.y && m_y < brw.y + brw.h) {
      brw.active_row = Math.ceil((m_y + scroll_ - brw.y) / ppt.row_height - 1);
      if (brw.active_row >= brw.rows.length)
        brw.active_row = -1;
    } else {
      brw.active_row = -1;
    }
    scroll = check_scroll(scroll);
    if (Math.abs(scroll - scroll_) >= 1) {
      scroll_ += (scroll - scroll_) / ppt.scroll_smoothness;
      need_repaint = true;
      is_scrolling = true;
      //
      if (scroll_prev != scroll)
        this.scrollbar.update();
    } else {
      if (is_scrolling) {
        if (scroll_ < 1)
          scroll_ = 0;
        is_scrolling = false;
        need_repaint = true;
      }
    }
    if (need_repaint) {
      if (is_scrolling && brw.rows.length > 0)
        brw.get_tags(false);
      need_repaint = false;
      window.Repaint();
    }
    scroll_prev = scroll;
  }, ppt.refresh_rate);
  this.refresh_thumb = () => {
    cache = new _cache;
    var total = brw.groups.length;
    for (var i = 0; i < total; i++) {
      brw.groups[i].tid = -1;
      brw.groups[i].load_requested = 0;
      brw.groups[i].save_requested = false;
      brw.groups[i].cover_img = null;
      brw.groups[i].cover_type = null;
    }
  }
  this.context_menu = (x, y, id, row_id) => {
    var m = window.CreatePopupMenu();
    var n = window.CreatePopupMenu();
    var o = window.CreatePopupMenu();
    var context = fb.CreateContextMenuManager();
    if (brw.active_row > -1) {
      var albumIndex = this.rows[this.active_row].albumId;
      var crc = brw.groups[albumIndex].cachekey;
    }
    this.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
    context.InitContextPlaylist();
    // check if selection is single and is in the Media Library to provide if ok a link to Album View panel
    if (this.metadblist_selection.Count == 1) {
      if (fb.IsMetadbInMediaLibrary(this.metadblist_selection[0])) {
        showInAlbumView = true;
      }
    }
    m.AppendMenuItem(MF_STRING, 1, "Settings...");
    m.AppendMenuSeparator();
    context.BuildMenu(m, 2);
    n.AppendTo(m, MF_STRING, "Selection...");
    if (brw.active_row > -1) {
      if (this.metadblist_selection.Count == 1) {
        n.AppendMenuItem(MF_STRING, 1010, "Reset Image Cache");
      }
    }
    n.AppendMenuItem(plman.IsAutoPlaylist(g_active_playlist) ? MF_DISABLED | MF_GRAYED : MF_STRING, 1020, "Remove");
    o.AppendTo(n, MF_STRING, "Send to...");
    o.AppendMenuItem(MF_STRING, 2000, "a New playlist...");
    if (plman.PlaylistCount > 1) {
      o.AppendMenuItem(MF_SEPARATOR, 0, "");
    }
    for (var i = 0; i < plman.PlaylistCount; i++) {
      if (i != this.playlist && !plman.IsAutoPlaylist(i)) {
        o.AppendMenuItem(MF_STRING, 2001 + i, plman.GetPlaylistName(i));
      }
    }
    var ret = m.TrackPopupMenu(x, y);
    if (ret > 1 && ret < 800) {
      context.ExecuteByID(ret - 2);
    } else if (ret < 2) {
      switch (ret) {
        case 1:
          this.context_menu_settings(x, y);
          break;
      }
    } else {
      switch (ret) {
        case 1010:
          if (fso.FileExists(CACHE_FOLDER + crc)) {
            try {
              fso.DeleteFile(CACHE_FOLDER + crc);
            } catch (e) {
              console.log("Error: Image cache [" + crc + "] can't be deleted on disk, file in use, try later or reload panel.");
            }
          }
          this.groups[albumIndex].tid = -1;
          this.groups[albumIndex].load_requested = 0;
          this.groups[albumIndex].save_requested = false;
          cache.reset(crc);
          this.groups[albumIndex].cover_img = null;
          this.groups[albumIndex].cover_type = null;
          this.repaint();
          break;
        case 1020:
          plman.RemovePlaylistSelection(g_active_playlist, false);
          break;
        case 2000:
          plman.CreatePlaylist(plman.PlaylistCount, "");
          plman.ActivePlaylist = plman.PlaylistCount - 1;
          plman.InsertPlaylistItems(plman.PlaylistCount - 1, 0, this.metadblist_selection, false);
          break;
        default:
          var insert_index = plman.PlaylistItemCount(ret - 2001);
          plman.InsertPlaylistItems((ret - 2001), insert_index, this.metadblist_selection, false);
      }
    }
    return true;
  }
  this.context_menu_settings = (x, y) => {
    var m = window.CreatePopupMenu();
    var n = window.CreatePopupMenu();
    var ret = undefined;
    n.AppendMenuItem((!ppt.auto_collapse ? MF_STRING : MF_GRAYED | MF_DISABLED), 100, "Enable\tTab");
    n.CheckMenuItem(100, ppt.show_group_headers);
    n.AppendMenuItem((ppt.show_group_headers ? MF_STRING : MF_GRAYED | MF_DISABLED), 110, "Cover Art");
    n.CheckMenuItem(110, ppt.show_cover);
    n.AppendMenuItem((ppt.show_group_headers ? MF_STRING : MF_GRAYED | MF_DISABLED), 120, "Background");
    n.CheckMenuItem(120, ppt.show_group_header_bg);
    n.AppendMenuSeparator();
    n.AppendMenuItem((ppt.show_group_headers ? MF_STRING : MF_GRAYED | MF_DISABLED), 130, "Autocollapse");
    n.CheckMenuItem(130, ppt.auto_collapse);
    n.AppendMenuItem((ppt.show_group_headers && !ppt.auto_collapse ? MF_STRING : MF_GRAYED | MF_DISABLED), 140, "Collapse All\tCtrl+Tab");
    n.AppendMenuItem((ppt.show_group_headers && !ppt.auto_collapse ? MF_STRING : MF_GRAYED | MF_DISABLED), 150, "Expand All\tShift+Tab");
    n.AppendTo(m, MF_STRING, "Group Headers");
    m.AppendMenuSeparator();
    m.AppendMenuItem(MF_STRING, 160, "Scroll Bar\tCtrl+B");
    m.CheckMenuItem(160, this.scrollbar.enabled);
    m.AppendMenuItem(MF_STRING, 170, "Row Stripes\tCtrl+E");
    m.CheckMenuItem(170, ppt.show_stripes);
    m.AppendMenuItem(MF_STRING, 180, "Rating\tCtrl+R");
    m.CheckMenuItem(180, ppt.show_rating);
    m.AppendMenuItem(MF_STRING, 190, "Filter Box\tCtrl+T");
    m.CheckMenuItem(190, ppt.show_filter);
    m.AppendMenuSeparator();
    m.AppendMenuItem(MF_STRING, 991, "Panel Properties");
    m.AppendMenuItem(MF_STRING, 992, "Configure...");
    m.AppendMenuItem(MF_STRING, 993, "Reload");
    ret = m.TrackPopupMenu(x, y);
    switch (true) {
      case (ret == 100):
        ppt.show_group_headers = !ppt.show_group_headers;
        window.SetProperty("_DISPLAY: Show Group Headers", ppt.show_group_headers);
        if (!ppt.show_group_headers)
          brw.collapse_all(false);
        get_metrics();
        brw.repaint();
        break;
      case (ret == 110):
        ppt.show_cover = !ppt.show_cover;
        window.SetProperty("_DISPLAY: Show Cover Art", ppt.show_cover),
        brw.repaint();
        break;
      case (ret == 120):
        ppt.show_group_header_bg = !ppt.show_group_header_bg
        window.SetProperty("_DISPLAY: Show Group Headers Background", ppt.show_group_header_bg);
        break;
      case (ret == 130):
        ppt.auto_collapse = !ppt.auto_collapse;
        window.SetProperty("_DISPLAY: Autocollapse Groups", ppt.auto_collapse);
        brw.populate(false);
        brw.show_focused_item();
        break;
      case (ret == 140):
        brw.collapse_all(true);
        brw.show_focused_item();
        break;
      case (ret == 150):
        brw.collapse_all(false);
        brw.show_focused_item();
        break;
      case (ret == 160):
        this.scrollbar.enabled = !this.scrollbar.enabled;
        window.SetProperty("_DISPLAY: Show Scroll Bar", this.scrollbar.enabled),
        window.Repaint();
        break;
      case (ret == 170):
        ppt.show_stripes = !ppt.show_stripes;
        window.SetProperty("_DISPLAY: Show Row Stripes", ppt.show_stripes),
        window.Repaint();
        break;
      case (ret == 180):
        ppt.show_rating = !ppt.show_rating;
        window.SetProperty("_DISPLAY: Show Rating in Track Row", ppt.show_rating);
        get_metrics();
        brw.repaint();
        break;
      case (ret == 190):
        ppt.show_filter = !ppt.show_filter;
        window.SetProperty("_DISPLAY: Show Filter Box", ppt.show_filter);
        get_metrics();
        brw.repaint();
        break;
      case (ret == 991):
        window.ShowProperties();
        break;
      case (ret == 992):
        window.ShowConfigure();
        break;
      case (ret == 993):
        window.Reload();
        break;
    }
    return true;
  }
  this.incremental_search = () => {
    var albumartist, artist, groupkey;
    var chr;
    var gstart;
    var pid = -1;
    var format_str = "";
    // exit if no search string in cache
    if (cList.search_string.length <= 0)
      return;
    // 1st char of the search string
    var first_chr = cList.search_string.substring(0, 1);
    var len = cList.search_string.length;
    // which start point for the search
    if (this.list.count > 1000) {
      albumartist = ppt.tf_albumartist.EvalWithMetadb(this.list[Math.floor(this.list.Count / 2)]);
      chr = albumartist.substring(0, 1);
      if (first_chr.charCodeAt(first_chr) > chr.charCodeAt(chr)) {
        gstart = Math.floor(this.list.Count / 2);
      } else {
        gstart = 0;
      }
    } else {
      gstart = 0;
    }
    if (!ppt.show_group_headers) {
      // 1st search on "album artist" TA
      for (var i = gstart; i < this.list.Count; i++) {
        albumartist = ppt.tf_albumartist.EvalWithMetadb(this.list[i]);
        format_str = albumartist.substring(0, len).toUpperCase();
        if (format_str == cList.search_string) {
          pid = i;
          break;
        }
      }
      // if not found, search in the first part (from 0 to gstart)
      if (pid < 0) {
        for (var i = 0; i < gstart; i++) {
          albumartist = ppt.tf_albumartist.EvalWithMetadb(this.list[i]);
          format_str = albumartist.substring(0, len).toUpperCase();
          if (format_str == cList.search_string) {
            pid = i;
            break;
          }
        }
      }
      if (pid < 0) {
        // 2nd search on "artist" TAG
        for (var i = 0; i < this.list.Count; i++) {
          artist = ppt.tf_artist.EvalWithMetadb(this.list[i]);
          format_str = artist.substring(0, len).toUpperCase();
          if (format_str == cList.search_string) {
            pid = i;
            break;
          }
        }
      }
    } else {
      // 1st search on tf_group_key of current group by patter
      for (var i = gstart; i < this.list.Count; i++) {
        groupkey = ppt.tf_groupkey.EvalWithMetadb(this.list[i]);
        format_str = groupkey.substring(0, len).toUpperCase();
        if (format_str == cList.search_string) {
          pid = i;
          break;
        }
      }
      // if not found, search in the first part (from 0 to gstart)
      if (pid < 0) {
        for (var i = 0; i < gstart; i++) {
          groupkey = ppt.tf_groupkey.EvalWithMetadb(this.list[i]);
          format_str = groupkey.substring(0, len).toUpperCase();
          if (format_str == cList.search_string) {
            pid = i;
            break;
          }
        }
      }
    }
    if (pid >= 0) { // found
      g_focus_id = pid;
      plman.ClearPlaylistSelection(g_active_playlist);
      plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
      plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
      this.show_focused_item();
    } else { // not found on "album artist" TAG, new search on "artist" TAG
      cList.inc_search_nofilter_result = true;
      brw.repaint();
    }
    cList.clear_incsearch_timer && window.ClearTimeout(cList.clear_incsearch_timer);
    cList.clear_incsearch_timer = window.SetTimeout(() => {
      // reset incremental search string after 1 seconds without any key pressed
      cList.search_string = "";
      cList.inc_search_nofilter_result = false;
      brw.repaint();
      window.ClearInterval(cList.clear_incsearch_timer);
      cList.clear_incsearch_timer = false;
    }, 1000);
  }
}
// main
var g_seconds = 0;
var g_time_remaining = null;
var g_radio_title = "loading live tag ...";
var g_radio_artist = "";
var cover_img = cover.masks.split(";");
var brw = null;
var is_scrolling = false;
var filter = null;
var filter_text = "";
// drag'n drop from windows system
var g_dragndrop_status = false;
var g_dragndrop_x = -1;
var g_dragndrop_y = -1;
var g_dragndrop_bottom = false;
var g_dragndrop_timer = false;
var g_dragndrop_trackId = -1;
var g_dragndrop_targetPlaylistId = -1;
// general
var ww = 0, wh = 0;
var g_metadb = null;
var g_sel_holder = fb.AcquireUiSelectionHolder();
g_sel_holder.SetPlaylistSelectionTracking();
var m_x = 0, m_y = 0;
var g_active_playlist = null;
var g_focus_id = -1;
var g_focus_id_prev = -1;
var g_focus_row = 0;
var g_focus_album_id = -1;
var g_populate_opt = 1;
// boolean to avoid callbacks
var g_avoid_on_playlists_changed = false;
var g_avoid_on_playlist_switch = false;
var g_avoid_on_item_focus_change = false;
var g_avoid_on_metadb_change = false;
var g_avoid_on_playlist_items_added = false;
var g_avoid_on_playlist_items_removed = false;
var g_avoid_on_playlist_items_removed_callbacks_on_sendItemToPlaylist = false;
var g_avoid_on_playlist_items_reordered = false;
// mouse actions
var g_lbtn_click = false;
// misc
var g_first_populate_done = false;
var g_first_populate_launched = false;
var scroll_ = 0, scroll = 0, scroll_prev = 0;
var g_start_ = 0, g_end_ = 0;
var g_rating_updated = false;
var g_rating_row_id = -1;
function on_init() {
  plman.SetActivePlaylistContext();
  window.DlgCode = DLGC_WANTALLKEYS;
  get_font();
  get_colours();
  get_metrics();
  g_active_playlist = plman.ActivePlaylist;
  g_focus_id = get_focus_id(g_active_playlist);
  brw = new _brw("brw");
  pman = new _plm("pman");
  cache = new _cache;
  filter = new _filter;
}
on_init();
function on_size() {
  window.DlgCode = DLGC_WANTALLKEYS;
  ww = window.Width;
  wh = window.Height;
  if (!ww || !wh) return;
  get_images();
  if (brw.scrollbar.enabled) {
    brw.size(0, (ppt.show_filter ? filter.inputbox.h : 0), ww - brw.scrollbar.width, wh - (ppt.show_filter ? filter.inputbox.h : 0));
  } else {
    brw.size(0, (ppt.show_filter ? filter.inputbox.h : 0), ww, wh - (ppt.show_filter ? filter.inputbox.h : 0));
  }
}
function on_paint(gr) {
  if (!ww) return;
  gr.FillSolidRect(0, 0, ww, wh, g_colour_normal_bg);
  brw && brw.paint(gr);
  pman.offset > 0 && pman.paint(gr);
  ppt.show_filter && filter.paint(gr, filter.inputbox.w, filter.inputbox.y);
}
function on_mouse_lbtn_down(x, y) {
  g_lbtn_click = true;
  // stop inertia
  if (cTouch.timer) {
    window.ClearInterval(cTouch.timer);
    cTouch.timer = false;
    // stop scrolling but not abrupt, add a little offset for the stop
    if (Math.abs(scroll - scroll_) > ppt.row_height) {
      scroll = (scroll > scroll_ ? scroll_ + ppt.row_height : scroll_ - ppt.row_height);
      scroll = check_scroll(scroll);
    }
  }
  var is_scroll_enabled = brw.row_count > brw.total_rows_vis;
  if (is_scroll_enabled) {
    if (brw.hover(x, y) && !brw.scrollbar.hover(x, y)) {
      if (!timers.mouse_down) {
        cTouch.y_prev = y;
        cTouch.y_start = y;
        if (cTouch.t1) {
          cTouch.t1.Reset();
        } else {
          cTouch.t1 = fb.CreateProfiler("t1");
        }
        timers.mouse_down = window.SetTimeout(() => {
          window.ClearTimeout(timers.mouse_down);
          timers.mouse_down = false;
          if (Math.abs(cTouch.y_start - m_y) > 15) {
            cTouch.down = true;
          } else {
            brw.on_mouse("lbtn_down", x, y);
          }
        }, 50);
      }
    } else {
      brw.on_mouse("lbtn_down", x, y);
    }
  } else {
    brw.on_mouse("lbtn_down", x, y);
  }
  // inputbox
  if (ppt.show_filter) {
    filter.on_mouse("lbtn_down", x, y);
  }
}
function on_mouse_lbtn_up(x, y) {
  // inputbox
  if (ppt.show_filter) {
    filter.on_mouse("lbtn_up", x, y);
  }
  if (pman.state == 1) {
    pman.on_mouse("lbtn_up", x, y);
  } else {
    brw.on_mouse("lbtn_up", x, y);
  }
  if (timers.mouse_down) {
    window.ClearTimeout(timers.mouse_down);
    timers.mouse_down = false;
    if (Math.abs(cTouch.y_start - m_y) <= 30) {
      brw.on_mouse("lbtn_down", x, y);
    }
  }
  // create scroll inertia on mouse lbtn up
  if (cTouch.down) {
    cTouch.down = false;
    cTouch.y_end = y;
    cTouch.scroll_delta = scroll - scroll_;
    // cTouch.y_delta = cTouch.y_start - cTouch.y_end;
    if (Math.abs(cTouch.scroll_delta) > 30) {
      cTouch.multiplier = ((1000 - cTouch.t1.Time) / 20);
      cTouch.delta = Math.round((cTouch.scroll_delta) / 30);
      if (cTouch.multiplier < 1)
        cTouch.multiplier = 1;
      if (cTouch.timer)
        window.ClearInterval(cTouch.timer);
      cTouch.timer = window.SetInterval(() => {
        scroll += cTouch.delta * cTouch.multiplier;
        scroll = check_scroll(scroll);
        cTouch.multiplier = cTouch.multiplier - 1;
        cTouch.delta = cTouch.delta - (cTouch.delta / 10);
        if (cTouch.multiplier < 1) {
          window.ClearInterval(cTouch.timer);
          cTouch.timer = false;
        }
      }, 75);
    }
  }
  g_lbtn_click = false;
}
function on_mouse_lbtn_dblclk(x, y, mask) {
  if (y >= brw.y) {
    brw.on_mouse("lbtn_dblclk", x, y);
  } else if (x > brw.x + filter.inputbox.w + filter.inputbox.h * 2 && x < brw.x + brw.w) {
    brw.show_now_playing();
  } else {
    brw.on_mouse("lbtn_dblclk", x, y);
  }
}
function on_mouse_rbtn_up(x, y) {
  // inputbox
  if (ppt.show_filter) {
    filter.on_mouse("rbtn_up", x, y);
  }
  if (pman.state == 1) {
    pman.on_mouse("rbtn_up", x, y);
  }
  brw.on_mouse("rbtn_up", x, y);
  return true;
}
function on_mouse_move(x, y) {
  if (m_x == x && m_y == y)
    return;
  // inputbox
  if (ppt.show_filter) {
    filter.on_mouse("move", x, y);
  }
  if (pman.state == 1) {
    pman.on_mouse("move", x, y);
  } else {
    if (cTouch.down) {
      cTouch.y_current = y;
      cTouch.y_move = (cTouch.y_current - cTouch.y_prev);
      if (x < brw.w) {
        scroll -= cTouch.y_move;
        cTouch.scroll_delta = scroll - scroll_;
        if (Math.abs(cTouch.scroll_delta) < 30)
          cTouch.y_start = cTouch.y_current;
        cTouch.y_prev = cTouch.y_current;
      }
    } else {
      brw.on_mouse("move", x, y);
    }
  }
  m_x = x;
  m_y = y;
}
function on_mouse_wheel(step) {
  if (cTouch.timer) {
    window.ClearInterval(cTouch.timer);
    cTouch.timer = false;
  }
  if (pman.state == 1) {
    if (pman.scr_w > 0)
      pman.on_mouse("wheel", m_x, m_y, step);
  } else {
    var row_step = ppt.scroll_step;
    scroll -= step * ppt.row_height * row_step;
    scroll = check_scroll(scroll);
    brw.on_mouse("wheel", m_x, m_y, step);
  }
}
function on_mouse_leave() {
  // inputbox
  if (ppt.show_filter) {
    filter.on_mouse("leave", 0, 0);
  }
  brw.on_mouse("leave", 0, 0);
  if (pman.state == 1) {
    pman.on_mouse("leave", 0, 0);
  }
}
// Metrics & Fonts & Colours & Images
function get_metrics() {
  cache = new _cache;
  if (brw) {
    if (brw.scrollbar.enabled) {
      brw.size(0, (ppt.show_filter ? filter.inputbox.h : 0), ww - brw.scrollbar.width, wh - (ppt.show_filter ? filter.inputbox.h : 0));
    } else {
      brw.size(0, (ppt.show_filter ? filter.inputbox.h : 0), ww, wh - (ppt.show_filter ? filter.inputbox.h : 0));
    }
    brw.set_list();
    g_focus_row = brw.get_offset_focus_item(g_focus_id);
    // if focused track not totally visible, we scroll to show it centered in the panel
    if (g_focus_row < scroll / ppt.row_height || g_focus_row > scroll / ppt.row_height + brw.total_rows_vis - 1) {
      scroll = (g_focus_row - Math.floor(brw.total_rows_vis / 2)) * ppt.row_height;
      scroll = check_scroll(scroll);
      scroll_ = scroll;
    }
    if (brw.row_count > 0)
      brw.get_tags(true);
  }
}
function on_font_changed() {
  get_font();
  get_metrics();
  brw.repaint();
}
function on_colours_changed() {
  get_colours();
  get_images();
  brw && brw.scrollbar.colours_changed();
  filter.get_images();
  filter.colours_changed();
  brw.repaint();
}
function on_script_unload() {
  brw.g_time && window.ClearInterval(brw.g_time);
  brw.g_time = false;
}
function on_key_up(vkey) {
  // inputbox
  if (ppt.show_filter) {
    filter.on_key("lbtn_up", vkey);
  }
  // scroll keys up and down RESET (step and timers)
  brw.keypressed = false;
  brw.scrollbar.timer_count = -1;
  brw.scrollbar.timer && window.ClearTimeout(brw.scrollbar.timer);
  brw.scrollbar.timer = false;
  if (vkey == VK_SHIFT) {
    brw.shift_start_id = null;
    brw.shift_count = 0;
  }
  brw.repaint();
}
function vk_up() {
  var scroll_step = 1;
  var new_focus_id = 0;
  var new_row = 0;
  new_row = g_focus_row - scroll_step;
  if (new_row < 0) {
    if (brw.groups[0].collapsed) {
      new_row = 0;
    } else {
      if (ppt.show_group_headers) {
        new_row = ppt.group_header_row_num;
      } else {
        new_row = 0;
      }
    }
    // kill timer
    brw.scrollbar.timer_count = -1;
    brw.scrollbar.timer && window.ClearTimeout(brw.scrollbar.timer);
    brw.scrollbar.timer = false;
  } else {
    switch (brw.rows[new_row].type) {
      case 0: // track row
        // RAS
        break;
      case 99: // blank line (extra line)
        while (brw.rows[new_row].type == 99) {
          if (new_row > 0)
            new_row -= 1;
        }
        break;
      default: // group row
        if (brw.groups[brw.rows[new_row].albumId].collapsed) {
          new_row -= (ppt.group_header_row_num - 1);
        } else {
          new_row -= ppt.group_header_row_num;
        }
    }
  }
  if (new_row >= 0) {
    while (brw.rows[new_row].type == 99) {
      if (new_row > 0)
        new_row -= 1;
    }
    new_focus_id = brw.rows[new_row].playlistTrackId;
    plman.ClearPlaylistSelection(g_active_playlist);
    plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
    plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
  } else {
    // kill timer
    brw.scrollbar.timer_count = -1;
    brw.scrollbar.timer && window.ClearTimeout(brw.scrollbar.timer);
    brw.scrollbar.timer = false;
  }
}
function vk_down() {
  var scroll_step = 1;
  var new_focus_id = 0,
    new_row = 0;
  new_row = g_focus_row + scroll_step;
  if (new_row > brw.row_count - 1) {
    new_row = brw.row_count - 1;
    if (brw.groups[brw.rows[new_row].albumId].collapsed) {
      new_row -= (ppt.group_header_row_num - 1);
    }
    // kill timer
    brw.scrollbar.timer_count = -1;
    brw.scrollbar.timer && window.ClearTimeout(brw.scrollbar.timer);
    brw.scrollbar.timer = false;
  } else {
    switch (brw.rows[new_row].type) {
      case 0: // track row
        // RAS
        break;
      case 99: // blank line (extra line)
        while (brw.rows[new_row].type == 99) {
          if (new_row < brw.row_count - 1)
            new_row += 1;
        }
        break;
      default: // group row
        if (brw.groups[brw.rows[new_row].albumId].collapsed) {
          if (brw.rows[new_row].type > 1) { // if not 1st row of the group header
            new_row += (ppt.group_header_row_num - brw.rows[new_row].type + 1);
            if (new_row > brw.row_count - 1) {
              new_row = brw.row_count - 1;
              if (brw.groups[brw.rows[new_row].albumId].collapsed) {
                new_row -= (ppt.group_header_row_num - 1);
              }
            } else {
              if (!brw.groups[brw.rows[new_row].albumId].collapsed) {
                new_row += ppt.group_header_row_num;
              }
            }
          } else {
            // RAS
          }
        } else {
          if (brw.rows[new_row].type > 1) { // if not 1st row of the group header
            // RAS, can't happend
          } else {
            new_row += ppt.group_header_row_num;
          }
        }
    }
  }
  if (new_row < brw.row_count) {
    while (brw.rows[new_row].type == 99) {
      if (new_row < brw.row_count - 1)
        new_row += 1;
    }
    new_focus_id = brw.rows[new_row].playlistTrackId;
    plman.ClearPlaylistSelection(g_active_playlist);
    plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
    plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
  } else {
    // kill timer
    brw.scrollbar.timer_count = -1;
    brw.scrollbar.timer && window.ClearTimeout(brw.scrollbar.timer);
    brw.scrollbar.timer = false;
  }
}
function vk_pgup() {
  var scroll_step = brw.total_rows_vis;
  var new_focus_id = 0,
    new_row = 0;
  new_row = g_focus_row - scroll_step;
  if (new_row < 0) {
    if (brw.groups[0].collapsed) {
      new_row = 0;
    } else {
      new_row = ppt.group_header_row_num;
    }
    // kill timer
    brw.scrollbar.timer_count = -1;
    brw.scrollbar.timer && window.ClearTimeout(brw.scrollbar.timer);
    brw.scrollbar.timer = false;
  } else {
    switch (brw.rows[new_row].type) {
      case 0: // track row
        // RAS
        break;
      case 99: // blank line (extra line)
        while (brw.rows[new_row].type == 99) {
          if (new_row > 0)
            new_row -= 1;
        }
        break;
      default: // group row
        if (brw.groups[brw.rows[new_row].albumId].collapsed) {
          if (brw.rows[new_row].type > 1) { // if not 1st row of the group header
            new_row -= (brw.rows[new_row].type - 1);
          } else {
            // RAS
          }
        } else {
          new_row += (ppt.group_header_row_num - brw.rows[new_row].type + 1);
        }
    }
  }
  if (new_row >= 0) {
    while (brw.rows[new_row].type == 99) {
      if (new_row > 0)
        new_row -= 1;
    }
    new_focus_id = brw.rows[new_row].playlistTrackId;
    plman.ClearPlaylistSelection(g_active_playlist);
    plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
    plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
  } else {
    // kill timer
    brw.scrollbar.timer_count = -1;
    brw.scrollbar.timer && window.ClearTimeout(brw.scrollbar.timer);
    brw.scrollbar.timer = false;
  }
}
function vk_pgdn() {
  var scroll_step = brw.total_rows_vis;
  var new_focus_id = 0,
    new_row = 0;
  new_row = g_focus_row + scroll_step;
  if (new_row > brw.row_count - 1) {
    new_row = brw.row_count - 1;
    if (brw.groups[brw.rows[new_row].albumId].collapsed) {
      new_row -= (ppt.group_header_row_num - 1);
    }
  } else {
    switch (brw.rows[new_row].type) {
      case 0: // track row
        // RAS
        break;
      case 99: // blank line (extra line)
        while (brw.rows[new_row].type == 99) {
          if (new_row < brw.row_count - 1)
            new_row += 1;
        }
        break;
      default: // group row
        if (brw.groups[brw.rows[new_row].albumId].collapsed) {
          if (brw.rows[new_row].type > 1) { // if not 1st row of the group header
            new_row -= (brw.rows[new_row].type - 1);
          } else {
            // RAS
          }
        } else {
          new_row += (ppt.group_header_row_num - brw.rows[new_row].type + 1);
        }
    }
  }
  if (new_row < brw.row_count) {
    while (brw.rows[new_row].type == 99) {
      if (new_row < brw.row_count - 1)
        new_row += 1;
    }
    new_focus_id = brw.rows[new_row].playlistTrackId;
    plman.ClearPlaylistSelection(g_active_playlist);
    plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
    plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
  } else {
    // kill timer
    brw.scrollbar.timer_count = -1;
    brw.scrollbar.timer && window.ClearTimeout(brw.scrollbar.timer);
    brw.scrollbar.timer = false;
  }
}
function on_key_down(vkey) {
  var mask = GetKeyboardMask();
	var filter_is_active = false;
  // inputbox
  if (ppt.show_filter) {
    filter_is_active = filter.inputbox.is_active();
    filter.on_key("lbtn_down", vkey);
  }
  if (mask == KMask.none) {
    switch (vkey) {
    case VK_F2:
      break;
    case VK_F3:
      brw.show_now_playing();
      break;
    case VK_F5:
      brw.refresh_thumb();
      brw.repaint();
      break;
    case VK_F6:
      break;
    case VK_TAB:
      ppt.show_group_headers = !ppt.show_group_headers;
      window.SetProperty("_DISPLAY: Show Group Headers", ppt.show_group_headers);
      if (!ppt.show_group_headers)
        brw.collapse_all(false);
      get_metrics();
      brw.repaint();
      break;
    case VK_BACK:
      if (cList.search_string.length > 0 && !filter.inputbox.edit) {
        cList.inc_search_nofilter_result = false;
        brw.tt_x = ((brw.w) / 2) - (((cList.search_string.length * 13) + (10 * 2)) / 2);
        brw.tt_y = brw.y + Math.floor((brw.h / 2) - 30);
        brw.tt_w = ((cList.search_string.length * 13) + (10 * 2));
        brw.tt_h = 60;
        cList.search_string = cList.search_string.substring(0, cList.search_string.length - 1);
        brw.repaint();
        cList.clear_incsearch_timer && window.ClearTimeout(cList.clear_incsearch_timer);
        cList.clear_incsearch_timer = false;
        cList.incsearch_timer && window.ClearTimeout(cList.incsearch_timer);
        cList.incsearch_timer = window.SetTimeout(() => {
          brw.incremental_search();
          window.ClearTimeout(cList.incsearch_timer);
          cList.incsearch_timer = false;
          cList.inc_search_nofilter_result = false;
        }, 400);
      }
      break;
    case VK_ESCAPE:
      if (filter_is_active) {
        filter.clear_contents();
        if (fb.IsPlaying && plman.PlayingPlaylist == plman.ActivePlaylist) {
          brw.show_now_playing();
        }
      } else {
        return;
      }
      break;
    case 222:
      brw.tt_x = ((brw.w) / 2) - (((cList.search_string.length * 13) + (10 * 2)) / 2);
      brw.tt_y = brw.y + Math.floor((brw.h / 2) - 30);
      brw.tt_w = ((cList.search_string.length * 13) + (10 * 2));
      brw.tt_h = 60;
      cList.search_string = "";
      window.RepaintRect(0, brw.tt_y - 2, brw.w, brw.tt_h + 4);
      break;
    case VK_UP:
      if (brw.row_count > 0 && !brw.keypressed && !brw.scrollbar.timer) {
        brw.keypressed = true;
        reset_cover_timers();
        vk_up();
        if (!brw.scrollbar.timer) {
          brw.scrollbar.timer = window.SetTimeout(() => {
            window.ClearTimeout(brw.scrollbar.timer);
            brw.scrollbar.timer = window.SetInterval(vk_up, 100);
          }, 400);
        }
      }
      break;
    case VK_DOWN:
      if (brw.row_count > 0 && !brw.keypressed && !brw.scrollbar.timer) {
        brw.keypressed = true;
        reset_cover_timers();
        vk_down();
        if (!brw.scrollbar.timer) {
          brw.scrollbar.timer = window.SetTimeout(() => {
            window.ClearTimeout(brw.scrollbar.timer);
            brw.scrollbar.timer = window.SetInterval(vk_down, 100);
          }, 400);
        }
      }
      break;
    case VK_PGUP:
      if (brw.row_count > 0 && !brw.keypressed && !brw.scrollbar.timer) {
        brw.keypressed = true;
        reset_cover_timers();
        vk_pgup();
        if (!brw.scrollbar.timer) {
          brw.scrollbar.timer = window.SetTimeout(() => {
            window.ClearTimeout(brw.scrollbar.timer);
            brw.scrollbar.timer = window.SetInterval(vk_pgup, 100);
          }, 400);
        }
      }
      break;
    case VK_PGDN:
      if (brw.row_count > 0 && !brw.keypressed && !brw.scrollbar.timer) {
        brw.keypressed = true;
        reset_cover_timers();
        vk_pgdn();
        if (!brw.scrollbar.timer) {
          brw.scrollbar.timer = window.SetTimeout(() => {
            window.ClearTimeout(brw.scrollbar.timer);
            brw.scrollbar.timer = window.SetInterval(vk_pgdn, 100);
          }, 400);
        }
      }
      break;
    case VK_RETURN:
      plman.ExecutePlaylistDefaultAction(g_active_playlist, g_focus_id);
      break;
    case VK_END:
      if (brw.row_count > 0 && !filter.inputbox.edit) {
        var new_focus_id = brw.rows[brw.rows.length - 1].playlistTrackId;
        plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
        plman.ClearPlaylistSelection(g_active_playlist);
        plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
      }
      break;
    case VK_HOME:
      if (brw.row_count > 0 && !filter.inputbox.edit) {
        var new_focus_id = brw.rows[0].playlistTrackId;
        plman.ClearPlaylistSelection(g_active_playlist);
        plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
        plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
      }
      break;
    case VK_DELETE:
      if (!plman.IsAutoPlaylist(g_active_playlist)) {
        plman.UndoBackup(g_active_playlist);
        plman.RemovePlaylistSelection(g_active_playlist);
      }
      break;
    }
  } else {
    switch (mask) {
    case KMask.shift:
      switch (vkey) {
      case VK_SHIFT: // SHIFT+NONE
        brw.shift_count = 0;
        break;
      case VK_TAB: // SHIFT+TAB
        if (ppt.show_group_headers) {
          brw.collapse_all(false);
          brw.show_focused_item();
        }
        break;
      case VK_UP: // SHIFT+UP
        if (brw.shift_count == 0) {
          if (brw.shift_start_id == null) {
            brw.shift_start_id = g_focus_id;
          }
          plman.ClearPlaylistSelection(g_active_playlist);
          plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
          if (g_focus_id > 0) {
            brw.shift_count--;
            g_focus_id--;
            plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
            plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
          }
        } else if (brw.shift_count < 0) {
          if (g_focus_id > 0) {
            brw.shift_count--;
            g_focus_id--;
            plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
            plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
          }
        } else {
          plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, false);
          brw.shift_count--;
          g_focus_id--;
          plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
        }
        break;
      case VK_DOWN: // SHIFT+DOWN
        if (brw.shift_count == 0) {
          if (brw.shift_start_id == null) {
            brw.shift_start_id = g_focus_id;
          }
          plman.ClearPlaylistSelection(g_active_playlist);
          plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
          if (g_focus_id < brw.list.Count - 1) {
            brw.shift_count++;
            g_focus_id++;
            plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
            plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
          }
        } else if (brw.shift_count > 0) {
          if (g_focus_id < brw.list.Count - 1) {
            brw.shift_count++;
            g_focus_id++;
            plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
            plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
          }
        } else {
          plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, false);
          brw.shift_count++;
          g_focus_id++;
          plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
        }
        break;
      }
      break;
    case KMask.ctrl:
      if (vkey == 9 && ppt.show_group_headers) { // CTRL+TAB
        brw.collapse_all(true);
        brw.show_focused_item();
      }
      if (vkey == 65 && !filter.inputbox.edit) { // CTRL+A
        fb.RunMainMenuCommand("Edit/Select all");
        brw.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
        brw.repaint();
      }
      if (vkey == 66) { // CTRL+B
        brw.scrollbar.enabled = !brw.scrollbar.enabled;
        window.SetProperty("_DISPLAY: Show Scroll Bar", brw.scrollbar.enabled);
        get_metrics();
        brw.repaint();
      }
      if (vkey == 67) { // CTRL+C
        clipboard.selection = plman.GetPlaylistSelectedItems(g_active_playlist);
      }
      if (vkey == 69) { // CTRL+E
        ppt.show_stripes = !ppt.show_stripes;
        window.SetProperty("_DISPLAY: Show Row Stripes", ppt.show_stripes),
        get_metrics();
        brw.repaint();
      }
      if (vkey == 82) { // CTRL+R
        ppt.show_rating = !ppt.show_rating;
        window.SetProperty("_DISPLAY: Show Rating in Track Row", ppt.show_rating);
        get_metrics();
        brw.repaint();
      }
      if (vkey == 84) { // CTRL+T
        ppt.show_filter = !ppt.show_filter;
        window.SetProperty("_DISPLAY: Show Filter Box", ppt.show_filter);
        get_metrics();
        brw.scrollbar.update();
        brw.repaint();
      }
      if (vkey == 86) { // CTRL+V
        if (clipboard.selection) {
          if (clipboard.selection.Count > 0) {
            try {
              if (brw.list.Count > 0) {
                plman.InsertPlaylistItems(g_active_playlist, g_focus_id + 1, clipboard.selection);
              } else {
                plman.InsertPlaylistItems(g_active_playlist, 0, clipboard.selection);
              }
            } catch (e) {
              console.log("Error: Clipboard cannot be pasted, invalid content.");
            }
          }
        }
      }
      if (vkey == 88) { // CTRL+X
        if (!plman.IsAutoPlaylist(g_active_playlist)) {
          clipboard.selection = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
          plman.RemovePlaylistSelection(g_active_playlist, false);
          plman.SetPlaylistSelectionSingle(g_active_playlist, plman.GetPlaylistFocusItemIndex(g_active_playlist), true);
        }
      }
      break;
    case KMask.alt:
    break;
    }
  }
}
function on_char(code) {
  // inputbox
  if (ppt.show_filter) {
    filter.on_char(code);
  }
  if (filter.inputbox.edit) {
  } else {
    if (brw.list.Count > 0) {
      brw.tt_x = ((brw.w) / 2) - (((cList.search_string.length * 13) + (10 * 2)) / 2);
      brw.tt_y = brw.y + Math.floor((brw.h / 2) - 30);
      brw.tt_w = ((cList.search_string.length * 13) + (10 * 2));
      brw.tt_h = 60;
      if (code == 32 && cList.search_string.length == 0) return true; // SPACE Char not allowed on 1st char
      if (cList.search_string.length <= 20 && brw.tt_w <= brw.w - 20) {
        if (code > 31) {
          cList.search_string = cList.search_string + String.fromCharCode(code).toUpperCase();
          brw.repaint();
          cList.clear_incsearch_timer && window.ClearTimeout(cList.clear_incsearch_timer);
          cList.clear_incsearch_timer = false;
          cList.incsearch_timer && window.ClearTimeout(cList.incsearch_timer);
          cList.incsearch_timer = window.SetTimeout(() => {
            brw.incremental_search();
            window.ClearTimeout(cList.incsearch_timer);
            cList.incsearch_timer = false;
          }, 400);
        }
      }
    }
  }
}
// Playback Callbacks
function on_playback_stop(reason) {
  g_seconds = 0;
  g_time_remaining = null;
  g_metadb = null;
  switch (reason) {
  case 0: // user stop
  case 1: // eof (e.g. end of playlist)
    brw.repaint();
    break;
  case 2: // starting_another (only called on user action, i.e. click on next button)
    break;
  }
  g_radio_title = "loading live tag ...";
  g_radio_artist = "";
}
function on_playback_dynamic_info_track(metadb) {
  // radio Tags (live)
  g_metadb = metadb;
  if (g_metadb && g_metadb.Length < 0) {
    g_radio_title = fb.TitleFormat("%title%").Eval(true);
    g_radio_artist = fb.TitleFormat("$if2(%artist%,%bitrate%'K')").Eval(true);
  } else if (!g_metadb)
    g_metadb = fb.GetNowPlaying();
  brw.repaint();
}
function on_playback_new_track(metadb) {
  g_metadb = metadb;
  g_radio_title = "loading live tag ...";
  g_radio_artist = "";
  brw.repaint();
}
function on_playback_time(time) {
  g_seconds = time;
  g_time_remaining = ppt.tf_time_remaining.Eval(true);
  // radio Tags (live)
  if (g_metadb && g_metadb.Length < 0) {
    g_radio_title = fb.TitleFormat("%title%").Eval(true);
    g_radio_artist = fb.TitleFormat("$if2(%artist%,%bitrate%'K')").Eval(true);
  } else if (!g_metadb)
    g_metadb = fb.GetNowPlaying();
	if (brw.nowplaying_y + ppt.row_height > brw.y && brw.nowplaying_y < brw.y + brw.h) {
		brw.repaint();
	}
}
// Playlist Callbacks
function on_playlists_changed() {
  if (g_avoid_on_playlists_changed)
    return;
  if (pman.drop_done) {
    plman.ActivePlaylist = g_active_playlist;
  } else {
    if (g_active_playlist != plman.ActivePlaylist) {
      g_active_playlist = plman.ActivePlaylist;
    }
  }
  // refresh playlists list
  pman.populate(false, false);
}
function on_playlist_switch() {
  if (pman.drop_done)
    return;
  g_active_playlist = plman.ActivePlaylist;
  g_focus_id = get_focus_id(g_active_playlist);
  filter.clear_contents();
  brw.populate(true);
  brw.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
  // refresh playlists list
  pman.populate(false, false);
}
function on_playlist_items_added(playlist_idx) {
  g_avoid_on_playlist_items_removed_callbacks_on_sendItemToPlaylist = false;
  if (playlist_idx == g_active_playlist && !pman.drop_done) {
    g_focus_id = get_focus_id(g_active_playlist);
    brw.populate(false);
  }
}
function on_playlist_items_removed(playlist_idx, new_count) {
  if (playlist_idx == g_active_playlist && new_count == 0)
    scroll = scroll_ = 0;
  if (g_avoid_on_playlist_items_removed_callbacks_on_sendItemToPlaylist)
    return;
  if (playlist_idx == g_active_playlist) {
    g_focus_id = get_focus_id(g_active_playlist);
    brw.populate(true);
  }
}
function on_playlist_items_reordered(playlist_idx) {
  if (playlist_idx == g_active_playlist) {
    g_focus_id = get_focus_id(g_active_playlist);
    brw.populate(true);
  }
}
function on_item_focus_change(playlist, from, to) {
  if (!brw.list || !brw || !brw.list)
    return;
  g_focus_id = to;
  if (!g_avoid_on_item_focus_change) {
    if (playlist == g_active_playlist) {
      // Autocollapse handle
      if (ppt.auto_collapse) { // && !center_focus_item
        if (from > -1 && from < brw.list.Count) {
          var old_focused_group_id = brw.get_albumId_from_trackId(from);
        } else {
          var old_focused_group_id = -1;
        }
        if (to > -1 && to < brw.list.Count) {
          var new_focused_group_id = brw.get_albumId_from_trackId(to);
        } else {
          var old_focused_group_id = -1;
        }
        if (new_focused_group_id != old_focused_group_id) {
          if (old_focused_group_id > -1) {
            brw.groups[old_focused_group_id].collapsed = true;
          }
          if (new_focused_group_id > -1) {
            brw.groups[new_focused_group_id].collapsed = false;
          }
          brw.set_list();
          brw.scrollbar.update();
          if (brw.row_count > 0)
            brw.get_tags(true);
        }
      }
      // if new focused track not totally visible, we scroll to show it centered in the panel
      g_focus_row = brw.get_offset_focus_item(g_focus_id);
      if (g_focus_row < scroll / ppt.row_height || g_focus_row > scroll / ppt.row_height + brw.total_rows_vis - 0.1) {
        var old = scroll;
        scroll = (g_focus_row - Math.floor(brw.total_rows_vis / 2)) * ppt.row_height;
        scroll = check_scroll(scroll);
        brw.scrollbar.update();
      }
      brw.metadblist_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
      if (!is_scrolling)
        brw.repaint();
    }
  }
}
function on_metadb_changed(handles) {
  if (g_avoid_on_metadb_change) return;
  if (!brw.list || filter.inputbox.text.length > 0) // no repopulate if input text is present
    return;
  // rebuild list
  if (g_rating_updated) { // no repopulate if tag update is from rating click action in playlist
    g_rating_updated = false;
    // update track tags info to avoid a full populate
    if (g_rating_row_id > -1) {
      brw.rows[g_rating_row_id].tracktags = ppt.tf_track.EvalWithMetadb(brw.rows[g_rating_row_id].metadb);
      g_rating_row_id = -1;
    }
    window.Repaint();
  } else {
    if (!(handles.Count == 1 && handles[0].Length < 0)) {
      if (filter_text.length > 0) {
        g_focus_id = 0;
        brw.populate(true);
        if (brw.row_count > 0) {
          var new_focus_id = brw.rows[0].playlistTrackId;
          plman.ClearPlaylistSelection(g_active_playlist);
          plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
          plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
        }
      } else {
        brw.populate(false);
      }
    }
  }
}
function on_item_selection_change() {
  brw.repaint();
}
function on_playlist_items_selection_change() {
  brw.repaint();
}
function on_focus(is_focused) {
  if (is_focused) {
    plman.SetActivePlaylistContext();
    g_sel_holder.SetPlaylistSelectionTracking();
  } else {
    brw.repaint();
  }
}
function check_scroll(scroll___) {
  if (scroll___ < 0)
    scroll___ = 0;
  var g1 = brw.h - (brw.total_rows_vis * ppt.row_height);
  var end_limit = (brw.row_count * ppt.row_height) - (brw.total_rows_vis * ppt.row_height) - g1;
  if (scroll___ != 0 && scroll___ > end_limit) {
    scroll___ = end_limit;
  }
  return isNaN(scroll___) ? 0 : scroll___;
}
function get_focus_id(playlist_index) {
  return plman.GetPlaylistFocusItemIndex(playlist_index);
}
function send_response() {
  if (filter.inputbox.text.length == 0) {
    filter_text = "";
  } else {
    filter_text = filter.inputbox.text;
  }
  // filter in current panel
  g_focus_id = 0;
  brw.populate(true);
  if (brw.row_count > 0) {
    var new_focus_id = brw.rows[0].playlistTrackId;
    plman.ClearPlaylistSelection(g_active_playlist);
    plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
    plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
  }
}
function on_notify_data(name, info) {
  switch (name) {
    case "JSSmoothBrowser->JSSmoothPlaylist:avoid_on_playlist_items_removed_callbacks_on_sendItemToPlaylist":
      g_avoid_on_playlist_items_removed_callbacks_on_sendItemToPlaylist = true;
      break;
    case "show_now_playing":
      brw.show_now_playing();
      break;
    case "avoid_on_metadb_change":
      g_avoid_on_metadb_change = true;
    default:
      break;
  }
}
function save_image_to_cache(metadb, albumIndex) {
  var crc = brw.groups[albumIndex].cachekey;
  if (fso.FileExists(CACHE_FOLDER + crc))
    return;
  var path = get_path(ppt.tf_path.EvalWithMetadb(metadb));
  if (path) {
    resize(path, crc);
  }
}
function on_drag_enter() {}
function on_drag_leave() {}
function on_drag_over(action, x, y, mask) {
  if (y < brw.y) {
    action.Effect = 0;
  } else {
    if (plman.PlaylistCount == 0 || plman.ActivePlaylist == -1 || !plman.IsAutoPlaylist(plman.ActivePlaylist)) {
      action.Effect = 1;
    } else {
      action.Effect = 0;
    }
  }
}
function on_drag_drop(action, x, y, mask) {
  if (y < brw.y) {
    action.Effect = 0;
  } else {}
}